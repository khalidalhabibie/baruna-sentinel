import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const doc=JSON.parse(readFileSync(new URL("../data/semarang-hyp3-aoi-pixel-screening-20261118.json",import.meta.url),"utf8"));

test("source is genuine user-uploaded October HyP3 single pair, not simulated risk",()=>{
 assert.equal(doc.schema,"baruna-hyp3-real-aoi-pixel-screening-v1");
 assert.deepEqual(doc.source.acquisitionDates,["2026-10-02","2026-10-14"]);
 assert.equal(doc.source.geocodedEpsg,32749);
 assert.equal(doc.source.geocodedPixelSpacingMeters,80);
 assert.equal(doc.method.aoiBoundaryClass,"ILLUSTRATIVE_BOUNDARY_UNVERIFIED");
 assert.equal(doc.source.atmosphericCorrectionApplied,false);
 assert.equal(doc.scientificGates.multitemporalLOSTimeSeries,false);
 assert.equal(doc.scientificGates.annualVerticalSubsidenceAvailable,false);
 assert.equal(doc.scientificGates.infrastructureRiskRankingAllowed,false);
});

test("all 3 AOI pixel-screening fractions use land pixels (not eligible-only)",()=>{
 assert.equal(doc.aoiResults.length,3);
 const seen=new Set();
 for(const row of doc.aoiResults){
  assert.ok(!seen.has(row.aoiId));seen.add(row.aoiId);
  assert.equal(row.pixelsInsideAoi,row.landPixels+row.waterPixels);
  assert.ok(row.qualityPixels<=row.jointValidPixels && row.jointValidPixels<=row.landPixels);
  assert.equal(row.qualityShareOfLandPct,Number((row.qualityPixels/row.landPixels*100).toFixed(2)));
  assert.ok(row.largestQualityClusterPixels<=row.qualityPixels);
  assert.ok(row.qualityPixelsCoherenceGe09<=row.qualityPixels);
  assert.ok(row.qualityClusters8Connected>=1);
  assert.ok(!("annualVerticalRateMmYear" in row));
  assert.ok(!("riskRank" in row));
 }
});

test("Kaligawe highest availability and contiguous 8-neighbor quality in the seeded set",()=>{
 const rows=doc.aoiResults;
 const best=rows.find(x=>x.aoiId==="aoi-seed-kaligawe-road");
 assert.equal(best.landPixels,178);
 assert.equal(best.qualityPixels,173);
 assert.equal(best.qualityClusters8Connected,1);
 assert.equal(best.largestQualityClusterPixels,173);
 assert.equal(best.qualityPixelsCoherenceGe09,145);
 assert.ok(rows.every(x=>x===best||x.qualityShareOfLandPct<best.qualityShareOfLandPct));
});

test("BIG cartographic point outside Tanjung Emas AOI is not attributed polygon screening",()=>{
 assert.equal(doc.portLocator.insideIllustrativeTanjungEmasPolygon,false);
 assert.equal(doc.portLocator.waterMask,0);
 assert.equal(doc.portLocator.unwrappedPhaseValid,false);
 assert.ok(doc.portLocator.coherence<0.7);
});

test("the two baseline metadata sources are not silently equated",()=>{
 assert.notEqual(doc.source.processingPairBaselineMetadataMeters,doc.source.publicASFStackPerpendicularBaselineMeters);
 assert.match(doc.source.baselineNote,/sign conventions/);
});
