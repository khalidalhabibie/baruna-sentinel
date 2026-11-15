import { SOURCE_PROJECTS, safeHtml as e, safeHttpUrl, createDraft, comparableProjects } from "./projects.js";

const $=id=>document.getElementById(id);
const sessionKey="baruna:local-draft-workspaces:v1";
let drafts=[];
let compared=new Set(["semarang-port","csem-history"]);
const all=()=>[...SOURCE_PROJECTS,...drafts];
const current=()=>all().find(p=>p.id===window.BarunaNavigation?.getProject?.())||SOURCE_PROJECTS[0];
const tag=p=>'<span class="pw-tag'+(p.sourceKind==="draft"?' pw-tag-draft':'')+'">'+e(p.kind)+'</span>';
const action=(page,label,secondary=false)=>'<button class="pw-btn '+(secondary?'pw-btn-secondary':'pw-btn-primary')+'" type="button" data-pw-page="'+page+'">'+label+'</button>';
const crumb=(page,p)=>'<div class="pw-breadcrumb"><button type="button" data-pw-page="projects">Projects</button><span>/</span>'+(p?'<button type="button" data-pw-open="'+e(p.id)+'">'+e(p.name)+'</button><span>/</span>':'')+e(page)+'</div>';
function restore(){
 try{
   const value=JSON.parse(sessionStorage.getItem(sessionKey)||"[]");
   if(!Array.isArray(value))return;
   drafts=value.slice(0,15).filter(p=>p&&typeof p.name==="string"&&typeof p.area==="string"&&/^draft-[a-zA-Z0-9-]+$/.test(p.id))
    .map(p=>({...createDraft({name:p.name,area:p.area}),id:p.id}));
 }catch{drafts=[];}
}
function save(){
 try{sessionStorage.setItem(sessionKey,JSON.stringify(drafts.map(p=>({id:p.id,name:p.name,area:p.area}))));}catch{}
}
function selector(){
 const select=$("pw-project-switch");
 if(!select)return;
 const selected=window.BarunaNavigation?.getProject?.()||"semarang-port";
 select.innerHTML=all().map(p=>'<option value="'+e(p.id)+'">'+e(p.name)+'</option>').join("");
 if(all().some(p=>p.id===selected))select.value=selected;
}
function renderIndex(){
 const list=all();
 const rows=list.map(p=>'<article class="pw-list-item" role="listitem">'+
  '<div class="pw-list-main"><span class="pw-project-code">'+e(p.code)+'</span>'+
  '<button class="pw-project-name" data-pw-open="'+e(p.id)+'" type="button">'+e(p.name)+'</button>'+
  '<span class="pw-list-location">'+e(p.area)+' · '+e(p.subject)+'</span>'+tag(p)+'</div>'+
  '<div class="pw-list-evidence">'+e(p.evidence)+'</div><div class="pw-list-period">'+e(p.period)+'</div>'+
  '<button class="pw-list-open" data-pw-open="'+e(p.id)+'" type="button">Open ↗</button></article>').join("");
 $("pw-page-projects").innerHTML=
  '<div class="pw-breadcrumb">WORKSPACES / RESEARCH &amp; REVIEW</div>'+
  '<div class="pw-heading-row pw-index-title"><div><h1>Projects</h1><p>Choose a workspace, review its evidence, or compare source coverage.</p></div>'+
  '<button class="pw-btn pw-btn-primary" type="button" id="pw-new-project-btn">+ New demo project</button></div>'+
  '<div class="pw-index-status"><span><strong>'+list.length+'</strong> workspaces</span><span><strong>1</strong> field-study case</span><span><strong>0</strong> live asset feeds</span><span>Research and demonstration — not customer deployments</span></div>'+
  '<div class="pw-list" role="list" aria-label="Research workspaces">'+
    '<div class="pw-list-head"><span>WORKSPACE</span><span>EVIDENCE</span><span>PERIOD</span><span></span></div>'+rows+'</div>'+
  '<div class="pw-index-foot"><div><strong>Research versus deployment</strong><p>The Tanjung Emas study has published sector records. CSEM and BAKO are independent reference studies, not customer projects or asset feeds.</p></div>'+
  '<div><strong>Local drafts</strong><p>New workspaces are stored only in this browser session. No collaboration, data import, backend, or assessment is enabled for drafts.</p></div></div>';
 $("pw-new-project-btn")?.addEventListener("click",()=>$("pw-new-project-dialog").showModal());
}
function renderOverview(p){
 const isPort=p.id==="semarang-port",draft=p.sourceKind==="draft";
 const sources=isPort?[
  ["2005","Port field study","Six historical cumulative-settlement ranges","Study"],
  ["2010–21","CSEM station history","Regional station positions, not a port-asset solution","Independent"],
  ["2025","BAKO observation QC","Different station and period; pseudorange availability only","Independent"]
 ]:[[p.period,p.subject,p.limitation,draft?"Draft":"Reference"]];
 const sourceRows=sources.map(s=>'<div class="pw-source-row"><span>'+e(s[0])+'</span><strong>'+e(s[1])+'</strong><span>'+e(s[2])+'</span><em>'+e(s[3])+'</em></div>').join("");
 $("pw-page-overview").innerHTML=
  crumb("Overview",p)+
  '<div class="pw-heading-row"><div><span class="pw-kicker">'+e(p.code)+' / '+e(p.area)+'</span><h1>'+e(p.name)+'</h1>'+
  '<div class="pw-under-heading">'+tag(p)+'<span>'+e(p.period)+'</span></div></div>'+
  '<div class="pw-heading-actions">'+action("detail","Open details")+action("compare","Compare",true)+'</div></div>'+
  '<div class="pw-overview-grid">'+
   '<section class="pw-panel pw-main-summary"><div class="pw-panel-heading">Purpose <span>01 / CONTEXT</span></div>'+
    '<h2>'+(isPort?"Historic evidence, not a live risk score":draft?"Draft awaiting evidence":p.sourceKind==="movement"?"Historical station position review":"Independent GNSS observation audit")+'</h2>'+
    '<p>'+e(p.summary)+'</p><div class="pw-summary-separator"></div>'+
    '<div class="pw-two-col"><div><span class="pw-field-label">EVIDENCE</span><strong>'+e(p.evidence)+'</strong></div>'+
    '<div><span class="pw-field-label">CURRENT ASSET CONDITION</span><strong class="pw-plain-status">Not established</strong></div></div>'+
    '<div class="pw-panel-footnote">Source history is not a structural safety or inspection-priority conclusion.</div></section>'+
   '<section class="pw-panel pw-action-summary"><div class="pw-panel-heading">Next verification <span>02 / ACTION</span></div>'+
    '<h2>'+(isPort?"Request updated site evidence":draft?"Register a verified source":"Keep the interpretation within source scope")+'</h2>'+
    '<p>'+e(p.next)+'</p><div class="pw-subtle-rule"></div><span class="pw-field-label">NOT YET SUPPORTED</span>'+
    '<p class="pw-limit-text">'+e(p.limitation)+'</p>'+
    '<button class="pw-text-action" type="button" data-pw-page="detail">'+(isPort?"Review sectors":"View dataset details")+' →</button></section>'+
  '</div>'+
  '<section class="pw-panel pw-source-panel"><div class="pw-panel-heading">Record provenance <span>'+sources.length+' SOURCES</span></div>'+
    '<div class="pw-source-table"><div class="pw-source-head"><span>PERIOD</span><span>DATASET</span><span>MEANING</span><span>RELATION</span></div>'+sourceRows+'</div>'+
    '<p class="pw-caption">Independent sources from different stations or periods must not be merged into a single movement conclusion.</p></section>';
}
function renderDetail(p){
 const isPort=p.id==="semarang-port";
 const link=safeHttpUrl(p.sourceUrl);
 const sourceLink=link?'<a target="_blank" rel="noopener noreferrer" href="'+e(link)+'">Original source ↗</a>':"Local demo draft";
 $("pw-page-detail").innerHTML=
  crumb("Detail",p)+
  '<div class="pw-heading-row pw-detail-head"><div><span class="pw-kicker">'+e(p.code)+' / DETAIL</span><h1>'+e(p.name)+'</h1>'+
   '<p>'+(isPort?"Inspect one documented sector and prepare an updated field-verification request.":e(p.subject))+'</p></div>'+
   '<div class="pw-heading-actions">'+action("overview","Overview",true)+action("compare","Compare",true)+'</div></div>'+
  (isPort?'<div class="pw-detail-intro"><span class="pw-led"></span><span>2005 published field record</span><span>·</span><span>Current on-asset data unavailable</span><span>·</span><span>Verification brief ready</span></div>':
   '<div class="pw-overview-grid pw-reference-grid">'+
    '<section class="pw-panel"><div class="pw-panel-heading">Dataset <span>01 / SOURCE</span></div>'+
     '<h2>'+e(p.subject)+'</h2><p>'+e(p.summary)+'</p>'+
     '<dl class="pw-metadata"><div><dt>Region</dt><dd>'+e(p.area)+'</dd></div><div><dt>Period</dt><dd>'+e(p.period)+'</dd></div>'+
     '<div><dt>Provenance</dt><dd>'+sourceLink+'</dd></div><div><dt>Evidence</dt><dd>'+e(p.evidence)+'</dd></div></dl>'+
     (p.sourceKind!=="draft"?action("analyst","Open GNSS Lab"):'')+'</section>'+
    '<section class="pw-panel"><div class="pw-panel-heading">Interpretation <span>02 / LIMITS</span></div>'+
     '<h2>No asset-safety conclusion</h2><p>'+e(p.limitation)+'</p><div class="pw-subtle-rule"></div>'+
     '<span class="pw-field-label">NEXT CHECK</span><p>'+e(p.next)+'</p>'+action("compare","Compare evidence",true)+'</section></div>');
}
function renderCompare(){
 const projects=all(),selected=[...compared].filter(id=>projects.some(p=>p.id===id));
 const valid=selected.length>=2&&selected.length<=3;
 const report=valid?comparableProjects(projects,selected):null;
 const pickers=projects.map(p=>'<label class="pw-compare-pick"><input type="checkbox" data-pw-compare="'+e(p.id)+'" '+
  (compared.has(p.id)?"checked":"")+'><span><strong>'+e(p.name)+'</strong><small>'+e(p.kind)+'</small></span></label>').join("");
 const table=report?'<div class="pw-compare-scroll"><table class="pw-comparison">'+
   '<thead><tr><th scope="col">DATA / CONTROL</th>'+
   report.projects.map(p=>'<th scope="col"><span class="pw-table-title">'+e(p.name)+'</span><small>'+e(p.period)+'</small></th>').join("")+'</tr></thead>'+
   '<tbody>'+report.rows.map(row=>'<tr><th scope="row">'+e(row.label)+'</th>'+
     row.values.map(v=>'<td>'+e(v)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>':
   '<div class="pw-compare-empty">Select two or three workspaces to see evidence coverage side by side.</div>';
 $("pw-page-compare").innerHTML=
  crumb("Compare")+
  '<div class="pw-heading-row"><div><span class="pw-kicker">DATA COMPARISON</span><h1>Compare workspaces</h1>'+
   '<p>Compare coverage, provenance, and missing evidence—not ground movement, risk, or safety.</p></div></div>'+
  '<section class="pw-panel pw-compare-panel"><div class="pw-panel-heading">Select 2–3 workspaces <span>'+selected.length+' SELECTED</span></div>'+
   '<div class="pw-compare-picks">'+pickers+'</div>'+table+'</section>'+
  '<div class="pw-compare-note"><strong>Method boundary:</strong> CSEM and BAKO refer to different stations and data products. Their values are not a shared deformation analysis or an accuracy benchmark.</div>';
}
function render(){
 selector();
 renderIndex();
 const p=current();
 renderOverview(p);
 renderDetail(p);
 renderCompare();
 document.body.dataset.projectKind=p.id==="semarang-port"?"sector":p.sourceKind;
}
function createProject(event){
 event.preventDefault();
 const error=$("pw-draft-error");error.hidden=true;
 try{
  if(drafts.length>=15)throw Error("This session supports up to 15 local drafts.");
  const draft=createDraft({name:$("pw-draft-name").value,area:$("pw-draft-area").value});
  drafts.push(draft);save();
  $("pw-new-project-dialog").close();$("pw-new-project-form").reset();
  render();
  window.BarunaNavigation.selectProject(draft.id,{page:"overview"});
 }catch(err){error.textContent=err.message;error.hidden=false;}
}
function setLabTab(tab){
 if(!["movement","qc","gis","sandbox"].includes(tab))return;
 if(tab==="sandbox"&&document.body.dataset.sandbox!=="on")return;
 document.body.dataset.labTab=tab;
 for(const button of document.querySelectorAll("[data-pw-lab]")){
  button.setAttribute("aria-selected",String(button.dataset.pwLab===tab));
 }
 if(tab==="gis")window.dispatchEvent(new CustomEvent("baruna:viewchange",{detail:{view:"analyst"}}));
}
function init(){
 restore();render();
 window.addEventListener("baruna:pagechange",render);
 $("pw-new-project-form")?.addEventListener("submit",createProject);
 for(const id of ["pw-dialog-close","pw-dialog-cancel"])
  $(id)?.addEventListener("click",()=>$("pw-new-project-dialog").close());
 document.addEventListener("click",event=>{
  const tab=event.target.closest("[data-pw-lab]");
  if(tab)setLabTab(tab.dataset.pwLab);
 });
 document.addEventListener("change",event=>{
  const id=event.target?.dataset?.pwCompare;
  if(!id)return;
  if(event.target.checked)compared.add(id);
  else compared.delete(id);
  renderCompare();
 });
 const project=window.BarunaNavigation?.getProject?.();
 if(!all().some(p=>p.id===project))
  window.BarunaNavigation?.selectProject?.("semarang-port",{page:"projects",updateUrl:true,scroll:false});
}
window.BarunaWorkspace=Object.freeze({setLabTab});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
