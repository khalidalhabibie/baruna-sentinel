import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ASSESSMENT_POLICY,assessSyntheticScenario} from "./assessment.js";
import {SPATIAL_DEMO_META,getSpatialCases,getSpatialCase,makeSyntheticAssetSeries,explainSyntheticDecision,makeSpatialBrief,getRankedSpatialCases,getSyntheticScoreBreakdown} from "./spatial-scenario.js";

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
  assert.equal(series[0].upMm,0,"relative displacement chart starts at zero for each scenario");
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
 assert.match(html,/class="simulation-ribbon"/);
 assert.match(html,/DEMO SCENARIO/);
 assert.match(html,/4 aset ilustratif/);
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

test("Only eligible synthetic assets receive defensible demo ranks",()=>{
 const r=getRankedSpatialCases();
 assert.equal(r.mode,"SIMULATION_ONLY");
 assert.equal(r.policyId,ASSESSMENT_POLICY.id);
 assert.equal(r.eligibleCount,3);
 assert.equal(r.excludedCount,1);
 assert.deepEqual(r.eligible.map(x=>x.item.id),["sim-port","sim-road","sim-store"]);
 assert.deepEqual(r.eligible.map(x=>x.rank),[1,2,3]);
 assert.deepEqual(r.eligible.map(x=>x.item.result.score),[6,4,1]);
 assert.equal(r.excluded[0].item.id,"sim-incomplete");
 assert.equal(r.excluded[0].rank,null);
 assert.equal(r.excluded[0].item.result.score,null);
 assert.deepEqual(r.excluded[0].item.result.gateFailures.includes("GEOMETRY"),true);
 assert.throws(()=>getRankedSpatialCases([{sourceMode:"REAL"}]),TypeError);
});
test("Compare uses the exact existing screening-score reasons",()=>{
 const [a,b,c,d]=getSpatialCases();
 assert.deepEqual(getSyntheticScoreBreakdown(a),{motion:2,exposure:2,criticality:2,total:6});
 assert.deepEqual(getSyntheticScoreBreakdown(b),{motion:1,exposure:1,criticality:2,total:4});
 assert.deepEqual(getSyntheticScoreBreakdown(c),{motion:0,exposure:1,criticality:0,total:1});
 assert.equal(getSyntheticScoreBreakdown(d),null);
 assert.throws(()=>getSyntheticScoreBreakdown({sourceMode:"REAL"}),TypeError);
 const aBrief=makeSpatialBrief(a);
 const dBrief=makeSpatialBrief(d);
 assert.match(aBrief,/Peringkat sintetis: 1 dari 3 aset yang lolos Evidence Gate/);
 assert.match(dBrief,/Peringkat sintetis: TIDAK DIRANKING/);
 assert.match(dBrief,/SIMULASI \/ DATA FIKTIF/);
});
test("Ranking and Compare are present in HTML and not a new standalone scoring model",()=>{
 const html=readFileSync("spatial-demo.html","utf8");
 const script=readFileSync("src/spatial-demo.js","utf8");
 assert.match(html,/id="ranking"/);
 assert.match(html,/id="ranking-rows"/);
 assert.match(html,/id="compare-content"/);
 assert.match(html,/href="#ranking"/);
 assert.match(html,/A vs D · Kualitas bukti/);
 assert.match(script,/getRankedSpatialCases\(cases\)/);
 assert.match(script,/getSyntheticScoreBreakdown\(item\)/);
 assert.match(script,/data-compare-id/);
 assert.match(script,/data-focus-asset/);
 assert.doesNotMatch(script,/ASSESSMENT_POLICY\s*=|highScore\s*=/);
});

test("Video clarity preserves four fictional versus six historical sectors",()=>{
 const html=readFileSync("spatial-demo.html","utf8");
 const homepage=readFileSync("index.html","utf8");
 const sourceWorkspace=readFileSync("src/why-sentinel.js","utf8");
 const code=readFileSync("src/spatial-demo.js","utf8");
 assert.match(html,/4 aset ilustratif, berbeda dari 6 sektor penelitian historis/);
 assert.match(html,/href="\.\/\?page=assessment"/);
 assert.match(html,/class="map-ranking-cta"/);
 assert.match(html,/href="#ranking"/);
 assert.match(html,/class="ranking-back-link" href="#asset-map"/);
 assert.match(html,/Laju vertikal per tahun/);
 assert.match(html,/Perpindahan vertikal relatif/);
 assert.match(html,/Dari awal periode/);
 assert.match(html,/mm\/tahun/);
 assert.match(homepage,/Demo Keputusan · 4 aset/);
 assert.match(sourceWorkspace,/Enam sektor penelitian 2005/);
 assert.match(code,/GATE_LABELS\[code\]/);
 assert.match(code,/mm\/tahun/);
});
