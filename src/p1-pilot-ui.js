/** Local-only pilot ingestion. Never transmits user geojson, RINEX QC, or PPP reports. */
import {parseAssetFeature,parseStationFeature,assessStationAssetProximity,
 demnasIdentifyRequest,validateDemnasIdentify,validateDemnasLocalPreview,
 inspectLocalCorsSummary,inspectProcessedPositionSeries} from "./p1-pilot-integration.js";
import {readP1InputFile,reviewText,reviewDayGrid} from "./p1-handoff-reader.js";

const $=id=>document.getElementById(id);
const state={cors:null,demnas:null,demnasLocal:null,position:null,station:null,asset:null,proximity:null};
const fmt=n=>new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(n);
function update(id,text,tone=""){
 const el=$(id);el.textContent=text;el.className="output"+(tone?" "+tone:"");
}
function status(id,text){$(id).textContent=text;}
async function readJsonFile(e,fn,onError){
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>2_000_000)throw new RangeError("File JSON lebih dari 2 MB. Ringkas data sebelum impor.");
  const raw=JSON.parse(await file.text());
  fn(raw);
 }catch(error){onError(error);}
}
function attach(id,fn,err){$(id).addEventListener("change",e=>readJsonFile(e,fn,err));}
function renderProximity(){
 if(!state.station||!state.asset){
  state.proximity=null;status("p1-status-link","Menunggu geometri");
  update("p1-link-result","Untuk menilai kedekatan, pilih GeoJSON Point CSEM/CSMG dan GeoJSON Polygon aset. Keduanya akan tetap berstatus user-declared.","");
  return;
 }
 try{
  const x=assessStationAssetProximity(state.asset,state.station);state.proximity=x;
  status("p1-status-link","Jarak terhitung · belum sah");
  update("p1-link-result","Aset "+x.assetId+" ↔ "+x.stationCode+": jarak geometris perkiraan "+fmt(x.geometricProximityMeters)+" m. "+
    (x.pointInsideAssetPolygon?"Titik berada di dalam polygon. ":"")+"Koordinat dan sumber belum diverifikasi. "+
    "Kedekatan TIDAK memvalidasi laju gerak aset atau memberi ranking inspeksi. Dibutuhkan survei, datum, deret waktu dan review ahli.","warn");
 }catch(err){state.proximity=null;status("p1-status-link","Geometri ditolak");update("p1-link-result",err.message,"error");}
}
function renderLocalRaster(grid){
 const el=$("p1-demnas-preview"),ctx=el.getContext("2d"),image=ctx.createImageData(20,20);
 const vals=grid.flat().filter(v=>typeof v==="number");
 const lo=Math.min(...vals),hi=Math.max(...vals),span=Math.max(hi-lo,1);
 for(let y=0;y<20;y++)for(let x=0;x<20;x++){
  const idx=(y*20+x)*4,v=grid[y][x];
  if(v===null){image.data[idx]=235;image.data[idx+1]=238;image.data[idx+2]=235;image.data[idx+3]=255;continue;}
  const t=Math.max(0,Math.min(1,(v-lo)/span));
  image.data[idx]=Math.round(34+t*157);
  image.data[idx+1]=Math.round(114+t*89);
  image.data[idx+2]=Math.round(87-t*18);
  image.data[idx+3]=255;
 }
 const scratch=document.createElement("canvas");scratch.width=20;scratch.height=20;scratch.getContext("2d").putImageData(image,0,0);
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,el.width,el.height);ctx.drawImage(scratch,0,0,el.width,el.height);el.hidden=false;
}
$("p1-qc-file").addEventListener("change",async event=>{
 const target=$("p1-qc-days");target.replaceChildren();
 const file=event.target.files?.[0];if(!file)return;
 try {
  const data=await readP1InputFile(file);
  const inspected=inspectLocalCorsSummary(data.qc);
  state.cors={...inspected,auditedHandoff:data.verifiedLocalStructure,
   observedLongGaps:data.parsed.totals.map(x=>({station:x.station.toUpperCase(),count:x.gaps})),
   pairedFullDates:[...data.parsed.jointFullDays]};
  status("p1-status-cors",fmt(inspected.totalEpochs)+" epoch QC lokal");
  update("p1-qc-result",reviewText(data),"ok");
  target.appendChild(reviewDayGrid(data));
 }catch(err){
  state.cors=null;status("p1-status-cors","QC ditolak");
  update("p1-qc-result",err.message,"error");target.replaceChildren();
 }
});
attach("p1-position-file",raw=>{
 const x=inspectProcessedPositionSeries(raw);state.position=x;
 update("p1-position-result","Stasiun "+x.station+": "+x.epochCount+" epoch "+x.start+" s.d. "+x.end+
  " ("+x.spanDays+" hari), referensi "+x.referenceFrame+" (user-declared). "+
  (x.descriptiveSlopeMmYear===null?"Rentang/kelengkapan belum memadai untuk tren tahunan.":"OLS deskriptif "+fmt(x.descriptiveSlopeMmYear)+" mm/tahun; BELUM tervalidasi secara geodetik.")+
  " BARUNA tidak menjalankan PPP. Belum dapat dipakai meranking aset.",x.descriptiveSlopeMmYear===null?"warn":"ok");
},err=>{state.position=null;update("p1-position-result",err.message,"error");});
attach("p1-station-file",raw=>{state.station=parseStationFeature(raw);renderProximity();},
 err=>{state.station=null;renderProximity();update("p1-link-result","Stasiun: "+err.message,"error");});
attach("p1-asset-file",raw=>{state.asset=parseAssetFeature(raw);renderProximity();},
 err=>{state.asset=null;renderProximity();update("p1-link-result","Aset: "+err.message,"error");});
attach("p1-demnas-file",raw=>{
 const x=validateDemnasLocalPreview(raw);state.demnasLocal=x;
 status("p1-status-demnas","Preview lokal · belum sah");
 update("p1-demnas-import-result",x.validPixels+"/400 piksel valid, rentang "+fmt(x.minMeters)+" – "+fmt(x.maxMeters)+
  " m pada preview. SHA256 "+x.sourceSha256.slice(0,12)+"…. Raster diberikan pengguna, autentisitas BIG dan datum belum diperiksa. Tidak digunakan menghitung rob.", "ok");
 renderLocalRaster(raw.grid);
},err=>{state.demnasLocal=null;$("p1-demnas-preview").hidden=true;update("p1-demnas-import-result",err.message,"error");});
$("p1-demnas-check").addEventListener("click",async()=>{
 const el=$("p1-demnas-check"),lon=Number($("p1-lon").value),lat=Number($("p1-lat").value);
 if(!$("p1-lon").value||!$("p1-lat").value){update("p1-demnas-result","Masukkan longitude dan latitude WGS84.","error");return;}
 try{
  const url=demnasIdentifyRequest(lon,lat);
  el.disabled=true;state.demnas=null;update("p1-demnas-result","Meminta hasil ImageServer resmi BIG…");
  const controller=new AbortController(),abort=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch(url,{cache:"no-store",signal:controller.signal});
   if(!response.ok)throw Error("HTTP "+response.status);
   const x=validateDemnasIdentify(await response.json(),[lon,lat]);state.demnas=x;
   status("p1-status-demnas",x.valueMeters===null?"NoData dari BIG":"Nilai BIG · datum belum sah");
   update("p1-demnas-result",x.valueMeters===null?
     "Data BIG pada titik ini TIDAK VALID (nilai mentah "+x.rawValue+"). Jangan dipakai sebagai elevasi; unduh GeoTIFF resmi dan evaluasi metadata.": 
     "BIG ImageServer mengembalikan "+fmt(x.valueMeters)+" m. Datum vertikal dan kesesuaian dengan aset BELUM diverifikasi; bukan kedalaman banjir.",x.valueMeters===null?"warn":"ok");
  }finally{clearTimeout(abort)}
 }catch(err){
  status("p1-status-demnas","Belum tervalidasi");
  update("p1-demnas-result","Layanan BIG tidak dapat dikonfirmasi dari browser: "+err.message+
   ". Kemungkinan jaringan/CORS atau ketersediaan server. Gunakan ImageServer resmi atau unduh GeoTIFF; tidak menggunakan fallback data buatan.","warn");
 }finally{el.disabled=false;}
});
$("p1-export").addEventListener("click",()=>{
 const report={
  schema:"baruna-p1-evidence-integration-audit-v1",generatedAt:new Date().toISOString(),
  description:"Status integrasi data user-supplied / BIG without remote upload",
  rinexQc:state.cors,processedPositionSource:state.position,
  demnasIdentify:state.demnas?{status:state.demnas.status,valueMeters:state.demnas.valueMeters,rawValue:state.demnas.rawValue,source:state.demnas.source,warning:state.demnas.warning}:null,
  demnasLocalPreview:state.demnasLocal,
  stationAssetProximity:state.proximity,
  operatorAuthoritativeAssetRelationship:false,realAssetOperationalRankingAllowed:false,
  evidenceGate:"DATA_INSUFFICIENT",
  requiredNextSteps:["Download verified BIG DEMNAS GeoTIFF and verify CRS/vertical datum.","Obtain authorized recent RINEX CSEM/CSMG and process rigorous multi-GNSS coordinate solutions, plus geodetic QA.","Obtain authoritative asset geometry, representative asset benchmark and owner-approved priority criteria."]
 };
 const blob=new Blob([JSON.stringify(report,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="BARUNA_P1_Integration_Evidence_Audit.json";
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
