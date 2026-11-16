/* BARUNA home: source-backed workspace, not a marketing landing page. */
import {validateHistoricalFieldEvidence} from "./historical.js";

const root=document.getElementById("pw-page-why");
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const CATEGORY={ "Road access":"Akses jalan","Quay / wharf":"Dermaga","Coastal defence":"Pertahanan pesisir","Coastal protection":"Struktur pesisir","Port operations":"Operasi pelabuhan"};
let doc=null,selectedId="west-breakwater",map=null,loadError=null;
const selection=()=>doc?.sectors.find(s=>s.id===selectedId)||doc?.sectors[0]||null;

function renderLoading(){
 root.innerHTML='<div class="bf-loading"><span>BARUNA / TANJUNG EMAS</span><h1>Memuat data studi kasus…</h1><p>Memeriksa catatan historis sebelum membuka workspace.</p></div>';
}
function sectorRow(s){
 return '<button type="button" class="bf-sector" data-bf-sector="'+esc(s.id)+'" aria-pressed="'+(s.id===selectedId?'true':'false')+'">'+
  '<span class="bf-sector-name">'+esc(s.name)+'</span><span class="bf-sector-type">'+esc(CATEGORY[s.type]||s.type)+'</span>'+
  '<span class="bf-sector-arrow" aria-hidden="true">↗</span></button>';
}
function panel(s){
 if(!s)return '<p>Rekaman sektor tidak ditemukan.</p>';
 return '<div class="bf-detail-kicker">SEKTOR TERPILIH · CATATAN 2005</div>'+
 '<div class="bf-detail-heading"><h2>'+esc(s.name)+'</h2><span class="bf-detail-status">Bukti belum cukup</span></div>'+
 '<div class="bf-measure"><strong>'+s.minCm+'–'+s.maxCm+'<small>cm</small></strong>'+
 '<span>Penurunan kumulatif historis<br><small>bukan laju tahunan / kondisi 2026</small></span></div>'+
 '<div class="bf-evidence-mini" aria-label="Ketersediaan bukti">'+
  '<div><span>Catatan penelitian 2005</span><b class="bf-ok">Tersedia</b></div>'+
  '<div><span>Geometri sektor terukur</span><b>Belum ada</b></div>'+
  '<div><span>Pengukuran aset terkini</span><b>Belum ada</b></div>'+
 '</div>'+
 '<p class="bf-next">Langkah berikutnya: verifikasi geometri dan ukur ulang aset.</p>'+
 '<div class="bf-detail-actions"><button class="bf-primary" type="button" id="bf-open-review">Buka pemeriksaan <span aria-hidden="true">→</span></button>'+
 '<button class="bf-subtle" type="button" data-pw-page="guide">Lihat alur penggunaan</button></div>';
}
function render(){
 if(!root||!doc)return;
 root.innerHTML='<section class="bf-topline" aria-label="Workspace status"><div><span class="bf-eyebrow">WORKSPACE / SEMARANG</span>'+
  '<h1>Tanjung Emas</h1><p>Periksa bukti sebelum menetapkan inspeksi.</p></div>'+
  '<div class="bf-toplinks"><span>Studi historis · 2005</span>'+
  '<button type="button" data-pw-page="guide">Cara kerja <span aria-hidden="true">↗</span></button></div></section>'+
 '<section class="bf-workspace" aria-label="Studi kasus dan bukti">'+
 '<aside class="bf-sidebar"><div class="bf-pane-title"><strong>Sektor penelitian</strong><span>'+doc.sectors.length+' lokasi</span></div>'+
  '<div class="bf-sector-list" role="group" aria-label="Pilih sektor penelitian">'+doc.sectors.map(sectorRow).join("")+'</div>'+
  '<div class="bf-side-note"><a href="'+esc(doc.publication.url)+'" target="_blank" rel="noopener noreferrer">Sumber penelitian ↗</a>'+
  '<span>Belum ada polygon sektor tervalidasi.</span></div></aside>'+
 '<section class="bf-map-pane" aria-label="Peta konteks kawasan Semarang"><div id="bf-region-map" class="bf-map-canvas" role="region" aria-label="Peta konteks Semarang, bukan lokasi titik survei tiap sektor"></div>'+
  '<div class="bf-map-header"><strong>Konteks wilayah</strong><span>Semarang · Jawa Tengah</span></div>'+
  '<div class="bf-map-annotation"><span class="bf-map-dot"></span>Peta referensi, bukan lokasi sektor terukur</div>'+
  '</section>'+
 '<aside class="bf-result-pane"><div id="bf-sector-detail" aria-live="polite">'+panel(selection())+'</div></aside>'+
 '</section>'+
 '<div class="bf-bottom"><span><b>SUMBER</b> Levelling & GPR · Raharjo & Yosi (2017)</span>'+
  '<span><b>BATAS ANALISIS</b> Belum ada geometri/pengukuran terkini</span>'+
  '<button type="button" data-pw-page="analyst">Buka data GNSS <span aria-hidden="true">↗</span></button></div>';
 initMap();
}
function initMap(){
 if(map){map.remove();map=null}
 const target=root.querySelector("#bf-region-map");
 if(!target)return;
 if(typeof window.L!=="object"){
  target.classList.add("bf-map-unavailable");
  target.textContent="Peta dasar belum dapat dimuat. Konteks tetap tersedia melalui catatan sumber.";
  return;
 }
 // Approximate regional map extent only; no invented individual sector pins.
 map=window.L.map(target,{zoomControl:false,scrollWheelZoom:false,attributionControl:true,preferCanvas:true}).setView([-6.955,110.425],12);
 window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
  maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
 }).addTo(map);
 window.L.control.zoom({position:"bottomleft"}).addTo(map);
 window.requestAnimationFrame(()=>map?.invalidateSize());
}
function selectSector(id){
 if(!doc?.sectors.some(s=>s.id===id))return;
 selectedId=id;
 root.querySelectorAll("[data-bf-sector]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.bfSector===id)));
 const detail=root.querySelector("#bf-sector-detail");
 if(detail)detail.innerHTML=panel(selection());
}
root?.addEventListener("click",event=>{
 const sector=event.target.closest("[data-bf-sector]");
 if(sector){selectSector(sector.dataset.bfSector);return;}
 if(event.target.closest("#bf-open-review")){
  window.dispatchEvent(new CustomEvent("baruna:select-sector",{detail:{id:selectedId}}));
  const nav=window.BarunaNavigation;
  if(nav?.getProject?.()!=="semarang-port")nav?.selectProject?.("semarang-port",{page:"assessment",updateUrl:true,scroll:true});
  else nav?.setPage?.("assessment",{updateUrl:true,scroll:true});
 }
});
window.addEventListener("baruna:pagechange",event=>{
 if(event.detail?.page==="why"&&map)window.requestAnimationFrame(()=>map?.invalidateSize());
});
async function init(){
 if(!root)return;
 renderLoading();
 try{
  const res=await fetch("./data/tanjung-emas-historical-field-evidence.json");
  if(!res.ok)throw new Error("HTTP "+res.status);
  doc=validateHistoricalFieldEvidence(await res.json());
  render();
 }catch(error){
  loadError=error instanceof Error?error.message:String(error);
  root.innerHTML='<div class="bf-loading bf-error"><span>DATA TIDAK TERSEDIA</span><h1>Studi historis belum dapat dibuka.</h1><p>Periksa berkas sumber sebelum mengeluarkan keputusan.</p><small>'+esc(loadError)+'</small></div>';
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
