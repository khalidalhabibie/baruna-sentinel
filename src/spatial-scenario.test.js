import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ASSESSMENT_POLICY,assessSyntheticScenario} from "./assessment.js";
import {SPATIAL_DEMO_META,getSpatialCases,getSpatialCase,makeSyntheticAssetSeries,explainSyntheticDecision,makeSpatialBrief} from "./spatial-scenario.js";

test("Spatial decision demo mirrors approved fictional assessment engine",()=>{
 const original=assessSyntheticScenario().records;
 const cases=getSpatialCases();
 assert.equal(cases.length,4);
 assert.deepEqual(cases.map(c=>c.result.screeningTier),["HIGH","MEDIUM","MONITOR","BLOCKED"]);
 assert.deepEqual(cases.map(c=>c.id),original.map(r=>r.id));
 assert.equal(SPATIAL_DEMO_META.mode,"SIMULATION_ONLY");
 assert.equal(SPATIAL_DEMO_META.policyId,ASSESSMENT_POLICY.id);
 assert.equal(SPATIAL_DEMO_META.validForAssetSafety,false);
 assert.equal(SPATIAL_DEMO_META.geographicAccuracy,"FICTIONAL_POLYGONS");
 for(const c of cases){
  assert.equal(c.sourceMode,"SYNTHETIC");
  assert.equal(c.result.canIssueOperationalOrder,false);
  assert.equal(c.geometry.length,4);
  for(const point of c.geometry){
   assert.equal(point.length,2);
   assert.ok(point[0]>-7&&point[0]<-6&&point[1]>110&&point[1]<111);
  }
  assert.equal(getSpatialCase(c.id).id,c.id);
 }
 assert.equal(getSpatialCase("real-asset"),null);
});

test("Site selection produces distinct source-labeled trends and evidence explanations",()=>{
 const [a,b,c,d]=getSpatialCases();
 for(const item of [a,b,c]){
  const series=makeSyntheticAssetSeries(item);
  assert.ok(series.length>=20);
  assert.match(series[0].date,/^202\d-\d\d$/);
  assert.ok(series.at(-1).upMm<series[0].upMm,"fake down-motion sequence follows synthetic input");
  const summary=explainSyntheticDecision(item);
  assert.equal(summary.why.length,3);
  assert.equal(summary.score,item.result.score);
  assert.equal(summary.points.length,3);
 }
 assert.deepEqual(makeSyntheticAssetSeries(d),[],"blocked result must not display a trend chart as validated");
 const blocked=explainSyntheticDecision(d);
 assert.match(blocked.summary,/gagal/);
 assert.ok(blocked.why.some(x=>/Geometri/.test(x)));
 assert.ok(blocked.why.some(x=>/ketidakpastian/i.test(x)));
 assert.equal(blocked.score,undefined);
});

test("Verification brief cannot be confused with operator-approved instructions",()=>{
 for(const item of getSpatialCases()){
  const text=makeSpatialBrief(item);
  assert.match(text,/SIMULASI \/ DATA FIKTIF/);
  assert.match(text,/BUKAN HASIL SURVEI/);
  assert.match(text,/BUKAN hasil survei|tidak mewakili aset nyata|tidak mewakili aset/i);
  assert.match(text,/peraturan|kriteria|Aturan|Policy|Policy|SETELAH VIDEO|DATA RESMI/i);
  assert.match(text,new RegExp(item.label));
  assert.match(text,new RegExp(item.status.short==="PERLU DATA"?"Bukti belum cukup":item.status.label,"i"));
  assert.ok(!text.includes("operator-approved"));
 }
 assert.throws(()=>makeSyntheticAssetSeries({sourceMode:"REAL"}),TypeError);
 assert.throws(()=>explainSyntheticDecision({sourceMode:"REAL"}),TypeError);
});

test("Video GIS route packages only approved public files and permanent disclaimers",()=>{
 const html=readFileSync("spatial-demo.html","utf8");
 const script=readFileSync("src/spatial-demo.js","utf8");
 const build=readFileSync("scripts/build-static.mjs","utf8");
 const home=readFileSync("index.html","utf8");
 assert.match(html,/SIMULASI VIDEO · SEMUA ASET/);
 assert.match(html,/spatial-map/);
 assert.match(html,/brief-dialog/);
 assert.match(html,/vendor\/leaflet\/leaflet/);
 assert.match(html,/assets\/ourdo-tail-curve-wordmark\.svg/);
 assert.match(home,/href="\.\/spatial-demo\.html"/);
 assert.match(build,/spatial-demo\.html/);
 assert.match(build,/src\/spatial-scenario\.js/);
 assert.match(script,/L\.polygon|window\.L\.polygon/);
 assert.match(script,/makeSyntheticAssetSeries/);
 assert.match(script,/assessSyntheticScenario|makeSpatialBrief/);
 assert.doesNotMatch(script,/navigator\.geolocation/);
 assert.doesNotMatch(build,/BIG_CORS_RINEX_20261115/);
});
