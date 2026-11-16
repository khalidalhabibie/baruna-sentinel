/* Decision-first product tour. No private data access, no analytics, no fake observations. */
(function(){
  "use strict";
  const KEY="baruna:guided-intro:complete:v2";
  const route=window.BarunaNavigation;
  const $=sel=>document.querySelector(sel);
  const stages=Object.freeze([
    {page:"why",name:"Kenali misinya",tag:"MASALAH",title:"Aset mana yang perlu diperiksa?",body:"BARUNA membantu tim pesisir memahami bukti yang tersedia sebelum memutuskan inspeksi. Kita mulai dari satu kasus, bukan dari menu teknis.",target:"#pw-page-why .ws-cta-primary",cta:"Buka studi kasus"},
    {page:"assessment",name:"Pilih sektor",tag:"LOKASI",title:"Tanjung Emas · West Breakwater",body:"Enam sektor berasal dari studi historis. Pilih West Breakwater untuk melihat catatan penurunan kumulatif 74–140 cm pada tahun 2005—bukan kondisi tahun 2026.",target:".as-sector-list",cta:"Periksa kecukupan bukti"},
    {page:"assessment",name:"Periksa hasil",tag:"EVIDENCE GATE",title:"Bukti belum cukup, bukan berarti aman",body:"Tanpa geometri tervalidasi dan pengukuran aset terkini, hasilnya DATA INSUFFICIENT. BARUNA tidak menebak risiko, melainkan menjelaskan yang belum diketahui.",target:".as-decision-panel",cta:"Lihat asal bukti GNSS"},
    {page:"analyst",name:"Telusuri GNSS",tag:"SUMBER",title:"Bukti independen, bukan sensor aset",body:"CSEM 2010–2021 menunjukkan riwayat posisi stasiun; BAKO 2025 menunjukkan kualitas observasi Multi-GNSS. Data berbeda lokasi dan periode tidak digabung sebagai deformasi dermaga.",target:".pw-lab-tabs",cta:"Lanjut ke tindakan"},
    {page:"assessment",name:"Tentukan tindakan",tag:"OUTPUT",title:"Bawa pulang laporan verifikasi",body:"Tinjau checklist: konfirmasi geometri aset, minta pengukuran terbaru, lalu lakukan review ahli/operator. Gunakan 'Export assessment brief' untuk laporan yang bisa dibaca tim lapangan.",target:".as-decision-panel #as-export",cta:"Selesai jelajah"}
  ]);
  let index=0,open=false,trigger=null;
  function stored(){try{return localStorage.getItem(KEY)==="yes"}catch{return false}}
  function save(){try{localStorage.setItem(KEY,"yes")}catch{}}
  function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
  const card=el("aside","baruna-guide");
  card.id="baruna-guide-panel";
  card.setAttribute("role","dialog");
  card.setAttribute("aria-modal","false");
  card.setAttribute("aria-labelledby","baruna-guide-heading");
  card.hidden=true;
  document.body.appendChild(card);
  const status=el("span","baruna-tour-sr");
  status.setAttribute("role","status");
  status.setAttribute("aria-live","polite");
  document.body.appendChild(status);
  function cleanTarget(){document.querySelectorAll(".baruna-tour-highlight").forEach(n=>n.classList.remove("baruna-tour-highlight"))}
  function setPage(page){
    if(route?.getProject?.()!=="semarang-port"){
      route?.selectProject?.("semarang-port",{page,updateUrl:true,scroll:false});
    }else if(route?.getPage?.()!==page){
      route?.setPage?.(page,{updateUrl:true,scroll:false});
    }
  }
  function highlight(){
    cleanTarget();
    if(!open)return;
    let target=$(stages[index].target);
    if(!target || target.getClientRects().length===0)target=$('[data-pw-page="'+stages[index].page+'"]');
    if(target){
      target.classList.add("baruna-tour-highlight");
      if(index>0 && window.matchMedia("(min-width: 900px)").matches){
        const box=target.getBoundingClientRect();
        if(box.bottom>window.innerHeight-130||box.top<90){
          target.scrollIntoView({behavior:"smooth",block:"center"});
        }
      }
    }
  }
  function render(){
    if(!open)return;
    const s=stages[index];card.replaceChildren();
    const top=el("div","baruna-guide-top");
    const label=el("div","baruna-guide-label","PANDUAN PRODUK  /  "+s.tag);
    const close=el("button","baruna-guide-close","×");close.type="button";close.setAttribute("aria-label","Tutup panduan");close.addEventListener("click",finish);
    top.append(label,close);
    const progress=el("div","baruna-guide-progress");
    stages.forEach((stage,i)=>{
      const dot=el("button","baruna-guide-dot"+(i===index?" is-current":"")+(i<index?" is-complete":""));
      dot.type="button";dot.setAttribute("aria-label","Langkah "+(i+1)+": "+stage.name);
      dot.setAttribute("aria-current",i===index?"step":"false");
      dot.addEventListener("click",()=>goto(i));
      progress.append(dot);
    });
    const kicker=el("div","baruna-guide-count","LANGKAH "+(index+1)+" DARI "+stages.length+"  ·  "+s.name);
    const h=el("h2","baruna-guide-title",s.title);h.id="baruna-guide-heading";
    const p=el("p","baruna-guide-body",s.body);
    const foot=el("div","baruna-guide-foot");
    const left=el("button","baruna-guide-secondary",index?"← Kembali":"Lewati");
    left.type="button";left.addEventListener("click",()=>index?goto(index-1):finish());
    const right=el("button","baruna-guide-primary",s.cta+"  →");right.type="button";
    right.addEventListener("click",()=>index<stages.length-1?goto(index+1):finish());
    foot.append(left,right);card.append(top,progress,kicker,h,p,foot);
    setPage(s.page);
    status.textContent="Panduan langkah "+(index+1)+". "+s.title;
    window.setTimeout(highlight,150);
  }
  function goto(n){if(!open||n<0||n>=stages.length)return;index=n;render()}
  function finish(){
    open=false;card.hidden=true;cleanTarget();save();status.textContent="Panduan selesai. Bisa diulang dari menu atas.";
    if(trigger){trigger.focus({preventScroll:true});trigger=null}
  }
  function start(){
    index=0;open=true;card.hidden=false;trigger=document.activeElement;
    render();card.querySelector(".baruna-guide-close")?.focus({preventScroll:true});
  }
  function init(){
    document.getElementById("baruna-start-tour")?.addEventListener("click",start);
    document.addEventListener("click",event=>{
      if(event.target.closest("[data-baruna-tour-replay]")){event.preventDefault();start()}
      if(event.target.closest(".baruna-more-menu [data-pw-page]"))document.querySelector(".baruna-nav-more")?.removeAttribute("open");
    });
    document.addEventListener("keydown",event=>{if(open&&event.key==="Escape"){event.preventDefault();finish()}});
    window.addEventListener("baruna:pagechange",()=>{if(open)window.setTimeout(highlight,180)});
    if(!stored() && (route?.getPage?.()||document.body.dataset.page)==="why"){
      window.setTimeout(()=>{if(!stored()&&!open&&document.visibilityState==="visible")start()},1100);
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.BarunaGuidedTour=Object.freeze({start,finish});
})();