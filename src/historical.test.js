import {readFileSync} from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {validateHistoricalFieldEvidence,filterHistoricalSectors,historicalEvidenceSummary,renderHistoricalSectorCards,renderHistoricalSectorDetail} from "./historical.js";

const original=JSON.parse(readFileSync(new URL("../data/tanjung-emas-historical-field-evidence.json",import.meta.url),"utf8"));

test("published field evidence preserves 2005 measurement epoch, cm units, study DOI and 6 documented sectors",()=>{
  const d=validateHistoricalFieldEvidence(original);
  assert.equal(d.reportedSurveyYear,2005);
  assert.equal(d.units,"cumulative_cm");
  assert.equal(d.sectors.length,6);
  assert.deepEqual(d.sectors.map(s=>[s.minCm,s.maxCm]),[
    [21,41],[62,94],[64,79],[74,140],[76,89],[77,109]
  ]);
  const out=historicalEvidenceSummary(d);
  assert.equal(out.operationalInspectionPriorityAvailable,false);
  assert.equal(out.linkedToCsemMovement,false);
  assert.equal(out.linkedToBakoQc,false);
  assert.ok(out.sectors.every(s=>s.currentRisk==="UNKNOWN" && !s.directGnssMeasurement));
});
test("real field-sector research is filterable without inventing exact map pins",()=>{
  assert.equal(filterHistoricalSectors(original,"all").length,6);
  assert.equal(filterHistoricalSectors(original,"coastal").length,3);
  assert.equal(filterHistoricalSectors(original,"port").length,2);
  assert.equal(filterHistoricalSectors(original,"road").length,1);
  assert.throws(()=>filterHistoricalSectors(original,"danger"),/Unknown filter/);
  const text=renderHistoricalSectorCards(original,"all");
  assert.ok(text.includes("West breakwater"));
  assert.ok(text.includes("74–140 cm"));
  assert.ok(text.includes("2026 status unknown"));
  const detail=renderHistoricalSectorDetail(original,"west-breakwater");
  assert.ok(detail.includes("not</b> a 2026 displacement rate"));
  assert.ok(detail.includes("Precise sector geometry"));
});
test("bad or invented geodetic provenance cannot pass historical field evidence validation",()=>{
  assert.throws(()=>validateHistoricalFieldEvidence({...original,reportedSurveyYear:2026}),/Survey epoch/);
  assert.throws(()=>validateHistoricalFieldEvidence({...original,geometriesAvailable:true}),/Survey epoch/);
  assert.throws(()=>validateHistoricalFieldEvidence({...original,publication:{doi:"unknown"}}),/Unexpected research provenance/);
});
