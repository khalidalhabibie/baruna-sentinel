import {getSpatialCases,makeSyntheticAssetSeries,explainSyntheticDecision,makeSpatialBrief,SPATIAL_DEMO_META,getRankedSpatialCases,getSyntheticScoreBreakdown} from "./spatial-scenario.js";

const cases=getSpatialCases();
const ranking=getRankedSpatialCases(cases);
const compareIds=new Set(["sim-port","sim-road"]);
const comparisonMax=3;
const $=id=>document.getElementById(id);
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
let selectedId=cases[0]?.id||null;
let map=null;
let polygonById=new Map();
let markerById=new Map();

function current(){return cases.find(c=>c.id===selectedId)||cases[0];}
function statusColor(item){return item.status.color}
function assetOption(item){
 const active=item.id===selectedId;
 const color=statusColor(item);
 return '<button type="button" class="asset-option" data-asset-id="'+escapeHtml(item.id)+'" aria-pressed="'+String(active)+'" style="--status:'+color+'">'+
 '<span class="option-icon">'+escapeHtml(item.mapLabel)+'</span>'+
 '<span class="option-copy"><strong>'+escapeHtml(item.name)+'</strong><small>'+escapeHtml(item.type)+' · sintetis</small>'+
 '<span class="option-status"><i></i>'+escapeHtml(item.status.short)+'</span></span>'+
 '<span class="option-arrow" aria-hidden="true">›</span></button>';
}
function renderAssetList(){
 $("asset-list").innerHTML=cases.map(assetOption).join("");
 $("asset-count").textContent=String(cases.length);
}

/** Visually plausible cartographic context, never a surveyed site boundary. */
function initMap(){
 const element=$("spatial-map");
 if(!window.L){
  element.innerHTML='<div class="chart-empty">Peta interaktif tidak termuat. Pilih aset melalui daftar di kiri.</div>';
  element.setAttribute("data-map-state","unavailable");
  return;
 }
 map=window.L.map(element,{
  center:[-6.9485,110.427],
  zoom:14,
  minZoom:11,
  maxZoom:19,
  zoomControl:false,
  scrollWheelZoom:true,
  attributionControl:true,
  preferCanvas:false
 });
 window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  maxZoom:19,
  opacity:.85,
  crossOrigin:true
 }).addTo(map);
 window.L.control.zoom({position:"bottomright"}).addTo(map);
 for(const item of cases){
  const layer=window.L.polygon(item.geometry,{
   color:statusColor(item),
   weight:2.4,
   opacity:.95,
   fillColor:statusColor(item),
   fillOpacity:.24,
   interactive:true
  });
  layer.addTo(map);
  layer.bindTooltip(item.label+" · "+item.name+" (SIMULASI)",{direction:"top",sticky:true});
  layer.on("click",()=>select(item.id,{pan:true}));
  polygonById.set(item.id,layer);
  const centroid=layer.getBounds().getCenter();
  const icon=window.L.divIcon({
   className:"map-zone-label",
   html:'<span style="color:'+statusColor(item)+'">'+escapeHtml(item.mapLabel)+'</span>',
   iconSize:[24,24],iconAnchor:[12,12]
  });
  const marker=window.L.marker(centroid,{icon,keyboard:true,alt:item.label+" "+item.name+" simulasi"}).addTo(map);
  marker.on("click",()=>select(item.id,{pan:true}));
  markerById.set(item.id,marker);
 }
 resetMap();
 updateMapSelection();
 window.setTimeout(()=>map?.invalidateSize(),100);
}

function resetMap(){
 if(!map)return;
 const all=window.L.featureGroup([...polygonById.values()]);
 map.fitBounds(all.getBounds(),{paddingTopLeft:[65,95],paddingBottomRight:[65,80],maxZoom:14.7,animate:false});
}

function updateMapSelection(){
 for(const item of cases){
  const polygon=polygonById.get(item.id);
  const marker=markerById.get(item.id);
  const isSelected=item.id===selectedId;
  if(polygon){
   polygon.setStyle({
    color:statusColor(item),
    weight:isSelected?4.2:2.25,
    fillOpacity:isSelected?.50:.24,
    opacity:isSelected?1:.87,
    dashArray:item.result.screeningTier==="BLOCKED"?"7 5":undefined
   });
   if(isSelected)polygon.bringToFront();
  }
  if(marker){
   const el=marker.getElement();
   el?.classList.toggle("is-selected-zone",isSelected);
   const symbol=el?.querySelector("span");
   if(symbol){
    symbol.style.transform=isSelected?"scale(1.25)":"scale(1)";
    symbol.style.background=isSelected?"#fff":"#fafdfc";
    symbol.style.boxShadow=isSelected?"0 3px 16px rgba(22,49,58,.26)":"0 2px 6px rgba(19,46,53,.17)";
   }
  }
 }
}

/** Shared map, ranking and comparison selection. No second scoring policy. */
const exposureText=Object.freeze({high:"Tinggi",moderate:"Sedang",low:"Rendah"});
function caseRank(item){
 const r=ranking.eligible.find(row=>row.item.id===item.id);
 return r?r.rank:null;
}
function formatRate(item,{includeInvalid=false}={}){
 const rate=item.input.verticalRateMmYr;
 if(item.result.screeningTier==="BLOCKED"&&!includeInvalid)return "—";
 const value=(rate<0?"−":rate>0?"+":"")+Math.abs(rate)+" mm/th";
 return item.result.screeningTier==="BLOCKED"?value+" (input tidak layak)":value;
}
function rankRow(item,rank){
 const blocked=rank===null;
 const selected=item.id===selectedId;
 const checked=compareIds.has(item.id);
 const colStatus=blocked?"Belum cukup":"Lolos";
 return '<tr class="rank-table-row'+(blocked?" is-unranked":"")+(selected?" is-selected":"")+'" data-rank-row="'+escapeHtml(item.id)+'">'+
  '<td class="rank-index">'+(blocked?'—':String(rank).padStart(2,"0"))+'</td>'+
  '<td class="rank-asset-cell"><button type="button" class="rank-focus" data-focus-asset="'+escapeHtml(item.id)+'">'+escapeHtml(item.label)+' · '+escapeHtml(item.name)+' <span aria-hidden="true">↗</span></button>'+
  '<small>'+escapeHtml(item.type)+' · contoh</small></td>'+
  '<td class="rank-rate">'+escapeHtml(formatRate(item))+'</td>'+
  '<td><span class="rank-gate'+(blocked?" is-blocked":"")+'">'+colStatus+'</span></td>'+
  '<td class="numeric rank-score">'+(blocked?'—':escapeHtml(item.result.score))+'</td>'+
  '<td><span class="rank-outcome" style="--status:'+escapeHtml(item.status.color)+'">'+escapeHtml(blocked?"Tidak diranking":item.status.label)+'</span></td>'+
  '<td><label class="rank-compare-check"><input type="checkbox" data-compare-id="'+escapeHtml(item.id)+'" '+(checked?"checked":"")+' aria-label="Bandingkan '+escapeHtml(item.label)+'"><span>Pilih</span></label></td></tr>';
}
function renderRanking(){
 const rows=[
  ...ranking.eligible.map(({item,rank})=>rankRow(item,rank)),
  ...ranking.excluded.map(({item})=>rankRow(item,null))
 ];
 $("ranking-rows").innerHTML=rows.join("");
 $("ranking-summary").textContent=ranking.eligibleCount+" layak diranking · "+ranking.excludedCount+" perlu data";
}
function compareMetric(label,values,{kind=""}={}){
 return '<tr class="'+kind+'"><th scope="row">'+escapeHtml(label)+'</th>'+
  values.map(value=>'<td>'+value+'</td>').join("")+'</tr>';
}
function renderCompare(){
 const selected=cases.filter(item=>compareIds.has(item.id));
 const count=$("compare-selection-count");
 count.textContent=selected.length+" dari "+comparisonMax+" aset dipilih";
 for(const button of document.querySelectorAll("[data-compare-preset]")){
  const preset=button.dataset.comparePreset;
  const ids=preset==="blocked"?["sim-port","sim-incomplete"]:["sim-port","sim-road"];
  button.setAttribute("aria-pressed",String(ids.length===selected.length&&ids.every(id=>compareIds.has(id))));
 }
 const area=$("compare-content");
 if(selected.length<2){
  area.innerHTML='<p class="compare-empty">Pilih minimal dua aset melalui kolom Compare untuk melihat perbedaannya.</p>';
  return;
 }
 const cell=(item,kind)=>{
  const blocked=item.result.screeningTier==="BLOCKED";
  const breakdown=getSyntheticScoreBreakdown(item);
  if(kind==="status")return '<strong class="compare-decision" style="--status:'+escapeHtml(item.status.color)+'">'+escapeHtml(item.status.label)+'</strong>';
  if(kind==="eligible")return blocked?'<span class="compare-missing">Tidak layak diranking</span>':'<span class="compare-ok">Lolos Evidence Gate</span>';
  if(kind==="rank")return blocked?'<span class="compare-missing">— (tidak diranking)</span>':String(caseRank(item))+" dari "+ranking.eligibleCount;
  if(kind==="score")return blocked?'<span class="compare-missing">—</span>':String(breakdown.total)+" poin";
  if(kind==="rate")return escapeHtml(formatRate(item,{includeInvalid:true}));
  if(kind==="continuity")return escapeHtml(String(item.input.continuityPct))+"%";
  if(kind==="uncertainty")return escapeHtml(String(item.input.slopeUncertaintyMmYr))+" mm/th";
  if(kind==="period")return escapeHtml(String(item.input.spanYears).replace(".",","))+" tahun";
  if(kind==="exposure")return escapeHtml(exposureText[item.input.exposure]||"Tidak ada");
  if(kind==="criticality")return escapeHtml(exposureText[item.input.criticality]||"Tidak ada");
  if(kind==="breakdown")return breakdown?
    '<span class="compare-points">'+breakdown.motion+' gerakan + '+breakdown.exposure+' paparan + '+breakdown.criticality+' kekritisan</span>':
    '<span class="compare-missing">Tidak dihitung karena Evidence Gate gagal</span>';
  if(kind==="gate")return blocked?
    '<span class="compare-missing">'+escapeHtml(item.result.gateFailures.length)+" alasan: "+item.result.gateFailures.map(code=>escapeHtml(code)).join(", ")+'</span>':
    '<span class="compare-ok">Semua syarat contoh terpenuhi</span>';
  if(kind==="next")return escapeHtml(item.status.next);
  return "—";
 };
 const metricRows=[
  ["Evidence Gate","eligible","is-gate"],
  ["Hasil screening","status","is-status"],
  ["Peringkat demo","rank",""],
  ["Skor kebijakan","score",""],
  ["Rincian skor","breakdown",""],
  ["Laju vertikal INPUT","rate",""],
  ["Kontinuitas INPUT","continuity",""],
  ["Ketidakpastian INPUT","uncertainty",""],
  ["Rentang INPUT","period",""],
  ["Paparan","exposure",""],
  ["Kekritisan","criticality",""],
  ["Alasan gate","gate",""],
  ["Tindakan selanjutnya","next","is-next"]
 ];
 const header='<thead><tr><th scope="col">Indikator · semua simulasi</th>'+
  selected.map(item=>'<th scope="col"><span class="compare-column-code">'+escapeHtml(item.label)+'</span><strong>'+escapeHtml(item.name)+'</strong></th>').join("")+
  '</tr></thead>';
 const rows=metricRows.map(([name,key,kind])=>compareMetric(name,selected.map(item=>cell(item,key)),{kind})).join("");
 area.innerHTML='<table class="compare-table">'+header+'<tbody>'+rows+'</tbody></table>'+
  '<p class="compare-caution">Pergerakan dan skor merupakan input serta keluaran <strong>simulasi</strong>. Nilai INPUT aset yang gagal Evidence Gate tidak boleh ditafsirkan sebagai tren tervalidasi.</p>';
}
function setComparePreset(ids){
 compareIds.clear();ids.forEach(id=>compareIds.add(id));
 renderRanking();renderCompare();
}
function onRankingInteraction(event){
 const focus=event.target.closest("[data-focus-asset]");
 if(focus){
  select(focus.dataset.focusAsset,{pan:true});
  document.querySelector(".workbench")?.scrollIntoView({behavior:"smooth",block:"start"});
  return;
 }
 const preset=event.target.closest("[data-compare-preset]");
 if(preset){
  setComparePreset(preset.dataset.comparePreset==="blocked"?
    ["sim-port","sim-incomplete"]:["sim-port","sim-road"]);
 }
}
function onCompareCheckbox(event){
 const el=event.target.closest("[data-compare-id]");
 if(!el)return;
 const id=el.dataset.compareId;
 if(!cases.some(item=>item.id===id))return;
 if(el.checked&&compareIds.size>=comparisonMax){
  el.checked=false;
  $("compare-selection-count").textContent="Maksimal "+comparisonMax+" aset dapat dibandingkan sekaligus.";
  return;
 }
 if(el.checked)compareIds.add(id);
 else compareIds.delete(id);
 renderRanking();renderCompare();
}

function numberFmt(n){return Number(n).toLocaleString("id-ID",{maximumFractionDigits:0})}
function svgChart(item){
 const data=makeSyntheticAssetSeries(item);
 if(!data.length){
  return '<div class="chart-empty">Seri tidak memenuhi syarat pemeriksaan.<br>Tidak ada tren yang dapat ditetapkan.</div>';
 }
 const width=320,height=124,margin={left:38,right:10,top:12,bottom:25};
 const ys=data.map(d=>d.upMm);
 const min=Math.floor(Math.min(...ys)/25)*25-8,max=Math.ceil(Math.max(...ys)/25)*25+8;
 const den=Math.max(1,max-min);
 const x=i=>margin.left+(width-margin.left-margin.right)*i/Math.max(1,data.length-1);
 const y=v=>margin.top+(height-margin.top-margin.bottom)*(1-(v-min)/den);
 const path=data.map((d,i)=>(i?"L":"M")+x(i).toFixed(1)+","+y(d.upMm).toFixed(1)).join(" ");
 const baseline=y(0);
 const baselineLine=baseline>margin.top&&baseline<height-margin.bottom?
  '<line x1="'+margin.left+'" x2="'+(width-margin.right)+'" y1="'+baseline.toFixed(1)+'" y2="'+baseline.toFixed(1)+'" stroke="#b6c7c9" stroke-dasharray="4 4" stroke-width=".9" />':"";
 const lines=[0,.5,1].map(t=>{
  const v=max-(max-min)*t,py=y(v);
  return '<line x1="'+margin.left+'" y1="'+py.toFixed(1)+'" x2="'+(width-margin.right)+'" y2="'+py.toFixed(1)+'" stroke="#e7eded" stroke-width=".8"/>'+
   '<text x="'+(margin.left-7)+'" y="'+(py+3).toFixed(1)+'" text-anchor="end" font-size="9" fill="#93a8ab">'+numberFmt(v)+'</text>';
 }).join("");
 const first=data[0].date.slice(0,4),last=data.at(-1).date.slice(0,4);
 const endX=x(data.length-1),endY=y(data.at(-1).upMm);
 const safeColor=statusColor(item);
 return '<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Grafik pergerakan sintetis dari '+escapeHtml(first)+' hingga '+escapeHtml(last)+'">'+
  '<defs><linearGradient id="spatial-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+safeColor+'" stop-opacity=".18"/><stop offset="100%" stop-color="'+safeColor+'" stop-opacity="0"/></linearGradient></defs>'+
  lines+baselineLine+
  '<path d="'+path+' L '+endX.toFixed(1)+','+(height-margin.bottom)+' L '+margin.left+','+(height-margin.bottom)+' Z" fill="url(#spatial-fill)" />'+
  '<path d="'+path+'" fill="none" stroke="'+safeColor+'" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/>'+
  '<circle cx="'+endX.toFixed(1)+'" cy="'+endY.toFixed(1)+'" r="3.3" fill="'+safeColor+'" stroke="#fff" stroke-width="1.7"/>'+
  '<text x="'+margin.left+'" y="'+(height-6)+'" fill="#96a6a9" font-size="9">'+escapeHtml(first)+'</text>'+
  '<text x="'+endX+'" y="'+(height-6)+'" text-anchor="end" fill="#96a6a9" font-size="9">'+escapeHtml(last)+'</text>'+
  '</svg>';
}
function renderDecision(item){
 if(!item)return;
 const explanation=explainSyntheticDecision(item);
 const blocked=item.result.screeningTier==="BLOCKED";
 $("selected-index").textContent=String(cases.indexOf(item)+1).padStart(2,"0")+" / "+String(cases.length).padStart(2,"0");
 $("detail-code").textContent=item.label.toUpperCase();
 $("detail-title").textContent=item.name;
 $("detail-type").textContent=item.type+" · seluruh input simulasi";
 $("tier-title").textContent=item.status.label;
 $("decision-result").style.setProperty("--tier-color",statusColor(item));
 $("tier-description").textContent=explanation.summary;
 $("rate-value").innerHTML=blocked?'— <small>tidak valid</small>':
  escapeHtml("−"+numberFmt(Math.abs(item.input.verticalRateMmYr)))+' <small>mm/th</small>';
 $("continuity-value").textContent=numberFmt(item.input.continuityPct)+"%";
 $("movement-chart").innerHTML=svgChart(item);
 $("movement-chart").setAttribute("aria-label",blocked?
  "Tidak ada grafik hasil observasi karena bukti contoh gagal validasi":
  "Grafik contoh pergerakan "+item.name+" yang sepenuhnya sintetis");
 $("reason-score").textContent=blocked?"Evidence Gate: gagal":"Skor contoh: "+item.result.score;
 $("reason-list").innerHTML=explanation.why.map(value=>
  '<div class="reason-line'+(blocked?' missing':'')+'">'+escapeHtml(value)+'</div>').join("");
 $("next-action").textContent=item.status.next;
}

function select(id,{pan=false}={}){
 if(!cases.some(c=>c.id===id))return;
 selectedId=id;
 renderAssetList();
 renderDecision(current());
 renderRanking();
 updateMapSelection();
 if(pan && map && polygonById.has(id)){
  const bounds=polygonById.get(id).getBounds();
  if(!map.getBounds().contains(bounds))map.fitBounds(bounds.pad(1.2),{maxZoom:14.5,animate:true});
 }
 const selected=$("asset-list").querySelector('[data-asset-id="'+CSS.escape(id)+'"]');
 if(selected && window.innerWidth<720)selected.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"});
}
function renderBrief(){
 const item=current(),info=explainSyntheticDecision(item);
 const rank=caseRank(item);
 const why=info.why.map(x=>'<li>'+escapeHtml(x)+'</li>').join("");
 const down=item.result.screeningTier==="BLOCKED"?"Tidak dapat ditetapkan":item.input.verticalRateMmYr+" mm/tahun";
 $("brief-title").textContent="Verification Brief · "+item.label;
 $("brief-body").innerHTML=
 '<h3>'+escapeHtml(item.name)+'</h3>'+
 '<div class="brief-status">'+escapeHtml(item.status.label)+' · hasil simulasi, bukan keputusan lapangan</div>'+
 '<div class="brief-facts"><div><span>Sumber</span><strong>100% sintetis / video</strong></div><div><span>Laju vertikal input</span><strong>'+escapeHtml(down)+'</strong></div>'+
 '<div><span>Kontinuitas contoh</span><strong>'+escapeHtml(item.input.continuityPct)+'%</strong></div>'+
 '<div><span>Aturan screening</span><strong>'+escapeHtml(SPATIAL_DEMO_META.policyId)+'</strong></div>'+ 
 '<div><span>Peringkat sintetis</span><strong>'+(rank===null?'Tidak diranking':(rank+' dari '+ranking.eligibleCount))+'</strong></div></div>'+
 '<h4>Alasan keputusan</h4><ul>'+why+'</ul>'+
 '<h4>Langkah berikutnya</h4><p>'+escapeHtml(item.status.next)+'</p>'+
 '<h4>Sebelum dipakai secara operasional</h4>'+
 '<p>Konfirmasi poligon aset yang sebenarnya, seri pengukuran GNSS yang representatif beserta datum dan ketidakpastian, kekritisan operator, dan review ahli. Tidak ada geometri atau pengukuran resmi dalam simulasi ini.</p>';
}
function briefText(){return makeSpatialBrief(current());}
function openBrief(){
 renderBrief();
 $("brief-dialog").showModal();
}
function closeBrief(){$("brief-dialog").close();}
function downloadBrief(){
 const text=briefText();
 const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");
 link.href=url;
 link.download="BARUNA_SIMULASI_"+current().label.replaceAll(" ","_")+"_VERIFICATION_BRIEF.txt";
 document.body.appendChild(link);link.click();link.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function copyBrief(){
 const button=$("copy-brief");
 try{
  await navigator.clipboard.writeText(briefText());
  button.textContent="Tersalin ✓";
  window.setTimeout(()=>button.textContent="Salin teks",1600);
 }catch{
  const field=document.createElement("textarea");
  field.value=briefText();document.body.appendChild(field);field.select();
  const ok=document.execCommand?.("copy");field.remove();
  button.textContent=ok?"Tersalin ✓":"Gunakan Unduh .txt";
  window.setTimeout(()=>button.textContent="Salin teks",1700);
 }
}
function wireUI(){
 $("ranking").addEventListener("click",onRankingInteraction);
 $("ranking").addEventListener("change",onCompareCheckbox);
 $("asset-list").addEventListener("click",event=>{
  const button=event.target.closest("[data-asset-id]");
  if(button)select(button.dataset.assetId,{pan:true});
 });
 $("asset-list").addEventListener("keydown",event=>{
  const button=event.target.closest("[data-asset-id]");
  if(!button || !["ArrowDown","ArrowUp","ArrowRight","ArrowLeft"].includes(event.key))return;
  event.preventDefault();
  const dir=event.key==="ArrowDown"||event.key==="ArrowRight"?1:-1;
  const next=(cases.findIndex(x=>x.id===button.dataset.assetId)+dir+cases.length)%cases.length;
  select(cases[next].id,{pan:true});
  $("asset-list").querySelector('[data-asset-id="'+cases[next].id+'"]')?.focus();
 });
 $("reset-view").addEventListener("click",resetMap);
 $("open-brief").addEventListener("click",openBrief);
 $("close-brief").addEventListener("click",closeBrief);
 $("brief-dialog").addEventListener("click",event=>{if(event.target===$("brief-dialog"))closeBrief();});
 $("copy-brief").addEventListener("click",copyBrief);
 $("download-brief").addEventListener("click",downloadBrief);
 $("print-brief").addEventListener("click",()=>window.print());
 window.addEventListener("resize",()=>window.setTimeout(()=>map?.invalidateSize(),160));
}
function start(){
 if(!cases.length)throw new Error("Synthetic scenario contract unavailable");
 renderAssetList();
 renderDecision(current());
 renderRanking();
 renderCompare();
 wireUI();
 initMap();
 document.body.dataset.scenario=SPATIAL_DEMO_META.mode;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
