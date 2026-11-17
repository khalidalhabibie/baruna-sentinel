/** BARUNA AOI registry — browser-local pilot, manual source-manifest checks only. */
import {
 AOI_BOUNDS,MAX_AOIS,MAX_FILE_BYTES,readRegistry,writeRegistry,
 validateAoiPolygon,parseAoiGeoJSON,evaluateEvidenceSnapshot,diffEvidenceSnapshots,
 verificationQueue,makeEvidenceBrief
} from "./aoi-registry-model.js";
import {historyEvent,appendHistory,choosePublishedCatalog} from "./aoi-monitor-client.js";
import {makeLocalBackup,parseLocalBackup,mergeLocalBackup,BACKUP_MAX_BYTES} from "./aoi-local-backup.js";

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateShort=x=>x?new Date(x).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Belum";
const dateOnly=x=>x?new Date(x+"T00:00:00Z").toLocaleDateString("id-ID",{timeZone:"UTC",day:"2-digit",month:"short",year:"numeric"}):"—";
let records=[],selectedId=null,draft=null,drawPoints=[],drawing=false,geometry=null,boundarySource=null;
let map=null,shape=null,preview=null,vertices=null,mapReady=false,storageAvailable=true;
const selected=()=>records.find(item=>item.id===selectedId)||null;
function message(text,error=false){const node=$("map-hint");node.textContent=text;node.classList.toggle("error",error);}
function storageError(error){storageAvailable=false;message("Penyimpanan browser tidak tersedia. Periksa izin localStorage: "+String(error?.message||error),true);}
function applyStored(recordsNext){
 if(!storageAvailable)throw new Error("Penyimpanan browser tidak tersedia.");
 try{const result=writeRegistry(window.localStorage,recordsNext);records=result;return true;}
 catch(error){storageError(error);throw error;}
}
function newAoi(){selectedId=null;draft=null;drawing=false;drawPoints=[];geometry=null;boundarySource=null;
 $("aoi-form").reset();$("aoi-name").value="";$("aoi-purpose").value="evidence_review";
 drawMap();render();message("Area baru: gambar polygon di peta atau impor satu GeoJSON WGS84.");}
function loadAoi(id){const item=records.find(r=>r.id===id);if(!item)return;
 selectedId=item.id;draft=null;drawing=false;drawPoints=[];geometry=item.geometry;boundarySource=item.boundarySource;
 $("aoi-name").value=item.name;$("aoi-purpose").value=item.purpose;
 drawMap();render();message("AOI "+item.name+" dibuka dari penyimpanan browser.");
 if(map){const coords=geometry.coordinates[0].map(([lon,lat])=>[lat,lon]);map.fitBounds(window.L.latLngBounds(coords).pad(.35),{maxZoom:14});}
}
function clearLayers(){if(shape){map?.removeLayer(shape);shape=null;}if(preview){map?.removeLayer(preview);preview=null;}if(vertices){map?.removeLayer(vertices);vertices=null;}}
function drawMap(){
 if(!map)return;clearLayers();
 const L=window.L;
 if(geometry){shape=L.polygon(geometry.coordinates[0].map(c=>[c[1],c[0]]),{color:"#0f805f",weight:3,fillColor:"#66ad8b",fillOpacity:.18}).addTo(map);}
 if(drawPoints.length){
  if(drawPoints.length>=3)preview=L.polygon(drawPoints.map(c=>[c[1],c[0]]),{color:"#3d9781",weight:2,dashArray:"7 5",fillColor:"#70b49a",fillOpacity:.15}).addTo(map);
  else preview=L.polyline(drawPoints.map(c=>[c[1],c[0]]),{color:"#3d9781",weight:2,dashArray:"7 5"}).addTo(map);
  vertices=L.layerGroup(drawPoints.map(c=>L.circleMarker([c[1],c[0]],{radius:4,color:"#fff",weight:2,fillColor:"#206e58",fillOpacity:1}))).addTo(map);
 }
 $("vertex-count").textContent=drawPoints.length+" titik";
 $("boundary-provenance").textContent=boundarySource==="USER_DRAWN_UNVERIFIED"?"Digambar pengguna (unverified)":boundarySource==="USER_IMPORTED_UNVERIFIED"?"GeoJSON diimpor (unverified)":"Belum digambar / diimpor";
 $("undo-point").disabled=!drawing||!drawPoints.length;
 $("finish-draw").disabled=!drawing||drawPoints.length<3;
 $("start-draw").setAttribute("aria-pressed",String(drawing));
 map.getContainer().classList.toggle("is-drawing",drawing);
}
function startDraw(){drawing=!drawing;drawPoints=[];if(drawing){geometry=null;boundarySource=null;message("Klik minimal 3 titik pada peta, lalu pilih 'Selesaikan'. Batas harus dalam cakupan Semarang.");}
 else message("Penggambaran dibatalkan. Pilih kembali AOI tersimpan bila diperlukan.");
 drawMap();render();}
function finishDraw(){if(!drawing)return;try{
 const result=validateAoiPolygon(drawPoints);
 geometry=result;boundarySource="USER_DRAWN_UNVERIFIED";drawing=false;drawPoints=[];
 message("Polygon valid ("+result.areaKm2.toLocaleString("id-ID")+" km²). Lengkapi nama lalu simpan.");
 drawMap();render();
 }catch(e){message(e.message,true);}}
function clearDraw(){drawing=false;drawPoints=[];geometry=null;boundarySource=null;drawMap();render();message("Gambar dihapus. Data tersimpan sebelumnya tidak ikut dihapus.");}
async function importFile(file){if(!file)return;
 try{
  if(file.size>MAX_FILE_BYTES)throw new Error("File AOI maksimum 512 KB.");
  if(!/\.json$|\.geojson$/i.test(file.name))throw new Error("Gunakan file .geojson atau .json.");
  const parsed=parseAoiGeoJSON(await file.text());
  drawing=false;drawPoints=[];geometry=parsed;boundarySource="USER_IMPORTED_UNVERIFIED";
  drawMap();render();message("Polygon berhasil diimpor ("+parsed.areaKm2.toLocaleString("id-ID")+" km²). Sumber batas masih belum diverifikasi.");
  if(map)map.fitBounds(window.L.latLngBounds(parsed.coordinates[0].map(([lon,lat])=>[lat,lon])).pad(.35),{maxZoom:14});
 }catch(e){message("GeoJSON ditolak: "+e.message,true);}
 finally{$("upload-geojson").value="";}
}
function save(event){event.preventDefault();try{
 if(!geometry)throw new Error("Gambar polygon atau impor satu GeoJSON terlebih dahulu.");
 if(drawing)throw new Error("Selesaikan gambar polygon sebelum menyimpan.");
 const name=$("aoi-name").value.trim();
 const current=selected();const changed=current?JSON.stringify(current.geometry.coordinates)!==JSON.stringify(geometry.coordinates):true;
 const id=current?.id||( "aoi-"+crypto.randomUUID());
 const next={id,name,purpose:$("aoi-purpose").value,createdAt:current?.createdAt||new Date().toISOString(),
  geometry,boundarySource,sourceStatus:"USER_DECLARED_UNVERIFIED",workspaceId:"semarang-coastal",regionId:"semarang",
  lastEvidenceCheck:changed?null:(current?.lastEvidenceCheck||null),lastChange:changed?null:(current?.lastChange||null),
  monitorHistory:changed?[]:(current?.monitorHistory||[]),cloudId:current?.cloudId||null};
 if(!current&&records.length>=MAX_AOIS)throw new Error("Maksimal 20 AOI tersimpan di browser ini.");
 const nextRecords=current?records.map(item=>item.id===current.id?next:item):[...records,next];
 applyStored(nextRecords);selectedId=id;geometry=records.find(item=>item.id===id).geometry;
 drawMap();render();message("AOI tersimpan di browser ini. Klik 'Check Evidence' untuk membaca snapshot data sumber.");
 }catch(e){message("Gagal menyimpan: "+e.message,true);}}
function deleteSelected(){const item=selected();if(!item)return;
 if(!window.confirm("Hapus AOI '"+item.name+"' dari browser ini?"))return;
 try{applyStored(records.filter(x=>x.id!==item.id));newAoi();message("AOI dihapus dari browser ini.");}
 catch(e){message("Gagal menghapus: "+e.message,true);}}
function renderList(){const list=$("aoi-list");if(!records.length){list.innerHTML='<p class="empty-short">Belum ada AOI terdaftar di browser ini.</p>';return;}
 list.innerHTML=records.map(r=>'<button type="button" class="area-item" data-aoi-id="'+esc(r.id)+'" aria-pressed="'+(r.id===selectedId)+'"><strong>'+esc(r.name)+'</strong><span>'+r.geometry.areaKm2.toLocaleString("id-ID")+' km² · '+(r.lastEvidenceCheck?'dicek '+esc(dateShort(r.lastEvidenceCheck.checkedAt)):'belum dicek')+'</span></button>').join("");}
function renderMonitorHistory(history){
 if(!Array.isArray(history)||!history.length)return '<div class="monitor-empty">Riwayat belum tersedia. Klik Check Evidence untuk mencatat pemeriksaan pertama.</div>';
 return '<div class="monitor-history"><strong>RIWAYAT PEMERIKSAAN · MAKSIMAL 20</strong>'+history.slice(0,20).map(e=>
  '<div class="monitor-event"><span>'+esc(dateShort(e.checkedAt))+'</span><span>S1 '+Number(e.s1Count||0)+' · S2 '+Number(e.s2Count||0)+'</span><b>'+(e.isBaseline?"Baseline":e.newSceneCount?("+"+Number(e.newSceneCount)+" scene katalog"):"Tidak ada scene baru")+"</b></div>").join("")+
  '<small>Riwayat hanya pembaruan metadata katalog. Bukan deteksi gerakan tanah, bahaya, atau kondisi aset.</small></div>';
}
function renderEvidence(){const root=$("evidence-content"),item=selected();if(!item){root.innerHTML='<div class="placeholder-mark">↻</div><strong>Daftarkan AOI dahulu</strong><p>Pemeriksaan katalog tersedia setelah AOI disimpan di browser ini.</p>';return;}
 const data=item.lastEvidenceCheck,change=item.lastChange;if(!data){root.innerHTML='<div class="placeholder-mark">⌕</div><strong>AOI siap diperiksa</strong><p>Klik Check Evidence untuk membaca katalog Sentinel-1 GRD dan Sentinel-2 L2A yang disediakan deployment BARUNA.</p>';return;}
 const lastS1=data.s1Grd?.[0]?.date,lastS2=data.s2L2a?.[0]?.date;
 const changeText=change?.isBaseline?"Pemeriksaan pertama: snapshot dasar tersimpan, bukan alert perubahan.":
  change?.newTotal?"Terdapat "+change.newTotal+" scene baru pada katalog deployment dibanding pemeriksaan sebelumnya (belum terbukti perubahan fisik di AOI).":"Tidak ada scene baru pada snapshot katalog sejak pemeriksaan sebelumnya.";
 root.innerHTML='<div class="scan-meta"><strong>Checked '+esc(dateShort(data.checkedAt))+'</strong><span>Snapshot sumber: '+esc(dateOnly(data.sourceSnapshotAsOf))+'</span></div>'+ 
  '<div class="scene-summary"><div><span>SENTINEL-2 · L2A</span><strong>'+data.s2L2a.length+'</strong><small>Metadata footprint · terbaru '+esc(dateOnly(lastS2))+'</small></div><div><span>SENTINEL-1 · GRD</span><strong>'+data.s1Grd.length+'</strong><small>Metadata footprint · terbaru '+esc(dateOnly(lastS1))+'</small></div></div>'+ 
  '<div class="scan-change'+(change?.isBaseline?' baseline':'')+'">'+esc(changeText)+'</div>'+ 
  '<p class="source-warning">Scene dihitung dari irisan polygon AOI dengan <b>footprint katalog</b>, bukan cakupan piksel bersih. Katalog JSON dibekukan selama demo; pemeriksaan AOI lokal dijalankan manual. Tidak ada deteksi banjir rob atau hasil deformasi InSAR; GRD tidak bisa dijadikan pengukuran penurunan tanah.</p>'+renderMonitorHistory(item.monitorHistory);
}
function renderQueue(){const root=$("queue-content"),item=selected();if(!item){root.innerHTML='<div class="placeholder-mark">✓</div><strong>Belum ada area terpilih</strong><p>Daftarkan AOI untuk melihat kebutuhan verifikasi.</p>';return;}
 const tasks=verificationQueue(item);
 root.innerHTML='<div class="queue-lead"><strong>DATA INSUFFICIENT · 0 aset memenuhi ranking</strong><p>Ini daftar kebutuhan data. Bukan urutan risiko struktural, prediksi bencana, atau prioritas inspeksi yang telah disetujui operator.</p></div>'+ 
  '<div class="queue-list">'+tasks.map((t,i)=>'<div class="queue-item"><span class="queue-index">'+String(i+1).padStart(2,"0")+'</span><div><strong>'+esc(t.label)+'</strong><p>'+esc(t.detail)+'</p><small>Penanggung jawab: '+esc(t.responsible)+'</small></div></div>').join("")+'</div>';
}
function render(){const item=selected();renderList();
 $("stat-areas").textContent=String(records.length);
 $("stat-area-size").textContent=(geometry?.areaKm2??item?.geometry?.areaKm2)?.toLocaleString("id-ID")||"—";
 $("stat-check").textContent=item?.lastEvidenceCheck?dateShort(item.lastEvidenceCheck.checkedAt):"Belum";
 $("save-aoi").disabled=!storageAvailable||!geometry||drawing||$("aoi-name").value.trim().length<3;
 $("delete-aoi").hidden=!item;
 $("check-evidence").disabled=!storageAvailable||!item||drawing||!geometry||JSON.stringify(item.geometry.coordinates)!==JSON.stringify(geometry.coordinates);
 $("export-brief").disabled=!item;
 renderEvidence();renderQueue();
}
async function checkEvidence(){const item=selected();if(!item)return;
 const btn=$("check-evidence");btn.disabled=true;btn.textContent="Memeriksa sumber…";
 try{
  const urls=["./data/semarang-monitoring-catalog.json","./data/semarang-sentinel-scenes.json","./data/semarang-real-readiness.json"];
  const responses=await Promise.all(urls.map(url=>fetch(url,{cache:"no-store"})));
  if(!responses[1].ok||!responses[2].ok)throw new Error("Manifest sumber belum tersedia / server error.");
  const recent=responses[0].ok?await responses[0].json():null;
  const [legacy,baseline]=await Promise.all([responses[1].json(),responses[2].json()]);
  const published=choosePublishedCatalog(recent,legacy,baseline);
  const next=evaluateEvidenceSnapshot(item.geometry,published.catalog,published.readiness,new Date().toISOString());
  next.catalogGeneratedUtc=published.generatedUtc;
  next.publication=published.publication;
  const change=diffEvidenceSnapshots(item.lastEvidenceCheck,next);
  const event=historyEvent(next,change);
  const replacement={...item,lastEvidenceCheck:next,lastChange:change,
    monitorHistory:appendHistory(item.monitorHistory,event)};
  applyStored(records.map(r=>r.id===item.id?replacement:r));
  render();message("Pemeriksaan sumber publik selesai. "+(change.isBaseline?"Baseline pertama disimpan.":change.newTotal+" scene katalog baru dibanding pemeriksaan terakhir.")+" Ini bukan monitoring gerakan aset.");
 }catch(error){message("Pemeriksaan gagal: "+error.message+". Data lama tidak diganti.",true);}
 finally{btn.textContent="Check Evidence ↗";render();}
}
function exportBrief(){const item=selected();if(!item)return;
 const report=makeEvidenceBrief(item);
 const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+"\n"],{type:"application/json"}));
 const anchor=document.createElement("a");anchor.href=url;anchor.download="baruna-aoi-"+item.id+"-verification-brief.json";
 document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 message("Verification Brief diunduh. Statusnya tetap DATA INSUFFICIENT.");
}
function initMap(){if(!window.L){message("Library Leaflet gagal dimuat. Periksa koneksi aset peta.",true);return;}
 const L=window.L;
 map=L.map("aoi-map",{center:[-6.953,110.435],zoom:12,scrollWheelZoom:false,zoomControl:false,preferCanvas:true});
 L.control.zoom({position:"bottomright"}).addTo(map);
 L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
 const [w,s,e,n]=AOI_BOUNDS;
 L.rectangle([[s,w],[n,e]],{color:"#3c889b",weight:1,dashArray:"5 6",fillOpacity:.015,interactive:false})
  .bindTooltip("Cakupan dataset Semarang",{sticky:true}).addTo(map);
 map.fitBounds([[s,w],[n,e]],{padding:[22,22]});
 map.on("click",ev=>{if(!drawing)return;
  const {lng,lat}=ev.latlng;drawPoints.push([lng,lat]);
  if(drawPoints.length>200){drawPoints.pop();message("Maksimal 200 titik.",true);return;}
  drawMap();message(drawPoints.length+" titik. Klik minimal 3 titik, lalu Selesaikan.");
 });
 mapReady=true;drawMap();
}
/** Backup AOI as portable JSON; no network or cloud dependency. */
function exportLocalBackup(){
 try{
  const payload=makeLocalBackup(records);
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+"\n"],{type:"application/json;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="BARUNA_Semarang_AOI_Backup.json";
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  message("Backup "+records.length+" AOI tersimpan sebagai JSON. Simpan file untuk pemulihan.");
 }catch(error){message("Backup gagal: "+error.message,true);}
}
async function restoreLocalBackup(file){
 if(!file)return;
 try{
  if(file.size>BACKUP_MAX_BYTES)throw new RangeError("Backup JSON maksimal 1 MB.");
  if(!/\.json$/i.test(file.name))throw new TypeError("Gunakan file .json hasil backup BARUNA.");
  const imported=parseLocalBackup(await file.text());
  const result=mergeLocalBackup(records,imported);
  applyStored(result.records);
  if(!selectedId&&result.added>0)loadAoi(result.records.at(-1).id);
  render();
  message("Restore selesai: "+result.added+" AOI baru, "+result.skipped+" sudah ada, "+result.conflicts+" konflik polygon dilewati, "+result.capacitySkipped+" melewati batas 20 AOI. Tidak ada data lokal ditimpa.");
 }catch(error){message("Restore gagal: "+error.message,true);}
 finally{$("restore-local").value="";}
}
function initialize(){
 try{records=readRegistry(window.localStorage);}catch(e){storageError(e);records=[];}
 $("aoi-list").addEventListener("click",e=>{const target=e.target.closest("[data-aoi-id]");if(target)loadAoi(target.dataset.aoiId);});
 $("new-aoi").addEventListener("click",newAoi);
 $("aoi-name").addEventListener("input",render);
 $("aoi-form").addEventListener("submit",save);
 $("delete-aoi").addEventListener("click",deleteSelected);
 $("start-draw").addEventListener("click",startDraw);
 $("undo-point").addEventListener("click",()=>{drawPoints.pop();drawMap();message(drawPoints.length+" titik tersisa.");});
 $("finish-draw").addEventListener("click",finishDraw);
 $("clear-draw").addEventListener("click",clearDraw);
 $("upload-geojson").addEventListener("change",e=>importFile(e.target.files?.[0]));
 $("check-evidence").addEventListener("click",checkEvidence);
 $("export-brief").addEventListener("click",exportBrief);
 $("backup-local").addEventListener("click",exportLocalBackup);
 $("restore-local").addEventListener("change",event=>restoreLocalBackup(event.target.files?.[0]));
 initMap();render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});else initialize();