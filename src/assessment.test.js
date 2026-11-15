import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateHistoricalFieldEvidence} from "./historical.js";
import {
  ASSESSMENT_POLICY,assessHistoricalSector,assessRealProject,
  assessSyntheticAsset,assessSyntheticScenario,buildAssessmentPrint
} from "./assessment.js";
const doc=validateHistoricalFieldEvidence(JSON.parse(
  readFileSync(new URL("../data/tanjung-emas-historical-field-evidence.json",import.meta.url),"utf8")
));
test("real port field study has six defensible DATA_INSUFFICIENT decisions",()=>{
 const r=assessRealProject(doc);
 assert.equal(r.records.length,6);
 assert.equal(r.needsUpdatedEvidence,6);
 assert.equal(r.sufficientForOperationalRanking,0);
 assert.ok(r.records.every(x=>x.operationalPriority==="DATA_INSUFFICIENT"&&!x.canIssueOperationalOrder));
 assert.equal(r.records.find(x=>x.id==="west-breakwater").historicRangeCm.join("–"),"74–140");
 assert.ok(r.records[0].evidence.some(x=>x.state==="MISSING"));
});
test("historical cumulative measurements are never a vertical rate or projected risk",()=>{
 const r=assessHistoricalSector(doc.sectors[0]);
 assert.equal(r.measuredQuantity,"CUMULATIVE_SETTLEMENT_CM");
 assert.equal(r.screeningTier,null);
 assert.equal(r.operationalPriority,"DATA_INSUFFICIENT");
 assert.throws(()=>assessHistoricalSector({id:"wrong",name:"X",minCm:200,maxCm:1}),TypeError);
});
test("simulation shows high, medium, monitor and data insufficient—only in SYNTHETIC mode",()=>{
 const r=assessSyntheticScenario();
 assert.deepEqual(r.records.map(x=>x.screeningTier),["HIGH","MEDIUM","MONITOR","BLOCKED"]);
 assert.ok(r.records.every(x=>x.sourceMode==="SYNTHETIC"&&!x.canIssueOperationalOrder));
 assert.equal(r.records[3].operationalPriority,"DATA_INSUFFICIENT");
 assert.ok(r.records[3].gateFailures.includes("GEOMETRY"));
 assert.ok(r.records[3].gateFailures.includes("REPRESENTATIVENESS"));
});
test("real field sector input cannot accidentally enter synthetic ranking",()=>{
 assert.throws(()=>assessSyntheticAsset({...doc.sectors[0]}),TypeError);
 assert.throws(()=>assessSyntheticAsset({id:"x",name:"X",sourceMode:"PUBLISHED_HISTORICAL_CONTEXT"}),TypeError);
});
test("no high priority when evidence quality is insufficient, even with high simulated motion",()=>{
 const demo=assessSyntheticScenario().records[0];
 assert.equal(demo.screeningTier,"HIGH");
 const invalid=assessSyntheticAsset({
  id:"high-but-bad",name:"Synthetic with bad continuity",sourceMode:"SYNTHETIC",
  geometryVerified:true,siteRepresentative:true,sourceVerified:true,referenceFrameVerified:true,
  spanYears:3,continuityPct:20,slopeUncertaintyMmYr:1,verticalRateMmYr:-150,
  exposure:"high",criticality:"high"
 });
 assert.equal(invalid.screeningTier,"BLOCKED");
 assert.equal(invalid.operationalPriority,"DATA_INSUFFICIENT");
 assert.ok(invalid.gateFailures.includes("CONTINUITY"));
});
test("printable assessment separates real source data from invented scenario",()=>{
 const real=assessRealProject(doc);
 const out=buildAssessmentPrint({real,scenario:assessSyntheticScenario()});
 assert.match(out,/DATA INSUFFICIENT/);
 assert.match(out,/Six historical sectors/);
 assert.match(out,/Every|fictional|invented/i);
 assert.match(out,/West breakwater/);
 assert.match(out,/HIGH/);
 const without=buildAssessmentPrint({real});
 assert.doesNotMatch(without,/Separate invented demonstration/);
 assert.throws(()=>buildAssessmentPrint({real:{}}),TypeError);
 assert.equal(ASSESSMENT_POLICY.id,"SYNTHETIC_DEMO_POLICY_V1");
});
