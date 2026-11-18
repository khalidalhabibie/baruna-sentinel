import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const doc=JSON.parse(readFileSync(new URL("../data/semarang-hyp3-phase-continuity-qa-20261118.json",import.meta.url),"utf8"));
const earlier=JSON.parse(readFileSync(new URL("../data/semarang-hyp3-aoi-pixel-screening-20261118.json",import.meta.url),"utf8"));

test("phase-continuity source references the actual single HyP3 geocoded product, not fabricated time series",()=>{
 assert.equal(doc.schema,"baruna-hyp3-phase-spatial-continuity-qa-v1");
 assert.equal(doc.source.product,"S1_162214_IW2_20261002_20261014_VV_INT80_5087");
 assert.deepEqual(doc.source.acquisitionDates,["2026-10-02","2026-10-14"]);
 assert.equal(doc.source.geocodedEPSG,32749);
 assert.equal(doc.source.nominalPixelSpacingMeters,80);
 assert.equal(doc.source.rasterRows,541);assert.equal(doc.source.rasterColumns,1312);
 assert.equal(doc.source.sourceFilesCommitted,false);
 for(const key of ["corr.tif","unw_phase.tif","conncomp.tif","water_mask.tif"]){
  assert.match(doc.source.inputGeoTIFFSha256[key],/^[a-f0-9]{64}$/);
 }
});

test("new phase-edge QA agrees with previous source-derived Kaligawe and three seeded AOI counts",()=>{
 const expected=new Map(earlier.aoiResults.map(a=>[a.aoiId,a]));
 assert.equal(doc.results.length,3);
 for(const row of doc.results){
  const prior=expected.get(row.aoiId);assert.ok(prior,row.aoiId);
  assert.equal(row.boundaryStatus,"ILLUSTRATIVE_UNVERIFIED");
  assert.equal(row.landPixelCenters,prior.landPixels);
  assert.equal(row.qualifiedResearchPixelsCoherenceGe07,prior.qualityPixels);
  assert.equal(row.qualityEightNeighborSpatialClusters,prior.qualityClusters8Connected);
  assert.equal(row.largestQualitySpatialClusterPixels,prior.largestQualityClusterPixels);
  assert.equal(row.snaphuConnectedComponentIdCounts.reduce((sum,c)=>sum+c.pixels,0),row.qualifiedResearchPixelsCoherenceGe07);
  const edges=row.phaseEdgeConsistency;
  assert.ok(Number.isInteger(edges.sameSnaphuComponentFourNeighborEdges)&&edges.sameSnaphuComponentFourNeighborEdges>0);
  assert.equal(edges.edgesWithAbsolutePhaseDifferenceGreaterThanPi,0);
  assert.ok(edges.absoluteUnwrappedPhaseDifferenceRadians.median<=edges.absoluteUnwrappedPhaseDifferenceRadians.p95);
  assert.ok(edges.absoluteUnwrappedPhaseDifferenceRadians.p95<=edges.absoluteUnwrappedPhaseDifferenceRadians.maximum);
  assert.match(edges.edgeInterpretation,/no independent unwrapping/i);
 }
 const k=doc.results.find(x=>x.aoiId==="aoi-seed-kaligawe-road");
 assert.equal(k.phaseEdgeConsistency.sameSnaphuComponentFourNeighborEdges,313);
 assert.equal(k.phaseEdgeConsistency.absoluteUnwrappedPhaseDifferenceRadians.p95,.4145);
});

test("scientific gates stay closed: smooth phase cannot become annual motion or asset risk",()=>{
 assert.equal(doc.method.independentUnwrappingCheck,false);
 assert.match(doc.method.thresholdFlag,/heuristic/);
 for(const key of ["stableReferenceValidated","atmosphericCorrectionsValidated",
   "phaseUnwrappingIndependentlyValidated","multiTemporalLOSValidated",
   "annualVerticalMotionAvailable","assetRiskRankingAllowed"])
  assert.equal(doc.scientificGates[key],false);
 assert.equal(doc.scientificGates.rawSourcePixelsAnalyzed,true);
 assert.equal(doc.scientificGates.singlePairOnly,true);
 assert.ok(!("annualVerticalMmYear" in doc));
 assert.ok(!("riskRank" in doc));
});
