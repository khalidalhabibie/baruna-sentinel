/** Synthetic-only checks. No private CSEM/CSMG observations are committed. */
import test from "node:test";
import assert from "node:assert/strict";
import {validateReviewHandoff,readP1InputFile,reviewText} from "./p1-handoff-reader.js";

function fixture(){
 const days=["2026-11-09","2026-11-10"];
 const record=(station,date,doy)=>({
  station,date,doy,epochs:2880,expected_full_day_30s_epochs:2880,
  long_gaps_gt30s:0,largest_gap_min:0,
  first_epoch_gps:date+" 00:00:00",last_epoch_gps:date+" 23:59:30",
  epochs_with_C1_by_constellation:{G:2880,R:2880,E:2880,S:0,C:0,J:0,"G+R+E":2880}
 });
 const rows=[record("csem",days[0],313),record("csmg",days[0],313),record("csem",days[1],314)];
 const qc={
  schema:"baruna-private-cors-qc-v1",
  method:"GeoRinex RINEX observation QC (synthetic test)",
  provenance:{origin:"USER_SUPPLIED_UNVERIFIED",systems_assessed:["E","G","R"],
   systems_not_assessed:["C","J","S","I"]},
  summary:{station_day_records:3,paired_calendar_days:1},records:rows
 };
 const stations={};
 for(const name of ["CSEM","CSMG"]){
  const r=rows.filter(x=>x.station===name.toLowerCase());
  stations[name]={
   daysWithObservationFiles:r.length,observedEpochs:r.length*2880,totalLongGaps:0,
   full30SecondGridDays:r.length,
   missingFromImportedArchive:days.filter(d=>!r.some(x=>x.date===d)),
   dateCoverage:r.map(x=>({
    date:x.date,doy:x.doy,epochs:2880,expectedEpochs:2880,coveragePercent:100,
    longGaps:0,largestGapMinutes:0,codeEpochs:{G:2880,R:2880,E:2880,"G+R+E":2880}
   }))
  };
 }
 const summary={
  schema:"baruna-p1-qc-handoff-summary-v1",recordCount:3,
  observationPeriod:{start:days[0],end:days[1]},pairedCalendarDates:[days[0]],
  stations,scope:{
   observationQcProduced:true,positionSolutionProduced:false,
   annualSubsidenceMeasured:false,stationToAssetLinkValidated:false,
   operationalAssetRankingAllowed:false
  }
 };
 return {qc,summary};
}
function mutate(document,fn){const x=structuredClone(document);fn(x);return x;}
test("accepted data stay local and counts match both station-day series",()=>{
 const {qc,summary}=fixture();
 const x=validateReviewHandoff(qc,summary);
 assert.equal(x.verifiedLocalStructure,true);
 assert.equal(x.parsed.totalEpochs,8640);
 assert.equal(x.parsed.jointFullDays.length,1);
 assert.match(reviewText(x),/Tidak ada|2026-11-10/);
});
test("tampered or mismatched audit rejects",()=>{
 const {qc,summary}=fixture();
 const bad=mutate(summary,s=>s.stations.CSMG.observedEpochs=123);
 assert.throws(()=>validateReviewHandoff(qc,bad),/tidak cocok/);
 const changed=mutate(summary,s=>s.stations.CSMG.missingFromImportedArchive=[]);
 assert.throws(()=>validateReviewHandoff(qc,changed),/tidak cocok/);
});
test("forbid subsidence, asset ranking and unsupported constellation claims",()=>{
 const {qc,summary}=fixture();
 const danger=mutate(summary,s=>s.scope.annualSubsidenceMeasured=true);
 assert.throws(()=>validateReviewHandoff(qc,danger),/Ruang lingkup/);
 const wrong=mutate(qc,q=>q.provenance.systems_assessed=["E","G","R","C"]);
 assert.throws(()=>validateReviewHandoff(wrong,summary),/Provenance/);
});
test("legacy JSON input still works, but is not called audited handoff",async()=>{
 const {qc}=fixture();const payload=new TextEncoder().encode(JSON.stringify(qc));
 const fake={name:"LOCAL_QC.json",size:payload.byteLength,arrayBuffer:async()=>payload.buffer};
 const x=await readP1InputFile(fake);
 assert.equal(x.verifiedLocalStructure,false);
 assert.equal(x.parsed.records.length,3);
});
