#!/usr/bin/env python3
"""Read-only NASA ASF baseline review of eight Semarang SLC-BURST temporal edges.

Numbers are provider metadata, NOT proof of geodetic SBAS, coherence,
LOS motion, annual subsidence or infrastructure risk. No HyP3 orders.
"""
from datetime import datetime,timezone
from pathlib import Path
import argparse,json,math

ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/"data/semarang-asf-burst-network-20261118.json"
OUTPUT=ROOT/"reports/semarang-asf-eight-pair-baselines.json"
FULL_ID="076_162214_IW2"

def validate_catalog(doc):
    scenes=doc.get("scenes",[]);edges=doc.get("adjacentCandidatePairs",[])
    if (doc.get("source")!="NASA ASF SAR Search API" or doc.get("dataset")!="SLC-BURST" or
        doc.get("sourceResponseHttpStatus")!=200 or doc.get("targetFullBurstID")!=FULL_ID or
        len(scenes)!=9 or len(edges)!=8):
        raise ValueError("UNTRUSTED_OR_INCOMPLETE_ASF_CATALOG")
    names=[s["sceneName"] for s in scenes]
    if len(set(names))!=9:raise ValueError("DUPLICATED_SCENE")
    for i,s in enumerate(scenes):
        if (s.get("fullBurstID")!=FULL_ID or s.get("polarization")!="VV" or
            s.get("direction")!="DESCENDING" or
            not s["sceneName"].startswith("S1_162214_IW2_"+s["date"].replace("-",""))):
            raise ValueError("INCOMPATIBLE_BURST")
        if i and (s["date"]<=scenes[i-1]["date"] or
                  edges[i-1]["referenceBurst"]!=names[i-1] or
                  edges[i-1]["secondaryBurst"]!=names[i]):
            raise ValueError("DISCONNECTED_CHRONOLOGY")
    return scenes

def finite(x):
    try:
        n=float(x);return n if math.isfinite(n) else None
    except (ValueError,TypeError,OverflowError):return None

def inspect(doc,asf):
    scenes=validate_catalog(doc)
    names=[s["sceneName"] for s in scenes]
    products=list(asf.granule_search(names))
    found={p.properties.get("sceneName"):p for p in products if p.properties.get("sceneName") in names}
    edges=[];redundant=[]
    for i in range(8):
        a,b=scenes[i:i+2]
        row={"referenceDate":a["date"],"secondaryDate":b["date"],
             "referenceBurst":a["sceneName"],"secondaryBurst":b["sceneName"],
             "catalogTemporalDays":doc["adjacentCandidatePairs"][i]["daysApart"],
             "asfTemporalBaselineDays":None,"asfPerpendicularBaselineMeters":None,
             "status":"BLOCKED_SOURCE_MISSING","sameFullBurstIdConfirmed":False}
        ref,sec=found.get(a["sceneName"]),found.get(b["sceneName"])
        stack_rows=[]
        if ref is not None and sec is not None:
            try:
                rb=(ref.properties.get("burst") or {}).get("fullBurstID")
                sb=(sec.properties.get("burst") or {}).get("fullBurstID")
                row["sameFullBurstIdConfirmed"]=rb==sb==FULL_ID
                opts=asf.ASFSearchOptions(start="2026-07-20",end="2026-11-17",maxResults=100)
                stack_rows=list(ref.stack(opts=opts))
                matches=[p for p in stack_rows
                         if p.properties.get("sceneName")==b["sceneName"]]
                if len(matches)==1:
                    row["asfTemporalBaselineDays"]=finite(matches[0].properties.get("temporalBaseline"))
                    row["asfPerpendicularBaselineMeters"]=finite(matches[0].properties.get("perpendicularBaseline"))
                    if (row["sameFullBurstIdConfirmed"] and row["asfTemporalBaselineDays"] is not None
                        and row["asfPerpendicularBaselineMeters"] is not None
                        and abs(abs(row["asfTemporalBaselineDays"])-row["catalogTemporalDays"])<=1.5):
                        row["status"]="NUMERIC_BASELINE_AVAILABLE_REVIEW_REQUIRED"
                    else:row["status"]="BLOCKED_SOURCE_VALUES_MISMATCH"
                else:row["status"]="BLOCKED_SECONDARY_NOT_IN_STACK"
            except Exception as exc:
                row["status"]="BLOCKED_ASF_STACK_ERROR"
                row["errorType"]=type(exc).__name__ # No secret-bearing error message
        edges.append(row)
        # Same public stack request also exposes a potential two-hop link.
        # Adding such a processed link would allow a phase-loop/closure test
        # across a 3-date triangle, unlike a nonredundant temporal chain.
        # This is only source metadata; no interferogram has been ordered.
        if i+2<len(scenes):
            third=scenes[i+2]
            interval=(datetime.fromisoformat(third["date"])-datetime.fromisoformat(a["date"])).days
            extra={"referenceDate":a["date"],"secondaryDate":third["date"],
                   "referenceBurst":a["sceneName"],"secondaryBurst":third["sceneName"],
                   "catalogTemporalDays":interval,
                   "asfTemporalBaselineDays":None,"asfPerpendicularBaselineMeters":None,
                   "status":"BLOCKED_SOURCE_MISSING",
                   "purpose":"POTENTIAL_TRIANGLE_CLOSURE_NOT_PROCESSED"}
            if ref is not None and found.get(third["sceneName"]) is not None:
                v=[p for p in stack_rows if p.properties.get("sceneName")==third["sceneName"]]
                if len(v)==1:
                    extra["asfTemporalBaselineDays"]=finite(v[0].properties.get("temporalBaseline"))
                    extra["asfPerpendicularBaselineMeters"]=finite(v[0].properties.get("perpendicularBaseline"))
                    if (row["sameFullBurstIdConfirmed"]
                        and extra["asfTemporalBaselineDays"] is not None
                        and extra["asfPerpendicularBaselineMeters"] is not None
                        and abs(abs(extra["asfTemporalBaselineDays"])-interval)<=1.5):
                        extra["status"]="NUMERIC_BASELINE_AVAILABLE_REVIEW_REQUIRED"
                    else:extra["status"]="BLOCKED_SOURCE_VALUES_MISMATCH"
                else:extra["status"]="BLOCKED_SECONDARY_NOT_IN_SOURCE_STACK"
            redundant.append(extra)
    valid=sum(e["status"]=="NUMERIC_BASELINE_AVAILABLE_REVIEW_REQUIRED" for e in edges)
    redundant_valid=sum(e["status"]=="NUMERIC_BASELINE_AVAILABLE_REVIEW_REQUIRED" for e in redundant)
    return {"schema":"baruna-asf-eight-pair-baselines-v1",
            "asOfUtc":datetime.now(timezone.utc).isoformat(),
            "source":"NASA ASF asf_search public ASFProduct.stack()",
            "fullBurstID":FULL_ID,"catalogAcquisitions":9,
            "candidateEdges":8,"numericBaselineEdges":valid,
            "allEightNumericBaselinesPresent":valid==8,"edges":edges,
            "twoHopRedundantCandidateEdges":7,"twoHopNumericBaselines":redundant_valid,
            "twoHopMetadataAvailableForAll":redundant_valid==7,
            "twoHopCandidates":redundant,
            "scientificGates":{"numericBaselineMetadataForAllEdges":valid==8,
                "networkScientificallyValidated":False,
                "coherenceValidatedAcrossMultiplePairs":False,
                "actualProcessingNetworkCompleted":False,
                "stableGeodeticReferenceValidated":False,
                "multiTemporalLOSTimeSeries":False,
                "annualVerticalRateAvailable":False,
                "infrastructureRiskRankingAllowed":False},
            "limitations":[
                "Perpendicular baseline sign and values depend on reference and orbit conventions.",
                "Numeric baseline alone does not prove phase/coherence or network scientific validity.",
                "No SAR pixels downloaded, no HyP3 job, no processing credit used."]}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--source",type=Path,default=CATALOG)
    p.add_argument("--output",type=Path,default=OUTPUT)
    a=p.parse_args()
    import asf_search as asf
    report=inspect(json.loads(a.source.read_text()),asf)
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(report,indent=2)+"\n")
    print("ASF_NUMERIC_BASELINES:",report["numericBaselineEdges"],"/8")
    for e in report["edges"]:
        print(e["referenceDate"],e["secondaryDate"],
              e["asfTemporalBaselineDays"],e["asfPerpendicularBaselineMeters"],e["status"])
    print("ASF_TWO_HOP_NUMERIC_BASELINES:",report["twoHopNumericBaselines"],"/7")
    for e in report["twoHopCandidates"]:
        print("CLOSURE_CANDIDATE:",e["referenceDate"],e["secondaryDate"],e["asfTemporalBaselineDays"],e["asfPerpendicularBaselineMeters"],e["status"])
    print("SCIENCE_NETWORK_VALIDATED: False")
    print("NO HY P3 JOB, SAR DOWNLOAD OR CREDITS") # informational only
    print("REPORT:",a.output)
    return 0 if report["allEightNumericBaselinesPresent"] else 2

if __name__=="__main__":raise SystemExit(main())
