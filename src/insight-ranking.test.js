import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildRankingReadiness,INSPECTION_RANKING_STATUS} from "./insight-ranking.js";
const load=name=>JSON.parse(readFileSync(new URL("../data/"+name,import.meta.url),"utf8"));
const h=load("tanjung-emas-historical-field-evidence.json");
const q=load("semarang-real-hyp3-insar-qa.json");
const d=load("semarang-real-readiness.json");
test("six true historical sectors must never receive operational ranking",()=>{
 const result=buildRankingReadiness(h,q,d);
 assert.equal(result.status,INSPECTION_RANKING_STATUS);
 assert.equal(result.rankedAssetCount,0);
 assert.equal(result.candidateCount,6);
 assert.equal(result.rankingAvailable,false);
 assert.equal(result.scenarioIsSynthetic,true);
 assert.ok(result.sectors.every(s=>s.rank===null&&s.score===null&&s.riskTier===null));
 assert.ok(result.sectors.every(s=>s.currentVerticalMmPerYear===null&&s.assetGeometry===null));
});
test("changing history or model gates is rejected instead of scoring",()=>{
 const bad=structuredClone(d);bad.modelGate.assetLevelInspectionPriority=true;
 assert.throws(()=>buildRankingReadiness(h,q,bad),/fail closed/);
 const invalid=structuredClone(h);invalid.sectors[0].locationStatus="SURVEYED";
 assert.throws(()=>buildRankingReadiness(invalid,q,d),/Bad historical sector/);
});
