import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inflateSync} from "node:zlib";
import {sampleDisplayGrid, decodeDisplayGrid} from "./real-spatial-evidence.js";

const read = file => JSON.parse(readFileSync(new URL("../data/" + file, import.meta.url), "utf8"));

test("real DSM grid is traceable and decodes to the correct geospatial size", async () => {
  const dsm = read("semarang-dsm-preview.json");
  assert.equal(dsm.sourceTifSha256.length, 64);
  assert.deepEqual(dsm.aoiEpsg4326, [110.375, -7.025, 110.485, -6.875]);
  assert.deepEqual(dsm.previewSize, [72,98]);
  assert.deepEqual(dsm.sourceSize, [396,540]);
  const buffer = inflateSync(Buffer.from(dsm.b64, "base64"));
  assert.equal(buffer.length, 72*98);
  const decoded = await decodeDisplayGrid(dsm);
  assert.deepEqual(decoded, Uint8Array.from(buffer));
  const valid = decoded.filter(n => n !== dsm.nodataCode);
  assert.ok(valid.length > decoded.length * .95);
  const sample = sampleDisplayGrid(decoded, dsm, -6.95, 110.42);
  assert.equal(typeof sample, "number");
  assert.ok(sample >= -5 && sample < 150);
  assert.equal(sampleDisplayGrid(decoded, dsm, -8, 110.42), null);
});

test("real scenes are complete, unique, valid metadata and never described as optical pixels", () => {
  const catalog = read("semarang-sentinel-scenes.json");
  assert.equal(catalog.count, 27);
  assert.equal(catalog.scenes.filter(row => row[0] === 1).length, 11);
  assert.equal(catalog.scenes.filter(row => row[0] === 2).length, 16);
  assert.equal(new Set(catalog.scenes.map(row => row[1])).size, 27);
  assert.match(catalog.sourceMode, /METADATA_ONLY/);
  for (const [sensor, id, date, cloud, polygon] of catalog.scenes) {
    assert.ok([1,2].includes(sensor));
    assert.ok(id.startsWith(sensor === 1 ? "S1" : "S2"));
    assert.match(date, /^2026-\d\d-\d\d$/);
    assert.ok(Array.isArray(polygon) && polygon.length >= 4);
    assert.deepEqual(polygon[0],polygon.at(-1));
    for (const [lon,lat] of polygon) {
      assert.ok(lon >= 90 && lon < 150);
      assert.ok(lat >= -12 && lat < 10);
    }
    if (sensor === 1) assert.equal(cloud,null);
    else assert.ok(Number.isFinite(cloud) && cloud>=0 && cloud<=100);
  }
});

test("real evidence gates prohibit unverified on-asset analysis", () => {
  const readiness = read("semarang-real-readiness.json");
  assert.equal(readiness.modelGate.surfaceLayer, true);
  assert.equal(readiness.modelGate.sceneDiscovery, true);
  assert.equal(readiness.modelGate.realOpticalAnalysis, false);
  assert.equal(readiness.modelGate.realInsar, false);
  assert.equal(readiness.modelGate.assetLevelInspectionPriority, false);
  assert.equal(readiness.datasets.find(x => x.id === "big_demnas").status, "REJECTED_INVALID_PIXEL_VALUES");
});
