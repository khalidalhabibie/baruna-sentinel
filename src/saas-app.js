/**
 * BARUNA Spatial Intelligence — enterprise SaaS front end.
 *
 * One real workspace only: Semarang Coastal / Tanjung Emas.
 * Jakarta and Surabaya are explicitly empty demo placeholders.
 * Preserves original scientific workspaces via deep links.
 */
import {validateRealInsarQa} from "./real-hyp3-insar.js";
import {validateHistoricalFieldEvidence} from "./historical.js";
import {installTrueColorLayer} from "./true-color-layer.js";
import {buildRankingReadiness} from "./insight-ranking.js";
import {buildMultiGnssReview,GNSS_CENTER_SOURCES} from "./multi-gnss-evidence.js";

const ROOT=document.getElementById("baruna-saas-app");
const SCREEN=document.body.dataset.saasScreen||"portfolio";
const LINKS=Object.freeze({
 home:"./index.html",workspaces:"./workspaces.html",
 semarang:"./workspace-semarang.html",areas:"./areas.html",
 area:"./area-tanjung-emas.html",catalog:"./data-catalog.html",
 advanced:"./real-workspace.html",subsidence:"./subsidence-evidence.html",
 evidence:"./evidence-brief-coaster.html",legacy:"./evidence-lab.html",
 aoi:"./aoi-registry.html",demo:"./workspace-demo.html",gnss:"./gnss-center.html"
});
const ASSETS=Object.freeze({
 qa:"./data/semarang-real-hyp3-insar-qa.json",
 historical:"./data/tanjung-emas-historical-field-evidence.json",
 readiness:"./data/semarang-real-readiness.json"
});
const DEMOS=Object.freeze({
 jakarta:{name:"Jakarta Coastal",city:"Jakarta",region:"DKI Jakarta"},
 surabaya:{name:"Surabaya Coastal",city:"Surabaya",region:"Jawa Timur"}
});
const ESC=Object.freeze({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"});
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>ESC[c]);
const fmt=value=>Number(value).toLocaleString("id-ID",{maximumFractionDigits:2});
const $=id=>document.getElementById(id);

function chip(text,type="neutral"){return '<span class="saas-chip'+(type==="neutral"?"":" saas-chip-"+type)+'">'+esc(text)+'</span>';}
function btn(text,url,primary=false){return '<a class="saas-btn'+(primary?" saas-btn-primary":"")+'" href="'+url+'">'+esc(text)+' <span aria-hidden="true">↗</span></a>';}
function navLink(text,url,glyph,active=false){return '<a href="'+url+'"'+(active?' aria-current="page"':'')+'><span class="nav-glyph" aria-hidden="true">'+glyph+'</span><span>'+esc(text)+'</span></a>';}
function renderShell(content,{title,crumbs="Overview"}={}){
 const platform=[["Overview",LINKS.home,"⌂","portfolio"],["Workspaces",LINKS.workspaces,"▣","workspaces"],["All Areas",LINKS.areas,"◇","areas"],["Multi-GNSS Center",LINKS.gnss,"◎","gnss"],["Data Catalog",LINKS.catalog,"▤","catalog"]];
 const nav=platform.map(([text,url,icon,screen])=>navLink(text,url,icon,
 SCREEN===screen||((SCREEN==="workspace"||SCREEN==="demo")&&screen==="workspaces")||(SCREEN==="area"&&screen==="areas"))).join("");
 ROOT.innerHTML=
 '<div class="saas-shell" id="saas-shell">'
 +'<div class="saas-drawer-backdrop" id="saas-nav-backdrop" hidden></div>'
 +'<aside class="saas-sidebar" id="saas-sidebar" aria-label="Navigasi utama">'
 +'<a class="saas-brand" href="'+LINKS.home+'"><span class="saas-brand-text"><strong>BARUNA</strong><small>SENTINEL · SPATIAL INTELLIGENCE</small></span></a>'
 +'<div class="saas-section-label">PLATFORM</div><nav class="saas-nav">'+nav+'</nav>'
 +'<div class="saas-divider"></div><div class="saas-section-label">RECENT</div><nav class="saas-recent" aria-label="Area dan workspace terbaru">'
 +'<a href="'+LINKS.semarang+'"><span aria-hidden="true">▣</span>Semarang Coastal</a>'
 +'<a href="'+LINKS.area+'"><span aria-hidden="true">⌖</span>Tanjung Emas</a></nav>'
 +'<div class="saas-divider"></div><div class="saas-section-label">RESEARCH &amp; REPORTS</div><nav class="saas-recent">'
 +'<a href="'+LINKS.advanced+'">Advanced GIS</a>'
 +'<a href="'+LINKS.subsidence+'">Subsidence Evidence</a>'
 +'<a href="'+LINKS.legacy+'?page=analyst">GNSS / Evidence Lab</a><a href="./spatial-demo.html#ranking">Scenario Lab · Simulated</a></nav>'
 +'<div class="saas-org"><a class="saas-org-brand" href="https://ourdo.id/" target="_blank" rel="noopener noreferrer" aria-label="Ourdo Indonesia official website"><span class="saas-org-credit">A PRODUCT BY</span><span class="saas-org-identity"><img src="./assets/ourdo-tail-curve-wordmark.svg" alt="Ourdo Indonesia" width="116" height="33"><small>INDONESIA</small></span></a></div>'
 +'</aside><div class="saas-main">'
 +'<header class="saas-topbar"><button class="saas-mobile-nav-toggle" id="saas-menu-toggle" type="button" aria-expanded="false" aria-controls="saas-sidebar" aria-label="Buka menu navigasi">☰</button>'
 +'<div class="saas-crumb"><a href="'+LINKS.home+'">BARUNA</a><span aria-hidden="true">/</span><strong>'+esc(crumbs)+'</strong></div>'
 +'<div class="saas-top-actions"><div class="saas-search"><label class="sr-only" for="saas-search-input">Cari area atau workspace</label>'
 +'<input id="saas-search-input" type="search" placeholder="Search workspaces or areas" autocomplete="off"><div class="saas-search-results" id="saas-search-results" hidden></div></div>'
 +'<span class="saas-preview-label" aria-label="Status aplikasi: research prototype">RESEARCH PREVIEW</span></div></header>'
 +'<main class="saas-content" id="main-content">'+content
 +'<footer class="saas-footer">BARUNA Sentinel · Source-backed research prototype · Not operational asset-safety certification</footer>'
 +'</main></div></div>';
 document.title=title+" | BARUNA Sentinel";
 bindCommon();
}
function bindCommon(){
 const shell=$("saas-shell"),toggle=$("saas-menu-toggle"),backdrop=$("saas-nav-backdrop");
 function setNav(open){
  shell.classList.toggle("nav-open",open);
  toggle.setAttribute("aria-expanded",String(open));
  toggle.setAttribute("aria-label",open?"Tutup menu navigasi":"Buka menu navigasi");
  backdrop.hidden=!open;
 }
 toggle.addEventListener("click",()=>setNav(!shell.classList.contains("nav-open")));
 backdrop.addEventListener("click",()=>setNav(false));
 document.addEventListener("keydown",ev=>{if(ev.key==="Escape"){setNav(false);if($("saas-search-results"))$("saas-search-results").hidden=true;}});
 const results=$("saas-search-results"),input=$("saas-search-input");
 const destinations=[
  {name:"Semarang Coastal",detail:"Real workspace · Jawa Tengah",url:LINKS.semarang},
  {name:"Tanjung Emas",detail:"Area Explorer · InSAR QA",url:LINKS.area},
  {name:"All Areas",detail:"Areas across workspaces",url:LINKS.areas},
  {name:"Multi-GNSS Center",detail:"CSEM · CSMG · BAKO evidence review",url:LINKS.gnss},
  {name:"Data Catalog",detail:"Source provenance and evidence",url:LINKS.catalog},
  {name:"Jakarta Coastal",detail:"Demo · No datasets",url:LINKS.demo+"?city=jakarta"},
  {name:"Surabaya Coastal",detail:"Demo · No datasets",url:LINKS.demo+"?city=surabaya"}
 ];
 input.addEventListener("input",()=>{
  const q=input.value.toLowerCase().trim();
  if(!q){results.hidden=true;results.innerHTML="";filterDirectory("");return;}
  const matches=destinations.filter(item=>(item.name+" "+item.detail).toLowerCase().includes(q));
  results.innerHTML=matches.length?matches.map(item=>'<a href="'+item.url+'"><strong>'+esc(item.name)+'</strong><small>'+esc(item.detail)+'</small></a>').join(""):"<p>Tidak ditemukan</p>";
  results.hidden=false;
  filterDirectory(q);
 });
 input.addEventListener("keydown",e=>{if(e.key==="Enter"){const a=results.querySelector("a");if(a){e.preventDefault();location.href=a.href;}}});
 document.addEventListener("click",e=>{if(!e.target.closest(".saas-search"))results.hidden=true;});
}
function filterDirectory(q){
 const rows=[...document.querySelectorAll("[data-searchable]")];let visible=0;
 for(const el of rows){const show=(el.dataset.searchable||"").toLowerCase().includes(q);el.hidden=!show;if(show)visible++;}
 const empty=$("saas-filter-empty");if(empty)empty.hidden=!q||visible>0;
}
function headline(title,subtitle,actions=""){
 return '<div class="saas-page-head"><div><span class="saas-eyebrow">BARUNA / SPATIAL INTELLIGENCE</span><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p></div>'
 +(actions?'<div class="saas-page-actions">'+actions+'</div>':"")+'</div>';
}
function metric(value,label,description,id=""){
 return '<article class="saas-metric"><div class="saas-metric-label">'+esc(label)+'</div><strong'+(id?' id="'+esc(id)+'"':"")+'>'+esc(value)+'</strong><small>'+esc(description)+'</small></article>';
}
function tile(kind){
 const real=kind==="semarang";
 const name=real?"Semarang Coastal":DEMOS[kind].name;
 const region=real?"Jawa Tengah · Indonesia":DEMOS[kind].region+" · Indonesia";
 const href=real?LINKS.semarang:LINKS.demo+"?city="+kind;
 return '<a class="workspace-tile" href="'+href+'" data-searchable="'+esc(name+" "+region)+'">'
 +'<div class="workspace-tile-media'+(real?"":" is-demo")+'"><span class="workspace-tile-media-label">'+(real?"SOURCE-BACKED · COASTAL STUDY":"DEMO WORKSPACE · NO DATA")+'</span></div>'
 +'<div class="workspace-tile-body"><div class="workspace-tile-head"><h3>'+esc(name)+'</h3>'+chip(real?"Active":"Demo",real?"active":"neutral")+'</div>'
 +'<div class="saas-hint">'+esc(region)+'</div><p>'+(real?"Sentinel-2 optical imagery, real HyP3 QA and published field evidence.":"Placeholder for navigation only. No AOI, processed scenes or analysis.")+'</p>'
 +'<div class="workspace-tile-foot"><span>'+(real?"Open workspace":"View empty workspace")+'</span><span aria-hidden="true">→</span></div></div></a>';
}
function portfolio(){
 const html=
 '<section class="portfolio-intro"><div><span class="saas-eyebrow">BARUNA SENTINEL / PORTFOLIO</span>'
 +'<h1>Your spatial portfolio</h1>'
 +'<p>Manage spatial workspaces, explore areas and trace evidence before running analysis. Semarang is the only real source-backed workspace in this prototype.</p>'
 +'</div>'+btn("Open Semarang Coastal",LINKS.semarang,true)+'</section>'
 +'<section class="portfolio-metrics" aria-label="Portfolio summary">'
 +metric("3","Workspaces","1 active · 2 demo placeholders")
 +metric("1","Real study area","Semarang Coastal · Tanjung Emas")
 +metric("2","GNSS evidence streams","CSEM historic positions · BAKO QC")
 +metric("1","Processed InSAR pair","ASF HyP3 · QA only")
 +'</section>'
 +'<section class="saas-gnss-feature"><div><span class="saas-eyebrow">MULTI-GNSS / PRIMARY EVIDENCE</span><h2>Station evidence before asset risk</h2><p>CSEM 2010–2021 position history, independent BAKO 2025 multi-constellation QC, and CSMG site-log context. Review source quality, processing gaps and next checks before any deformation conclusion.</p></div><a class="saas-btn saas-btn-primary" href="./gnss-center.html">Open Multi-GNSS Center →</a></section>'
 +'<section class="saas-section-head"><h2 class="saas-section-title">Workspaces</h2><a class="saas-link" href="'+LINKS.workspaces+'">View all workspaces →</a></section>'
 +'<section class="workspace-tiles">'+["semarang","jakarta","surabaya"].map(tile).join("")+'</section>'
 +'<div class="saas-portfolio-lower"><section class="saas-card"><div class="saas-card-section"><div class="saas-card-head"><div><h2>Recent areas</h2><p>Direct access without reopening a workspace.</p></div><a class="saas-link" href="'+LINKS.areas+'">All areas →</a></div></div>'
 +'<a class="saas-recent-row" href="'+LINKS.area+'"><span><strong>Tanjung Emas</strong><small>Semarang Coastal · Coastal study area / source-backed</small></span>'+chip("Evidence review","warn")+' <span aria-hidden="true">→</span></a>'
 +'</section><section class="saas-card saas-card-section"><div class="saas-card-head"><div><h2>Evidence readiness</h2><p>Different sources are not interchangeable.</p></div></div>'
 +'<ul class="saas-fact-list"><li><span class="fact-key">Sentinel-2 natural RGB</span>'+chip("Verified display","active")+'</li>'
 +'<li><span class="fact-key">Sentinel-1 HyP3</span>'+chip("QA only","blue")+'</li>'
 +'<li><span class="fact-key">Current vertical subsidence</span>'+chip("Not validated","warn")+'</li></ul>'
 +'<a class="saas-link" href="'+LINKS.area+'#intelligence">Review evidence gates →</a></section></div>'
 +'<div class="saas-cta-strip"><div><strong>Need the existing technical workflow?</strong><p>Original research modules remain accessible, including GNSS, source raster previews and Evidence Brief.</p></div>'+btn("Open Evidence Lab",LINKS.legacy)+'</div>';
 renderShell(html,{title:"Portfolio Overview",crumbs:"Portfolio / Overview"});
}
function workspaces(){
 const rows=[
  ["Semarang Coastal","Jawa Tengah, Indonesia","1 real study area","Sentinel-1 / Sentinel-2 / DEM / Field","Active",LINKS.semarang],
  ["Jakarta Coastal","DKI Jakarta, Indonesia","No registered AOI","No datasets","Demo",LINKS.demo+"?city=jakarta"],
  ["Surabaya Coastal","Jawa Timur, Indonesia","No registered AOI","No datasets","Demo",LINKS.demo+"?city=surabaya"]
 ];
 const table='<div class="directory-panel"><div class="directory-toolbar"><strong>3 workspaces</strong><span class="saas-hint">Only one contains verified evidence.</span></div><div class="saas-table-scroll"><table class="data-table"><thead><tr><th>Workspace</th><th>Study areas</th><th>Data sources</th><th>Status</th><th></th></tr></thead><tbody>'
 +rows.map(row=>'<tr data-searchable="'+esc(row.join(" "))+'"><td><a class="table-primary" href="'+row[5]+'">'+esc(row[0])+'</a><span class="sub">'+esc(row[1])+'</span></td><td>'+esc(row[2])+'</td><td>'+esc(row[3])+'</td><td>'+chip(row[4],row[4]==="Active"?"active":"neutral")+'</td><td><a class="saas-link" href="'+row[5]+'">Open →</a></td></tr>').join("")
 +'</tbody></table></div><div class="directory-notice">Demo workspaces are intentionally empty. They are not satellite analyses of Jakarta or Surabaya.</div></div>'
 +'<div class="saas-empty" id="saas-filter-empty" hidden>Tidak ada workspace sesuai pencarian.</div>';
 renderShell(headline("Workspaces","Organize monitoring work by client, location, or operational objective. Demo entries let us validate the SaaS structure without inventing datasets.",btn("Browse All Areas",LINKS.areas))+table,
 {title:"Workspaces",crumbs:"Workspaces"});
}
function workspace(){
 const html=
 '<div class="saas-page-head"><div><span class="saas-eyebrow">WORKSPACES / CENTRAL JAVA</span><h1>Semarang Coastal '+chip("Active","active")+'</h1><p>Coastal geospatial evidence workspace for the Semarang study AOI. Only evidence with traceable provenance may appear as verified data.</p></div><div class="saas-page-actions">'+btn("Open Area Explorer",LINKS.area,true)+'</div></div>'
 +'<div class="workspace-top"><section class="workspace-banner"><div><span class="saas-eyebrow">SOURCE-BACKED STUDY</span><h2>Semarang Coastal</h2><p>Semarang, Jawa Tengah · Indonesia</p></div>'
 +'<p>Sentinel-2 optical context · ASF HyP3 radar quality · published historical field observations</p></section>'
 +'<section class="saas-card workspace-summary"><h3>Workspace summary</h3>'
 +'<ul class="saas-fact-list"><li><span class="fact-key">Accessible study areas</span><span class="fact-value">1</span></li>'
 +'<li><span class="fact-key">Latest evidence snapshot</span><span class="fact-value">17 Nov 2026</span></li>'
 +'<li><span class="fact-key">HyP3 processed pair</span><span class="fact-value">2–14 Oct 2026</span></li>'
 +'<li><span class="fact-key">Current subsidence mm/year</span><span class="fact-value">Unavailable</span></li></ul></section></div>'
 +'<section class="saas-card"><div class="saas-card-section"><div class="saas-card-head"><div><h2>Areas in this workspace</h2><p>Open the area to review data, timeline and intelligence.</p></div><a class="saas-link" href="'+LINKS.areas+'">All Areas →</a></div></div>'
 +'<a class="saas-recent-row" href="'+LINKS.area+'"><span><strong>Tanjung Emas</strong><small>Semarang Coastal · study AOI and BIG reference locator, not surveyed asset polygons</small></span>'+chip("Evidence available","active")+' <span aria-hidden="true">→</span></a>'
 +'</section>'
 +'<div class="saas-cta-strip section-space"><div><strong>Multi-GNSS evidence is the primary technical workflow.</strong><p>Inspect CSEM / CSMG readiness and independent BAKO QC before interpreting regional or asset-level movement.</p></div>'+btn("Multi-GNSS Center",LINKS.gnss,true)+'</div>'
 +'<div class="saas-portfolio-lower section-space"><section class="saas-card saas-card-section"><div class="saas-card-head"><div><h2>Source coverage</h2><p>Actual source types in this project.</p></div></div>'
 +'<div class="workspace-pills">'+chip("Sentinel-2 RGB","active")+chip("Optical NDWI/MNDWI","blue")+chip("Sentinel-1 HyP3 QA","blue")+chip("Copernicus DEM","active")+chip("Historical levelling","blue")+'</div>'
 +'<p class="saas-hint">Source availability does not imply confirmed subsidence, rob, or structural risk.</p><a class="saas-link" href="'+LINKS.catalog+'">Review data catalog →</a></section>'
 +'<section class="saas-card saas-card-section"><div class="saas-card-head"><div><h2>Evidence outputs</h2></div></div>'
 +'<ul class="saas-fact-list"><li><span>HyP3 quality evidence</span><a class="saas-link" href="'+LINKS.area+'#intelligence">Intelligence →</a></li>'
 +'<li><span>Historical sector measurements</span><a class="saas-link" href="'+LINKS.subsidence+'">Subsidence Evidence →</a></li>'
 +'<li><span>GNSS and field verification</span><a class="saas-link" href="'+LINKS.legacy+'?page=analyst">Evidence Lab →</a></li></ul></section></div>';
 renderShell(html,{title:"Semarang Coastal",crumbs:"Workspaces / Semarang Coastal"});
}
function demo(){
 const key=new URLSearchParams(location.search).get("city");
 const demo=DEMOS[key]||null;
 if(!demo){location.replace(LINKS.workspaces);return;}
 const html=headline(demo.name,"Demonstration workspace only. This page exists to prove the multi-workspace navigation and empty-state UX.",btn("All Workspaces",LINKS.workspaces))
 +'<div class="workspace-top"><section class="workspace-banner" style="background:#506983"><div><span class="saas-eyebrow" style="color:#cfe1f1">DEMO / NO DATA</span><h2>'+esc(demo.name)+'</h2><p>'+esc(demo.region)+', Indonesia</p></div><p>Not activated · No study AOI registered</p></section>'
 +'<section class="saas-card workspace-summary"><h3>Workspace state</h3><ul class="saas-fact-list">'
 +'<li><span class="fact-key">Status</span>'+chip("Demo")+'</li><li><span class="fact-key">Real scenes</span><strong>None</strong></li>'
 +'<li><span class="fact-key">Study areas</span><strong>None</strong></li><li><span class="fact-key">Intelligence</span><strong>Not available</strong></li></ul></section></div>'
 +'<div class="saas-empty"><strong>No areas or datasets yet</strong><p>This workspace is intentionally a placeholder. Real imagery, subsidence numbers, events and analysis will only be displayed after verified sources are registered.</p></div>'
 +'<div class="saas-cta-strip"><div><strong>See a source-backed example</strong><p>Semarang Coastal has real satellite evidence, published field context and a gated area intelligence view.</p></div>'+btn("Open Semarang",LINKS.semarang,true)+'</div>';
 renderShell(html,{title:demo.name+" (Demo)",crumbs:"Workspaces / "+demo.name});
}
function areas(){
 const html=headline("All Areas","Browse monitored study areas across all accessible workspaces. Only Tanjung Emas currently has traceable source evidence.",btn("Open Semarang Coastal",LINKS.semarang))
 +'<section class="directory-panel"><div class="directory-toolbar"><strong>1 real area · 2 demo workspaces without areas</strong><span class="saas-hint">Area = reusable geographic study object; Workspace = access and operational context</span></div>'
 +'<div class="saas-table-scroll"><table class="data-table"><thead><tr><th>Area</th><th>Workspace</th><th>Evidence coverage</th><th>Current subsidence</th><th></th></tr></thead><tbody>'
 +'<tr data-searchable="tanjung emas semarang coastal real evidence"><td><a class="table-primary" href="'+LINKS.area+'">Tanjung Emas</a><span class="sub">Semarang · study area / port reference</span></td>'
 +'<td><a href="'+LINKS.semarang+'" class="saas-link">Semarang Coastal</a></td><td>'+chip("Sentinel / field","active")+'</td><td>'+chip("Not validated","warn")+'</td><td><a href="'+LINKS.area+'" class="saas-link">Explore →</a></td></tr>'
 +'</tbody></table></div><div class="directory-notice">Jakarta and Surabaya demo workspaces have no registered areas or synthetic monitoring observations.</div></section>'
 +'<div class="saas-empty section-space" id="saas-filter-empty" hidden>Tidak ada area sesuai pencarian.</div>';
 renderShell(html,{title:"All Areas",crumbs:"All Areas"});
}
const DATA_CATALOG=[
 {name:"Sentinel-2 true color RGB",source:"Copernicus Sentinel-2 L2A · 14 Oct 2026",status:"Real source pixels",type:"active",use:"Geospatial context only; not a rob or deformation indicator"},
 {name:"Sentinel-2 optical indices",source:"Earth Search · 14 and 21 Oct 2026",status:"Verified exploratory preview",type:"blue",use:"NDWI / MNDWI comparison; not confirmed flood extent"},
 {name:"Sentinel-1 HyP3 InSAR",source:"ASF HyP3 · 2–14 Oct 2026",status:"Processed QA only",type:"blue",use:"Coherence, phase masks; no validated displacement mm/year"},
 {name:"Copernicus DEM GLO-30",source:"Copernicus elevation grid",status:"Real pixels",type:"active",use:"Surface context; not ground movement or water depth"},
 {name:"Tanjung Emas field levelling",source:"Raharjo & Yosi · reported 2005",status:"Historical research",type:"blue",use:"Cumulative settlement in 6 sectors; no georeferenced sector boundaries"},
 {name:"GNSS CSEM historical positions",source:"Zenodo 7775016 · 2010–2021",status:"Historical GPS-derived positions",type:"blue",use:"3561 source-derived daily epochs; not current position solution for port assets"},
 {name:"BAKO independent Multi-GNSS QC",source:"IGS BAKO · 1 Jan 2025 · 20 min",status:"Verified RINEX observation QC",type:"active",use:"41 epochs and six constellations; NOT positioning accuracy or Semarang movement"},
 {name:"CSMG Ina-CORS site log",source:"BIG SRGI Semarang Genuk · station metadata",status:"Paired observation QC not publicly loaded",type:"warn",use:"No numeric CSMG station-day records are published in this prototype"},
 {name:"Current asset vertical subsidence",source:"Not acquired or validated",status:"Missing",type:"warn",use:"Requires multi-temporal InSAR, stable reference, GNSS and surveyed geometries"}
];
function catalog(){
 const html=headline("Data Catalog","Review each source independently, with its timestamp, readiness and permitted interpretation.",btn("Area Evidence",LINKS.area+"#data"))
 +'<section class="directory-panel"><div class="directory-toolbar"><strong>Source inventory</strong><span class="saas-hint">As of 17 November 2026 · No live monitoring promise</span></div>'
 +'<div class="saas-table-scroll"><table class="data-table"><thead><tr><th>Source</th><th>Acquisition / provenance</th><th>Readiness</th><th>Permitted use</th></tr></thead><tbody>'
 +DATA_CATALOG.map(d=>'<tr data-searchable="'+esc(d.name+" "+d.source+" "+d.status)+'"><td><strong>'+esc(d.name)+'</strong></td><td>'+esc(d.source)+'</td><td>'+chip(d.status,d.type)+'</td><td>'+esc(d.use)+'</td></tr>').join("")
 +'</tbody></table></div><div class="directory-notice">Published regional maximum subsidence from literature is separate from verified current point displacement. No current rate is attributed to Tanjung Emas assets.</div></section>'
 +'<div class="saas-empty section-space" id="saas-filter-empty" hidden>Tidak ada sumber data sesuai pencarian.</div>'
 +'<div class="saas-cta-strip"><div><strong>Need provenance at the pixel level?</strong><p>Open the existing technical GIS workspace and source evidence manifest for detailed QA.</p></div>'+btn("Advanced GIS",LINKS.advanced,true)+'</div>';
 renderShell(html,{title:"Data Catalog",crumbs:"Data Catalog"});
}

function areaTab(name,title){return '<a href="#'+name+'" role="tab" aria-controls="panel-'+name+'" id="tab-'+name+'" data-area-tab="'+name+'">'+esc(title)+'</a>';}
function fieldRow(k,v,sub=""){return '<div class="area-stat-row"><dt>'+esc(k)+'</dt><dd>'+esc(v)+(sub?'<small>'+esc(sub)+'</small>':"")+'</dd></div>';}
function sourceCard(label,subtitle,status,kind,body,link,href){
 return '<article class="saas-card dataset-card"><div>'+chip(status,kind)+'</div><h3>'+esc(label)+'</h3><p>'+esc(subtitle)+'</p><div class="saas-hint">'+esc(body)+'</div>'
 +'<a class="saas-link" href="'+href+'">'+esc(link)+' →</a></article>';
}
function area(){
 const html=
 '<div class="area-topline"><div><span class="saas-eyebrow">WORKSPACES / SEMARANG COASTAL / AREA</span><h1>Tanjung Emas</h1><p class="saas-hint">Geographic study area · Semarang, Central Java · Evidence snapshot 17 November 2026</p></div>'
 +'<div class="saas-page-actions">'+chip("Source-backed research","active")+btn("Advanced GIS",LINKS.advanced)+'</div></div>'
 +'<nav class="area-tabs" role="tablist" aria-label="Area Detail sections">'
 +[["explorer","Explorer"],["data","Data & Sources"],["timeline","Timeline"],["intelligence","Intelligence"],["reports","Reports"]].map(([a,b])=>areaTab(a,b)).join("")+'</nav>'
 +'<div class="area-detail-panels">'
 +'<section class="saas-panel" id="panel-explorer" role="tabpanel" aria-labelledby="tab-explorer">'
 +'<div class="area-grid"><aside class="area-sidebar"><h2>Data Layers</h2>'
 +'<div class="area-layer-title">BASE MAP</div><div class="area-layer-list">'
 +'<label class="layer-radio"><input type="radio" name="basemap" id="basemap-satellite" value="satellite" disabled><span>Sentinel-2 true color<small>14 Oct 2026 · source-derived RGB</small></span></label>'
 +'<label class="layer-radio"><input type="radio" name="basemap" id="basemap-street" value="street" checked><span>Street map<small>OpenStreetMap context</small></span></label></div>'
 +'<div class="area-layer-title">STUDY OVERLAYS</div><div class="area-layer-list">'
 +'<label class="layer-check"><input type="checkbox" id="toggle-study-aoi" checked><span>Study AOI<small>Research coverage, not asset boundary</small></span></label>'
 +'<label class="layer-check"><input type="checkbox" id="toggle-port-reference" checked><span>BIG port locator<small>Map reference · phase NoData</small></span></label>'
 +'<label class="layer-check"><input type="checkbox" disabled><span>InSAR displacement<small>Not verified · no raster overlay</small></span></label></div>'
 +'<div class="area-layer-title">DISPLAY OPTIONS</div><div id="satellite-opacity-control" hidden><label class="saas-hint" for="satellite-opacity">RGB opacity <strong id="satellite-opacity-value">90%</strong></label><input id="satellite-opacity" type="range" min="30" max="100" step="5" value="90" style="width:100%;accent-color:#1b62a5"></div>'
 +'<div class="saas-sep"></div><a class="saas-link" href="'+LINKS.advanced+'">Advanced raster analysis →</a></aside>'
 +'<div class="area-map-wrap"><div id="area-map" class="area-map" aria-label="Interactive map with real Sentinel-2 imagery and study AOI"></div>'
 +'<div class="map-floating-controls"><button id="reset-area-map" type="button">Reset extent</button></div>'
 +'<div class="map-source-caption" id="satellite-source-note">Memuat peta sumber nyata...</div></div>'
 +'<aside class="area-inspector"><h2>Area Inspector</h2><dl class="area-stat-rows">'
 +fieldRow("Workspace","Semarang Coastal")
 +fieldRow("Area type","Research study AOI","Not surveyed port asset")
 +fieldRow("Sentinel-2","True color available","14 Oct 2026 · display")
 +fieldRow("Sentinel-1","HyP3 QA available","2–14 Oct 2026")
 +fieldRow("Multi-GNSS","Source review","CSEM historical · BAKO QC; no common solution")
 +fieldRow("Current subsidence","Not verified","No annual mm/year")
 +'</dl><div class="saas-note is-warning">Quality gate: The BIG port locator is not an asset survey point. Unwrapped phase at the locator is NoData. Do not infer port deformation or asset risk.</div>'
 +'<div style="margin-top:15px"><a class="saas-link" href="#intelligence" id="inspect-intelligence-link">Review intelligence →</a></div></aside></div>'
 +'<div class="saas-note section-space">Natural RGB is a verified Sentinel-2 display preview, not Google Maps imagery. The AOI is a study envelope, not the surveyed geometry of individual port facilities. InSAR QA has no velocity raster overlay.</div></section>'
 +'<section class="saas-panel" id="panel-data" role="tabpanel" aria-labelledby="tab-data">'
 +headline("Data & Sources","Data source, time range, validation state, and limitations are always visible together.")
 +'<div class="area-dataset-grid">'
 +sourceCard("Sentinel-2 natural RGB","14 Oct 2026 · Sentinel-2 L2A","Verified pixels","active","True color context; no subsidence or flood confirmation","View GIS layer",LINKS.area+"#explorer")
 +sourceCard("Sentinel-1 ASF HyP3","2–14 Oct 2026 · 80 m VV","Quality screening","blue","Coherence and phase masks; no validated displacement rate","QA manifest","./data/semarang-real-hyp3-insar-qa.json")
 +sourceCard("Historical field levelling","2005 observations · published 2017","Historical","blue","Six sectors and cumulative settlement ranges; no exact sector polygons","Study evidence",LINKS.subsidence)
 +sourceCard("Copernicus DEM","GLO-30 · quantized preview","Real display pixels","active","Surface height context, not land sinking or flood depth","Advanced GIS",LINKS.advanced)
 +sourceCard("GNSS station series","CSEM historic positions + BAKO independent QC","Separate station","blue","Multi-GNSS sources require aligned station observations, a common reference frame and independent validation. No asset rate inferred.","Multi-GNSS Center",LINKS.gnss)
 +sourceCard("Current port velocity","Multi-temporal InSAR + local reference","Not validated","warn","No asset-level vertical rate or validated time series has been imported","Evidence gate",LINKS.area+"#intelligence")
 +'</div></section>'
 +'<section class="saas-panel" id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline">'
 +headline("Evidence Timeline","Chronology of source acquisitions and published observations. A data acquisition is not a confirmed hazardous event.")
 +'<section class="saas-card saas-card-section"><div class="timeline">'
 +'<div class="timeline-item"><time>17 NOVEMBER 2026</time><h3>BARUNA evidence snapshot</h3><p>Registry of verified display sources, historical context and HyP3 quality gates. Not live monitoring.</p></div>'
 +'<div class="timeline-item"><time>21 OCTOBER 2026</time><h3>Second optical acquisition</h3><p>Sentinel-2 optical index preview comparison with 14 October. Difference in indices does not establish flooding extent.</p></div>'
 +'<div class="timeline-item"><time>14 OCTOBER 2026</time><h3>Sentinel-2 RGB and radar secondary scene</h3><p>Real Sentinel-2 true-color source display and Sentinel-1 HyP3 pair secondary date. Not a measured subsidence event.</p></div>'
 +'<div class="timeline-item"><time>02 OCTOBER 2026</time><h3>Sentinel-1 HyP3 reference scene</h3><p>Start of one 12-day interferogram. Coherence and phase QA only.</p></div>'
 +'<div class="timeline-item"><time>2005 (REPORTED)</time><h3>Tanjung Emas field levelling</h3><p>Historical cumulative settlement for six sectors, subsequently published in 2017. Current asset state remains unknown.</p></div>'
 +'</div></section></section>'
 +'<section class="saas-panel" id="panel-intelligence" role="tabpanel" aria-labelledby="tab-intelligence">'
 +headline("Evidence Intelligence","Review what the data supports, where it fails, and which verification to request next.",btn("Source evidence",LINKS.subsidence))
 +'<div class="intel-tabs" role="tablist" aria-label="Intelligence views"><button type="button" data-intel-tab="findings" role="tab" aria-controls="intel-findings" aria-selected="true">Findings</button><button type="button" data-intel-tab="gate" role="tab" aria-controls="intel-gate" aria-selected="false">Evidence Gate</button><button type="button" data-intel-tab="ranking" role="tab" aria-controls="intel-ranking" aria-selected="false">Ranking &amp; Compare</button></div>'
 +'<div class="intel-panel" id="intel-findings" role="tabpanel">'
 +'<div class="area-insight-grid">'
 +'<article class="saas-card area-evidence-card"><span class="saas-eyebrow">MULTI-GNSS / EVIDENCE QUALITY</span><h3>CSEM, CSMG &amp; BAKO sources</h3><strong class="area-evidence-value" id="int-gnss-status">Checking...</strong><p>Historic station positions and independent multi-constellation RINEX QC are available. A common CSEM/CSMG geodetic solution is not.</p><div class="area-evidence-footer"><a class="saas-link" href="./gnss-center.html">Open station evidence &amp; priorities →</a></div></article>'
 +'<article class="saas-card area-evidence-card"><span class="saas-eyebrow">RADAR / SOURCE QUALITY</span><h3>ASF HyP3 coherence screening</h3>'
 +'<strong class="area-evidence-value" id="int-qa-share">Loading...</strong><p id="int-qa-denominator">Checking real QA manifest and data gates.</p>'
 +'<div class="area-evidence-footer">'+chip("Processed product","active")+chip("Quality ≠ movement","blue")+'</div></article>'
 +'<article class="saas-card area-evidence-card"><span class="saas-eyebrow">TANJUNG EMAS / PORT LOCATOR</span><h3>Radar signal at BIG reference point</h3>'
 +'<strong class="area-evidence-value" id="int-port-coherence">Loading...</strong><p id="int-port-explanation">Port QA details and mask status.</p>'
 +'<div class="area-evidence-footer">'+chip("Phase NoData","warn")+chip("Insufficient evidence","warn")+'</div></article>'
 +'<article class="saas-card area-evidence-card"><span class="saas-eyebrow">PUBLISHED FIELD HISTORY</span><h3>Historical sectors from 2005</h3>'
 +'<strong class="area-evidence-value" id="int-historical-sectors">Loading...</strong><p>Published levelling measurements are cumulative centimeters; not current annual mm/year or mapped asset locations.</p>'
 +'<div class="area-evidence-footer"><a class="saas-link" href="'+LINKS.subsidence+'">Compare six published sectors →</a></div></article>'
 +'<article class="saas-card area-evidence-card"><span class="saas-eyebrow">VERTICAL LAND SUBSIDENCE</span><h3>Port asset movement in 2026</h3>'
 +'<strong class="area-evidence-value is-no-data">Not validated</strong><p>No multi-temporal annual vertical rate or reference-stable port asset displacement has been verified.</p>'
 +'<div class="area-chart-placeholder">No scientific time-series chart shown.<br>Validated observations are required before plotting movement.</div></article></div>'
 +'</div><div class="intel-panel" id="intel-gate" role="tabpanel" hidden>'
 +'<div class="saas-card saas-card-section"><div class="saas-card-head"><div><h2>Decision gate &amp; recommended action</h2><p>Operational conclusions are blocked until missing evidence is independently checked.</p></div>'+chip("Data insufficient","warn")+'</div>'
 +'<div class="saas-note">Multi-GNSS first: verify matched CSEM / CSMG observations, reference frame, time alignment and uncertainty. BAKO pseudorange QC does not verify Semarang displacement. <a href="./gnss-center.html" class="saas-link">Review GNSS evidence priority →</a></div>'
 +'<div class="science-step-grid section-space"><div class="science-step"><span class="science-step-index">01 / GEOMETRY</span><strong>Confirm surveyed assets</strong><p>Request official asset polygons and reference coordinates from the port operator.</p></div>'
 +'<div class="science-step"><span class="science-step-index">02 / DISPLACEMENT</span><strong>Validate multi-date InSAR</strong><p>Obtain time series, stable reference, uncertainty and atmospheric correction.</p></div>'
 +'<div class="science-step"><span class="science-step-index">03 / INDEPENDENCE</span><strong>Cross-check GNSS / levelling</strong><p>Verify representativeness, datum and time-matched measurements before asset decisions.</p></div></div></div>'
 +'</div><div class="intel-panel" id="intel-ranking" role="tabpanel" hidden>'
 +'<div class="intel-gnss-priority saas-card saas-card-section"><div class="saas-card-head"><div><h2>Evidence Review Priority · Multi-GNSS</h2><p>Dependency queue derived from verifiable GNSS source gaps; step order is not asset severity or station performance.</p></div><a class="saas-link" href="./gnss-center.html#evidence-priority">Open GNSS Center →</a></div><div id="intel-gnss-review" role="status">Validating CSEM and BAKO evidence…</div></div>'
 +'<div class="saas-note is-warning section-space"><strong>Operational Ranking · NOT AVAILABLE.</strong> Six published historical sectors are source-backed, but have no verified asset geometries or current vertical deformation. These sectors cannot be ordered by risk, movement or inspection priority.</div>'
 +'<div class="intel-ranking-header"><div><span class="saas-eyebrow">AREA INTELLIGENCE / COMPARABILITY</span><h2>Ranking &amp; Compare</h2><p>Current asset-level ranking is blocked by the Evidence Gate. Historical ranges are displayed for traceability, not as ranking criteria.</p></div><span class="saas-chip saas-chip-warn" id="intel-ranking-status">Verifying sources...</span></div>'
 +'<div class="directory-panel"><div class="saas-table-scroll"><table class="data-table intel-ranking-table"><thead><tr><th>Historical sector</th><th>Reported cumulative settlement (2005)</th><th>Current vertical rate</th><th>Operational ranking</th></tr></thead><tbody id="intel-ranking-rows"><tr><td colspan="4">Validating source evidence...</td></tr></tbody></table></div><div class="directory-notice" id="intel-ranking-provenance">Published levelling is not a 2026 ranking input. Asset coordinates and representative movement measurements are missing.</div></div>'
 +'<div class="saas-gnss-feature section-space"><div><span class="saas-eyebrow">PRIORITY / NOT AN ASSET RISK SCORE</span><h2>Evidence Review Priority</h2><p>Prioritize GNSS data completeness, aligned geodetic processing, and representative verification. These are workflow steps, not a numeric severity rank of the port sectors.</p></div><a class="saas-btn saas-btn-primary" href="./gnss-center.html#evidence-priority">Review GNSS queue →</a></div>'
 +'<div class="saas-cta-strip"><div><strong>Need to demonstrate how ranking would work?</strong><p>Open a strictly separated, four-asset synthetic Scenario Lab. Synthetic mm/year and scores are not observations of Tanjung Emas.</p></div><a class="saas-btn" href="./spatial-demo.html#ranking">Scenario Lab · Simulated ↗</a></div>'
 +'</div></section>'
 +'<section class="saas-panel" id="panel-reports" role="tabpanel" aria-labelledby="tab-reports">'
 +headline("Reports & Evidence","Existing scientific evidence briefs remain available without being replaced by fictitious risk scores.")
 +'<section class="saas-card">'
 +'<div class="report-action"><div><h3>Real-data exploratory Evidence Brief</h3><p>Draw an AOI, inspect DSM/optical and HyP3 source gates, then export source-traceable JSON.</p></div>'+btn("Advanced GIS",LINKS.advanced,true)+'</div>'
 +'<div class="report-action"><div><h3>Subsidence Evidence Atlas</h3><p>Compare historical levelling, published regional study and 2026 HyP3 QA as separate scientific sources.</p></div>'+btn("Open Atlas",LINKS.subsidence)+'</div>'
 +'<div class="report-action"><div><h3>Coaster Street Verification Brief</h3><p>Published historical case, not a current asset health certificate.</p></div>'+btn("Read Brief",LINKS.evidence)+'</div>'
 +'<div class="report-action"><div><h3>GNSS research analyst</h3><p>Original evidence lab for independent station observations and provenance review.</p></div>'+btn("Open GNSS Lab",LINKS.legacy+"?page=analyst")+'</div>'
 +'</section></section></div>';
 renderShell(html,{title:"Tanjung Emas Area",crumbs:"Semarang Coastal / Tanjung Emas"});
 bindAreaTabs();
 bindIntelligenceTabs();
 bootAreaSources();
 void bootAreaGnssPriority();
 bootAreaMap();
}
function bindAreaTabs(){
 const allowed=new Set(["explorer","data","timeline","intelligence","reports"]);
 const activate=()=>{
  const value=location.hash.slice(1);const current=allowed.has(value)?value:"explorer";
  for(const name of allowed){
   const link=$("tab-"+name),panel=$("panel-"+name);
   const yes=name===current;link.classList.toggle("active",yes);
   if(yes)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
   link.setAttribute("aria-selected",String(yes));panel.classList.toggle("is-active",yes);
   panel.hidden=!yes;
  }
  if(current==="explorer")window.setTimeout(()=>window.__barunaAreaMap?.invalidateSize(),50);
 };
 window.addEventListener("hashchange",activate);activate();
}
function bindIntelligenceTabs(){
 const allowed=new Set(["findings","gate","ranking"]);
 const params=new URLSearchParams(location.search);
 const initial=allowed.has(params.get("intel"))?params.get("intel"):"findings";
 function activate(name,updateUrl){
  for(const button of document.querySelectorAll("[data-intel-tab]")){
   const active=button.dataset.intelTab===name;
   button.setAttribute("aria-selected",String(active));
   button.classList.toggle("active",active);
   const panel=$("intel-"+button.dataset.intelTab);
   if(panel)panel.hidden=!active;
  }
  if(updateUrl){
   const next=new URL(location.href);next.searchParams.set("intel",name);
   history.replaceState(null,"",next.pathname+next.search+"#intelligence");
  }
 }
 for(const button of document.querySelectorAll("[data-intel-tab]"))button.addEventListener("click",()=>activate(button.dataset.intelTab,true));
 activate(initial,false);
}
async function bootAreaSources(){
 const label=(id,text)=>{const node=$(id);if(node)node.textContent=text;};
 try{
  const resp=await Promise.all(Object.values(ASSETS).map(uri=>fetch(uri,{cache:"no-store"})));
  if(resp.some(r=>!r.ok))throw Error("Required source manifest missing");
  const [qa,history,readiness]=await Promise.all(resp.map(r=>r.json()));
  validateRealInsarQa(qa);validateHistoricalFieldEvidence(history);
  if(readiness?.schema!=="baruna-real-evidence-readiness-v1"||readiness.modelGate?.realInsar!==false)throw Error("Invalid science gates");
  label("int-qa-share",fmt(qa.studyArea.candidateShareOfValidLandPct)+"% qualified");
  label("int-qa-denominator",fmt(qa.studyArea.candidatePixelsCoherenceAtLeast07)+" of "+fmt(qa.studyArea.landWithValidUnwrappedPhaseAndCoherence)+" valid-land phase pixels meet coherence ≥ 0.7. Not an accuracy score.");
  label("int-port-coherence",fmt(qa.portLocator.coherence)+" coherence");
  label("int-port-explanation",qa.portLocator.qualified500m+" / "+qa.portLocator.gridPixels500m+" pixels qualified within 500 m. Phase is NoData/water-masked at the BIG map reference; no verified annual displacement.");
  label("int-historical-sectors",history.sectors.length+" sectors");
  const ranking=buildRankingReadiness(history,qa,readiness);
  label("intel-ranking-status",ranking.rankedAssetCount+" eligible · ranking unavailable");
  $("intel-ranking-rows").innerHTML=ranking.sectors.map(s=>
   '<tr><td><strong>'+esc(s.name)+'</strong><span class="sub">'+esc(s.type)+'</span></td>'+
   '<td>'+fmt(s.historicalCumulativeCmRange[0])+'–'+fmt(s.historicalCumulativeCmRange[1])+' cm <span class="sub">Historical cumulative · 2005</span></td>'+
   '<td>— <span class="sub">No validated 2026 rate</span></td><td>'+chip("Not ranked","warn")+'</td></tr>').join("");
  label("intel-ranking-provenance",ranking.candidateCount+" historical research sectors · no operator-surveyed geometry, time-matched validated velocity, or approved risk policy. 0 eligible for operational ranking.");
  document.body.dataset.saasEvidence="ready";
 }catch(error){
  for(const id of ["int-qa-share","int-port-coherence","int-historical-sectors"])label(id,"Unavailable");
  label("intel-ranking-status","Source unavailable · ranking blocked");
  $("intel-ranking-rows").innerHTML='<tr><td colspan="4">Source integrity check failed. Ranking disabled.</td></tr>';
  label("int-qa-denominator","The source manifest failed validation. No quality metrics are reported.");
  label("int-port-explanation","The source manifest failed validation. No port condition is inferred.");
  document.body.dataset.saasEvidence="unavailable";
 }
}
function bootAreaMap(){
 const mapTarget=$("area-map");
 if(!mapTarget||!window.L){if(mapTarget){mapTarget.classList.add("map-map-fallback");mapTarget.textContent="Peta interaktif tidak tersedia; sumber evidence tetap bisa ditinjau melalui tab Data & Sources.";}return;}
 const L=window.L;
 try{
  const aoi=[[ -7.025,110.375],[-6.875,110.485]];
  const map=L.map(mapTarget,{zoomControl:false,preferCanvas:true,minZoom:8,maxZoom:18});
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',maxZoom:19,crossOrigin:true}).addTo(map);
  const box=L.latLngBounds(aoi);
  const study=L.rectangle(box,{color:"#2677bc",weight:2,fillColor:"#2c7ec3",fillOpacity:.06,dashArray:"6 5",interactive:false}).addTo(map);
  const locator=L.circleMarker([-6.93749333,110.42332243],{color:"#1d4978",fillColor:"#fff",fillOpacity:.9,radius:8,weight:3})
   .addTo(map).bindPopup("<strong>BIG RBI port locator</strong><div>Cartographic reference only, not surveyed asset.</div><div>HyP3 unwrapped phase: NoData</div>");
  map.fitBounds(box,{padding:[20,20],maxZoom:13});
  L.control.zoom({position:"bottomright"}).addTo(map);
  $("toggle-study-aoi").addEventListener("change",e=>{if(e.target.checked)study.addTo(map);else map.removeLayer(study);});
  $("toggle-port-reference").addEventListener("change",e=>{if(e.target.checked)locator.addTo(map);else map.removeLayer(locator);});
  $("reset-area-map").addEventListener("click",()=>map.fitBounds(box,{padding:[20,20],maxZoom:13}));
  window.__barunaAreaMap=map;
  void installTrueColorLayer(map);
 }catch(error){
  mapTarget.replaceChildren();
  mapTarget.classList.add("map-map-fallback");
  mapTarget.textContent="Tidak dapat memuat peta, gunakan tab Data untuk memeriksa sumber evidence.";
  const state=$("satellite-source-note");if(state)state.textContent="GIS map unavailable — no raster inference";
 }
}

function gnss(){
 const html=
 headline("Multi-GNSS Center","Source-traceable station evidence and observation-quality review. The workflow prioritizes GNSS evidence completeness and processing — not port-asset risk scores.",
   btn("Open existing GNSS Lab",LINKS.legacy+"?page=analyst",true))
 +'<div class="saas-note"><strong>Scope:</strong> CSEM historical GPS-derived positions (Semarang), BAKO public Multi-GNSS RINEX QC (Cibinong), and CSMG site metadata. These are separate sources, stations and dates — not a shared movement solution.</div>'
 +'<div class="portfolio-metrics section-space">'
 +metric('Checking…','CSEM historic epochs','GPS-derived position series · 2010–2021','gnss-metric-csem')
 +metric('Checking…','BAKO QC epochs','20-minute sample · 1 Jan 2025','gnss-metric-bako')
 +metric('Checking…','Observed constellations','BAKO pseudorange availability only','gnss-metric-constellations')
 +metric('Not available','Shared CSEM/CSMG solution','No aligned public position result')
 +'</div>'
 +'<div class="gnss-status-ribbon" id="gnss-source-status" role="status">Validating official source references and public QC manifests…</div>'
 +'<section class="saas-section-head section-space"><h2 class="saas-section-title">Station evidence</h2><span class="saas-hint">Source-specific scope · no cross-station displacement inference</span></section>'
 +'<div class="gnss-station-grid">'
 +'<article class="saas-card saas-card-section"><div class="saas-card-head"><h2>CSEM · Semarang</h2>'+chip("Historic positions","blue")+'</div><strong class="gnss-stat-value" id="gnss-csem-epochs">Checking…</strong><p class="saas-hint" id="gnss-csem-period">Published GPS-derived ENU position series; reference-frame metadata retained. Not a port-asset measurement.</p><a class="saas-link" href="https://zenodo.org/records/7775016" target="_blank" rel="noopener noreferrer">Source dataset · Zenodo →</a></article>'
 +'<article class="saas-card saas-card-section"><div class="saas-card-head"><h2>CSMG · Genuk</h2>'+chip("Site metadata","warn")+'</div><strong class="gnss-stat-value">QC pending</strong><p class="saas-hint">BIG station site log is a reference. Paired date-matched CSEM/CSMG RINEX-derived QC is not in this public SaaS build.</p><a class="saas-link" href="https://srgi.big.go.id/cors/CSMG" target="_blank" rel="noopener noreferrer">BIG Ina-CORS station log →</a></article>'
 +'<article class="saas-card saas-card-section"><div class="saas-card-head"><h2>BAKO · Cibinong</h2>'+chip("Verified RINEX QC","active")+'</div><strong class="gnss-stat-value" id="gnss-bako-epochs">Checking…</strong><p class="saas-hint" id="gnss-bako-constellations">Independent sample of observed constellations; not a Semarang position solution or accuracy comparison.</p><a class="saas-link" href="https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/43690104506" target="_blank" rel="noopener noreferrer">Verified GeoRinex run →</a></article>'
 +'</div>'
 +'<section class="saas-card saas-card-section section-space"><div class="saas-card-head"><div><h2>BAKO observation context</h2><p>Counts of satellites with pseudorange available per epoch — not accuracy or precision.</p></div>'+chip("Not a displacement result","blue")+'</div>'
 +'<div class="gnss-observation-grid"><div class="gnss-observation-cell"><span>GPS-only average / epoch</span><strong id="gnss-gps-average">—</strong></div><div class="gnss-observation-cell"><span>Multi-GNSS average / epoch</span><strong id="gnss-multi-average">—</strong></div><div class="gnss-observation-cell"><span>Sampling window</span><strong id="gnss-bako-window">—</strong></div></div>'
 +'<div class="saas-note is-warning section-space">BAKO is located in Cibinong. More available pseudorange satellites do not demonstrate better position accuracy and cannot establish CSEM or CSMG movement in Semarang.</div></section>'
 +'<section class="section-space" id="evidence-priority"><div class="saas-section-head"><div><h2 class="saas-section-title">Evidence Review Priority</h2><p class="saas-hint">Ordered verification dependencies, not a ranking of hazards, GNSS station performance, or port assets.</p></div>'+btn("Import private station QC",LINKS.legacy+"?page=analyst")+'</div>'
 +'<div class="directory-panel"><div class="saas-table-scroll"><table class="data-table gnss-queue-table"><thead><tr><th>Step</th><th>Evidence / verification task</th><th>Source readiness</th><th>Next action</th></tr></thead><tbody id="gnss-review-rows"><tr><td colspan="4">Checking evidence sources…</td></tr></tbody></table></div><div class="directory-notice">Steps 1–4 identify process dependencies only; they are not numeric risk ranks and do not imply any data-provider failure.</div></div></section>'
 +'<div class="saas-cta-strip"><div><strong>Official observational QC is separate from positioning.</strong><p>The GNSS Lab supports local CSEM/CSMG QC JSON import without publishing private RINEX files. Station movement requires an independently validated geodetic solution.</p></div>'+btn("Go to GNSS Analyst",LINKS.legacy+"?page=analyst",true)+'</div>';
 renderShell(html,{title:"Multi-GNSS Center",crumbs:"Multi-GNSS Center"});
 void bootGnss();
}

async function bootAreaGnssPriority(){
 const container=$("intel-gnss-review");
 if(!container)return;
 try{
  const [c,b]=await Promise.all([fetch(GNSS_CENTER_SOURCES.csem,{cache:"no-store"}),fetch(GNSS_CENTER_SOURCES.bako,{cache:"no-store"})]);
  if(!c.ok||!b.ok)throw Error("GNSS sources unavailable");
  const d=buildMultiGnssReview(await c.text(),await b.json());
  const table=document.createElement("div");table.className="gnss-priority-list";
  for(const step of d.reviewPriority){
   const item=document.createElement("div");item.className="gnss-priority-row";
   const ordinal=document.createElement("span");ordinal.className="gnss-priority-no";ordinal.textContent=String(step.order).padStart(2,"0");
   const detail=document.createElement("div");
   const title=document.createElement("strong");title.textContent=step.title;
   const caption=document.createElement("p");caption.textContent=step.next;
   detail.append(title,caption);item.append(ordinal,detail);table.appendChild(item);
  }
  container.replaceChildren(table);
  const status=$("int-gnss-status");if(status)status.textContent=fmt(d.csem.epochs)+" CSEM epochs · "+fmt(d.bako.epochs)+" BAKO QC epochs";
  container.setAttribute("aria-label",d.reviewPriority.length+" GNSS evidence verification steps. No asset risks ranked.");
 }catch(error){
  container.textContent="GNSS source verification unavailable. Evidence prioritization is disabled; no risk rankings have been inferred.";
  const status=$("int-gnss-status");if(status)status.textContent="Source unavailable";
 }
}

async function bootGnss(){
 const set=(id,t)=>{const n=$(id);if(n)n.textContent=String(t)};
 try{
  const [r1,r2]=await Promise.all([fetch(GNSS_CENTER_SOURCES.csem,{cache:"no-store"}),fetch(GNSS_CENTER_SOURCES.bako,{cache:"no-store"})]);
  if(!r1.ok||!r2.ok)throw Error("Source manifest unavailable");
  const [txt,obj]=await Promise.all([r1.text(),r2.json()]);
  const d=buildMultiGnssReview(txt,obj);
  const fmtN=n=>Number(n).toLocaleString("id-ID",{maximumFractionDigits:3});
  // All numeric metrics are source-derived, never placeholders after validation.
  set("gnss-csem-epochs",fmtN(d.csem.epochs)+" epochs");
  set("gnss-metric-csem",fmtN(d.csem.epochs));
  set("gnss-metric-bako",fmtN(d.bako.epochs));
  set("gnss-metric-constellations",String(d.bako.constellations.length));
  set("gnss-csem-period",d.csem.first+" to "+d.csem.last+" · "+d.csem.referenceFrame+" · GPS-derived historical station positions only");
  set("gnss-bako-epochs",fmtN(d.bako.epochs)+" epochs");
  set("gnss-bako-constellations",d.bako.constellations.join(" · ")+" · 1 Jan 2025. Pseudorange availability, not position accuracy.");
  set("gnss-gps-average",fmtN(d.bako.gpsOnlyAvgPseudorangeSatellites));
  set("gnss-multi-average",fmtN(d.bako.multiGnssAvgPseudorangeSatellites));
  set("gnss-bako-window","20 min");
  set("gnss-source-status","2 public source streams validated · CSMG site log present · aligned Semarang station solution not available");
  $("gnss-review-rows").innerHTML=d.reviewPriority.map(x=>
    '<tr><td><strong>Step '+x.order+'</strong><span class="sub">Workflow dependency</span></td>'+
    '<td><strong>'+esc(x.title)+'</strong><span class="sub">'+esc(x.evidence)+'</span></td>'+
    '<td>'+chip("Verification needed","warn")+'</td><td>'+esc(x.next)+'</td></tr>').join("");
  document.body.dataset.gnssReadiness="ready";
 }catch(error){
  for(const id of ["gnss-csem-epochs","gnss-bako-epochs","gnss-gps-average","gnss-multi-average","gnss-bako-window","gnss-metric-csem","gnss-metric-bako","gnss-metric-constellations"])set(id,"Unavailable");
  set("gnss-source-status","Source verification failed. No GNSS observations or readiness priorities are claimed.");
  $("gnss-review-rows").innerHTML='<tr><td colspan="4">Required source files could not be verified. Review queue unavailable.</td></tr>';
  document.body.dataset.gnssReadiness="unavailable";
 }
}

const pages={portfolio,workspaces,workspace,demo,areas,catalog,area,gnss};
if(ROOT)try{(pages[SCREEN]||portfolio)();}catch(error){
 console.error("BARUNA SaaS view failed:",error);
 ROOT.innerHTML='<div class="app-start-fallback"><strong>BARUNA view unavailable</strong><p>Antarmuka belum dapat dimuat. Data evidence asli tidak diubah.</p><a href="./real-workspace.html">Open existing Real Workspace →</a></div>';
}

