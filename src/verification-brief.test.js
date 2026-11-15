import test from "node:test";
import assert from "node:assert/strict";
import { buildVerificationBriefMarkup } from "./report.js";

const verification = {
  sectorId:"west-breakwater",
  sectorName:"West breakwater",
  historicMeasurementYear:2005,
  historicCumulativeSettlementCm:[74,140],
  currentAssetCondition:"UNKNOWN",
  decision:"REQUEST_UPDATED_EVIDENCE",
  request:[
    "Confirm the surveyed asset boundary with the operator.",
    "Acquire a current site-representative geodetic survey.",
    "Validate date, datum, uncertainty and linkage.",
    "Have a qualified engineer approve any operational threshold."
  ]
};
const source = {
  reportedSurveyYear:2005,
  publication:{title:"Published field research",doi:"10.32693/bomg.32.1.2017.351"}
};

test("verification brief is comprehensible and independent of GNSS processing results",()=>{
  const html=buildVerificationBriefMarkup({verification,source,generatedAt:"2026-11-15T16:00:00Z"});
  assert.match(html,/West breakwater/);
  assert.match(html,/What we know/);
  assert.match(html,/What we cannot conclude/);
  assert.match(html,/What to verify next/);
  assert.match(html,/74–140 cm/);
  assert.match(html,/CURRENT ASSET CONDITION/);
  assert.match(html,/UNKNOWN/);
  assert.match(html,/REQUEST UPDATED FIELD EVIDENCE/);
  assert.match(html,/10\.32693\/bomg\.32\.1\.2017\.351/);
  assert.match(html,/Confirm the surveyed asset boundary/);
  assert.doesNotMatch(html, /REAL GPS-DERIVED HISTORICAL SERIES/);
});
test("verification brief escapes user-controlled source strings",()=>{
  const html=buildVerificationBriefMarkup({
    verification:{...verification,sectorName:'<img src=x onerror="alert(1)">'},
    source,generatedAt:"2026-11-15T16:00:00Z"
  });
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes('<img src=x'));
});
test("verification brief rejects unknown source and unsupported risk decisions",()=>{
  assert.throws(()=>buildVerificationBriefMarkup({source,verification:{...verification,decision:"ASSET_SAFE"}}),TypeError);
  assert.throws(()=>buildVerificationBriefMarkup({source:{reportedSurveyYear:2026},verification}),TypeError);
  assert.throws(()=>buildVerificationBriefMarkup({source,verification:null}),TypeError);
});
