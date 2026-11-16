/* Full-page onboarding. No modal, no first-visit interruption. */
import {validateHistoricalFieldEvidence} from "./historical.js";
const root=document.getElementById("pw-page-guide");
const esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const STEPS=Object.freeze([
 {short:"Pilih lokasi",title:"Mulai dari satu lokasi.",desc:"Tanjung Emas · Semarang",kind:"site"},
 {short:"Buka catatan",title:"Lihat bukti historis.",desc:"Bukti lama tetap berguna, tetapi bukan kondisi hari ini.",kind:"record"},
 {short:"Periksa kelengkapan",title:"Mana yang belum ada?",desc:"Tanpa pengukuran terbaru, jangan menebak risiko.",kind:"gate"},
 {short:"Ambil tindakan",title:"Siapkan verifikasi.",desc:"Hasilnya daftar bukti yang perlu diminta.",kind:"action"}
]);
let index=0,west=null,error=null;
function visual(s){
 if(s.kind==="site")return '<div class="bg-showcase-site"><span class="bg-label">01 / LOKASI</span><strong>Tanjung Emas</strong><small>Semarang, Jawa Tengah</small><span class="bg-arrow">→</span><span>6 sektor penelitian historis</span></div>';
 if(s.kind==="record"){
  const amount=west?west.minCm+'–'+west.maxCm:'—';
  return '<div class="bg-showcase-record"><span class="bg-label">02 / CATATAN 2005</span><strong>West breakwater</strong><div class="bg-amount">'+amount+' <small>cm</small></div><p>Penurunan kumulatif historis</p><small>Raharjo & Yosi · bukan laju per tahun</small></div>';
 }
 if(s.kind==="gate")return '<div class="bg-showcase-check"><span class="bg-label">03 / KELENGKAPAN BUKTI</span>'+
 '<div><span>Catatan lapangan 2005</span><b class="is-yes">Tersedia</b></div>'+
 '<div><span>Geometri sektor</span><b>Belum ada</b></div>'+
 '<div><span>Survei terbaru</span><b>Belum ada</b></div></div>';
 return '<div class="bg-showcase-action"><span class="bg-label">04 / TINDAKAN</span>'+
 '<strong>DATA INSUFFICIENT</strong><p>Perlu ukur ulang dan validasi lokasi.</p>'+
 '<button type="button" class="bg-open-review" data-pw-page="assessment">Buka pemeriksaan lengkap →</button></div>';
}
function render(){
 if(!root)return;
 const step=STEPS[index];
 root.innerHTML='<div class="bg-guide"><div class="bg-guide-head"><span>PANDUAN · BARUNA SENTINEL</span>'+
 '<h1>Cara kerja BARUNA.</h1><p>Empat langkah dari lokasi ke tindakan.</p></div>'+
 '<div class="bg-guide-stage"><div class="bg-guide-steps" role="tablist" aria-label="Langkah penggunaan BARUNA">'+STEPS.map((s,i)=>
 '<button type="button" role="tab" id="bg-tab-'+i+'" aria-controls="bg-guide-detail" aria-selected="'+(i===index)+'" tabindex="'+(i===index?'0':'-1')+
 '" data-bg-step="'+i+'" class="'+(i===index?'is-active':'')+'"><span>'+String(i+1).padStart(2,"0")+'</span><strong>'+esc(s.short)+'</strong></button>').join("")+
 '</div><section id="bg-guide-detail" role="tabpanel" aria-labelledby="bg-tab-'+index+'" class="bg-guide-detail">'+
 '<div class="bg-guide-copy"><span class="bg-kicker">LANGKAH '+(index+1)+' / 4</span><h2>'+esc(step.title)+'</h2>'+
 '<p>'+esc(step.desc)+'</p><div class="bg-guide-controls">'+
 (index>0?'<button type="button" class="bg-prev" data-bg-nav="-1">← Sebelumnya</button>':'')+
 (index<STEPS.length-1?'<button type="button" class="bg-next" data-bg-nav="1">Berikutnya →</button>':
 '<button type="button" class="bg-next" data-pw-page="assessment">Coba di workspace →</button>')+
 '</div></div><div class="bg-guide-visual">'+visual(step)+'</div></section></div>'+
 '<div class="bg-guide-foot"><span>Mode panduan · tidak mengubah data</span>'+
 '<button type="button" data-pw-page="why">Kembali ke workspace ↗</button></div></div>';
}
root?.addEventListener("click",event=>{
 const n=event.target.closest("[data-bg-step]");
 if(n){index=Number(n.dataset.bgStep);render();return;}
 const next=event.target.closest("[data-bg-nav]");
 if(next){index=Math.max(0,Math.min(3,index+Number(next.dataset.bgNav)));render();}
});
root?.addEventListener("keydown",event=>{
 const item=event.target.closest("[data-bg-step]");
 if(!item)return;
 if(event.key==="ArrowDown"||event.key==="ArrowRight"){event.preventDefault();index=(index+1)%4;render();root.querySelector("#bg-tab-"+index)?.focus()}
 if(event.key==="ArrowUp"||event.key==="ArrowLeft"){event.preventDefault();index=(index+3)%4;render();root.querySelector("#bg-tab-"+index)?.focus()}
});
async function init(){
 render();
 try{
  const r=await fetch("./data/tanjung-emas-historical-field-evidence.json");
  if(!r.ok)throw new Error("Unavailable source");
  const doc=validateHistoricalFieldEvidence(await r.json());
  west=doc.sectors.find(s=>s.id==="west-breakwater");
 }catch(e){error=String(e);west=null}
 // Numeric field is not displayed if the official research extract isn't valid.
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
