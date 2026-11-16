import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inflateSync} from "node:zlib";
import {createHash} from "node:crypto";
import {validateNdwiMetadata, sampleNdwiDisplay,
        decodeNdwiGrid, opticalExportEvidence} from "./real-sentinel2-evidence.js";

const meta = JSON.parse(readFileSync(new URL("../data/semarang-s2-ndwi-preview.json", import.meta.url), "utf8"));

test("real Sentinel-2 preview is source-traceable and geospatially aligned", () => {
  assert.equal(validateNdwiMetadata(meta), true);
  assert.equal(meta.sourceRasterSha256, "d398e1af132b23fb3daecaf6477ed8f142d25dd02b6b3218a5c572c15d294363");
  assert.deepEqual(meta.sourceBands, ["B03", "B04", "B08", "SCL"]);
  assert.deepEqual(meta.aoiEpsg4326, [110.375,-7.025,110.485,-6.875]);
  const grid = inflateSync(Buffer.from(meta.b64,"base64"));
  assert.equal(grid.length, 72*98);
  assert.equal(createHash("sha256").update(grid).digest("hex"), meta.gridSha256);
  assert.ok(grid.filter(x=>x !== 255).length > grid.length*.95);
});

test("NDWI display pixels are actual decoded grid, no synthetic fallback", async () => {
  const grid=await decodeNdwiGrid(meta);
  assert.ok(grid instanceof Uint8Array);
  const sample=sampleNdwiDisplay(grid,meta,-6.95,110.42);
  assert.ok(sample === null || (sample>=-1 && sample<=1));
  assert.equal(sampleNdwiDisplay(grid,meta,-8,110.42), null);
  assert.equal(sampleNdwiDisplay(grid,meta,-6.95,111), null);
});

test("single-date optical evidence never allows change, rob, InSAR or risk claims", () => {
  const evidence=opticalExportEvidence(meta);
  assert.equal(evidence.temporalChangeAvailable,false);
  assert.equal(evidence.floodExtentVerified,false);
  assert.equal(evidence.onAssetRiskScoringAllowed,false);
  assert.equal(evidence.sourceStatistics.sclWaterClass6Fraction,0.48658);
  assert.match(evidence.previewPurpose,/DISPLAY_ONLY/);
  const missing=structuredClone(meta);
  missing.sourceRasterSha256="0".repeat(64);
  assert.throws(()=>validateNdwiMetadata(missing),/provenance/);
  const invented=structuredClone(meta);
  invented.sceneId="S2B_T49MDN_20261015T025716_L2A";
  assert.throws(()=>validateNdwiMetadata(invented),/provenance/);
});
