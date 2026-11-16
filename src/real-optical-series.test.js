import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {validateOpticalSeries,decodeOpticalSeries,OPTICAL_VIEWS,sampleOpticalValue,opticalAreaStats,opticalSeriesExport} from './real-optical-series.js';
const m=JSON.parse(readFileSync(new URL('../data/semarang-s2-optical-series.json',import.meta.url)));
test('source-derived 14 and 21 Oct products have exact provenance, same grid and five previews',()=>{
 assert.equal(validateOpticalSeries(m),true);
 assert.equal(m.baseline.originalFourBandSha256,'d398e1af132b23fb3daecaf6477ed8f142d25dd02b6b3218a5c572c15d294363');
 assert.notEqual(m.baseline.sceneId,m.comparison.sceneId);
 assert.equal(OPTICAL_VIEWS.length,5);
 for(const v of OPTICAL_VIEWS){
  const p=m.previews[v.key];const raw=inflateSync(Buffer.from(p.b64,'base64'));
  assert.equal(raw.length,72*98);
  assert.equal(createHash('sha256').update(raw).digest('hex'),p.gridSha256);
 }
});
test('browser decoder authenticates each compressed grid by SHA256',async()=>{
 const grids=await decodeOpticalSeries(m);
 assert.equal(Object.keys(grids).length,5);
 const {baselineMndwi,comparisonMndwi}=grids;
 assert.equal(baselineMndwi.length,72*98);
 const corrupted=structuredClone(m);corrupted.previews.comparisonMndwi.gridSha256='0'.repeat(64);
 await assert.rejects(()=>decodeOpticalSeries(corrupted),/SHA256 mismatch/);
 const wrong=structuredClone(m);wrong.comparison.rasterSha256='0'.repeat(64);
 assert.throws(()=>validateOpticalSeries(wrong),/provenance/);
});
test('sampling outside AOI returns null and selected AOI stats are actual preview cells',async()=>{
 const grids=await decodeOpticalSeries(m);
 const key='mndwiContrast';
 const p=m.previews[key];
 assert.equal(sampleOpticalValue(grids[key],p,-8,110.43),null);
 const values=opticalAreaStats(grids[key],p,m.aoiEpsg4326);
 assert.equal(values.selectedPixels,72*98);
 assert.ok(values.validPct>99);
 assert.ok(values.median>=-.2&&values.median<=.2);
 const box=opticalAreaStats(grids[key],p,[110.41,-6.97,110.44,-6.93]);
 assert.ok(box.selectedPixels>0&&box.selectedPixels<values.selectedPixels);
 assert.ok(box.p10<=box.median&&box.median<=box.p90);
 assert.deepEqual(opticalAreaStats(grids[key],p,[111,-7,112,-6]).status,'NO_DISPLAY_GRID_CELLS');
});
test('export remains an index contrast, never verified rob or asset risk',()=>{
 const exported=opticalSeriesExport(m,'mndwiContrast',{median:0});
 assert.equal(exported.validatedFloodOrRobExtent,false);
 assert.equal(exported.validatedLandCoverChange,false);
 assert.equal(exported.usableForAssetRisk,false);
 assert.equal(exported.notAnInSARProduct,true);
 assert.equal(exported.viewKey,'mndwiContrast');
});