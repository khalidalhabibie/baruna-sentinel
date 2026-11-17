/** Browser P1 ZIP upload: all source data below are SYNTHETIC ONLY. */
import {chromium} from "playwright";
import {deflateRawSync} from "node:zlib";
import assert from "node:assert/strict";
const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
function fixture(){
 const dates=["2026-11-09","2026-11-10"];
 const create=(station,date,doy)=>({station,date,doy,epochs:2880,
  expected_full_day_30s_epochs:2880,long_gaps_gt30s:0,largest_gap_min:0,
  first_epoch_gps:date+" 00:00:00",last_epoch_gps:date+" 23:59:30",
  epochs_with_C1_by_constellation:{G:2880,R:2880,E:2880,S:0,C:0,J:0,"G+R+E":2880}});
 const records=[create("csem",dates[0],313),create("csmg",dates[0],313),create("csem",dates[1],314)];
 const qc={schema:"baruna-private-cors-qc-v1",method:"Synthetic RINEX QC for UI test",
  provenance:{origin:"USER_SUPPLIED_UNVERIFIED",systems_assessed:["E","G","R"],
   systems_not_assessed:["C","J","S","I"]},
  summary:{station_day_records:3,paired_calendar_days:1},records};
 const stations={};
 for(const key of ["CSEM","CSMG"]){
  const rows=records.filter(r=>r.station===key.toLowerCase());
  stations[key]={daysWithObservationFiles:rows.length,observedEpochs:rows.length*2880,
   totalLongGaps:0,full30SecondGridDays:rows.length,
   missingFromImportedArchive:dates.filter(date=>!rows.some(r=>r.date===date)),
   dateCoverage:rows.map(r=>({date:r.date,doy:r.doy,epochs:r.epochs,
    expectedEpochs:2880,coveragePercent:100,longGaps:0,largestGapMinutes:0,
    codeEpochs:{G:2880,R:2880,E:2880,"G+R+E":2880}}))};
 }
 const summary={schema:"baruna-p1-qc-handoff-summary-v1",recordCount:3,
  observationPeriod:{start:dates[0],end:dates[1]},pairedCalendarDates:[dates[0]],
  stations,scope:{observationQcProduced:true,positionSolutionProduced:false,
   annualSubsidenceMeasured:false,stationToAssetLinkValidated:false,
   operationalAssetRankingAllowed:false}};
 return {qc,summary};
}
const crcTable=Array.from({length:256},(_,n)=>{
 let c=n;for(let i=0;i<8;i++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;
});
function crc32(buf){
 let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);
 return (c^0xffffffff)>>>0;
}
function makeZip(qc,summary){
 const files=[["README_REVIEW.txt","SYNTHETIC TEST ONLY"],
  ["qc/CSEM_CSMG_QC.json",JSON.stringify(qc)],
  ["audit/QC_SUMMARY.json",JSON.stringify(summary)]];
 const locals=[],centrals=[];let offset=0,centralLength=0;
 for(const [name,text] of files){
  const title=Buffer.from(name),raw=Buffer.from(text),packed=deflateRawSync(raw),checksum=crc32(raw);
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);
  local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);
  local.writeUInt32LE(checksum,14);local.writeUInt32LE(packed.length,18);
  local.writeUInt32LE(raw.length,22);local.writeUInt16LE(title.length,26);
  locals.push(local,title,packed);
  const center=Buffer.alloc(46);center.writeUInt32LE(0x02014b50,0);
  center.writeUInt16LE(20,4);center.writeUInt16LE(20,6);
  center.writeUInt16LE(8,10);center.writeUInt32LE(checksum,16);
  center.writeUInt32LE(packed.length,20);center.writeUInt32LE(raw.length,24);
  center.writeUInt16LE(title.length,28);center.writeUInt32LE(offset,42);
  centrals.push(center,title);centralLength+=center.length+title.length;
  offset+=local.length+title.length+packed.length;
 }
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);
 end.writeUInt32LE(centralLength,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,...centrals,end]);
}
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
try {
 const {qc,summary}=fixture();
 const pkg={name:"BARUNA_SYNTHETIC_P1_QC_HANDOFF.zip",mimeType:"application/zip",
  buffer:makeZip(qc,summary)};
 const lab=await browser.newPage();
 lab.on("pageerror",e=>errors.push(e.message));
 assert.equal((await lab.goto(BASE+"/pilot-data-lab.html")).status(),200);
 await lab.locator("#p1-qc-file").setInputFiles(pkg);
 await lab.waitForFunction(()=>document.getElementById("p1-qc-result").textContent.includes("8.640 epoch"));
 assert.match(await lab.locator("#p1-qc-result").innerText(),/QC dan audit ZIP cocok/);
 assert.equal(await lab.locator("#p1-qc-days tbody tr").count(),2);
 assert.match(await lab.locator("#p1-qc-days").innerText(),/CSMG tidak ada di arsip/);
 assert.match(await lab.locator(".status-band").innerText(),/DATA INSUFFICIENT/);
 const rejected=structuredClone(summary);rejected.scope.annualSubsidenceMeasured=true;
 await lab.locator("#p1-qc-file").setInputFiles({...pkg,buffer:makeZip(qc,rejected)});
 await lab.waitForFunction(()=>document.getElementById("p1-qc-result").textContent.includes("P1 handoff:"));
 assert.equal(await lab.locator("#p1-qc-days tbody tr").count(),0);
 await lab.close();
 const brief=await browser.newPage();
 brief.on("pageerror",e=>errors.push(e.message));
 assert.equal((await brief.goto(BASE+"/evidence-brief-coaster.html")).status(),200);
 await brief.locator("#qc-brief-file").setInputFiles(pkg);
 await brief.waitForFunction(()=>document.getElementById("qc-brief-result").textContent.includes("8.640 epoch"));
 assert.equal(await brief.locator("#qc-brief-days tbody tr").count(),2);
 assert.match(await brief.locator("#brief-verdict").innerText(),/DATA INSUFFICIENT/);
 assert.deepEqual(errors,[]);
 console.log("P1 synthetic ZIP import, matched summaries, tamper guard and local printable annex PASS");
} finally {await browser.close();}
