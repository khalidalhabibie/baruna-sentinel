import test from "node:test";
import assert from "node:assert/strict";
import {inspectLocalStationEvidence,localStationEvidencePrint} from "./cors-evidence-bridge.js";
const project={
 mode:"SOURCE_BACKED_RESEARCH",
 records:[{id:"north-breakwater",name:"North breakwater",
  year:2005,historicRangeCm:[64,79]}]
};
const row=(station,date,doy,epoch=2880,extra={})=>({
 station,date,doy,epochs:epoch,expected_full_day_30s_epochs:2880,
 long_gaps_gt30s:0,largest_gap_min:0,
 first_epoch_gps:date+" 00:00:00",last_epoch_gps:date+" 23:59:30",
 epochs_with_C1_by_constellation:{
  G:epoch,R:epoch,E:epoch,S:0,"G+R+E":epoch
 },...extra
});
const sample=(rows)=>({
 schema:"baruna-private-cors-qc-v1",
 method:"GeoRinex RINEX observations (SYNTHETIC UNIT FIXTURE, NOT REAL)",
 disposition:"TEST DATA NEVER PUBLISHED",
 records:rows
});
test("QC pairs CSEM & CSMG same date but cannot set asset risk",()=>{
 const v=inspectLocalStationEvidence(sample([
  row("csem","2026-11-15",319),
  row("csmg","2026-11-15",319),
  row("csem","2026-11-16",320),
  row("csmg","2026-11-16",320,1700,{long_gaps_gt30s:2,largest_gap_min:31})
 ]),project,"north-breakwater");
 assert.equal(v.calendarDayPairs,2);
 assert.equal(v.full30sDayPairs,1);
 assert.equal(v.epochCoveragePercent.CSEM,100);
 assert.equal(v.epochCoveragePercent.CSMG,79.51);
 assert.deepEqual(v.missingArchiveDates.CSMG,[]);
 assert.equal(v.missingArchiveDates.CSEM.length,0);
 assert.equal(v.stationCoverageState,"SHARED_FULL_DAY");
 assert.equal(v.stationDays.CSEM,2);
 assert.equal(v.stationDays.CSMG,2);
 assert.equal(v.operatorPriorityAllowed,false);
 assert.equal(v.stationPositionSolutionComputed,false);
 assert.equal(v.onAssetMovementMeasured,false);
 assert.equal(v.decision,"REQUEST_UPDATED_SITE_EVIDENCE");
 const page=localStationEvidencePrint(v);
 assert.match(page,/LOCAL STATION OBSERVATION QC/);
 assert.match(page,/NOT BIG CERTIFIED/);
 assert.match(page,/CSEM \/ CSMG/);
 assert.match(page,/site evidence/i);
 assert.doesNotMatch(page,/HIGH RISK|SAFE ASSET/i);
});
test("same station without CSMG yields missing station; not zero-displacement",()=>{
 const v=inspectLocalStationEvidence(sample([row("csem","2026-11-15",319)]),project,"north-breakwater");
 assert.equal(v.stationCoverageState,"MISSING_STATION");
 assert.equal(v.full30sDayPairs,0);
 assert.deepEqual(v.missingArchiveDates.CSMG,[]);
 assert.equal(v.epochCoveragePercent.CSMG,0);
 assert.equal(v.operatorPriorityAllowed,false);
});
test("no overlap with both station files means no matching observation dates",()=>{
 const v=inspectLocalStationEvidence(sample([
  row("csem","2026-11-15",319),
  row("csmg","2026-11-16",320)
 ]),project,"north-breakwater");
 assert.equal(v.stationCoverageState,"NO_MATCHING_DATES");
 assert.equal(v.calendarDayPairs,0);
});
test("reject foreign stations, wrong DOY, duplicate samples and missing selected sector",()=>{
 assert.throws(()=>inspectLocalStationEvidence(sample([row("bako","2026-11-15",319)]),project,"north-breakwater"),/CSEM and CSMG/);
 assert.throws(()=>inspectLocalStationEvidence(sample([row("csem","2026-11-15",318)]),project,"north-breakwater"),/DOY and calendar date/);
 assert.throws(()=>inspectLocalStationEvidence(sample([row("csem","2026-11-15",319)]),project,"fictional-sector"),/documented field-study sector/);
});
test("only escaped source names enter printed report",()=>{
 const v=inspectLocalStationEvidence(sample([row("csem","2026-11-15",319)]),
 {mode:"SOURCE_BACKED_RESEARCH",records:[{
  id:"s1",name:"<img src=x onerror=alert(1)>",year:2005,historicRangeCm:[2,5]
 }]}, "s1");
 const text=localStationEvidencePrint(v);
 assert.ok(!text.includes("<img"));
 assert.ok(text.includes("&lt;img"));
});
