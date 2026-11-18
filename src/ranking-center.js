/**
 * BARUNA Ranking Center.
 * Three research scopes: infrastructure sub-workspace, AOIs, and specific AOI.
 * Published station motion is its own scientific leaderboard, NEVER asset-risk input.
 */
import {readRegistry,writeRegistry,STORE_KEY} from "./aoi-registry-model.js";
import {SEED_MARKER,mergeInfrastructureSeeds} from "./aoi-infrastructure-cases.js";
import {
 INFRA_WORKSPACES,groupForAoi,groupName,rankInfrastructureWorkspaces,
 rankInfrastructureAois,parsePublishedStations,aoiResearchDetail
} from "./workspace-ranking-model.js";
import {publishedCorsComparison} from "./published-cors.js";
const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const num=(value,dp=1)=>Number(value).toLocaleString("id-ID",{minimumFractionDigits:dp,maximumFractionDigits:dp});
const vel=value=>(value>0?"+":"")+num(value,1);
let records=[],stations=[],storageWarning=null,sourceWarning=null;
let scope="all",group="port-logistics",aoiId=null,stationId="CSEM";
let map=null,aoiLayer=null,stationMarker=null,connectionLine=null;
const selectedAoi=()=>records.find(x=>x.id===aoiId)||null;
const selectedStation=()=>stations.find(x=>x.id===stationId)||null;
function loadLocal(){
 try{
  records=readRegistry(window.localStorage);
  if(window.localStorage.getItem(SEED_MARKER)!=="1"){
   const merged=mergeInfrastructureSeeds(records);
   if(merged.length>records.length)records=writeRegistry(window.localStorage,merged);
   window.localStorage.setItem(SEED_MARKER,"1");
  }
  storageWarning=null;
 }catch(error){
  records=[];storageWarning="AOI lokal tidak dapat dibaca: "+String(error?.message||error);
 }
 if(!records.some(x=>x.id===aoiId)){
  aoiId=records.find(x=>groupForAoi(x)===group)?.id||records[0]?.id||null;
 }
}
function chooseAoiInGroup(){
 if(!records.some(x=>x.id===aoiId&&groupForAoi(x)===group))
  aoiId=records.find(x=>groupForAoi(x)===group)?.id||null;
}
function syncControls(){
 $("rk-scope").value=scope;
 $("rk-group").innerHTML=INFRA_WORKSPACES.map(w=>'<option value="'+esc(w.id)+'">'+esc(w.name)+'</option>').join("");
 $("rk-group").value=group;
 const list=records.filter(x=>groupForAoi(x)===group);
 $("rk-aoi").innerHTML=list.length?list.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join(""):'<option value="">Belum ada AOI</option>';
 if(scope==="aoi")chooseAoiInGroup();
 $("rk-aoi").value=String(aoiId&&list.some(x=>x.id===aoiId)?aoiId:"");
 $("rk-aoi").disabled=!list.length;
}
function renderMetrics(){
 $("rk-workspace-count").textContent=String(rankInfrastructureWorkspaces(records).length);
 $("rk-aoi-count").textContent=String(records.length);
 $("rk-station-count").textContent=stations.length?String(stations.length):"—";
}
function rowHtml(item,isWorkspace){
 const subtitle=isWorkspace?
  item.checkedCount+"/"+item.areaCount+" AOI diperiksa · "+item.description:
  groupName(item.workspaceId)+" · "+item.explanation;
 const score=isWorkspace?
  item.sourceCategoriesFound+"/"+item.sourceCategoriesPossible:
  item.sourceCategoriesFound+"/2";
 const target=isWorkspace?'data-workspace="'+esc(item.id)+'"':'data-choose-aoi="'+esc(item.id)+'"';
 return '<button class="rk-rank-item" type="button" '+target+'>'+
  '<span class="rk-rank-number">'+(item.rank?"#"+item.rank:"—")+'</span>'+
  '<span class="rk-rank-title"><strong>'+esc(item.name)+'</strong><small>'+esc(subtitle)+'</small></span>'+
  '<span class="rk-rank-meta"><strong>'+esc(score)+'</strong><small>'+(item.rank?"META CATALOG":"UNRANKED")+'</small></span></button>';
}
function renderScope(){
 let rows=[],isWorkspace=false;
 if(scope==="all"){
  isWorkspace=true;rows=rankInfrastructureWorkspaces(records);
  $("rk-list-title").textContent="Antar-workspace · Semarang";
 }else if(scope==="workspace"){
  rows=rankInfrastructureAois(records,group);
  $("rk-list-title").textContent="Dalam "+groupName(group);
 }else{
  rows=rankInfrastructureAois(records,"all");
  $("rk-list-title").textContent="Detail spesifik · bandingkan dengan semua AOI";
 }
 const root=$("rk-scope-list");
 if(!rows.length){root.innerHTML='<div class="rk-list-foot"><p>Belum ada AOI di kelompok ini. Tambahkan dari AOI Registry, lalu Check Evidence jika sumber katalog tersedia.</p></div>';return;}
 root.innerHTML=rows.map(x=>rowHtml(x,isWorkspace)).join("");
 if(storageWarning)root.insertAdjacentHTML("afterbegin",'<div class="error-alert">'+esc(storageWarning)+'</div>');
}
function renderDetail(){
 const aoi=selectedAoi(),root=$("rk-aoi-detail");
 if(!aoi){
  root.innerHTML='<h3>Belum ada AOI</h3><p>Buka AOI Registry untuk membuat area kajian. Tidak ada hasil deformasi yang akan dibuat secara otomatis.</p><div class="rk-detail-actions"><a href="./aoi-registry.html">Buka AOI Registry ↗</a></div>';
  updateMap(null,null);return;
 }
 const info=aoiResearchDetail(aoi,stations);
 const gnss=info.nearestStation;
 const context=gnss?
  '<div class="rk-gnss-reference"><strong>GNSS referensi terdekat: '+esc(gnss.id)+' · '+num(gnss.distanceKm,1)+' km</strong>'+
  '<p>Publikasi 2010–2021: '+vel(gnss.verticalMmYear)+' mm/tahun pada stasiun. Jarak diukur dari titik tengah bounding-box AOI. <b>Ini bukan laju deformasi aset.</b></p></div>':
  '<div class="rk-gnss-reference"><strong>Referensi stasiun GNSS belum termuat</strong><p>Tidak ada proxy pergerakan yang dihitung untuk AOI ini.</p></div>';
 root.innerHTML='<h3>'+esc(aoi.name)+'</h3><p>'+esc(info.workspace)+' · Semarang Coastal</p>'+
  '<div class="rk-detail-tags"><span>Area indikatif '+num(aoi.geometry.areaKm2,2)+' km²</span>'+
  '<span>Katalog '+info.catalog.count+'/2 kategori</span>'+
  '<span>Batas belum terverifikasi</span></div>'+
  context+
  '<p><b>Status:</b> deformasi spesifik AOI dan ranking risiko belum tersedia. Butuh InSAR tervalidasi, referensi geodetik, dan geometri aset.</p>'+
  '<div class="rk-detail-actions"><a href="./aoi-registry.html">Edit / cek AOI ↗</a>'+
  '<a href="./gnss-center.html">Review Multi-GNSS ↗</a></div>';
 updateMap(aoi,gnss);
}
function initMap(){
 if(!window.L){$("rk-map").textContent="Peta tidak dapat dimuat: Leaflet belum tersedia.";return;}
 const L=window.L;
 map=L.map("rk-map",{center:[-6.951,110.435],zoom:12,scrollWheelZoom:false,zoomControl:false});
 L.control.zoom({position:"bottomright"}).addTo(map);
 L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
}
function updateMap(aoi,station){
 if(!map)return;
 const L=window.L;
 for(const old of [aoiLayer,stationMarker,connectionLine])if(old)map.removeLayer(old);
 aoiLayer=null;stationMarker=null;connectionLine=null;
 if(!aoi){map.setView([-6.951,110.435],12);return;}
 const ring=aoi.geometry.coordinates[0].map(([lon,lat])=>[lat,lon]);
 aoiLayer=L.polygon(ring,{color:"#118b8f",weight:3,fillColor:"#5aa9af",fillOpacity:.2}).addTo(map);
 const bounds=L.latLngBounds(ring);
 if(station){
  const target=[station.latitude,station.longitude];
  stationMarker=L.circleMarker(target,{radius:7,weight:2,color:"#fff",fillColor:"#204e82",fillOpacity:1})
   .bindTooltip("GNSS "+station.id+" · published historical station",{direction:"top"}).addTo(map);
  bounds.extend(target);
  const center=[(aoi.geometry.bbox[1]+aoi.geometry.bbox[3])/2,(aoi.geometry.bbox[0]+aoi.geometry.bbox[2])/2];
  connectionLine=L.polyline([center,target],{color:"#4f94b3",weight:1,dashArray:"4 7",opacity:.65}).addTo(map);
 }
 map.fitBounds(bounds.pad(.45),{maxZoom:13});
}
function renderStationTable(){
 const root=$("rk-station-body");
 if(!stations.length){
  root.innerHTML='<tr><td colspan="4">Dataset GNSS belum berhasil dimuat. '+esc(sourceWarning||"Tidak ada data")+'</td></tr>';
  return;
 }
 root.innerHTML=stations.map(s=>'<tr tabindex="0" aria-selected="'+String(s.id===stationId)+'" data-station="'+esc(s.id)+'">'+
  '<td>#'+s.rank+'</td><td>'+esc(s.id)+'</td><td>'+vel(s.verticalMmYear)+' mm/tahun</td>'+
  '<td>± '+num(s.publishedUncertaintyMmYear,3)+' mm/tahun</td></tr>').join("");
}
function renderStationDetail(){
 const selected=selectedStation(),node=$("rk-selected-station");
 if(!selected){
  node.innerHTML='<p>20 station historical source belum dapat diverifikasi. Nilai tidak ditampilkan.</p>';return;
 }
 const target=selectedAoi();
 let distanceLine="";
 if(target){
  const bbox=target.geometry.bbox;
  const lon=(bbox[0]+bbox[2])/2,lat=(bbox[1]+bbox[3])/2;
  const a=(lat*Math.PI/180),b=(selected.latitude*Math.PI/180);
  const dlat=(selected.latitude-lat)*Math.PI/180,dlon=(selected.longitude-lon)*Math.PI/180;
  const h=Math.sin(dlat/2)**2+Math.cos(a)*Math.cos(b)*Math.sin(dlon/2)**2;
  const km=6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
  distanceLine='<p>Jarak dari titik tengah bbox AOI terpilih: sekitar '+num(km,1)+' km. Kedekatan bukan dasar inferensi deformasi aset.</p>';
 }
 node.innerHTML='<h3>'+esc(selected.id)+'</h3>'+
  '<div class="rk-velocity">'+vel(selected.verticalMmYear)+' <small>mm/tahun</small></div>'+
  '<p>Kecepatan vertikal hasil publikasi untuk stasiun GNSS, periode 2010–2021. Ketidakpastian yang dilaporkan: ±'+num(selected.publishedUncertaintyMmYear,3)+' mm/tahun.</p>'+
  distanceLine+
  '<p><b>Mode:</b> historical published station rate, bukan Multi-GNSS real-time atau pemantauan infrastruktur.</p>'+
  '<a class="rk-source-link" href="https://doi.org/10.1038/s41597-023-02274-0" target="_blank" rel="noopener noreferrer">Scientific Data 2023 · Table 2 ↗</a>';
}
function renderPppContrast(){
 const c=publishedCorsComparison(),root=$("rk-ppp-contrast");
 root.innerHTML='<div class="rk-ppp-row"><span>CSMG · Semarang Genuk</span><b>'+vel(c.csmg.verticalMmYr)+' mm/yr</b></div>'+
 '<div class="rk-ppp-row"><span>CSEM · Semarang</span><b>'+vel(c.csem.verticalMmYr)+' mm/yr</b></div>'+
 '<p>Hasil penelitian terpisah 2021–2023; jangan mengurutkannya bersama data Susilo 2010–2021 atau menjadikannya laju aset.</p>';
}
function render(){
 syncControls();renderMetrics();renderScope();renderDetail();renderStationTable();renderStationDetail();
}
function listen(){
 $("rk-scope").addEventListener("change",event=>{scope=event.target.value; if(scope==="aoi")chooseAoiInGroup();render();});
 $("rk-group").addEventListener("change",event=>{
  group=event.target.value;chooseAoiInGroup();scope="workspace";render();
 });
 $("rk-aoi").addEventListener("change",event=>{
  aoiId=event.target.value||null;scope="aoi";render();
 });
 $("rk-scope-list").addEventListener("click",event=>{
  const w=event.target.closest("[data-workspace]");
  if(w){group=w.dataset.workspace;chooseAoiInGroup();scope="workspace";render();return;}
  const a=event.target.closest("[data-choose-aoi]");
  if(a){aoiId=a.dataset.chooseAoi;group=groupForAoi(selectedAoi());scope="aoi";render();}
 });
 const changeStation=event=>{
  const row=event.target.closest("[data-station]");
  if(!row)return;
  stationId=row.dataset.station;renderStationTable();renderStationDetail();
 };
 $("rk-station-body").addEventListener("click",changeStation);
 $("rk-station-body").addEventListener("keydown",event=>{
  if(event.key==="Enter"||event.key===" "){event.preventDefault();changeStation(event);}
 });
 window.addEventListener("storage",event=>{
  if(event.key===STORE_KEY||event.key===SEED_MARKER){loadLocal();render();}
 });
}
async function initialize(){
 loadLocal();initMap();renderPppContrast();listen();render();
 try{
  const response=await fetch("./data/gnss-published-2023-stations.geojson",{cache:"force-cache"});
  if(!response.ok)throw new Error("Sumber GNSS tidak tersedia (HTTP "+response.status+")");
  stations=parsePublishedStations(await response.json());
  sourceWarning=null;
  render();
 }catch(error){stations=[];sourceWarning=String(error?.message||error);render();}
}
if(document.readyState==="loading")
 document.addEventListener("DOMContentLoaded",initialize,{once:true});
else initialize();
