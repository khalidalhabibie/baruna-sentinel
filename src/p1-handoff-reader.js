/**
 * BARUNA P1 handoff reader. Derived QC stays in browser memory; no fetch,
 * upload, localStorage, or publication of source ZIP/hash/receiver details.
 */
import {parseStationQc} from "./station-qc.js";

const allowed = new Set([
 "README_REVIEW.txt","qc/CSEM_CSMG_QC.json","audit/QC_SUMMARY.json",
 "demnas/BARUNA_DEMNAS_preview.json"
]);
const required = ["README_REVIEW.txt","qc/CSEM_CSMG_QC.json","audit/QC_SUMMARY.json"];
const fail = message => { throw new TypeError("P1 handoff: "+message); };
const eq = (a,b) => JSON.stringify(a)===JSON.stringify(b);
const dateKeys = rows => rows.map(row=>row.date).sort();
const sorted = xs => [...xs].sort();
const int = x => Number.isInteger(x)&&x>=0;
const crcTable = Array.from({length:256},(_,n)=>{
 let c=n;
 for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;
 return c>>>0;
});
function crc32(bytes){
 let c=0xffffffff;
 for(const x of bytes)c=crcTable[(c^x)&255]^(c>>>8);
 return (c^0xffffffff)>>>0;
}
function json(bytes){
 try {return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));}
 catch{fail("JSON rusak atau bukan UTF-8.");}
}
function ensure(ok,message){if(!ok)fail(message);}
function stationDay(parsed,station){return parsed.records.filter(r=>r.station===station);}
function stationSummary(parsed,summary,station){
 const rows=stationDay(parsed,station),s=summary.stations?.[station.toUpperCase()];
 ensure(s&&int(s.daysWithObservationFiles)&&int(s.observedEpochs)&&int(s.totalLongGaps)&&int(s.full30SecondGridDays),
  "Ringkasan "+station+" tidak lengkap.");
 const missing=parsed.calendar.map(x=>x.date).filter(d=>!parsed.lookup.has(station+"|"+d));
 ensure(s.daysWithObservationFiles===rows.length &&
  s.observedEpochs===rows.reduce((n,r)=>n+r.epochs,0) &&
  s.totalLongGaps===rows.reduce((n,r)=>n+r.longGaps,0) &&
  s.full30SecondGridDays===parsed.totals.find(x=>x.station===station).complete &&
  eq(sorted(s.missingFromImportedArchive||[]),missing),
  "Jumlah epoch, gap, atau tanggal hilang "+station+" tidak cocok.");
 ensure(Array.isArray(s.dateCoverage)&&s.dateCoverage.length===rows.length,
  "Cakupan harian "+station+" tidak cocok.");
 const byDate=new Map(s.dateCoverage.map(v=>[v.date,v]));
 ensure(byDate.size===rows.length,"Tanggal rangkuman "+station+" duplikat.");
 for(const row of rows){
  const a=byDate.get(row.date);
  ensure(a&&a.epochs===row.epochs&&a.expectedEpochs===2880&&a.doy===row.doy &&
   a.longGaps===row.longGaps&&a.largestGapMinutes===row.largestGapMin &&
   Math.abs(a.coveragePercent-row.coverage)<0.011 &&
   ["G","R","E","G+R+E"].every(k=>a.codeEpochs?.[k]===(k==="G+R+E"?row.jointGre:row.systems[k])),
   "Rincian hari "+station+" "+row.date+" tidak konsisten.");
 }
}
export function validateReviewHandoff(qc,summary) {
 ensure(qc?.schema==="baruna-private-cors-qc-v1" &&
  qc.provenance?.origin==="USER_SUPPLIED_UNVERIFIED" &&
  eq(qc.provenance?.systems_assessed,["E","G","R"]) &&
  ["C","J","S","I"].every(s=>qc.provenance?.systems_not_assessed?.includes(s)),
  "Provenance atau cakupan konstelasi tidak sesuai.");
 ensure(summary?.schema==="baruna-p1-qc-handoff-summary-v1" &&
  summary.scope?.observationQcProduced===true &&
  summary.scope?.positionSolutionProduced===false &&
  summary.scope?.annualSubsidenceMeasured===false &&
  summary.scope?.stationToAssetLinkValidated===false &&
  summary.scope?.operationalAssetRankingAllowed===false,
  "Ruang lingkup evidence tidak sah.");
 const parsed=parseStationQc(qc);
 ensure(summary.recordCount===parsed.records.length &&
  summary.observationPeriod?.start===parsed.firstDate &&
  summary.observationPeriod?.end===parsed.lastDate,
  "Periode atau jumlah record tidak cocok.");
 for(const station of ["csem","csmg"])stationSummary(parsed,summary,station);
 const pairs=parsed.calendar.map(x=>x.date).filter(d=>
  ["csem","csmg"].every(s=>parsed.lookup.has(s+"|"+d)));
 ensure(eq(sorted(summary.pairedCalendarDates||[]),pairs),
  "Tanggal observasi berpasangan tidak cocok.");
 ensure(qc.summary?.station_day_records===parsed.records.length &&
  qc.summary?.paired_calendar_days===pairs.length,
  "Jumlah pada QC sendiri tidak cocok.");
 return {qc,summary,parsed,verifiedLocalStructure:true};
}
export async function readP1InputFile(file){
 ensure(file&&file.size>0&&file.size<=1_000_000,"File tidak ada atau terlalu besar (maksimum 1 MB).");
 if(/\.json$/i.test(file.name)){
  const qc=json(new Uint8Array(await file.arrayBuffer()));
  return {qc,summary:null,parsed:parseStationQc(qc),verifiedLocalStructure:false};
 }
 ensure(/\.zip$/i.test(file.name),"Pilih JSON hasil QC atau ZIP P1 handoff.");
 const b=new Uint8Array(await file.arrayBuffer()),v=new DataView(b.buffer);
 const found=new Map();
 let pos=0,entryCount=0,total=0;
 while(pos+4<=b.length){
  const sig=v.getUint32(pos,true);
  if(sig===0x02014b50||sig===0x06054b50)break;
  ensure(sig===0x04034b50&&pos+30<=b.length,"Struktur ZIP tidak didukung.");
  const flag=v.getUint16(pos+6,true),method=v.getUint16(pos+8,true),
   checksum=v.getUint32(pos+14,true),compressed=v.getUint32(pos+18,true),
   rawSize=v.getUint32(pos+22,true),nameSize=v.getUint16(pos+26,true),
   extraSize=v.getUint16(pos+28,true);
  ensure((flag&0x09)===0,"ZIP terenkripsi atau data descriptor tidak didukung.");
  ensure(method===0||method===8,"Jenis kompresi ZIP tidak didukung.");
  ensure(rawSize<=350_000&&compressed<=1_000_000,"Ukuran isi ZIP tidak wajar.");
  const start=pos+30,body=start+nameSize+extraSize,end=body+compressed;
  ensure(end<=b.length,"Batas ZIP rusak.");
  const name=new TextDecoder("utf-8",{fatal:true}).decode(b.subarray(start,start+nameSize));
  ensure(allowed.has(name)&&!found.has(name),"ZIP berisi file tidak dikenal atau duplikat.");
  total+=rawSize;entryCount++;
  ensure(entryCount<=4&&total<=650_000,"Batas hasil dekompresi terlampaui.");
  let payload;
  if(method===0)payload=b.subarray(body,end);
  else {
   ensure(typeof DecompressionStream==="function","Browser tidak mendukung ZIP lokal; ekstrak JSON QC di Mac.");
   try {
    const stream=new Blob([b.subarray(body,end)]).stream()
     .pipeThrough(new DecompressionStream("deflate-raw"));
    payload=new Uint8Array(await new Response(stream).arrayBuffer());
   }catch{fail("Tidak dapat mengekstrak ZIP; gunakan JSON QC dari arsip.");}
  }
  ensure(payload.length===rawSize&&crc32(payload)===checksum,"Integritas isi ZIP tidak cocok.");
  found.set(name,payload);
  pos=end;
 }
 ensure(required.every(n=>found.has(n))&&entryCount===found.size,
  "ZIP handoff wajib memuat README, QC, dan audit.");
 return validateReviewHandoff(json(found.get("qc/CSEM_CSMG_QC.json")),
  json(found.get("audit/QC_SUMMARY.json")));
}
export function reviewText(data){
 const p=data.parsed;
 const a=p.totals.find(x=>x.station==="csem");
 const b=p.totals.find(x=>x.station==="csmg");
 const missing=p.calendar.map(x=>x.date).filter(d=>!p.lookup.has("csmg|"+d));
 return p.totalEpochs.toLocaleString("id-ID")+" epoch pada "+p.records.length+
  " record ("+p.firstDate+" s.d. "+p.lastDate+"); CSEM "+a.files+
  " hari / "+a.epochs.toLocaleString("id-ID")+" epoch; CSMG "+b.files+
  " hari / "+b.epochs.toLocaleString("id-ID")+" epoch. "+
  p.jointFullDays.length+" hari lengkap di kedua stasiun; gap CSMG "+
  b.gaps+"; tanggal tanpa berkas CSMG: "+(missing.join(", ")||"tidak ada")+
  ". "+(data.verifiedLocalStructure?"QC dan audit ZIP cocok. ":"QC JSON tanpa audit ZIP. ")+
  "Sumber belum disahkan BIG. QC observasi ≠ PPP, InSAR, penurunan tanah, atau ranking aset.";
}
export function reviewDayGrid(data){
 const p=data.parsed,table=document.createElement("table");
 table.className="p1-qc-days";
 const head=document.createElement("thead"),tr=document.createElement("tr");
 for(const label of ["Tanggal","CSEM","CSMG","Catatan"]){
  const th=document.createElement("th");th.textContent=label;tr.appendChild(th);
 }head.appendChild(tr);table.appendChild(head);
 const tbody=document.createElement("tbody");
 for(const day of p.calendar){
  const a=p.lookup.get("csem|"+day.date),b=p.lookup.get("csmg|"+day.date);
  const cells=[day.date,a?a.coverage.toFixed(2)+"%":"Tidak ada berkas",
   b?b.coverage.toFixed(2)+"%":"Tidak ada berkas",
   !b?"CSMG tidak ada di arsip":
   b.longGaps?b.longGaps+" gap; terbesar "+b.largestGapMin+" menit":
   b.coverage<100?"Cakupan CSMG parsial":
   a?.coverage<100?"Cakupan CSEM parsial":"Grid lengkap"];
  const row=document.createElement("tr");
  for(const text of cells){const td=document.createElement("td");td.textContent=text;row.appendChild(td);}
  tbody.appendChild(row);
 }table.appendChild(tbody);return table;
}
