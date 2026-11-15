import test from "node:test";
import assert from "node:assert/strict";
import {parseStationQc,renderStationQc} from "./station-qc.js";

// FICTITIOUS UNIT FIXTURES: never use these for published observation claims.
function daily(station,date,doy,epochs=2880,extras={}){
  return {
    station,date,doy,epochs,expected_full_day_30s_epochs:2880,
    long_gaps_gt30s:0,largest_gap_min:0,
    first_epoch_gps:date+" 00:00:00",
    last_epoch_gps:date+" 23:59:30",
    epochs_with_C1_by_constellation:{G:epochs,R:epochs,E:epochs,S:0,"G+R+E":epochs},
    ...extras
  };
}
const fixture=()=>({
  method:"Fictitious RINEX epoch-count parser for unit testing only",
  disposition:"TEST ONLY; NOT REAL BIG DATA",
  records:[
    daily("csem","2026-11-10",314),
    daily("csmg","2026-11-10",314),
    daily("csem","2026-11-11",315),
    daily("csmg","2026-11-11",315,1787,{long_gaps_gt30s:2,largest_gap_min:56.5}),
    daily("csem","2026-11-12",316)
  ]
});
test("parse local QC without changing records, joins matching full station-days",()=>{
  const obj=fixture();
  const data=parseStationQc(obj);
  assert.equal(data.totalEpochs,2880*4+1787);
  assert.deepEqual(data.jointFullDays,["2026-11-10"]);
  assert.equal(data.calendar.length,3);
  assert.equal(data.totals.find(s=>s.station==="csmg").complete,1);
  assert.equal(data.lookup.get("csmg|2026-11-11").largestGapMin,56.5);
});
test("report distinguishes no file, partial day and complete day",()=>{
  const html=renderStationQc(parseStationQc(fixture()));
  assert.match(html,/full 30-second epoch grid/i);
  assert.match(html,/No file/);
  assert.match(html,/62\.0%/);
  assert.match(html,/DOY 316/);
  assert.match(html,/Not computed/);
  assert.match(html,/not.*precision/i);
});
test("malformed or misidentified private summaries fail closed",()=>{
  const invalid=fixture();
  invalid.records[0].station="bako";
  assert.throws(()=>parseStationQc(invalid),/CSEM and CSMG/);
  const corrupt=fixture();
  corrupt.records[0].doy=313;
  assert.throws(()=>parseStationQc(corrupt),/DOY and calendar date/);
  const dup=fixture();
  dup.records.push({...dup.records[0]});
  assert.throws(()=>parseStationQc(dup),/Duplicate/);
  const wrongGrid=fixture();
  wrongGrid.records[0].expected_full_day_30s_epochs=86400;
  assert.throws(()=>parseStationQc(wrongGrid),/30-second daily/);
});
test("no direct source or receiver-identifying string is placed into HTML",()=>{
  const injected=fixture();
  injected.records[0].archive='<script>alert(1)</script>';
  const output=renderStationQc(parseStationQc(injected));
  assert.equal(output.includes("<script>"),false);
  assert.equal(output.includes("TEST ONLY"),false);
});
});
