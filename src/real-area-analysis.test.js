import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inflateSync} from "node:zlib";
import {normalizeArea,analyzeDsmArea,bboxAreaKm2} from "./real-area-analysis.js";

const meta=JSON.parse(readFileSync(new URL("../data/semarang-dsm-preview.json",import.meta.url),"utf8"));
const grid=Uint8Array.from(inflateSync(Buffer.from(meta.b64,"base64")));

test("AOI normalization clips to actual Semarang source, rejects disconnected area",()=>{
 assert.deepEqual(normalizeArea([110.5,-7.1,110.4,-6.95],meta.aoiEpsg4326),
   [110.4,-7.025,110.485,-6.95]);
 assert.equal(normalizeArea([111,-8,112,-7.5],meta.aoiEpsg4326),null);
 assert.ok(bboxAreaKm2(meta.aoiEpsg4326)>0);
});

test("full AOI uses real Copernicus DSM preview without pretending to measure flood risk",()=>{
 const result=analyzeDsmArea(grid,meta,meta.aoiEpsg4326);
 assert.equal(result.status,"VALID_DISPLAY_GRID_STATS");
 assert.equal(result.selectedPixels,meta.previewSize[0]*meta.previewSize[1]);
 assert.ok(result.validPixels>=.95*result.selectedPixels);
 assert.ok(result.maxM>=result.medianM && result.medianM>=result.minM);
 assert.ok(result.p25M<=result.p75M);
 assert.ok(Number.isFinite(result.areaKm2));
 assert.equal(result.includesSeaAndStructures,true);
 assert.match(result.warning,/No flood depth/);
});

test("tiny area fails closed rather than inventing elevation",()=>{
 const result=analyzeDsmArea(grid,meta,[110.401,-6.934,110.40101,-6.93401]);
 assert.equal(result.status,"TOO_SMALL_FOR_PREVIEW_GRID");
 assert.equal(result.validPixels,0);
});

test("sparse DSM valid pixels must not produce exportable AOI statistics",()=>{
 const sparse=new Uint8Array(grid.length).fill(meta.nodataCode);
 sparse[0]=20;
 sparse[1]=21;
 sparse[2]=22;
 const result=analyzeDsmArea(sparse,meta,meta.aoiEpsg4326);
 assert.equal(result.status,"INSUFFICIENT_VALID_DSM_COVERAGE");
 assert.equal(result.validPixels,3);
 assert.equal(result.selectedPixels,grid.length);
 assert.ok(result.coveragePct<80);
 assert.equal(result.medianM,undefined,"no misleading statistics reported");
});
