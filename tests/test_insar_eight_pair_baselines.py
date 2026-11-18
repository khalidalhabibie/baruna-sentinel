import unittest,sys,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from insar_eight_pair_baselines import inspect,validate_catalog

class Product:
    def __init__(self,props,stack=None):self.properties=props;self.items=stack or []
    def stack(self,opts=None):return [Product(row) for row in self.items]

class ASF:
    def __init__(self,doc,remove=None):
        self.products={}
        scenes=doc["scenes"]
        for i,a in enumerate(scenes):
            future=[{"sceneName":scenes[j]["sceneName"],
                     "perpendicularBaseline":-float((j-i)*10),
                     "temporalBaseline":float((__import__("datetime").date.fromisoformat(scenes[j]["date"])-__import__("datetime").date.fromisoformat(a["date"])).days)}
                     for j in range(i+1,len(scenes))]
            if a["sceneName"]!=remove:
                self.products[a["sceneName"]]=Product(
                    {"sceneName":a["sceneName"],"burst":{"fullBurstID":"076_162214_IW2"}},future)
    def granule_search(self,names):return [self.products[n] for n in names if n in self.products]
    def ASFSearchOptions(self,**kwargs):return kwargs

def fixture():
    from datetime import date,timedelta
    doc={"source":"NASA ASF SAR Search API","dataset":"SLC-BURST",
         "sourceResponseHttpStatus":200,"targetFullBurstID":"076_162214_IW2",
         "scenes":[],"adjacentCandidatePairs":[]}
    for i in range(9):
        d=date(2026,7,22)+timedelta(days=12*i+(12 if i==8 else 0))
        name=f"S1_162214_IW2_{d:%Y%m%d}T221703_VV_{i+1:04X}-BURST"
        doc["scenes"].append({"date":d.isoformat(),"sceneName":name,
             "fullBurstID":"076_162214_IW2","polarization":"VV","direction":"DESCENDING"})
    for i in range(8):
        doc["adjacentCandidatePairs"].append({
          "referenceBurst":doc["scenes"][i]["sceneName"],
          "secondaryBurst":doc["scenes"][i+1]["sceneName"],
          "daysApart":12 if i<7 else 24})
    return doc

class TestPublicBaselines(unittest.TestCase):
    def test_all_numeric_baselines_still_not_deformation(self):
        doc=fixture();result=inspect(doc,ASF(doc))
        self.assertEqual(result["numericBaselineEdges"],8)
        self.assertTrue(result["allEightNumericBaselinesPresent"])
        self.assertFalse(result["scientificGates"]["networkScientificallyValidated"])
        self.assertFalse(result["scientificGates"]["multiTemporalLOSTimeSeries"])
        self.assertFalse(result["scientificGates"]["infrastructureRiskRankingAllowed"])
        self.assertEqual(len(result["edges"]),8)
        self.assertEqual(result["twoHopNumericBaselines"],7)
        self.assertTrue(result["twoHopMetadataAvailableForAll"])
        self.assertEqual(len(result["twoHopCandidates"]),7)
        self.assertEqual(result["twoHopCandidates"][-1]["catalogTemporalDays"],36)
        self.assertEqual(result["twoHopCandidates"][-1]["asfTemporalBaselineDays"],36.0)
    def test_missing_source_scene_blocks_adjacent_edge(self):
        doc=fixture();provider=ASF(doc,remove=doc["scenes"][0]["sceneName"])
        result=inspect(doc,provider)
        self.assertEqual(result["numericBaselineEdges"],7)
        self.assertFalse(result["allEightNumericBaselinesPresent"])
        self.assertLess(result["twoHopNumericBaselines"],7)
    def test_mixed_direction_and_disconnected_edge_rejected(self):
        doc=fixture();doc["scenes"][0]["direction"]="ASCENDING"
        with self.assertRaises(ValueError):validate_catalog(doc)
        doc=fixture();doc["adjacentCandidatePairs"][0]["secondaryBurst"]="BAD"
        with self.assertRaises(ValueError):validate_catalog(doc)

if __name__=="__main__":unittest.main()
