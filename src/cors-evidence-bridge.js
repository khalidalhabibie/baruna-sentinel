/**
 * Strict station observation → field-verification workflow.
 * A private, user-declared RINEX-derived QC document never raises an
 * asset-level risk class or becomes a geodetic position solution.
 */
import {parseStationQc} from "./station-qc.js";

export function inspectLocalStationEvidence(document, project, sectorId) {
  if(project?.mode!=="SOURCE_BACKED_RESEARCH"||!Array.isArray(project.records))
    throw new TypeError("Validated historical Tanjung Emas assessment required");
  const sector=project.records.find(x=>x.id===sectorId);
  if(!sector)throw new RangeError("Select a documented field-study sector");
  const qc=parseStationQc(document);
  const csemDays=qc.records.filter(x=>x.station==="csem");
  const csmgDays=qc.records.filter(x=>x.station==="csmg");
  const sameDayPairs=qc.calendar.filter(day=>qc.lookup.has("csem|"+day.date)&&qc.lookup.has("csmg|"+day.date));
  const sharedFull=qc.jointFullDays;
  const observedSystems=Object.fromEntries(["csem","csmg"].map(station=>[
    station,["G","R","E","S"].filter(system=>
      qc.records.some(r=>r.station===station&&r.systems[system]>0))
  ]));
  const stationCoverageState=!csemDays.length||!csmgDays.length?
    "MISSING_STATION":!sameDayPairs.length?"NO_MATCHING_DATES":sharedFull.length?
    "SHARED_FULL_DAY":"PARTIAL_SHARED_DATES";
  return {
    scope:"PRIVATE_LOCAL_STATION_OBSERVATION_QC",
    stationCoverageState,
    sectorId:sector.id,sectorName:sector.name,
    measuredHistoricalYear:sector.year,
    historicalRangeCm:[...sector.historicRangeCm],
    parsed:qc,
    stationDays:{CSEM:csemDays.length,CSMG:csmgDays.length},
    calendarDayPairs:sameDayPairs.length,
    full30sDayPairs:sharedFull.length,
    sourceDateRange:[qc.firstDate,qc.lastDate],
    observedSystems,
    evidenceAvailable:qc.totalEpochs>0,
    stationPositionSolutionComputed:false,
    sharedStationPositionFrameValidated:false,
    onAssetMovementMeasured:false,
    operatorPriorityAllowed:false,
    decision:"REQUEST_UPDATED_SITE_EVIDENCE",
    explanation:"RINEX quality review documents station-day observation availability only. It does not establish a position solution or the movement of the selected port sector.",
    requiredActions:[
      "Konfirmasi metadata perangkat, sistem koordinat, periode, dan izin penggunaan arsip CSEM–CSMG.",
      "Jika kualitas observasi cukup, lakukan solusi posisi geodetik dengan navigasi, orbit/clock, datum, dan uji ketidakpastian yang sesuai.",
      "Dapatkan geometri resmi dan pengukuran representatif pada sektor "+sector.name+".",
      "Minta geodesist dan engineer aset memvalidasi kaitan pengamatan dengan keputusan inspeksi."
    ]
  };
}

export function localStationEvidencePrint(bridge) {
  if(bridge?.scope!=="PRIVATE_LOCAL_STATION_OBSERVATION_QC"||!bridge.parsed)
    throw new TypeError("Validated private QC bridge required");
  const esc=x=>String(x??"—").replace(/[&<>"']/g,ch=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[ch]);
  const lines=bridge.requiredActions.map(t=>"<li>"+esc(t)+"</li>").join("");
  return '<section class="print-station-qc"><h2>LOCAL STATION OBSERVATION QC — CSEM / CSMG</h2>'+
    '<p><strong>DECLARED PRIVATE INPUT, NOT BIG CERTIFIED.</strong> Source: RINEX-derived local JSON. Observation epoch availability does not measure positioning precision, displacement or asset condition.</p>'+
    '<div class="print-metrics">'+
      '<div><small>CSEM STATION-DAYS</small><strong>'+bridge.stationDays.CSEM+'</strong></div>'+
      '<div><small>CSMG STATION-DAYS</small><strong>'+bridge.stationDays.CSMG+'</strong></div>'+
      '<div><small>MATCHED FULL 30-S DAYS</small><strong>'+bridge.full30sDayPairs+'</strong></div></div>'+
    '<p>Period: '+esc(bridge.sourceDateRange.join(" to "))+' · Same-calendar-day pairs: '+
    bridge.calendarDayPairs+' · QC state: '+esc(bridge.stationCoverageState)+'.</p>'+
    '<h3>Next field and geodetic verification</h3><ol>'+lines+'</ol>'+
    '<p><strong>Decision:</strong> REQUEST UPDATED SITE EVIDENCE. No GNSS displacement solution, operational rank or structural conclusion was calculated from QC.</p></section>';
}
