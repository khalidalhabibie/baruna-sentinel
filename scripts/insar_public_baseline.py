#!/usr/bin/env python3
"""Read-only NASA ASF public SLC-BURST baseline experiment for BARUNA Semarang.

Uses ASF metadata/Catalog only. No Earthdata auth, raw bursts, HyP3 job
submission, credits or geodetic deformation estimates. A calculated
perpendicular baseline is candidate screening, not processing QA.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"data/semarang-asf-burst-network-20261118.json"
REFERENCE="S1_162214_IW2_20261002T221703_VV_F470-BURST"
SECONDARY="S1_162214_IW2_20261014T221703_VV_21AC-BURST"


def number(value):
    try:
        n=float(value)
        return n if math.isfinite(n) else None
    except (TypeError, ValueError, OverflowError):
        return None


def source_records(path):
    doc=json.loads(Path(path).read_text(encoding="utf-8"))
    if (doc.get("schema")!="baruna-public-asf-burst-preflight-live-snapshot-v1"
        or doc.get("targetFullBurstID")!="076_162214_IW2"
        or len(doc.get("scenes",[]))!=9
        or not all(s.get("fullBurstID")=="076_162214_IW2" and
                   s.get("polarization")=="VV" and
                   s.get("direction")=="DESCENDING" and
                   s.get("sourceRole")=="PUBLIC_CATALOG_METADATA_ONLY"
                   for s in doc["scenes"])):
        raise ValueError("Unverified input catalog")
    names=[s["sceneName"] for s in doc["scenes"]]
    if len(set(names))!=9 or REFERENCE not in names or SECONDARY not in names:
        raise ValueError("Reference or distinct scene names missing")
    return names


def report_template():
    return {
        "schema":"baruna-asf-public-burst-baseline-review-v1",
        "asOfUtc":datetime.now(timezone.utc).isoformat(),
        "reference":REFERENCE, "secondary":SECONDARY,
        "fullBurstID":"076_162214_IW2",
        "source":"NASA ASF asf_search public CMR baseline stack",
        "status":"BLOCKED_UNVERIFIED_ASF_STACK",
        "retrievedCatalogRecords":0, "referenceInCatalog":False,
        "secondaryInStack":False, "perpendicularBaselineMeters":None,
        "temporalBaselineDays":None, "stackCount":0,
        "sourceBaselines":[],
        "scientificGates":{"sameFullBurstIdFromCatalog":False,
           "sourcePerpendicularBaselineNumeric":False,
           "baselineScientificallyAccepted":False,
           "coherenceValidated":False, "stackProcessed":False,
           "LOSDisplacementValidated":False,"assetRiskAllowed":False},
        "limitations":[
            "Read-only public orbit/metadata only; no raw SAR pixels downloaded or HyP3 credits spent",
            "A numeric perpendicular baseline alone does not certify coherence, phase unwrapping or scientific stack acceptance",
            "One two-date baseline is not an annual deformation or station movement measurement"
        ]
    }


def evaluate(source_names,products,stack):
    report=report_template()
    props=[]
    for p in products:
        row=getattr(p,"properties",{}) or {}
        if row.get("sceneName") in source_names:
            props.append(row)
    present={p["sceneName"] for p in props}
    report["retrievedCatalogRecords"]=len(props)
    report["referenceInCatalog"]=REFERENCE in present
    reference=next((p for p in props if p["sceneName"]==REFERENCE),None)
    report["scientificGates"]["sameFullBurstIdFromCatalog"]=bool(
        reference and (reference.get("burst") or {}).get("fullBurstID")=="076_162214_IW2"
    )
    for p in stack:
        row=getattr(p,"properties",{}) or {}
        name=row.get("sceneName")
        if name in source_names:
            match={"name":name,"perpendicularBaselineMeters":number(row.get("perpendicularBaseline")),
                "temporalBaselineDays":number(row.get("temporalBaseline"))}
            report["sourceBaselines"].append(match)
    report["stackCount"]=len(report["sourceBaselines"])
    selected=[x for x in report["sourceBaselines"] if x["name"]==SECONDARY]
    if len(selected)==1:
        pair=selected[0]
        report["secondaryInStack"]=True
        report["perpendicularBaselineMeters"]=pair["perpendicularBaselineMeters"]
        report["temporalBaselineDays"]=pair["temporalBaselineDays"]
    t=report["temporalBaselineDays"]
    report["scientificGates"]["sourcePerpendicularBaselineNumeric"]=(report["perpendicularBaselineMeters"] is not None)
    accepted=(report["sourcePerpendicularBaselineNumeric"] and report["secondaryInStack"]
         and t is not None and abs(abs(t)-12)<=1.5
         and report["scientificGates"]["sameFullBurstIdFromCatalog"])
    report["status"]="BASELINE_METRICS_AVAILABLE_REVIEW_REQUIRED" if accepted else "BLOCKED_BASELINE_METADATA_INCOMPLETE"
    return report


def main(argv=None):
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source",type=Path,default=SOURCE)
    ap.add_argument("--output",type=Path,default=ROOT/"reports/asf_public_baseline_review.json")
    args=ap.parse_args(argv)
    try:
        import asf_search as asf
        names=source_records(args.source)
        products=list(asf.granule_search(names))
        ref=next((p for p in products if p.properties.get("sceneName")==REFERENCE),None)
        if ref is None:
            raise ValueError("Reference scene absent from ASF granule_search")
        opts=asf.ASFSearchOptions(start="2026-07-20",end="2026-11-17",maxResults=100)
        stack=list(ref.stack(opts=opts))
        result=evaluate(names,products,stack)
    except Exception as e:
        result=report_template()
        result["blockerType"]=type(e).__name__
        # No auth headers, URLs, exception repr, or sensitive bodies in public logs.
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("ASF_PUBLIC_BASELINE_STATUS:",result["status"])
    print("STACK_RECORDS:",result["stackCount"])
    print("REFERENCE_IN_CATALOG:",result["referenceInCatalog"])
    print("SECONDARY_IN_STACK:",result["secondaryInStack"])
    print("PERPENDICULAR_BASELINE_METERS:",result["perpendicularBaselineMeters"])
    print("TEMPORAL_BASELINE_DAYS:",result["temporalBaselineDays"])
    if result.get("blockerType"):print("BLOCKER_TYPE:",result["blockerType"])
    print("No InSAR or geodetic displacement computed. No HyP3 job or credits consumed.")
    return 0 if result["status"]=="BASELINE_METRICS_AVAILABLE_REVIEW_REQUIRED" else 2


if __name__=="__main__":
    sys.exit(main())
