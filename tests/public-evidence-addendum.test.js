import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyPublicAddendum,sectorPublicContext,historicalBenchmarkSummary} from "../src/public-evidence-addendum.js";
const raw=JSON.parse(readFileSync(new URL("../data/tanjung-emas-published-evidence-addendum.json",import.meta.url),"utf8"));
const clone=()=>structuredClone(raw);
test("source citations and six historical survey benchmark rows are present, with duplicate QA flagged",()=>{
 const d=verifyPublicAddendum(raw),s=historicalBenchmarkSummary(d);
 assert.equal(s.count,6);
 assert.equal(s.rankAllowed,false);
 assert.equal(s.verifiedAssetGeometry,false);
 assert.deepEqual(s.collisionIds,["TB 1","TB 2"]);
 assert.equal(d.surveyReference.qa.safeToPlotAsVerifiedAssets,false);
 assert.equal(d.surveyReference.qa.rawTableCrossCheckedAgainstRenderedPdf,false);
});
test("Coaster Road published 2026 exposure stays distinct from on-asset movement and all other sectors",()=>{
 const c=sectorPublicContext(raw,"coaster-street");
 assert.equal(c.year,2026);assert.equal(c.segmentLengthMApprox,725);
 assert.deepEqual(c.reportedRoadElevationMlwsRangeM,[0.5,0.7]);
 assert.equal(c.reportedMaximumSeaLevelMlwsM,1.1);
 assert.equal(c.rankAllowed,false);assert.equal(c.unverifiedSegmentMatch,true);
 assert.equal(sectorPublicContext(raw,"west-breakwater"),null);
 assert.equal(raw.assetExposureCase.onAssetGnssOrLevellingSolution,null);
 assert.equal(raw.decisionBoundary.qualityGateStatus,"DATA_INSUFFICIENT");
});
test("corrupted or unguarded addendum cannot be shown as accepted source",()=>{
 const a=clone();a.decisionBoundary.operationalAssetRankAllowed=true;assert.throws(()=>verifyPublicAddendum(a));
 const b=clone();b.surveyReference.qa.status="VERIFIED";assert.throws(()=>verifyPublicAddendum(b));
 const c=clone();c.surveyReference.benchmarkPoints.find(p=>p.id==="TB 2").utmXY=[436900,9232900];assert.throws(()=>verifyPublicAddendum(c));
 const d=clone();d.assetExposureCase.fieldRiskRank="HIGH";assert.throws(()=>verifyPublicAddendum(d));
});
