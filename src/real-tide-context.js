/** BMKG Maritim forecast-only context for real Semarang workspace. */
import {BMKG_TIDE_META,parseBmkgForecastCsv,wibDateKey,wibTimeLabel} from "./bmkg-tide-adapter.js";
export {BMKG_TIDE_META,parseBmkgForecastCsv};
export function dailyTideContext(records,dateWib) {
  if (!/^2026-11-(16|17|18|19|20|21|22)$/.test(dateWib)) throw new RangeError("Date outside the BMKG forecast period");
  const rows=records.filter(row=>wibDateKey(row)===dateWib);
  if(!rows.length) return null;
  const high=rows.reduce((a,b)=>b.mslM>a.mslM?b:a);
  const low=rows.reduce((a,b)=>b.mslM<a.mslM?b:a);
  return {
    dateWib,
    type:"FORECAST_NOT_OBSERVATION",
    source:"BMKG Maritim Semarang",
    timezone:"WIB UTC+07:00 (source naive UTC interpreted from BMKG page selection)",
    datum:"BMKG forecast MSL (not confirmed equal to DSM vertical datum)",
    recordCount:rows.length,
    completeWibDay:rows.length===144,
    maxMslM:high.mslM,maxAtWib:wibTimeLabel(high),
    minMslM:low.mslM,minAtWib:wibTimeLabel(low),
    series:rows.map(row=>({timeWib:wibTimeLabel(row),mslM:row.mslM})),
    sourceCsv:BMKG_TIDE_META.sourceCsv,
    methodologicalWarning:"Forecast, not observed water level or rob warning. Never subtract BMKG MSL tide from Copernicus DSM height without a validated shared vertical datum."
  };
}
export function forecastLineSvg(day) {
  if(!day || !day.series.length) return "";
  const vals=day.series.map(row=>row.mslM);
  const min=Math.min(...vals)-.06,max=Math.max(...vals)+.06;
  const width=620,height=124,px=8,py=12;
  const points=vals.map((v,i)=>{
    const x=px+(width-2*px)*i/Math.max(1,vals.length-1);
    const y=height-py-(v-min)/(max-min)*(height-2*py);
    return x.toFixed(1)+","+y.toFixed(1);
  }).join(" ");
  return '<svg viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none" role="img" aria-label="Prakiraan BMKG tinggi pasang surut dalam meter MSL pada tanggal '+day.dateWib+' WIB">'+
    '<line x1="0" y1="'+(height/2)+'" x2="'+width+'" y2="'+(height/2)+'" stroke="#d6e2df" stroke-dasharray="4 5"/>'+
    '<polyline fill="none" stroke="#287f88" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="'+points+'"/></svg>';
}
