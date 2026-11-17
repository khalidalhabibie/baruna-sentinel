import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateRegionalPublishedFinding,atlasEvidenceSummary,createHistoricalRangeRows} from "./subsidence-evidence.js";
const load=f=>JSON.parse(readFileSync(new URL("../data/"+f,import.meta.url),"utf8"));
const h=load("tanjung-emas-historical-field-evidence.json");
const q=load("semarang-real-hyp3-insar-qa.json");
const r=load("semarang-published-subsidence-context.json");

test("published 2005 cumulative settlement remains separate from regional mm/year",()=>{
 const out=atlasEvidenceSummary(h,q,r);
 assert.equal(out.historical.sectors.length,6);
 assert.equal(out.historical.units,"cumulative_cm");
 assert.deepEqual(out.regional.reportedRegionalMaximumMmPerYear,[100,120]);
 assert.equal(out.regional.portSpecific,false);
 assert.equal(out.regional.velocityRasterInApplication,false);
 assert.equal(out.scientificGates.verifiedVerticalMmPerYear,false);
 assert.equal(out.scientificGates.measured2026PortSubsidence,false);
 assert.equal(out.scientificGates.portOperationalRiskRanking,false);
 assert.equal(out.radar.portPhaseNoData,true);
});
test("chart scales historical ranges only, never converts to a modern rate",()=>{
 const rows=createHistoricalRangeRows(h);
 assert.equal(rows.length,6);
 assert.deepEqual(rows.find(s=>s.id==="west-breakwater"),{
  id:"west-breakwater",name:"West breakwater",type:"Coastal defence",minCm:74,maxCm:140,
  leftPercent:100*74/140,widthPercent:100*(140-74)/140,
  currentCondition:"UNKNOWN",geometryAvailable:false
 });
 assert.equal(createHistoricalRangeRows(h,"coastal").length,3);
 assert.equal(createHistoricalRangeRows(h,"road").length,1);
 assert.throws(()=>createHistoricalRangeRows(h,"risk"),/Unknown filter/);
});
test("invalid scientific claims and substituted regional values fail closed",()=>{
 const changed=structuredClone(r);
 changed.dataStatus.harbourSiteSpecificRate=true;
 assert.throws(()=>validateRegionalPublishedFinding(changed),/invalid/);
 changed.dataStatus.harbourSiteSpecificRate=false;changed.maximumRangeMmPerYear=[100,150];
 assert.throws(()=>validateRegionalPublishedFinding(changed),/invalid/);
 const invalid=structuredClone(q);invalid.scientificGates.annualRateAvailable=true;
 assert.throws(()=>atlasEvidenceSummary(h,invalid,r),/rejected/i);
});
