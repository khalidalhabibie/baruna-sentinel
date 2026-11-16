import test from "node:test";
import assert from "node:assert/strict";
import {VIDEO_FIXTURE_VERSION,VIDEO_SOURCES,VIDEO_ASSETS,VIDEO_CONTEXT,SOURCE_STATUS,validateVideoSources} from "./video-fixture.js";

test("video mode is isolated and every source declares its provenance",()=>{
 assert.equal(VIDEO_FIXTURE_VERSION,"baruna-video-only-v1");
 assert.equal(validateVideoSources().length,7);
 assert.deepEqual(VIDEO_SOURCES.filter(x=>x.status===SOURCE_STATUS.LOCAL).map(x=>x.id),["cors"]);
 assert.deepEqual(VIDEO_SOURCES.filter(x=>x.status===SOURCE_STATUS.PENDING).map(x=>x.id),["station_series"]);
 assert.deepEqual(VIDEO_SOURCES.filter(x=>x.status===SOURCE_STATUS.SYNTHETIC).map(x=>x.id),["demnas","assets"]);
 assert.deepEqual(VIDEO_SOURCES.filter(x=>x.status===SOURCE_STATUS.FORECAST).map(x=>x.id),["tide"]);
 assert.deepEqual(VIDEO_SOURCES.filter(x=>x.status===SOURCE_STATUS.CATALOGUE).map(x=>x.id),["drainage","satellite"]);
 assert.ok(VIDEO_SOURCES.every(x=>x.source===null||x.source.startsWith("https://")));
});
test("synthetic assets are not real operator geometry or geodetic sites",()=>{
 assert.equal(VIDEO_ASSETS.length,3);
 assert.ok(VIDEO_ASSETS.every(x=>x.type==="FIKTIF"&&x.id.startsWith("DEMO-")));
 assert.equal(VIDEO_CONTEXT.provenance,SOURCE_STATUS.SYNTHETIC);
 assert.equal(VIDEO_CONTEXT.positionSolution.velocityMmPerYear,null);
 assert.equal(VIDEO_CONTEXT.positionSolution.uncertaintyMm,null);
 assert.equal(VIDEO_CONTEXT.verifiedAssetGeometry,false);
 assert.ok(!VIDEO_ASSETS.some(x=>"latitude" in x||"longitude" in x||"assetRiskLevel" in x));
});
test("source contract rejects missing provenance",()=>{
 assert.throws(()=>validateVideoSources(VIDEO_SOURCES.map((x,i)=>i?x:{...x,status:"VERIFIED"})),/provenance/);
 assert.throws(()=>validateVideoSources(VIDEO_SOURCES.slice(1)),/contract/);
});
