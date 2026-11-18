import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 validatedKaligawePilot,renderInsarNetwork,renderRealKaligawePilot,
 loadRealKaligawePilot
} from "./insar-network-readiness.js";

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),"utf8"));
const network=read("../data/semarang-asf-burst-network-20261118.json");
const oldQA=read("../data/semarang-real-hyp3-insar-qa.json");
const baselines=read("../data/semarang-asf-15-baseline-candidates-20261118.json");
const raster=read("../data/semarang-hyp3-aoi-pixel-screening-20261118.json");
const clone=obj=>structuredClone(obj);
const ids=["rk-insar-status","rk-insar-count","rk-insar-edge-count","rk-insar-qa-count",
 "rk-insar-coverage","rk-insar-port","rk-insar-science","rk-insar-timeline",
 "rk-insar-pilot-status","rk-insar-existing","rk-insar-next-one","rk-insar-next-two",
 "rk-insar-baseline-total","rk-insar-aoi-quality","rk-insar-aoi-note",
 "real-insar-pilot-status","real-insar-pilot-focus","real-insar-pilot-baselines",
 "real-insar-pilot-first","real-insar-pilot-existing","real-insar-pilot-last"];
function dom(){
 const m=new Map();
 const element=()=>({textContent:"",children:[],replaceChildren(){this.children=[];},
   append(...items){this.children.push(...items);}});
 ids.forEach(id=>m.set(id,element()));
 return {nodes:m,root:{getElementById:id=>m.get(id),createElement:element},
  text:id=>m.get(id).textContent};
}

test("true Kaligawe minimum pilot uses one processed pair and exactly two unprocessed ASF candidates",()=>{
 const report=validatedKaligawePilot(baselines,raster);
 assert.equal(report.sourceBaselinesCount,15);
 assert.equal(report.focus.qualityPixels,173);
 assert.equal(report.focus.landPixels,178);
 assert.deepEqual(report.pilot.threeTemporalEdges.map(x=>x.processedProductAvailable),
  [false,true,false]);
 assert.deepEqual(report.pilot.threeTemporalEdges.map(x=>x.asfPerpendicularBaselineMeters),
  [-37,-16,-54]);
 assert.equal(report.pilot.costEstimateCredits,null);
 assert.equal(report.pilot.minimumAdditionalJobsIfApproved,2);
 assert.equal(report.pilot.focusAoiId,"aoi-seed-kaligawe-road");
});

test("manifest tampering cannot quietly move a missing product to processed or invent risk",()=>{
 for(const change of [
  b=>b.minimumPilot.threeTemporalEdges[0].processedProductAvailable=true,
  b=>b.minimumPilot.threeTemporalEdges[1].processedProductAvailable=false,
  b=>b.minimumPilot.threeTemporalEdges[2].asfPerpendicularBaselineMeters=-4,
  b=>b.minimumPilot.focusAoiId="aoi-seed-tanjung-emas",
  b=>b.minimumPilot.costEstimateCredits=1,
  b=>b.minimumPilot.minimumAdditionalJobsIfApproved=0,
  b=>b.minimumPilot.dates=["2026-09-20","2026-10-02","2026-10-26"],
 ]){
  const corrupted=clone(baselines);change(corrupted);
  assert.throws(()=>validatedKaligawePilot(corrupted,raster),
   /ASF burst readiness rejected/i);
 }
 const broken=clone(raster);
 broken.aoiResults.find(x=>x.aoiId==="aoi-seed-kaligawe-road").qualityPixels=160;
 assert.throws(()=>validatedKaligawePilot(baselines,broken),/ASF burst readiness rejected/i);
});

test("real and ranking UI show source-backed readiness but no annual velocity",()=>{
 const d=dom();
 renderInsarNetwork(network,oldQA,d.root,baselines,raster);
 assert.match(d.text("rk-insar-pilot-status"),/2 PROCESSING PENDING/);
 assert.match(d.text("rk-insar-existing"),/HyP3 tersedia/);
 assert.match(d.text("rk-insar-next-one"),/−37 m| -37 m/);
 assert.match(d.text("rk-insar-next-two"),/−54 m| -54 m/);
 assert.match(d.text("rk-insar-baseline-total"),/15 baseline orbit ASF/);
 assert.match(d.text("rk-insar-baseline-total"),/173\/178/);
 assert.equal(d.nodes.get("rk-insar-timeline").children.length,8);
 assert.equal(d.nodes.get("rk-insar-aoi-quality").children.length,3);
 assert.match(d.text("rk-insar-science"),/belum ada time-series/i);
 renderRealKaligawePilot(baselines,raster,d.root);
 assert.match(d.text("real-insar-pilot-status"),/1 processed · 2 pending/);
 assert.match(d.text("real-insar-pilot-focus"),/173\/178/);
 assert.match(d.text("real-insar-pilot-existing"),/HyP3 tersedia/);
 assert.match(d.text("real-insar-pilot-first"),/belum diproses/);
 assert.match(d.text("real-insar-pilot-last"),/belum diproses/);
 assert.doesNotMatch(d.text("real-insar-pilot-baselines"),/mm\/tahun/);
});

test("real-workspace fails closed if either new production source endpoint is 404",async()=>{
 const d=dom();
 const loader=async path=>({
  ok:!path.includes("15-baseline"),
  json:async()=>path.includes("15-baseline")?baselines:raster
 });
 assert.equal(await loadRealKaligawePilot(d.root,loader),null);
 assert.equal(d.text("real-insar-pilot-status"),"SOURCE UNAVAILABLE");
 assert.match(d.text("real-insar-pilot-focus"),/belum dapat diverifikasi/);
 assert.match(d.text("real-insar-pilot-existing"),/Perlu data sumber/);
});

test("P1/P2 pages preserve real/simulation boundary and ship one shared blue stylesheet",()=>{
 const html=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
 for(const name of ["ranking-center.html","aoi-registry.html",
  "real-workspace.html","spatial-demo.html"]){
  const source=html(name);
  assert.match(source,/class="baruna-spatial-unified"/);
  assert.match(source,/spatial-ui-alignment\.css/);
 }
 assert.match(html("spatial-demo.html"),/input sintetis/i);
 assert.match(html("spatial-demo.html"),/bukan output InSAR, Multi-GNSS/i);
 assert.match(html("real-workspace.html"),/real-insar-pilot-status/);
 assert.match(html("ranking-center.html"),/rk-insar-pilot-status/);
 const build=html("scripts/build-static.mjs");
 assert.match(build,/spatial-ui-alignment\.css/);
});
