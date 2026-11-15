import test from "node:test";
import assert from "node:assert/strict";
import {
  STORY_STEPS,STORY_HIGHLIGHTS,selectStoryStep,
  estimatedInterruptionExposure,rupiah
} from "./why-sentinel-model.js";

test("intro has five semantic, source-transparent navigable stages",()=>{
 assert.equal(STORY_STEPS.length,5);
 assert.deepEqual(STORY_STEPS.map(step=>step.id),["problem","economy","evidence","process","action"]);
 assert.ok(STORY_STEPS.every(step=>step.title&&step.lead&&step.takeaway));
 assert.equal(selectStoryStep("evidence").nav,"Bukti GNSS");
 assert.equal(selectStoryStep("unknown").id,"problem");
 assert.equal(selectStoryStep(3).id,"process");
 assert.ok(STORY_HIGHLIGHTS[0].detail.includes("bukan laju seluruh aset"));
});
test("no invented economic loss until user assumptions are available",()=>{
 assert.equal(estimatedInterruptionExposure("",5_000_000),null);
 assert.equal(estimatedInterruptionExposure(4,""),null);
 assert.equal(estimatedInterruptionExposure("4","5000000"),20_000_000);
 assert.equal(estimatedInterruptionExposure(0,5_000_000),0);
 assert.equal(estimatedInterruptionExposure(-1,5_000_000),null);
 assert.equal(estimatedInterruptionExposure("abc",5_000_000),null);
 assert.equal(estimatedInterruptionExposure("10000",5_000_000),null);
 assert.equal(estimatedInterruptionExposure(2,-1),null);
 assert.equal(estimatedInterruptionExposure(4,"Infinity"),null);
 assert.equal(estimatedInterruptionExposure(9,1e16),null);
 assert.equal(rupiah(20_000_000),"Rp20.000.000");
 assert.equal(rupiah(NaN),"—");
});
test("scientific provenance is clear at source and economic-step boundaries",()=>{
 assert.equal(STORY_STEPS[0].sourceUrl,"https://doi.org/10.1016/j.jag.2023.103579");
 assert.ok(STORY_STEPS[1].takeaway.includes("belum menghitung kerugian aktual"));
 assert.ok(STORY_STEPS[2].takeaway.includes("terpisah"));
 assert.ok(STORY_STEPS[3].takeaway.includes("Data Insufficient"));
 assert.ok(STORY_STEPS[4].takeaway.includes("Belum"));
 assert.ok(STORY_STEPS.every(s=>s.page===null||["detail","analyst","assessment"].includes(s.page)));
});
