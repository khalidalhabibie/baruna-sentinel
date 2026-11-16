import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectScenes,validateSceneInventory,formatDsmReading,reportSnapshot} from "./real-workspace.js";

const data = file => JSON.parse(readFileSync(new URL("../data/"+file,import.meta.url),"utf8"));

test("real workspace has 16 Sentinel-2 and 11 Sentinel-1 products sorted by actual dates",()=>{
  const catalog=data("semarang-sentinel-scenes.json");
  const s2=selectScenes(catalog.scenes,"2");
  const s1=selectScenes(catalog.scenes,"1");
  assert.equal(s2.length,16);
  assert.equal(s1.length,11);
  assert.equal(s2[0][2],"2026-11-16");
  assert.equal(s1[0][2],"2026-11-07");
  assert.ok(s2.every((r,i)=>i===0||s2[i-1][2]>=r[2]));
  assert.ok(s1.every((r,i)=>i===0||s1[i-1][2]>=r[2]));
});

test("surface readout is cautious about NoData and out-of-AOI clicks",()=>{
  assert.match(formatDsmReading(null,-6.94,110.43),/NoData/);
  assert.match(formatDsmReading(2.7,-6.94,110.43),/≈ 2.7 m/);
});

test("exported evidence brief preserves all scientific no-go gates",()=>{
  const meta=data("semarang-dsm-preview.json");
  const catalog=data("semarang-sentinel-scenes.json");
  const readiness=data("semarang-real-readiness.json");
  const result=reportSnapshot({
    meta,scenes:catalog.scenes,readiness,
    selection:selectScenes(catalog.scenes,"2")[0],
    sampled:{latitude:-6.94,longitude:110.43,previewDsmMeters:2.7}
  });
  assert.equal(result.satelliteCatalogue.countSentinel2,16);
  assert.equal(result.satelliteCatalogue.countSentinel1,11);
  assert.equal(result.evidenceGates.realInsar,false);
  assert.equal(result.evidenceGates.assetLevelInspectionPriority,false);
  assert.match(result.satelliteCatalogue.selectedScene.sourceKind,/METADATA_NOT_IMAGE_PIXELS/);
  assert.match(result.realDsm.previewPurpose,/NOT surveyed height/);
});

test("verified Sentinel catalogue may grow without changing application code",()=>{
 const catalog=data("semarang-sentinel-scenes.json");
 const readiness=data("semarang-real-readiness.json");
 assert.deepEqual(validateSceneInventory(catalog,readiness),{s1Count:11,s2Count:16});
 const updated=structuredClone(catalog);
 updated.scenes.push([...updated.scenes.find(row=>row[0]===2)]);
 updated.scenes.at(-1)[1]+="_ADDITIONAL_TEST_SCENE";
 const nextManifest=structuredClone(readiness);
 nextManifest.datasets.find(x=>x.id==="sentinel2_catalog").count=17;
 assert.deepEqual(validateSceneInventory(updated,nextManifest),{s1Count:11,s2Count:17});
 assert.throws(()=>validateSceneInventory(updated,readiness),/Manifest readiness berbeda/);
 const malformed=structuredClone(updated);
 malformed.scenes.at(-1)[2]="not-a-date";
 assert.throws(()=>validateSceneInventory(malformed,nextManifest),/pemeriksaan sumber/);
});
