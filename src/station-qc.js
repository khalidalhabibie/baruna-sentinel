/**
 * Private local SRGI / BIG Ina-CORS daily QC summary viewer.
 * Input is a derived read-only JSON summary, NEVER raw RINEX, receiver credentials
 * or a geodetic position solution. No network calls or persisted browser storage.
 * This module deliberately refuses to estimate displacement, risk or subsidence.
 */
const MAX_RECORDS=800;
const MAX_DAYS=366;
const STATIONS=["csem","csmg"];
const DISPLAY={csem:"CSEM",csmg:"CSMG"};

function assert(ok,message){if(!ok) throw new Error(message);}
function validDay(value){
  assert(typeof value==="string" && /^\d{4}-\d{2}-\d{2}$/.test(value),"Invalid ISO date.");
  const d=new Date(value+"T00:00:00Z");
  assert(Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value,"Invalid date in QC record.");
  return d;
}
function doyOf(d){
  const year=d.getUTCFullYear();
  return Math.floor((d.getTime()-Date.UTC(year,0,1))/86400000)+1;
}
function esc(input){
  return String(input).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function count(value,description){
  assert(Number.isInteger(value)&&value>=0,description+" must be a non-negative integer.");
  return value;
}
function dateLabel(date){
  return new Date(date+"T00:00:00Z").toLocaleDateString("en-GB",{
    timeZone:"UTC",day:"numeric",month:"short"
  });
}
export function parseStationQc(source) {
  assert(source && typeof source==="object" && !Array.isArray(source),"QC document must be an object.");
  assert(Array.isArray(source.records)&&source.records.length>0&&source.records.length<=MAX_RECORDS,
    "QC document requires 1–800 daily records.");
  assert(typeof source.method==="string"&&/RINEX/i.test(source.method),
    "Expected a RINEX-derived QC summary with documented processing method.");
  const records=[],seen=new Set();
  for(const raw of source.records){
    assert(raw&&typeof raw==="object","Invalid QC record.");
    const station=String(raw.station||"").toLowerCase();
    assert(STATIONS.includes(station),"Only explicitly identified CSEM and CSMG records are supported.");
    const d=validDay(raw.date);
    const doy=count(raw.doy,"DOY");
    assert(doy===doyOf(d),"DOY and calendar date disagree.");
    const epoch=count(raw.epochs,"Epoch count");
    const expected=count(raw.expected_full_day_30s_epochs,"Expected 30-second daily epochs");
    assert(expected===2880,"This viewer requires a 30-second daily RINEX grid (2,880 expected epochs).");
    assert(epoch<=expected,"Epoch count exceeds the expected daily grid.");
    const gaps=count(raw.long_gaps_gt30s,"Gap count");
    assert(typeof raw.largest_gap_min==="number" && Number.isFinite(raw.largest_gap_min) &&
      raw.largest_gap_min>=0 && raw.largest_gap_min<=1440,"Invalid largest gap.");
    const joint=raw.epochs_with_C1_by_constellation||{};
    const systems={};
    for(const system of ["G","R","E","S"]){
      const n=joint[system]??0;
      systems[system]=count(n,system+" C1 epochs");
      assert(n<=epoch,"Observed constellation epochs exceed record epochs.");
    }
    const jointGre=joint["G+R+E"]??0;
    count(jointGre,"G+R+E combined C1 epochs");
    assert(jointGre<=epoch,"Combined system epochs exceed total epochs.");
    const key=station+"|"+raw.date;
    assert(!seen.has(key),"Duplicate station/date record: "+key);
    seen.add(key);
    records.push({
      station,date:raw.date,year:d.getUTCFullYear(),doy,epochs:epoch,expected,
      coverage:+(epoch/expected*100).toFixed(2),longGaps:gaps,
      largestGapMin:raw.largest_gap_min,systems,jointGre,
      first:typeof raw.first_epoch_gps==="string"?raw.first_epoch_gps:"",
      last:typeof raw.last_epoch_gps==="string"?raw.last_epoch_gps:""
    });
  }
  const years=[...new Set(records.map(r=>r.year))];
  assert(years.length===1,"One calendar year per comparison is supported. Import another period separately.");
  const dates=records.map(r=>r.date).sort();
  const first=new Date(dates[0]+"T00:00:00Z");
  const last=new Date(dates.at(-1)+"T00:00:00Z");
  const totalDays=Math.round((last-first)/86400000)+1;
  assert(totalDays<=MAX_DAYS,"Comparison period cannot exceed one year.");
  const calendar=Array.from({length:totalDays},(_,i)=>{
    const d=new Date(first.getTime()+i*86400000);
    return {date:d.toISOString().slice(0,10),doy:doyOf(d)};
  });
  const lookup=new Map(records.map(r=>[r.station+"|"+r.date,r]));
  const jointFullDays=calendar.filter(day=>STATIONS.every(s=>{
    const r=lookup.get(s+"|"+day.date);
    return isCompleteDay(r);
  })).map(day=>day.date);
  const totals=STATIONS.map(station=>{
    const selected=records.filter(r=>r.station===station);
    return {
      station,files:selected.length,epochs:selected.reduce((a,r)=>a+r.epochs,0),
      complete:selected.filter(isCompleteDay).length,
      gaps:selected.reduce((a,r)=>a+r.longGaps,0),
      observed:{G:selected.some(r=>r.systems.G>0),R:selected.some(r=>r.systems.R>0),
        E:selected.some(r=>r.systems.E>0),S:selected.some(r=>r.systems.S>0)}
    };
  });
  return {records,calendar,lookup,totals,jointFullDays,year:years[0],
    totalEpochs:records.reduce((a,r)=>a+r.epochs,0),
    firstDate:dates[0],lastDate:dates.at(-1),
    sourceDisclaimer:typeof source.disposition==="string"?source.disposition:"Private source: verify BIG data-sharing permissions."
  };
}
function isCompleteDay(record){
  return !!record && record.epochs===2880 && record.longGaps===0 &&
    record.first.startsWith(record.date+" ") &&
    record.last.startsWith(record.date+" ") &&
    record.first.endsWith("00:00:00") && record.last.endsWith("23:59:30");
}
function cell(record){
  if(!record){
    return '<div class="cors-day-cell is-missing"><div class="cors-meter"><span style="width:0"></span></div><strong>No file</strong><small>Not available in this import</small></div>';
  }
  const full=isCompleteDay(record);
  const cls=full?"is-complete":"is-partial";
  const coverage=record.coverage.toFixed(record.coverage===100?0:1)+"%";
  const gap=record.longGaps?" · "+record.longGaps+" interval gaps":"";
  const caption=record.epochs.toLocaleString("en-US")+" epochs"+gap;
  return '<div class="cors-day-cell '+cls+'" title="'+esc(record.station.toUpperCase()+": "+record.epochs+
    "/2880 epochs, "+record.longGaps+" long gaps")+'"><div class="cors-meter"><span style="width:'+
    record.coverage+'%"></span></div><strong>'+coverage+'</strong><small>'+esc(caption)+'</small></div>';
}
function systemPills(systems){
  return Object.entries({G:"GPS",R:"GLONASS",E:"Galileo",S:"SBAS"}).map(([code,label])=>
    systems[code]?'<span class="cors-system-pill">'+label+'</span>':'').join("");
}
export function renderStationQc(data){
  assert(data&&Array.isArray(data.calendar),"Expected parsed QC dataset.");
  const dayRows=data.calendar.map(day=>{
    const a=data.lookup.get("csem|"+day.date);
    const b=data.lookup.get("csmg|"+day.date);
    const bothFull=data.jointFullDays.includes(day.date);
    const notes=[];
    if(bothFull)notes.push("Both station-day files cover the full 30-second epoch grid");
    if(a?.longGaps)notes.push("CSEM: "+a.longGaps+" gaps, largest "+a.largestGapMin+" min");
    if(b?.longGaps)notes.push("CSMG: "+b.longGaps+" gaps, largest "+b.largestGapMin+" min");
    if(!b)notes.push("CSMG file not available in imported archive");
    if(a&&a.coverage<100&&!a.longGaps)notes.push("CSEM observation window shorter than full day");
    if(b&&b.coverage<100&&!b.longGaps)notes.push("CSMG observation window shorter than full day");
    if(!notes.length)notes.push("Partial observation coverage");
    return '<div class="cors-day-row"><div class="cors-day-label"><strong>DOY '+
      day.doy+'</strong><small>'+dateLabel(day.date)+'</small></div>'+
      cell(a)+cell(b)+'<div class="cors-day-notes'+(bothFull?" is-good":"")+'">'+
      esc(notes.join("; "))+'</div></div>';
  }).join("");
  const summaries=data.totals.map(item=>'<article class="cors-station-summary"><header><div><span class="cors-mini-label">INa-CORS / LOCAL RINEX QC</span><h3>'+
    DISPLAY[item.station]+'</h3></div><strong>'+item.complete+'/'+item.files+
    ' complete days</strong></header><div class="cors-station-numbers"><span><b>'+
    item.epochs.toLocaleString("en-US")+'</b> epochs</span><span><b>'+item.gaps+
    '</b> long gaps</span></div><div class="cors-system-list">'+systemPills(item.observed)+'</div></article>').join("");
  const matched=data.jointFullDays.map(d=>dateLabel(d)).join(" · ") || "None";
  return '<div class="cors-overview-row"><div class="cors-main-stat"><span class="cors-mini-label">PARSED OBSERVATION EPOCHS</span><strong>'+
    data.totalEpochs.toLocaleString("en-US")+'</strong><small>Across '+data.records.length+
    ' station-day files · '+data.year+'</small></div><div class="cors-main-stat"><span class="cors-mini-label">FULL 30-SECOND DAYS AT BOTH STATIONS</span><strong>'+
    data.jointFullDays.length+'</strong><small>'+esc(matched)+'</small></div>'+
    '<div class="cors-main-stat"><span class="cors-mini-label">GEODETIC POSITION SOLUTION</span><strong class="cors-not-available">Not computed</strong><small>No asset or subsidence risk inference</small></div></div>'+
    '<div class="cors-station-summaries">'+summaries+'</div>'+
    '<div class="cors-calendar"><div class="cors-day-header"><span>DATE / DOY</span><span>CSEM COVERAGE</span><span>CSMG COVERAGE</span><span>OBSERVATION NOTE</span></div>'+
    dayRows+'</div>'+
    '<p class="cors-method-note">Coverage = parsed epoch count ÷ 2,880 expected 30-second timestamps per full UTC/GPS day. It does not measure geodetic precision, multipath, cycle slips, or equipment reliability. “No file” means missing from this import, not a confirmed receiver outage. C1 presence for GPS / GLONASS / Galileo confirms observation evidence, <strong>not</strong> an independently validated multi-GNSS position solution. A RINEX-derived local summary is not a BIG-issued certificate.</p>';
}
