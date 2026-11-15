import {STORY_STEPS,STORY_HIGHLIGHTS,selectStoryStep,estimatedInterruptionExposure,rupiah} from "./why-sentinel-model.js";

const root=document.getElementById("pw-page-why");
const html=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
let currentIndex=0;
let hours="4";
let hourlyCost="5000000";
const officialLinks=[
  {title:"Aditiya & Ito (2023) · InSAR 2015–2022",url:"https://doi.org/10.1016/j.jag.2023.103579"},
  {title:"Azeriansyah et al. (2025) · Infrastruktur",url:"https://doi.org/10.31284/j.jemt.2025.v5i2.6841"},
  {title:"Studi sektor Tanjung Emas (2005)",url:"https://doi.org/10.32693/bomg.32.1.2017.351"},
  {title:"Susilo et al. (2023) · GNSS historis",url:"https://doi.org/10.5281/zenodo.7775016"}
];

function initialIndex(){
  const value=new URLSearchParams(location.search).get("step");
  const i=STORY_STEPS.findIndex(step=>step.id===value);
  return i<0?0:i;
}
function sourceAnchor(source){
  return source.sourceUrl?
    '<a class="ws-source-link" href="'+html(source.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Sumber: '+html(source.sourceLabel)+' ↗</a>':
    '<span class="ws-source-link ws-source-plain">'+html(source.sourceLabel)+'</span>';
}
function nodePanelExtra(id){
  if(id==="problem")
    return '<div class="ws-evidence-detail"><div class="ws-strong-point"><strong>100–120 mm/tahun</strong>'+
      '<span>Laju maksimum pada sebagian lokasi Semarang–Demak menurut studi InSAR 2015–2022. <b>Bukan</b> kecepatan penurunan semua aset.</span></div>'+
      '<div class="ws-mini-flow"><span>Data regional</span><span>≠</span><span>Kesimpulan per aset</span></div></div>';
  if(id==="economy")
    return '<div class="ws-economic-impact"><div class="ws-impact-chips"><span>Penundaan akses</span><span>Gangguan jadwal</span><span>Survei ulang</span><span>Perbaikan</span></div>'+
      '<div class="ws-econ-model"><div class="ws-econ-title"><strong>Contoh biaya gangguan — asumsi Anda</strong>'+
        '<small>Bukan nilai kerugian aktual maupun prediksi BARUNA</small></div>'+
        '<div class="ws-econ-inputs">'+
          '<label>Durasi gangguan (jam)<input id="ws-hours" type="number" min="0" max="720" step="1" inputmode="numeric" value="'+html(hours)+'"></label>'+
          '<span class="ws-econ-times" aria-hidden="true">×</span>'+
          '<label>Biaya per jam (Rp)<input id="ws-hourly" type="number" min="0" max="1000000000000" step="100000" inputmode="numeric" value="'+html(hourlyCost)+'"></label>'+
          '<span class="ws-econ-equals" aria-hidden="true">=</span>'+
          '<output id="ws-econ-result">'+rupiah(estimatedInterruptionExposure(hours,hourlyCost))+'</output></div>'+
        '<p>Perkiraan sederhana biaya langsung yang Anda asumsikan. Belum termasuk probabilitas kejadian, klaim kontrak, efek berantai logistik, atau efisiensi yang benar-benar dicapai.</p></div></div>';
  if(id==="evidence")
    return '<div class="ws-dataset-lines">'+[
      ["FIELD / 2005","6 sektor historis","Kumulatif, bukan laju tahunan"],
      ["GPS / 2010–2021","CSEM · 3.561 posisi","Stasiun regional, bukan aset"],
      ["QC / 2025","BAKO · 41 epoch","Multi-GNSS independen, bukan solusi CSEM"]
    ].map(x=>'<div><small>'+html(x[0])+'</small><strong>'+html(x[1])+'</strong><span>'+html(x[2])+'</span></div>').join("")+'</div>';
  if(id==="process")
    return '<div class="ws-gates"><div><b>01</b><span>Observasi dan metadata</span></div><div><b>02</b><span>Quality control GNSS</span></div>'+
      '<div><b>03</b><span>Kesesuaian terhadap aset</span></div><div><b>04</b><span>Keputusan + alasan</span></div></div>';
  return '<div class="ws-outcome"><div class="ws-outcome-mark">DATA INSUFFICIENT</div>'+
    '<div><strong>Keputusan yang dapat dipertanggungjawabkan</strong><p>Untuk studi Tanjung Emas saat ini, BARUNA mengidentifikasi data yang harus diverifikasi sebelum memberi peringkat inspeksi aset secara operasional.</p></div></div>';
}
function renderStage(){
  const step=STORY_STEPS[currentIndex];
  const nav=root.querySelector("#ws-node-track");
  nav.innerHTML=STORY_STEPS.map((s,i)=>
   '<button type="button" role="tab" id="ws-step-'+html(s.id)+'" data-ws-index="'+i+
   '" aria-controls="ws-step-detail" aria-selected="'+String(i===currentIndex)+'" tabindex="'+(i===currentIndex?"0":"-1")+
   '" class="ws-node'+(i===currentIndex?" is-current":"")+(i<currentIndex?" is-passed":"")+'">'+
   '<span class="ws-node-number">'+s.number+'</span>'+
   '<span class="ws-node-title">'+html(s.nav)+'</span>'+
   '</button>').join("");
  const body=root.querySelector("#ws-step-detail");
  const next=STORY_STEPS[currentIndex+1];
  body.setAttribute("aria-labelledby","ws-step-"+step.id);
  body.innerHTML='<div class="ws-detail-main"><span class="ws-detail-label">'+html(step.eyebrow)+
    ' <span> / '+step.number+' OF 05</span></span><h3>'+html(step.title)+'</h3>'+
    '<p class="ws-detail-lead">'+html(step.lead)+'</p>'+
    nodePanelExtra(step.id)+
    '<div class="ws-takeaway"><b>BATAS KLAIM</b><p>'+html(step.takeaway)+'</p></div>'+
    '<div class="ws-stage-footer">'+sourceAnchor(step)+
    '<div class="ws-stage-actions">'+
      (currentIndex>0?'<button type="button" class="ws-step-prev" data-ws-navigate="-1">← Sebelumnya</button>':'')+
      (next?'<button type="button" class="ws-step-next" data-ws-navigate="1">Lanjut: '+html(next.nav)+' →</button>':
      '<button type="button" class="ws-step-next" data-pw-page="assessment">Coba assessment →</button>')+
    '</div></div></div>';
  root.querySelector("#ws-stage-progress").textContent="Langkah "+(currentIndex+1)+" dari "+STORY_STEPS.length;
  const est=root.querySelector("#ws-econ-result");
  if(est)est.textContent=rupiah(estimatedInterruptionExposure(hours,hourlyCost));
}
function goToStep(index,{focus=false}={}){
  if(index<0||index>=STORY_STEPS.length)return;
  currentIndex=index;
  const url=new URL(location.href);
  if(window.BarunaNavigation?.getPage?.()==="why"){
    url.searchParams.set("step",STORY_STEPS[index].id);
    history.replaceState(history.state,"",url.pathname+url.search);
  }
  renderStage();
  if(focus)root.querySelector('#ws-step-'+STORY_STEPS[index].id)?.focus();
}
function render(){
  if(!root)return;
  root.innerHTML=
    '<div class="ws-story"><div class="ws-story-header">'+
      '<div class="ws-kicker"><span class="ws-kicker-dot"></span> BARUNA SENTINEL <span> / WHY IT EXISTS</span></div>'+
      '<div class="ws-hero-grid"><div class="ws-headline">'+
        '<h1>Bukti pergerakan tanah ada.<br><span>Keputusan inspeksi belum tentu jelas.</span></h1>'+
        '<p>Untuk infrastruktur pesisir, peta penurunan tanah saja belum menjawab aset mana yang harus diverifikasi terlebih dahulu. BARUNA menghubungkan data geodetik, kualitas bukti, dan konteks aset menjadi keputusan yang dapat ditelusuri.</p>'+
        '<div class="ws-hero-actions"><a href="#ws-workflow" class="ws-cta-primary">Jelajahi cara kerja <span>↓</span></a>'+
         '<button type="button" class="ws-cta-secondary" data-pw-page="assessment">Coba assessment <span>↗</span></button></div>'+
      '</div>'+
      '<div class="ws-hero-aside"><div class="ws-aside-top">ONE QUESTION</div>'+
        '<p>“Dengan data yang kita punya, <em>apa yang bisa diputuskan</em>—dan apa yang masih harus diperiksa?”</p>'+
        '<div class="ws-aside-bottom"><span>Evidence → decision</span><span>RGPD 2026 / DEMO</span></div></div></div>'+
      '<div class="ws-fact-strip" aria-label="Published evidence and limitations">'+STORY_HIGHLIGHTS.map(h=>
        '<div class="ws-fact"><strong>'+html(h.label)+'</strong><span>'+html(h.detail)+'</span></div>').join("")+'</div></div>'+
      '<section class="ws-workflow" id="ws-workflow" aria-labelledby="ws-flow-heading">'+
        '<div class="ws-section-head"><div><span class="ws-section-kicker">THE EXPLANATION</span>'+
          '<h2 id="ws-flow-heading">Dari masalah sampai keputusan.</h2>'+
          '<p>Klik setiap node untuk melihat cara BARUNA bekerja dan batas bukti yang tersedia.</p></div>'+
          '<div id="ws-stage-progress" class="ws-progress" aria-live="polite">Langkah 1 dari 5</div></div>'+
        '<div id="ws-node-track" class="ws-node-track" role="tablist" aria-label="Tahap cerita BARUNA"></div>'+
        '<section id="ws-step-detail" role="tabpanel" tabindex="-1" class="ws-step-detail"></section>'+
      '</section>'+
      '<div class="ws-bottom-cta"><div><strong>Coba prosesnya, bukan hanya baca penjelasannya.</strong>'+
         '<p>Gunakan studi historis Tanjung Emas untuk membuka analisis bukti, gap verifikasi, dan laporan.</p></div>'+
         '<div class="ws-bottom-actions"><button type="button" class="pw-btn pw-btn-primary" data-pw-page="assessment">Buka Assessment</button>'+
         '<button type="button" class="pw-btn pw-btn-secondary" data-pw-page="projects">Lihat Projects</button></div></div>'+
      '<footer class="ws-sources"><strong>REFERENSI &amp; METODOLOGI</strong>'+
        '<div>'+officialLinks.map(s=>'<a href="'+html(s.url)+'" rel="noopener noreferrer" target="_blank">'+html(s.title)+' ↗</a>').join("")+'</div>'+
        '<p>Angka penelitian bersifat historis dan spesifik pada metode/periode/lokasi. Tidak ada estimasi kerugian operator, hasil intervensi, atau kepastian risiko struktural yang diklaim oleh prototype ini.</p></footer></div>';
  renderStage();
}
function init(){
  currentIndex=initialIndex();
  render();
  root.addEventListener("click",event=>{
    const target=event.target.closest("button");
    if(!target)return;
    if(target.dataset.wsIndex!==undefined){
      goToStep(Number(target.dataset.wsIndex),{focus:true});return;
    }
    if(target.dataset.wsNavigate){
      goToStep(currentIndex+Number(target.dataset.wsNavigate));
      root.querySelector("#ws-step-detail")?.focus({preventScroll:true});
    }
  });
  root.addEventListener("keydown",event=>{
    const tab=event.target.closest('[role="tab"][data-ws-index]');
    if(!tab)return;
    const idx=Number(tab.dataset.wsIndex);
    if(event.key==="ArrowRight"||event.key==="ArrowDown"){event.preventDefault();goToStep((idx+1)%STORY_STEPS.length,{focus:true});}
    if(event.key==="ArrowLeft"||event.key==="ArrowUp"){event.preventDefault();goToStep((idx+STORY_STEPS.length-1)%STORY_STEPS.length,{focus:true});}
    if(event.key==="Home"){event.preventDefault();goToStep(0,{focus:true});}
    if(event.key==="End"){event.preventDefault();goToStep(STORY_STEPS.length-1,{focus:true});}
  });
  root.addEventListener("input",event=>{
    if(event.target.id==="ws-hours")hours=event.target.value;
    else if(event.target.id==="ws-hourly")hourlyCost=event.target.value;
    else return;
    const result=root.querySelector("#ws-econ-result");
    if(result)result.textContent=rupiah(estimatedInterruptionExposure(hours,hourlyCost));
  });
  window.addEventListener("popstate",()=>{
    if(window.BarunaNavigation?.getPage?.()==="why")goToStep(initialIndex());
  });
  window.addEventListener("baruna:pagechange",event=>{
    if(event.detail?.page==="why"&&
       new URLSearchParams(location.search).has("step")){
      const i=initialIndex();
      if(i!==currentIndex)goToStep(i);
    }
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
