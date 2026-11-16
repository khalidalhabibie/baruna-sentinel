
/**
 * Source-backed BMKG tide forecast, exported from BMKG Maritim by the user.
 * Timestamp column is naive; interpreted as UTC ONLY because the source-page
 * screenshot shows "UTC" selected. Do not reinterpret without revalidation.
 * Forecast is not a field measurement, inundation warning or asset assessment.
 */
export const BMKG_TIDE_META=Object.freeze({
  station:"Semarang",
  provider:"BMKG Maritim",
  type:"FORECAST_NOT_OBSERVATION",
  datumColumn:"MSL",
  sourceCsv:"./data/bmkg-semarang-tide-forecast-20261116-20261122.csv",
  extremesCsv:"./data/bmkg-semarang-tide-extremes-20261116-20261122.csv",
  sourcePage:"https://maritim.bmkg.go.id/cuaca/pasut",
  dateFirstUtc:"2026-11-16T00:00:00.000Z",
  dateLastUtc:"2026-11-22T23:50:00.000Z",
  intervalMinutes:10,
  expectedRows:1008,
  expectedMinMsl:-0.48,
  expectedMaxMsl:0.53,
  timezoneAssumption:"UTC selected in user screenshot; source CSV lacks zone",
  notFor:"Forecast cannot establish asset risk, rob occurrence, GNSS subsidence or actual observed water level"
});
const round2=n=>Math.round(n*100)/100;
const parseStamp=value=>{
 if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value))throw new TypeError("BMKG timestamp format invalid");
 const ms=Date.parse(value.replace(" ","T")+"Z");
 if(!Number.isFinite(ms))throw new TypeError("BMKG timestamp is invalid");
 return ms;
};
export function parseBmkgForecastCsv(csv){
 if(typeof csv!=="string")throw new TypeError("BMKG CSV must be text");
 const lines=csv.trim().split(/\r?\n/);
 if(lines[0]?.replace(/^\uFEFF/,"")!=="Date,EST,MSL,LAT")throw new TypeError("Unexpected BMKG CSV header");
 if(lines.length!==BMKG_TIDE_META.expectedRows+1)throw new RangeError("Unexpected BMKG forecast row count");
 const records=lines.slice(1).map((line,i)=>{
  const cells=line.split(",");
  if(cells.length!==4)throw new TypeError("Invalid BMKG CSV record");
  const [raw,est,msl,lat]=cells;
  const epochMs=parseStamp(raw);
  const nums=[est,msl,lat].map(n=>Number(n));
  if(nums.some(v=>!Number.isFinite(v)))throw new TypeError("Invalid BMKG numeric height");
  if(i>0&&epochMs!==parseStamp(lines[i].split(",")[0])+600000)throw new RangeError("BMKG time series gap / duplicate");
  return Object.freeze({epochMs,utc:new Date(epochMs).toISOString(),mslM:nums[1],estM:nums[0],latM:nums[2]});
 });
 if(records[0].utc!==BMKG_TIDE_META.dateFirstUtc||records.at(-1).utc!==BMKG_TIDE_META.dateLastUtc)
  throw new RangeError("Unexpected BMKG period");
 const min=Math.min(...records.map(r=>r.mslM)),max=Math.max(...records.map(r=>r.mslM));
 if(round2(min)!==BMKG_TIDE_META.expectedMinMsl||round2(max)!==BMKG_TIDE_META.expectedMaxMsl)
  throw new RangeError("Unexpected BMKG MSL range");
 return Object.freeze(records);
}
export function wibDateKey(record){
 return new Date(record.epochMs+7*60*60*1000).toISOString().slice(0,10);
}
export function wibTimeLabel(record){
 return new Date(record.epochMs+7*60*60*1000).toISOString().slice(11,16);
}
export function selectBmkgWindow(records,window="2026-11-18"){
 if(window==="all")return records;
 if(!/^2026-11-(18|19)$/.test(window))throw new RangeError("Unknown forecast video window");
 return records.filter(r=>wibDateKey(r)===window);
}
export function forecastMetrics(records){
 if(!records.length)return null;
 return Object.freeze({
  count:records.length,
  minMslM:Math.min(...records.map(r=>r.mslM)),
  maxMslM:Math.max(...records.map(r=>r.mslM)),
  firstUtc:records[0].utc,
  lastUtc:records.at(-1).utc
 });
}
