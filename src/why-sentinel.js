import {STORY_STEPS,STORY_HIGHLIGHTS,estimatedInterruptionExposure,rupiah} from "./why-sentinel-model.js";

const root=document.getElementById("pw-page-why");
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
let currentIndex=0;
let hours="";
let hourlyCost="";
const officialLinks=[
  {title:"Aditiya & Ito (2023) · InSAR Semarang",url:"https://doi.org/10.1016/j.jag.2023.103579"},
  {title:"Wetlands International / Deltares · Ekonomi penurunan tanah",url:"https://indonesia.wetlands.org/id/download/1496/"},
  {title:"Studi sektor Tanjung Emas (2005)",url:"https://doi.org/10.32693/bomg.32.1.2017.351"},
  {title:"Susilo et al. (2023) · GNSS historis",url:"https://doi.org/10.5281/zenodo.7775016"},
  {title:"Sitaningrum & Widjajanti (2024) · CSMG dan CSEM PPP",url:"https://doi.org/10.22146/jgise.95957"}
];
const estimate=()=>estimatedInterruptionExposure(hours,hourlyCost);
const estimateLabel=()=>estimate()===null?"Masukkan dua asumsi":rupiah(estimate());

function initialIndex(){
  const stepId=new URLSearchParams(location.search).get("step");
  const index=STORY_STEPS.findIndex(step=>step.id===stepId);
  return Math.max(0,index);
}
function sourceAnchor(step){
  if(!step.sourceUrl)return '<span class="ws-source-link ws-source-plain">'+esc(step.sourceLabel)+'</span>';
  return '<a class="ws-source-link" href="'+esc(step.sourceUrl)+
    '" target="_blank" rel="noopener noreferrer">Lihat sumber penelitian ↗</a>';
}
function extraPanel(id){
  if(id==="problem"){
    return '<div class="ws-evidence-detail">'+
      '<div class="ws-strong-point"><strong>100–120 mm/tahun</strong>'+
      '<span>Temuan laju maksimum di sebagian lokasi Semarang–Demak, dari penelitian InSAR <b>2015–2022</b>. Ini bukan pengukuran dermaga atau jalan tertentu.</span></div>'+
      '<div class="ws-mini-flow"><span>Data wilayah</span><span>≠</span><span>Kondisi tiap aset</span></div></div>';
  }
  if(id==="economy"){
    return '<div class="ws-economic-impact">'+
      '<div class="ws-impact-chips"><span>Akses terganggu</span><span>Jadwal mundur</span><span>Inspeksi ulang</span><span>Biaya perbaikan</span></div>'+
      '<div class="ws-econ-model"><div class="ws-econ-title"><strong>Ilustrasi biaya gangguan</strong>'+
      '<small>Hanya asumsi yang Anda isi, bukan kerugian aktual</small></div>'+
      '<div class="ws-econ-inputs">'+
      '<label>Durasi gangguan (jam)<input id="ws-hours" type="number" min="0" max="720" step="1" inputmode="numeric" placeholder="Mis. 4" value="'+esc(hours)+'"></label>'+
      '<span class="ws-econ-times" aria-hidden="true">×</span>'+
      '<label>Biaya per jam (Rp)<input id="ws-hourly" type="number" min="0" max="1000000000000" step="100000" inputmode="numeric" placeholder="Mis. 1000000" value="'+esc(hourlyCost)+'"></label>'+
      '<span class="ws-econ-equals" aria-hidden="true">=</span>'+
      '<output id="ws-econ-result" aria-live="polite">'+estimateLabel()+'</output></div>'+
      '<p>Durasi × biaya per jam. Tidak termasuk kemungkinan kejadian atau efek logistik lanjutan.</p></div></div>';
  }
  if(id==="evidence"){
    return '<div class="ws-dataset-lines">'+[
      ["RISET / 2005","6 sektor Tanjung Emas","Catatan penurunan kumulatif"],
      ["GPS / 2010–2021","CSEM · 3.561 posisi","Tren stasiun, bukan aset"],
      ["PPP / 2021–2023","CSMG −94,03 / CSEM +3,23","Perbandingan dua stasiun, bukan aset"],
      ["QC / 2025","BAKO · 41 epoch","Mutu observasi stasiun lain"]
    ].map(x=>'<div><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong><span>'+esc(x[2])+'</span></div>').join("")+'</div>';
  }
  if(id==="process"){
    return '<div class="ws-gates">'+[
      ["01","Baca data pergerakan"],
      ["02","Periksa mutu GNSS"],
      ["03","Cek lokasi dan fungsi aset"],
      ["04","Jelaskan hasil + tindakan"]
    ].map(x=>'<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join("")+'</div>';
  }
  return '<div class="ws-outcome"><div class="ws-outcome-mark">CONTOH · WEST BREAKWATER / 2005</div>'+
    '<div><strong class="ws-case-figure">74–140 cm</strong><p>Penurunan kumulatif historis yang dilaporkan studi, bukan laju tahunan.</p></div>'+
    '<div class="ws-case-status"><b>Hasil prototype: bukti belum cukup</b>'+
    '<span>Masih perlu posisi/geometri aset dan pengukuran terbaru. BARUNA dapat menyiapkan daftar verifikasi dan laporannya.</span></div></div>';
}
function renderStep(){
  const step=STORY_STEPS[currentIndex];
  const next=STORY_STEPS[currentIndex+1];
  root.querySelector("#ws-node-track").innerHTML=STORY_STEPS.map((s,i)=>
    '<button type="button" role="tab" id="ws-step-'+esc(s.id)+'" data-ws-index="'+i+
    '" aria-controls="ws-step-detail" aria-selected="'+(i===currentIndex)+'" tabindex="'+(i===currentIndex?0:-1)+
    '" class="ws-node'+(i===currentIndex?" is-current":"")+(i<currentIndex?" is-passed":"")+'">'+
    '<span class="ws-node-number">'+esc(s.number)+'</span>'+
    '<span class="ws-node-title">'+esc(s.nav)+'</span></button>').join("");
  const detail=root.querySelector("#ws-step-detail");
  detail.setAttribute("aria-labelledby","ws-step-"+step.id);
  detail.innerHTML='<div class="ws-detail-main">'+
    '<span class="ws-detail-label">'+esc(step.eyebrow)+' <span>/ '+esc(step.number)+' DARI 05</span></span>'+
    '<h3>'+esc(step.title)+'</h3><p class="ws-detail-lead">'+esc(step.lead)+'</p>'+
    extraPanel(step.id)+
    '<div class="ws-takeaway"><b>PERLU DIINGAT</b><p>'+esc(step.takeaway)+'</p></div>'+
    '<div class="ws-stage-footer">'+sourceAnchor(step)+
    '<div class="ws-stage-actions">'+
    (currentIndex>0?'<button type="button" class="ws-step-prev" data-ws-navigate="-1">← Kembali</button>':'')+
    (next?'<button type="button" class="ws-step-next" data-ws-navigate="1">Berikutnya: '+esc(next.nav)+' →</button>':
      '<button type="button" class="ws-step-next" data-pw-page="assessment">Lihat hasil Assessment →</button>')+
    '</div></div></div>';
  root.querySelector("#ws-stage-progress").textContent="Tahap "+(currentIndex+1)+" dari 5";
}
function goToStep(index,{focus=false}={}){
  if(!Number.isInteger(index)||index<0||index>=STORY_STEPS.length)return;
  currentIndex=index;
  if(window.BarunaNavigation?.getPage?.()==="why"){
    const u=new URL(location.href);
    u.searchParams.set("step",STORY_STEPS[index].id);
    history.replaceState(history.state,"",u.pathname+u.search);
  }
  renderStep();
  if(focus)root.querySelector("#ws-step-"+STORY_STEPS[index].id)?.focus();
}
function render(){
  if(!root)return;
  root.innerHTML=
    '<div class="ws-story"><div class="ws-story-header">'+
    '<div class="ws-kicker"><span class="ws-kicker-dot"></span> BARUNA SENTINEL <span>/ PROTOTIPE INSPEKSI PESISIR</span></div>'+
    '<div class="ws-hero-grid"><div class="ws-headline">'+
    '<h1>Tanah pesisir bergerak.<br><span>Mana yang perlu diperiksa dulu?</span></h1>'+
    '<p>BARUNA Sentinel membantu tim infrastruktur pesisir memeriksa data pergerakan tanah, mutu pengukuran GNSS, dan kondisi informasi aset. Hasilnya: alasan untuk memprioritaskan verifikasi—atau penjelasan mengapa bukti belum cukup.</p>'+
    '<div class="ws-hero-actions">'+
    '<button type="button" class="ws-cta-primary" data-pw-page="assessment">Coba kasus Tanjung Emas <span>↗</span></button>'+
    '<a href="#ws-workflow" class="ws-cta-secondary">Pahami caranya <span>↓</span></a></div>'+
    '</div>'+
    '<div class="ws-hero-aside"><span class="ws-aside-top">CONTOH KASUS / SEMARANG</span>'+
    '<div class="ws-aside-case"><strong>Tanjung Emas</strong><span>6 sektor infrastruktur pada studi historis</span></div>'+
    '<div class="ws-aside-bottom"><span>Hasil: butuh verifikasi lapangan</span><span>DATA / 2005</span></div></div></div>'+
    '<div class="ws-fact-strip" aria-label="Masalah, cara kerja dan hasil BARUNA">'+
    STORY_HIGHLIGHTS.map(h=>'<div class="ws-fact"><strong>'+esc(h.label)+'</strong><span>'+esc(h.detail)+'</span></div>').join("")+'</div></div>'+
    '<section class="ws-workflow" id="ws-workflow" aria-labelledby="ws-flow-heading">'+
    '<div class="ws-section-head"><div><span class="ws-section-kicker">COBA JELAJAHI</span>'+
    '<h2 id="ws-flow-heading">Lima langkah dari masalah ke tindakan.</h2>'+
    '<p>Tekan setiap titik untuk melihat apa yang diketahui, bagaimana BARUNA memeriksa, dan hasilnya.</p></div>'+
    '<div id="ws-stage-progress" class="ws-progress" aria-live="polite"></div></div>'+
    '<div id="ws-node-track" class="ws-node-track" role="tablist" aria-label="Alur penjelasan BARUNA"></div>'+
    '<section id="ws-step-detail" role="tabpanel" tabindex="-1" class="ws-step-detail"></section></section>'+
    '<div class="ws-bottom-cta"><div><strong>Bukti bukan hanya untuk dilihat, tetapi untuk membantu tindakan.</strong>'+
    '<p>Coba enam catatan historis Tanjung Emas: pilih sektor, lihat data yang kurang, dan siapkan laporan verifikasi.</p></div>'+
    '<div class="ws-bottom-actions"><button type="button" class="pw-btn pw-btn-primary" data-pw-page="assessment">Coba penilaian</button>'+
    '<button type="button" class="pw-btn pw-btn-secondary" data-pw-page="projects">Lihat proyek</button></div></div>'+
    '<footer class="ws-sources"><strong>SUMBER & BATAS PROTOTIPE</strong>'+
    '<div>'+officialLinks.map(l=>'<a href="'+esc(l.url)+'" rel="noopener noreferrer" target="_blank">'+esc(l.title)+' ↗</a>').join("")+'</div>'+
    '<p>Temuan historis tidak menunjukkan kondisi aset saat ini. Contoh biaya adalah asumsi pengguna, bukan kerugian aktual. BARUNA mendukung screening dan perencanaan verifikasi, bukan prediksi kegagalan struktur atau sertifikasi keselamatan.</p></footer></div>';
  renderStep();
}
function init(){
  if(!root)return;
  currentIndex=initialIndex();
  render();
  root.addEventListener("click",event=>{
    const button=event.target.closest("button");
    if(!button)return;
    if(button.dataset.wsIndex!==undefined){goToStep(Number(button.dataset.wsIndex),{focus:true});return;}
    if(button.dataset.wsNavigate){
      goToStep(currentIndex+Number(button.dataset.wsNavigate));
      root.querySelector("#ws-step-detail")?.focus({preventScroll:true});
    }
  });
  root.addEventListener("keydown",event=>{
    const tab=event.target.closest('[role="tab"][data-ws-index]');
    if(!tab)return;
    const idx=Number(tab.dataset.wsIndex);
    if(event.key==="ArrowRight"||event.key==="ArrowDown"){event.preventDefault();goToStep((idx+1)%5,{focus:true});}
    if(event.key==="ArrowLeft"||event.key==="ArrowUp"){event.preventDefault();goToStep((idx+4)%5,{focus:true});}
    if(event.key==="Home"){event.preventDefault();goToStep(0,{focus:true});}
    if(event.key==="End"){event.preventDefault();goToStep(4,{focus:true});}
  });
  root.addEventListener("input",event=>{
    if(event.target.id==="ws-hours")hours=event.target.value;
    else if(event.target.id==="ws-hourly")hourlyCost=event.target.value;
    else return;
    const output=root.querySelector("#ws-econ-result");
    if(output)output.textContent=estimateLabel();
  });
  window.addEventListener("popstate",()=>{
    if(window.BarunaNavigation?.getPage?.()==="why")goToStep(initialIndex());
  });
  window.addEventListener("baruna:pagechange",event=>{
    if(event.detail?.page==="why"&&new URLSearchParams(location.search).has("step")){
      const index=initialIndex();
      if(index!==currentIndex)goToStep(index);
    }
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
