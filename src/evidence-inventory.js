/**
 * Public, source-limited evidence slots for BARUNA Sentinel.
 * Details are paraphrased from public BIG SRGI site logs saved Nov 2026.
 * Do not embed user-supplied private RINEX, derived QC or PDF captures.
 * A pending numeric series is UNKNOWN, never zero observations or movement.
 */
export const SITE_LOG_REFERENCES=Object.freeze([
 Object.freeze({
  station:"CSEM",name:"Semarang",
  installed:"2010-01-13",
  latestReceiverRecorded:"LEICA GR50",latestReceiverInstalled:"2018-08-02",
  receiverCapability:"GPS · GLONASS · Galileo · BeiDou · QZSS",
  metadataSnapshot:"2022-04-15",
  url:"https://srgi.big.go.id/cors/CSEM",
  caveat:"Site log records historical station equipment; not a certified 2026 hardware inspection."
 }),
 Object.freeze({
  station:"CSMG",name:"Semarang Genuk",
  installed:"2021-11-30",
  latestReceiverRecorded:"LEICA GR50",latestReceiverInstalled:"2021-11-30",
  receiverCapability:"GPS · GLONASS · Galileo · BeiDou · QZSS",
  metadataSnapshot:"2022-01-28",
  url:"https://srgi.big.go.id/cors/CSMG",
  caveat:"Approximate position fields were blank in the 2022 site-log capture; no coordinates are invented."
 })
]);

export const MISSING_EVIDENCE=Object.freeze([
 Object.freeze({
  id:"official-position-series",
  label:"Time Series koordinat numerik CSEM dan CSMG",
  status:"AWAITING_OFFICIAL_NUMERIC",
  detail:"Grafik SRGI tersedia sebagai referensi visual; CSV/XYZ/ENU koordinat beserta epoch, frame, dan uncertainty belum tersedia.",
  next:"Minta ekspor posisi harian dan metadata pemrosesannya dari BIG; periksa skema sebelum membuat import."
 }),
 Object.freeze({
  id:"on-site-measurements",
  label:"Geometri dan pengukuran terkini pada aset Tanjung Emas",
  status:"AWAITING_OPERATOR_VALIDATION",
  detail:"CORS stasiun regional tidak mengukur bangunan pelabuhan secara langsung.",
  next:"Dapatkan identitas aset, geometri resmi, survei/levelling representatif, datum, dan kriteria inspeksi pengelola."
 })
]);

export function sourceReadiness(localBridge=null){
 if(localBridge!==null && (
  localBridge?.scope!=="PRIVATE_LOCAL_STATION_OBSERVATION_QC"||
  localBridge.operatorPriorityAllowed!==false||
  localBridge.stationPositionSolutionComputed!==false
 ))throw new TypeError("QC bridge must be validated and must not issue asset risk");
 return {
  stationSiteLogs:{status:"PUBLIC_REFERENCE",stations:SITE_LOG_REFERENCES},
  observationQc:localBridge?
   {status:"LOCAL_IMPORTED",dateRange:[...localBridge.sourceDateRange],
    fullDayPairs:localBridge.full30sDayPairs,
    totalDays:localBridge.parsed.calendar.length}:
   {status:"WAITING_FOR_LOCAL_JSON",dateRange:null,fullDayPairs:null,totalDays:null},
  missing:MISSING_EVIDENCE,
  measuredAssetDisplacement:null,
  operationalRiskRank:null,
  officialNumericVelocityMmYr:null,
  allowsAssetDecision:false
 };
}
