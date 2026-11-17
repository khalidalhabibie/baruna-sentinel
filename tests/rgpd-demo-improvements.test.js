import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateIndependentBakoQc,verificationActionsForSector} from "../src/rgpd-demo-improvements.js";
import {historicalBenchmarkSummary,verifyPublicAddendum} from "../src/public-evidence-addendum.js";
const bako=JSON.parse(readFileSync(new URL("../data/BAKO_IGS_2025-001_20min_qc_summary.json",import.meta.url),"utf8"));
const audit=JSON.parse(readFileSync(new URL("../data/tanjung-emas-published-evidence-addendum.json",import.meta.url),"utf8"));

test("BAKO authentic independent QC preserves 41 epochs, six constellations and pseudorange distinction",()=>{
 const x=validateIndependentBakoQc(bako);
 assert.equal(x.station,"BAKO00IDN");
 assert.equal(x.location,"Cibinong, Indonesia");
 assert.equal(x.epochCount,41);assert.equal(x.nonGpsEpochs,41);
 assert.equal(x.constellations.length,6);
 assert.equal(x.gpsOnlyAverage,8.951);assert.equal(x.multiGnssAverage,44.634);
 assert.equal(x.supportsSemarangMotion,false);
 assert.equal(x.supportsAssetRisk,false);
 assert.equal(x.notPositionAccuracy,true);
 assert.match(x.runUrl,/github.com/);
});
test("BAKO source cannot be relabeled as Semarang or position accuracy",()=>{
 const a=structuredClone(bako);a.source.station="CSMG";assert.throws(()=>validateIndependentBakoQc(a));
 const b=structuredClone(bako);b.audit.notAPositionAccuracyComparison=false;assert.throws(()=>validateIndependentBakoQc(b));
 const c=structuredClone(bako);c.relationshipToSemarang.linkedToCsemMovement=true;assert.throws(()=>validateIndependentBakoQc(c));
});
test("Coaster verified backlog requires geometry, representative measurements, exposure and owner policy",()=>{
 const x=verificationActionsForSector("coaster-street",{withPublishedCoasterContext:true});
 assert.equal(x.rankingAllowed,false);assert.equal(x.operationalRanking,"DATA_INSUFFICIENT");
 assert.equal(x.caseContext,"PUBLISHED_2026_COASTER_EXPOSURE_UNVERIFIED_SEGMENT_LINK");
 assert.deepEqual(x.actions.map(a=>a.key),["LOCATE","MEASURE","EXPOSURE","CRITICALITY"]);
 assert.match(x.actions[0].evidence,/725/);
 assert.match(x.actions[2].evidence,/mLWS/);
 assert.ok(x.actions.every(a=>a.owner&&a.deliverable&&a.evidence));
 const y=verificationActionsForSector("west-breakwater");
 assert.equal(y.rankingAllowed,false);assert.doesNotMatch(y.actions[0].evidence,/725/);
});
test("historical UTM coordinate collision is published in PDF text, not a BARUNA corrected location",()=>{
 const x=historicalBenchmarkSummary(audit);
 assert.equal(x.count,6);assert.equal(x.rankAllowed,false);assert.equal(x.pdfTextAudit,true);assert.equal(x.visualAudit,false);
 assert.equal(x.pairUtmDistanceM,0.001);
 assert.equal(audit.surveyReference.qa.rawTableCrossCheckedAgainstRenderedPdf,false);
 assert.equal(audit.surveyReference.qa.coordinateCollisionAudit.disposition,"CONFIRMED_IN_PUBLIC_PDF_TEXT_TABLE_BUT_GEODETIC_CORRECTION_UNRESOLVED");
 assert.equal(audit.surveyReference.qa.safeToPlotAsVerifiedAssets,false);
 const tampered=structuredClone(audit);tampered.surveyReference.qa.publishedTableTextCrossChecked=false;
 assert.throws(()=>verifyPublicAddendum(tampered));
});
