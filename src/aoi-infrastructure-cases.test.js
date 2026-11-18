import test from "node:test";
import assert from "node:assert/strict";
import {validateRecord,MAX_AOIS} from "./aoi-registry-model.js";
import {INFRASTRUCTURE_CASES,mergeInfrastructureSeeds,rankAoiEvidenceCoverage} from "./aoi-infrastructure-cases.js";

test("Semarang examples have valid illustrative polygons, not surveyed boundaries",()=>{
 assert.equal(INFRASTRUCTURE_CASES.length,3);
 const ids=new Set();
 for(const item of INFRASTRUCTURE_CASES){
  const v=validateRecord(item);
  assert.ok(!ids.has(v.id));ids.add(v.id);
  assert.equal(v.boundarySource,"ILLUSTRATIVE_BOUNDARY_UNVERIFIED");
  assert.equal(v.rankingEligibility,"DATA_INSUFFICIENT");
  assert.ok(v.geometry.areaKm2>0.005);
  assert.ok(v.researchUrl.startsWith("https://"));
 }
});

test("merging examples is idempotent, preserves local AOIs and never exceeds capacity",()=>{
 const initial=mergeInfrastructureSeeds([]);
 assert.equal(initial.length,3);
 assert.deepEqual(mergeInfrastructureSeeds(initial),initial);
 const custom=Array.from({length:MAX_AOIS-1},(_,i)=>({
  ...initial[0],id:"aoi-custom-"+String(i+100000),name:"Custom "+i,seedCase:false
 }));
 const merged=mergeInfrastructureSeeds(custom);
 assert.equal(merged.length,MAX_AOIS);
 assert.deepEqual(merged.slice(0,custom.length),custom);
});

test("research ordering uses only catalog category presence with ties and blocks risk scores",()=>{
 const [first,second,third]=INFRASTRUCTURE_CASES;
 const check={schema:"baruna-aoi-evidence-check-v1",s1Grd:[{id:"s1"}],s2L2a:[{id:"s2"}]};
 const rows=rankAoiEvidenceCoverage([
  {...first,lastEvidenceCheck:check},
  {...second,lastEvidenceCheck:check},
  third
 ]);
 assert.equal(rows[0].rank,1);
 assert.equal(rows[1].rank,1);
 assert.equal(rows[2].rank,null);
 assert.ok(rows.every(r=>r.operationalRiskRank===null&&r.operationalRiskStatus==="DATA_INSUFFICIENT"));
});
