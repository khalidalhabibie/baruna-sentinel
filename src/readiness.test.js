import {readFileSync} from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {evidenceReadiness,verificationRequestForSector,COASTAL_CONTEXT} from "./readiness.js";
import {parseRneu,analyzeSeries} from "./engine.js";

const study=JSON.parse(readFileSync(new URL("../data/tanjung-emas-historical-field-evidence.json",import.meta.url),"utf8"));
const qc=JSON.parse(readFileSync(new URL("../data/BAKO_IGS_2025-001_20min_qc_summary.json",import.meta.url),"utf8"));
const history=analyzeSeries(parseRneu(
  readFileSync(new URL("../data/CSEM_clean_Noff1site.source-derived.rneu",import.meta.url),"utf8"),
  {station:"CSEM"}));
const input={
  fieldEvidence:study,movement:history,movementMeta:{mode:"published"},
  rinex:{
    marker:qc.source.station,status:"MULTI_GNSS_RECORDS_SEEN",
    linkedToCsemMovement:false,verifiedRun:qc.verifiedRun},
  rinexMeta:{mode:"real-qc"}
};
test("executive snapshot counts three genuine but independent data sources with zero modern site monitoring",()=>{
  const r=evidenceReadiness(input);
  assert.equal(r.sectorCount,6);
  assert.equal(r.loadedEvidenceStreams,3);
  assert.equal(r.currentInstrumentedAssetMeasurementsInDemo,0);
  assert.equal(r.validatedCurrentAssetSafetyDecisions,0);
  assert.equal(r.state,"NEEDS_ASSET_SPECIFIC_VERIFICATION");
  assert.equal(r.availableAction,"PREPARE_UPDATED_EVIDENCE_REQUEST");
  assert.ok(r.unsupportedConclusions.some(s=>s.includes("BAKO")));
});
test("no synthetic input or unrelated GNSS proof can qualify historic/site evidence",()=>{
  const r=evidenceReadiness({...input,movementMeta:{mode:"synthetic"},rinex:{...input.rinex,linkedToCsemMovement:true}});
  assert.equal(r.loadedEvidenceStreams,1);
  assert.equal(r.currentInstrumentedAssetMeasurementsInDemo,0);
  const empty=evidenceReadiness({});
  assert.equal(empty.loadedEvidenceStreams,0);
  assert.equal(empty.sectorCount,null);
});
test("site-specific evidence request preserves historic context and prohibits fabricated ROI/safety numbers",()=>{
  const r=verificationRequestForSector(study,"west-breakwater");
  assert.equal(r.currentAssetCondition,"UNKNOWN");
  assert.deepEqual(r.historicCumulativeSettlementCm,[74,140]);
  assert.equal(r.historicMeasurementYear,2005);
  assert.equal(r.decision,"REQUEST_UPDATED_EVIDENCE");
  assert.equal(r.request.length,4);
  assert.equal(r.estimates.roi,null);
  assert.equal(r.estimates.costIdr,null);
  assert.throws(()=>verificationRequestForSector(study,"fictitious"),/Unknown/);
});
test("BMKG coastal context is dated and cannot be interpreted as live deformation warning",()=>{
  assert.equal(COASTAL_CONTEXT.issuedInPast,true);
  assert.equal(COASTAL_CONTEXT.publishedPeriod,"1–6 November 2026");
  assert.match(COASTAL_CONTEXT.caveat,/NOT a current warning/);
});
