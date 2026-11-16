/**
 * AOI → actual DSM preview statistics → separate BMKG tide forecast → export.
 * No synthetic values, risk ranking, depth estimates or vertical-datum mixing.
 */
import {analyzeDsmArea} from "./real-area-analysis.js";
import {dailyTideContext,forecastLineSvg} from "./real-tide-context.js";

const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString("id-ID",{maximumFractionDigits:2});
const esc=v=>String(v??"").replace(/[&<>"']/g,
  c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function tideSummaryForExport(day){
  if(!day) return null;
  const {series,...summary}=day;
  return {...summary, seriesPointCount:series.length};
}

export function installScreeningFlow({map,pixels,meta,tideRecords,tideIssue,onAreaChanged}){
  if(!map||!window.L) throw new TypeError("Leaflet map required");
  const L=window.L;
  const canvas=map.getContainer();
  let first=null;
  let drafting=false;
  let selectedBbox=null;
  let stats=null;
  let chosenShape=null;
  let draftShape=null;
  let tideDay=null;

  function updateState(text){
    $("aoi-state").textContent=text;
  }
  function exitDrawing(){
    drafting=false;
    first=null;
    canvas.classList.remove("is-selecting-aoi");
    if(draftShape){map.removeLayer(draftShape);draftShape=null;}
    $("draw-aoi").textContent="Pilih AOI · 2 klik peta";
    $("draw-aoi").setAttribute("aria-pressed","false");
  }
  function showArea(){
    if(!selectedBbox||!stats) {
      $("area-profile-content").innerHTML='<div class="analysis-placeholder"><strong>Mulai dari pemilihan area</strong><p>Pilih area di peta atau gunakan seluruh wilayah kajian.</p></div>';
      $("area-analysis-status").textContent="Belum ada AOI";
      return;
    }
    const valid=stats.status==="VALID_DISPLAY_GRID_STATS" && stats.selectedPixels>=4;
    $("area-analysis-status").textContent=valid?"Area dianalisis":"Perlu AOI lebih luas";
    $("area-analysis-status").dataset.status=valid?"ready":"blocked";
    if(!valid){
      $("area-profile-content").innerHTML=
        '<div class="analysis-placeholder"><strong>Data area belum cukup</strong><p>'+
        esc(stats.status==="NO_VALID_DSM_PIXELS"?"Area tidak memiliki piksel DSM yang valid.":
          "Perbesar area: minimal empat piksel grid tampilan diperlukan.")+
        '</p></div>';
      return;
    }
    const values=[
      ["Median",fmt(stats.medianM)+" m"],
      ["Rata-rata",fmt(stats.meanM)+" m"],
      ["Min–maks",fmt(stats.minM)+" – "+fmt(stats.maxM)+" m"],
      ["Kuartil 25–75%",fmt(stats.p25M)+" – "+fmt(stats.p75M)+" m"],
      ["Perkiraan luas bbox",fmt(stats.areaKm2)+" km²"],
      ["Piksel valid",stats.validPixels+" / "+stats.selectedPixels+" ("+fmt(stats.coveragePct)+"%)"]
    ];
    $("area-profile-content").innerHTML=
      '<div class="analysis-metrics">'+values.map(([label,value],i)=>
        '<div class="analysis-metric'+(i===0?" highlight":"")+'"><span>'+esc(label)+
        '</span><strong>'+esc(value)+'</strong></div>').join("")+'</div>'+
      '<p class="analysis-coordinates">BBOX EPSG:4326 · '+
        stats.bounds.map(n=>n.toFixed(5)).join(" · ")+'</p>'+
      '<p class="analysis-caution">Statistik piksel DSM grid display 72×98; bukan resolusi asli GLO-30. Laut dan bangunan belum dimask.</p>';
  }
  function setArea(bbox){
    selectedBbox=bbox;
    stats=analyzeDsmArea(pixels,meta,bbox);
    if(chosenShape) map.removeLayer(chosenShape);
    const bounds=stats.bounds;
    chosenShape=bounds?L.rectangle([[bounds[1],bounds[0]],[bounds[3],bounds[2]]],{
      color:"#195f77",weight:2.5,fillColor:"#2d8fa0",fillOpacity:.11,
      dashArray:"6 4",interactive:false}).addTo(map):null;
    $("clear-aoi").disabled=false;
    showArea();
    updateState("AOI dipilih · hasil dihitung dari grid DSM nyata. Ubah area untuk membandingkan.");
    if(typeof onAreaChanged==="function")onAreaChanged(getArea());
  }
  function clear(){
    exitDrawing();
    selectedBbox=null;stats=null;
    if(chosenShape){map.removeLayer(chosenShape);chosenShape=null;}
    $("clear-aoi").disabled=true;
    $("area-analysis-status").dataset.status="pending";
    updateState("Pilih dua sudut pada peta atau gunakan seluruh AOI penelitian.");
    showArea();
    if(typeof onAreaChanged==="function")onAreaChanged(null);
  }
  function onMapClick(event){
    if(!drafting)return;
    const point=[event.latlng.lng,event.latlng.lat];
    if(!first){
      first=point;
      updateState("Sudut pertama dipilih. Klik sudut kedua untuk menyelesaikan AOI.");
      return;
    }
    const bbox=[Math.min(first[0],point[0]),Math.min(first[1],point[1]),
      Math.max(first[0],point[0]),Math.max(first[1],point[1])];
    exitDrawing();
    setArea(bbox);
    const selected=stats?.bounds;
    if(selected) map.fitBounds([[selected[1],selected[0]],[selected[3],selected[2]]],
      {padding:[28,28],maxZoom:14});
  }
  map.on("click",onMapClick);
  map.on("mousemove",event=>{
    if(!drafting||!first)return;
    if(draftShape) map.removeLayer(draftShape);
    draftShape=L.rectangle([ [first[1],first[0]],
       [event.latlng.lat,event.latlng.lng] ],{
      color:"#195f77",weight:2,dashArray:"5 5",fillOpacity:.06,interactive:false
    }).addTo(map);
  });
  $("draw-aoi").disabled=false;
  $("full-aoi").disabled=false;
  $("draw-aoi").addEventListener("click",()=>{
    if(drafting){exitDrawing();updateState("Pemilihan area dibatalkan.");return;}
    drafting=true;first=null;
    canvas.classList.add("is-selecting-aoi");
    $("draw-aoi").textContent="Batalkan pemilihan";
    $("draw-aoi").setAttribute("aria-pressed","true");
    updateState("Klik dua sudut pada peta untuk menentukan batas area analisis.");
  });
  $("full-aoi").addEventListener("click",()=>{
    exitDrawing();
    setArea(meta.aoiEpsg4326.slice());
    const [w,s,e,n]=meta.aoiEpsg4326;
    map.fitBounds([[s,w],[n,e]],{padding:[26,26],maxZoom:13});
  });
  $("clear-aoi").addEventListener("click",clear);
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&drafting){exitDrawing();updateState("Pemilihan area dibatalkan.");}
  });
  $("jump-evidence").addEventListener("click",()=>$("evidence").scrollIntoView({behavior:"smooth",block:"start"}));

  function showTide(){
    const container=$("tide-result"),chart=$("tide-chart");
    if(!tideDay){
      container.innerHTML='<p>Forecast tidak tersedia: '+esc(tideIssue||"file belum tervalidasi")+'</p>';
      chart.innerHTML="";
      return;
    }
    container.innerHTML=
      '<div class="tide-values">'+
      '<div><span>Pasang maksimum · prakiraan</span><strong>'+fmt(tideDay.maxMslM)+' m</strong><small>'+tideDay.maxAtWib+' WIB</small></div>'+
      '<div><span>Surut minimum · prakiraan</span><strong>'+fmt(tideDay.minMslM)+' m</strong><small>'+tideDay.minAtWib+' WIB</small></div>'+
      '</div>'+
      '<p class="tide-source">BMKG MSL · '+tideDay.recordCount+' pengamatan prakiraan tiap 10 menit'+
      (tideDay.completeWibDay?"":" · hari parsial")+' · bukan observasi lapangan.</p>';
    chart.innerHTML=forecastLineSvg(tideDay);
  }
  if(tideRecords?.length) {
    $("tide-day").disabled=false;
    const updateTide=()=>{
      tideDay=dailyTideContext(tideRecords,$("tide-day").value);
      showTide();
    };
    $("tide-day").addEventListener("change",updateTide);
    updateTide();
  }else{
    tideDay=null;
    showTide();
  }

  function getArea(){
    return stats?.status==="VALID_DISPLAY_GRID_STATS"&&stats.selectedPixels>=4?stats:null;
  }
  return {
    getArea,
    getTide:()=>tideSummaryForExport(tideDay),
    clear
  };
}
