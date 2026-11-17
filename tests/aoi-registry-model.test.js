import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 AOI_BOUNDS,STORE_KEY,validateAoiPolygon,parseAoiGeoJSON,polygonIntersects,
 readRegistry,writeRegistry,evaluateEvidenceSnapshot,diffEvidenceSnapshots,verificationQueue,makeEvidenceBrief
} from "../src/aoi-registry-model.js";

const P=[[110.430,-6.960],[110.447,-6.960],[110.447,-6.943],[110.430,-6.943],[110.430,-6.960]];
const poly=validateAoiPolygon(P);
const date="2026-11-17T02:00:00.000Z";
const record={id:"aoi-valid-12345678",name:"Tanjung Emas pilot",purpose:"evidence_review",createdAt:date,
 boundarySource:"USER_IMPORTED_UNVERIFIED",geometry:poly};
function fakeStorage(){const store=new Map();return{getItem:key=>store.get(key)??null,setItem:(key,val)=>store.set(key,val),removeItem:key=>store.delete(key)};}

test("validates Semarang polygon geometry with size, vertices and closed ring",()=>{
 assert.deepEqual(AOI_BOUNDS,[110.375,-7.025,110.485,-6.875]);
 assert.equal(poly.type,"Polygon");
 assert.deepEqual(poly.coordinates[0][0],poly.coordinates[0].at(-1));
 assert.ok(poly.areaKm2>1 && poly.areaKm2<10);
 assert.equal(poly.coordinates[0].length,5);
});
test("rejects outside area, missing vertices and self-intersection",()=>{
 assert.throws(()=>validateAoiPolygon([[106.8,-6.1],[106.9,-6.1],[106.85,-6.2]]),/dalam cakupan/);
 assert.throws(()=>validateAoiPolygon(P.slice(0,2)),/minimal 3/);
 assert.throws(()=>validateAoiPolygon([[110.43,-6.95],[110.45,-6.93],[110.43,-6.93],[110.45,-6.95]]),/memotong dirinya/);
 assert.throws(()=>validateAoiPolygon([[110.43,-6.95],[110.43,-6.95],[110.45,-6.95],[110.43,-6.94]]),/duplikat/);
 assert.throws(()=>validateAoiPolygon([[-150,-6.95],[110.45,-6.95],[110.44,-6.94]]),/dalam cakupan/);
});
test("imports one GeoJSON Polygon, rejects invalid projected CRS and multipolygons",()=>{
 const feature={type:"FeatureCollection",features:[{type:"Feature",properties:{},geometry:{type:"Polygon",coordinates:[P]}}]};
 assert.deepEqual(parseAoiGeoJSON(JSON.stringify(feature)),poly);
 assert.throws(()=>parseAoiGeoJSON({...feature,crs:{type:"name",properties:{name:"EPSG:32749"}}}),/EPSG:4326/);
 assert.throws(()=>parseAoiGeoJSON({type:"MultiPolygon",coordinates:[[P]]}),/Polygon GeoJSON/);
 assert.throws(()=>parseAoiGeoJSON({type:"FeatureCollection",features:[]}),/tepat satu/);
});
test("scene overlap tests actual polygon rather than only a bbox",()=>{
 const a=poly.coordinates[0];
 const overlap=[[110.440,-6.970],[110.480,-6.970],[110.480,-6.951],[110.440,-6.951],[110.440,-6.970]];
 const outside=[[110.380,-6.999],[110.390,-6.999],[110.390,-6.990],[110.380,-6.990],[110.380,-6.999]];
 assert.equal(polygonIntersects(a,overlap),true);
 assert.equal(polygonIntersects(a,outside),false);
});
test("registry persists locally, retains review disclaimer and rejects tampered data",()=>{
 const storage=fakeStorage();
 const saved=writeRegistry(storage,[record]);
 assert.equal(storage.getItem(STORE_KEY)?.includes("Tanjung Emas pilot"),true);
 assert.equal(saved[0].sourceStatus,"USER_DECLARED_UNVERIFIED");
 assert.equal(readRegistry(storage)[0].rankingEligibility,"DATA_INSUFFICIENT");
 assert.throws(()=>writeRegistry(storage,[record,record]),/duplikat/);
 assert.throws(()=>writeRegistry(storage,[{...record,name:"x"}]),/3–70/);
 assert.equal(readRegistry(storage).length,1);
});
test("checks only actual local STAC manifest scenes and never claims InSAR",()=>{
 const scene=(sensor,id,date,points)=>[sensor,id,date,sensor===2?2:null,points];
 const included=[[110.425,-6.965],[110.46,-6.965],[110.46,-6.935],[110.425,-6.935],[110.425,-6.965]];
 const external=[[110.375,-7.02],[110.385,-7.02],[110.385,-7.01],[110.375,-7.01],[110.375,-7.02]];
 const catalog={schema:"baruna-real-scene-index-v1",sourceMode:"REAL_CATALOG_METADATA_ONLY_NOT_INSAR",source:"Test fixture catalog",scenes:[scene(2,"s2-oct","2026-10-14",included),scene(1,"s1-grd","2026-10-12",included),scene(2,"outside","2026-10-21",external)]};
 const readiness={schema:"baruna-real-evidence-readiness-v1",asOf:"2026-11-16"};
 const first=evaluateEvidenceSnapshot(poly,catalog,readiness,date);
 assert.equal(first.s1Grd.length,1);
 assert.equal(first.s2L2a.length,1);
 assert.equal(first.coverageMethod,"SCENE_FOOTPRINT_POLYGON_INTERSECTION_NOT_PIXEL_COVERAGE");
 assert.equal(first.capabilities.grdIsInSAR,false);
 assert.equal(first.capabilities.scheduledMonitoring,false);
 assert.deepEqual(diffEvidenceSnapshots(null,first),{isBaseline:true,newS1:[],newS2:[],newTotal:0});
 catalog.scenes.push(scene(2,"s2-next","2026-11-01",included));
 const second=evaluateEvidenceSnapshot(poly,catalog,readiness,date);
 const diff=diffEvidenceSnapshots(first,second);
 assert.equal(diff.newS2.length,1);
 assert.equal(diff.newS1.length,0);
 assert.equal(diff.newTotal,1);
 assert.equal(diff.isBaseline,false);
 assert.throws(()=>evaluateEvidenceSnapshot(poly,{...catalog,sourceMode:"FAKE"},readiness,date),/tervalidasi/);
});
test("verification queue cannot turn absent asset data into operational priority",()=>{
 const task=verificationQueue(record);
 assert.equal(task.length,5);
 assert.ok(task.every(x=>x.state!=="SAFE"&&x.state!=="LOW_RISK"));
 const brief=makeEvidenceBrief(record);
 assert.equal(brief.decision.operationalRanking,"DATA_INSUFFICIENT");
 assert.equal(brief.decision.rankedAssets,0);
 assert.equal(brief.verificationQueue.length,5);
 assert.match(brief.limitations.join(" "),/private operator cloud persistence only when configured/);
});
test("public UI includes real registry controls and no fake automatic monitoring",()=>{
 const html=readFileSync(new URL("../aoi-registry.html",import.meta.url),"utf8");
 assert.match(html,/id="aoi-map"/);
 assert.match(html,/id="upload-geojson"/);
 assert.match(html,/id="check-evidence"/);
 assert.match(html,/id="verification-queue"/);
 assert.match(html,/BROWSER-LOCAL/);
 assert.match(html,/bukan pemantauan otomatis/);
});