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

const ROOT=document.getElementById("baruna-saas-app");
const SCREEN=document.body.dataset.saasScreen||"portfolio";
const LINKS=Object.freeze({
 home:"./index.html",workspaces:"./workspaces.html",
 semarang:"./workspace-semarang.html",areas:"./areas.html",
 area:"./area-tanjung-emas.html",catalog:"./data-catalog.html",
 advanced:"./real-workspace.html",subsidence:"./subsidence-evidence.html",
 evidence:"./evidence-brief-coaster.html",legacy:"./evidence-lab.html",
 aoi:"./aoi-registry.html",demo:"./workspace-demo.html"
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
 const platform=[["Overview",LINKS.home,"⌂","portfolio"],["Workspaces",LINKS.workspaces,"▣","workspaces"],["All Areas",LINKS.areas,"◇","areas"],["Data Catalog",LINKS.catalog,"▤","catalog"]];
 const nav=platform.map(([text,url,icon,screen])=>navLink(text,url,icon,
 SCREEN===screen||((SCREEN==="workspace"||SCREEN==="demo")&&screen==="workspaces")||(SCREEN==="area"&&screen==="areas"))).join("");
 ROOT.innerHTML=
 '<div class="saas-shell" id="saas-shell">'
 +'<div class="saas-drawer-backdrop" id="saas-nav-backdrop" hidden></div>'
 +'<aside class="saas-sidebar" id="saas-sidebar" aria-label="Navigasi utama">'
 +'<a class="saas-brand" href="'+LINKS.home+'"><span class="saas-symbol" aria-hidden="true">≋</span><span class="saas-brand-text"><strong>BARUNA</strong><small>SENTINEL · SPATIAL INTELLIGENCE</small></span></a>'
 +'<div class="saas-section-label">PLATFORM</div><nav class="saas-nav">'+nav+'</nav>'
 +'<div class="saas-divider"></div><div class="saas-section-label">RECENT</div><nav class="saas-recent" aria-label="Area dan workspace terbaru">'
 +'<a href="'+LINKS.semarang+'"><span aria-hidden="true">▣</span>Semarang Coastal</a>'
 +'<a href="'+LINKS.area+'"><span aria-hidden="true">⌖</span>Tanjung Emas</a></nav>'
 +'<div class="saas-divider"></div><div class="saas-section-label">RESEARCH &amp; REPORTS</div><nav class="saas-recent">'
 +'<a href="'+LINKS.advanced+'">Advanced GIS</a>'
 +'<a href="'+LINKS.subsidence+'">Subsidence Evidence</a>'
 +'<a href="'+LINKS.legacy+'?page=analyst">GNSS / Evidence Lab</a></nav>'
 +'<div class="saas-org"><span class="saas-org-icon">◈</span><span><strong>Ourdo Indonesia</strong><small>Spatial intelligence workspace</small></span></div>'
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
function metric(value,label,description){
 return '<article class="saas-metric"><div class="saas-metric-label">'+esc(label)+'</div><strong>'+esc(value)+'</strong><small>'+esc(description)+'</small></article>';
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
 +metric("6","Historical sectors","Published levelling · 2005")
 +metric("1","Processed InSAR pair","ASF HyP3 · QA only")
 +'</section>'
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
 {name:"GNSS CSEM historical",source:"CSEM station historical series",status:"Independent station context",type:"blue",use:"Station measurement; not a measurement at Tanjung Emas assets"},
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
 +sourceCard("GNSS station series","CSEM historical station evidence","Separate station","blue","Nearby station data are not measurements of each port asset","GNSS Lab",LINKS.legacy+"?page=analyst")
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
 +'<div class="area-insight-grid">'
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
 +'<div class="saas-card saas-card-section section-space"><div class="saas-card-head"><div><h2>Decision gate &amp; recommended action</h2><p>Operational conclusions are blocked until missing evidence is independently checked.</p></div>'+chip("Data insufficient","warn")+'</div>'
 +'<div class="science-step-grid"><div class="science-step"><span class="science-step-index">01 / GEOMETRY</span><strong>Confirm surveyed assets</strong><p>Request official asset polygons and reference coordinates from the port operator.</p></div>'
 +'<div class="science-step"><span class="science-step-index">02 / DISPLACEMENT</span><strong>Validate multi-date InSAR</strong><p>Obtain time series, stable reference, uncertainty and atmospheric correction.</p></div>'
 +'<div class="science-step"><span class="science-step-index">03 / INDEPENDENCE</span><strong>Cross-check GNSS / levelling</strong><p>Verify representativeness, datum and time-matched measurements before asset decisions.</p></div></div></div>'
 +'</section>'
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
 bootAreaSources();
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
  document.body.dataset.saasEvidence="ready";
 }catch(error){
  for(const id of ["int-qa-share","int-port-coherence","int-historical-sectors"])label(id,"Unavailable");
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
const pages={portfolio,workspaces,workspace,demo,areas,catalog,area};
if(ROOT)try{(pages[SCREEN]||portfolio)();}catch(error){
 console.error("BARUNA SaaS view failed:",error);
 ROOT.innerHTML='<div class="app-start-fallback"><strong>BARUNA view unavailable</strong><p>Antarmuka belum dapat dimuat. Data evidence asli tidak diubah.</p><a href="./real-workspace.html">Open existing Real Workspace →</a></div>';
}

