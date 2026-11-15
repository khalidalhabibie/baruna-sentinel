import {safeHtml as e} from "./projects.js";
import {validateHistoricalFieldEvidence} from "./historical.js";
import {parseRneu,analyzeSeries} from "./engine.js";
import {
  ASSESSMENT_POLICY,assessRealProject,assessSyntheticScenario,buildAssessmentPrint
} from "./assessment.js";

const root=document.getElementById("pw-page-assessment");
let real=null;
let sourceError=null;
let selectedId="west-breakwater";
let showSimulation=false;
const measuredSources={csem:null,bako:null};
const nav=window.BarunaNavigation;
const button=(page,label,secondary=true)=>
  '<button type="button" class="pw-btn '+(secondary?'pw-btn-secondary':'pw-btn-primary')+'" data-pw-page="'+page+'">'+e(label)+'</button>';
const cell=(value,highlight=false)=>'<span'+(highlight?' class="as-accent"':'')+'>'+e(value)+'</span>';
const stateName=s=>String(s||"").replace(/_/g," ");
function sourceRows(){
 const csem=measuredSources.csem;
 const bako=measuredSources.bako;
 return [
   ["2005 field study","Tanjung Emas","Available","Historical sector observations; not current rates"],
   ["2010–2021 GPS","CSEM","Reference only",csem?
     csem.epochCount.toLocaleString("en-US")+" positions · OLS "+csem.verticalSlopeMmYr+" mm/year · descriptive station trend only":
     "Station position history; not linked to sector measurements"],
   ["2025 Multi-GNSS QC","BAKO","Reference only",bako?
     bako.epochCount+" epochs · "+bako.constellations+" constellations with pseudorange · no position solution":
     "Independent Cibinong station; not a CSEM position solution"]
 ].map(x=>'<div class="as-source-row"><strong>'+e(x[0])+'</strong><span>'+e(x[1])+'</span><em>'+e(x[2])+'</em><small>'+e(x[3])+'</small></div>').join("");
}
function renderReal(){
 if(sourceError)return '<div class="as-error">The published source could not be validated. Assessment unavailable: '+e(sourceError)+'</div>';
 if(!real)return '<div class="as-empty">Validating published research records…</div>';
 const chosen=real.records.find(x=>x.id===selectedId)||real.records[0];
 const table=real.records.map(x=>
  '<button type="button" class="as-sector'+(x.id===chosen.id?' is-selected':'')+'" data-as-sector="'+e(x.id)+'" aria-pressed="'+(x.id===chosen.id)+'">'+
    '<span class="as-sector-title">'+e(x.name)+'</span>'+
    '<span class="as-sector-value">'+e(x.historicRangeCm.join("–"))+' cm <small>2005</small></span>'+
    '<span class="as-sector-status">Data insufficient</span>'+
  '</button>').join("");
 const evidence=chosen.evidence.map(x=>
   '<div class="as-evidence-item"><div><strong>'+e(x.label)+'</strong><small>'+e(x.detail)+'</small></div>'+
   '<span class="as-state as-state-'+(x.state==="MISSING"?"missing":x.state==="AVAILABLE"?"ready":"reference")+'">'+e(stateName(x.state))+'</span></div>').join("");
 const actions=chosen.requiredActions.map((s,i)=>
   '<li><span>'+String(i+1).padStart(2,"0")+'</span>'+e(s)+'</li>').join("");
 return '<div class="as-overview-stats">'+
   '<div><small>PUBLISHED SECTORS</small><strong>'+real.records.length+'</strong><span>2005 field study</span></div>'+
   '<div><small>ASSET PRIORITIES PERMITTED</small><strong>0</strong><span>No on-asset evidence</span></div>'+
   '<div><small>VERIFICATION REQUESTS</small><strong>'+real.needsUpdatedEvidence+'</strong><span>Data gaps identified</span></div></div>'+
   '<div class="as-workflow"><div class="as-workflow-title">EVIDENCE-TO-DECISION CHAIN</div>'+
    '<div class="as-chain-item"><span class="as-chain-step">01</span><div><strong>Observed evidence</strong><small>Historical field study + separate GNSS references</small></div><b class="as-state as-state-reference">Partial</b></div>'+
    '<div class="as-chain-item"><span class="as-chain-step">02</span><div><strong>Quality &amp; linkage</strong><small>GNSS provenance present; station-to-asset link absent</small></div><b class="as-state as-state-missing">Incomplete</b></div>'+
    '<div class="as-chain-item"><span class="as-chain-step">03</span><div><strong>Spatial context</strong><small>No surveyed sector geometry or operator criticality</small></div><b class="as-state as-state-missing">Missing</b></div>'+
    '<div class="as-chain-item"><span class="as-chain-step">04</span><div><strong>Inspection decision</strong><small>Request updated field evidence; do not assign a safety rank</small></div><b class="as-state as-state-missing">Blocked</b></div>'+
   '</div>'+
   '<div class="as-section-title"><h2>Inspection screening</h2><span>Published sector records · no invented coordinates</span></div>'+
   '<div class="as-workbench">'+
     '<section class="as-select-panel"><div class="as-pane-label">SELECT AN INFRASTRUCTURE SECTOR</div>'+
       '<p>Six sectors from the original field study. Values are cumulative historic settlement, not an annual rate.</p>'+
       '<div class="as-sector-list">'+table+'</div></section>'+
     '<section class="as-decision-panel"><div class="as-pane-label">ASSESSMENT RESULT / SOURCE-BACKED</div>'+
       '<div class="as-decision-top"><div><h3>'+e(chosen.name)+'</h3>'+
       '<p>Historical reported settlement: <b>'+e(chosen.historicRangeCm.join("–"))+' cm</b> in 2005</p></div>'+
       '<span class="as-decision-status">DATA INSUFFICIENT</span></div>'+
       '<p class="as-decision-explain">'+e(chosen.explanation)+'</p>'+
       '<div class="as-pane-label as-gap-heading">EVIDENCE CHECKLIST</div><div class="as-evidence-list">'+evidence+'</div>'+
       '<div class="as-pane-label as-gap-heading">REQUIRED BEFORE OPERATIONAL PRIORITY</div>'+
       '<ol class="as-required-actions">'+actions+'</ol>'+
       '<div class="as-action-row"><button type="button" class="pw-btn pw-btn-primary" id="as-export">Export assessment brief</button>'+
         button("detail","View field records")+'</div></section>'+
   '</div>'+
   '<section class="as-source-panel"><div class="as-source-title"><h2>GNSS and source provenance</h2>'+
      button("analyst","Open GNSS Lab")+'</div>'+
     '<div class="as-source-header"><span>SOURCE</span><span>STATION / SITE</span><span>RELATION</span><span>WHAT IT MEANS</span></div>'+
     sourceRows()+
     '<p>CSEM and BAKO are evidence sources, not independent operator projects. Neither has been linked geodetically to an individual 2005 survey sector in this prototype. The descriptive CSEM 2010–2021 OLS result must not be equated with the 2021–2023 station rates cited in the proposal: periods and processing differ.</p></section>';
}
function renderSimulation(){
 const scenario=assessSyntheticScenario();
 const policy=ASSESSMENT_POLICY;
 const list=scenario.records.map(x=>
   '<tr><th scope="row">'+e(x.name)+'</th><td>'+e(x.screeningTier)+'</td>'+
   '<td>'+(x.score===null?"—":e(x.score))+'</td>'+
   '<td>'+e(x.gateFailures.length?x.gateFailures.join(", "):x.reasons.join(" · "))+'</td></tr>').join("");
 return '<div class="as-synthetic-warning"><strong>Invented scenario — not Semarang observations</strong>'+
   '<p>Every site name, measured trend, exposure level and criticality in this exercise is synthetic. Do not use the following rankings to prioritize real inspections.</p></div>'+
   '<section class="as-simulation-rules"><div><span class="as-pane-label">ILLUSTRATIVE POLICY / NOT INDUSTRY STANDARDS</span>'+
      '<h2>Transparent priority rules</h2><p>The purpose is to demonstrate the computation and its failure states; actual thresholds must be approved by an operator and geodetic specialist.</p></div>'+
    '<div class="as-sim-formula"><span>Gate first</span><b>Geometry + site linkage + provenance + coverage + uncertainty + exposure/criticality</b>'+
    '<span>Then score (demonstration only)</span><b>Motion (0–2) + Exposure (0–2) + Criticality (0–2)</b></div></section>'+
   '<div class="as-simulation-limits"><span>Minimum span: '+policy.minimumSpanYears+' year</span>'+
    '<span>Continuity: ≥'+policy.minimumContinuityPct+'%</span>'+
    '<span>Max slope uncertainty: '+policy.maximumSlopeUncertaintyMmYr+' mm/year</span>'+
    '<span>Motion bands: '+policy.rateMediumMmYr+' / '+policy.rateHighMmYr+' mm/year</span>'+
    '<span>HIGH ≥'+policy.highScore+' · MEDIUM ≥'+policy.mediumScore+' · otherwise MONITOR</span></div>'+
   '<div class="as-simulation-table-wrap"><table class="as-simulation-table"><thead><tr><th>FICTIONAL ASSET</th><th>DEMO TIER</th><th>SCORE</th><th>EXPLAINABLE REASON / GATE</th></tr></thead>'+
    '<tbody>'+list+'</tbody></table></div>'+
   '<div class="as-simulation-footer"><p>Blocked data stays <strong>Data Insufficient</strong> even when an invented motion rate is large. Poor-quality evidence must never be interpreted as stability.</p>'+
   '<button type="button" class="pw-btn pw-btn-secondary" id="as-export">Export synthetic policy annex</button></div>';
}
function render(){
 if(!root)return;
 const selectedProject=nav?.getProject?.()||"semarang-port";
 if(selectedProject!=="semarang-port"){
  root.innerHTML='<div class="pw-breadcrumb"><button type="button" data-pw-page="projects">Projects</button><span>/</span> Assessment</div>'+
  '<div class="pw-heading-row"><div><span class="pw-kicker">SCOPE CHECK</span><h1>Assessment</h1>'+
  '<p>The selected workspace is a standalone GNSS reference or local draft, not a verified infrastructure asset project. No inspection ranking can be generated from it.</p></div></div>'+
  '<section class="pw-panel"><h2>Select the Tanjung Emas research case</h2><p>The published sector data and evidence-gate workflow are associated with that case only. Reference stations are examined in GNSS Lab.</p>'+
  '<button id="as-open-semarang" class="pw-btn pw-btn-primary" type="button">Open Tanjung Emas assessment</button></section>';return;
 }
 root.innerHTML=
  '<div class="pw-breadcrumb"><button type="button" data-pw-page="projects">Projects</button><span>/</span>'+
  '<button type="button" data-pw-page="overview">Tanjung Emas / Semarang</button><span>/</span> Assessment</div>'+
  '<div class="pw-heading-row as-page-heading"><div><span class="pw-kicker">PROPOSAL WORKFLOW / GNSS → EVIDENCE → DECISION</span>'+
     '<h1>Inspection assessment</h1><p>Explain what the research proves, what remains unknown, and whether an infrastructure inspection priority can be issued.</p></div>'+
     '<div class="pw-heading-actions">'+button("analyst","GNSS evidence")+button("compare","Compare sources")+'</div></div>'+
  '<div class="as-mode-switch" role="group" aria-label="Assessment evidence mode">'+
     '<button type="button" id="as-real-mode" aria-pressed="'+(!showSimulation)+'" class="'+(!showSimulation?"is-active":"")+'">Published evidence</button>'+
     '<button type="button" id="as-demo-mode" aria-pressed="'+showSimulation+'" class="'+(showSimulation?"is-active":"")+'">Synthetic policy demo</button>'+
     '<span>'+ (showSimulation?"Illustrative data only · no real site positions":"Actual 2005 study · asset risk unassessed")+'</span></div>'+
  (showSimulation?renderSimulation():renderReal());
}
root?.addEventListener("click",event=>{
 const target=event.target.closest("button");
 if(!target)return;
 if(target.id==="as-open-semarang"){
  nav.selectProject("semarang-port",{page:"assessment"});return;
 }
 if(target.id==="as-real-mode"||target.id==="as-demo-mode"){
  showSimulation=target.id==="as-demo-mode";render();return;
 }
 if(target.dataset.asSector){
  selectedId=target.dataset.asSector;render();return;
 }
 if(target.id==="as-export"){
  if(!real)return;
  const printRegion=document.getElementById("print-report");
  printRegion.innerHTML=buildAssessmentPrint({real,scenario:showSimulation?assessSyntheticScenario():null});
  window.print();return;
 }
});
window.addEventListener("baruna:pagechange",render);
async function loadSourceMetrics(){
 const tasks=[
  async()=>{
   const r=await fetch("./data/CSEM_clean_Noff1site.source-derived.rneu");
   if(!r.ok)throw Error("CSEM source unavailable");
   const positions=parseRneu(await r.text(),{station:"CSEM",unit:"meters",referenceFrame:"user-declared"});
   const result=analyzeSeries(positions);
   if(result.station!=="CSEM"||result.epochCount<100)throw Error("CSEM source mismatch");
   measuredSources.csem=result;
  },
  async()=>{
   const r=await fetch("./data/BAKO_IGS_2025-001_20min_qc_summary.json");
   if(!r.ok)throw Error("BAKO QC source unavailable");
   const qc=await r.json();
   if(qc.status!=="VERIFIED_REAL_RINEX_OBSERVATIONS"||
      qc.source?.station!=="BAKO00IDN"||
      qc.relationshipToSemarang?.linkedToCsemMovement!==false||
      qc.audit?.epochs!==41)throw Error("BAKO QC provenance mismatch");
   measuredSources.bako={
    epochCount:qc.audit.epochs,
    constellations:qc.audit.constellationsObservedWithPseudorange.length
   };
  }
 ];
 await Promise.allSettled(tasks.map(task=>task()));
}
async function init(){
 render();
 try{
  const response=await fetch("./data/tanjung-emas-historical-field-evidence.json");
  if(!response.ok)throw Error("Published field records unavailable (HTTP "+response.status+")");
  const doc=validateHistoricalFieldEvidence(await response.json());
  real=assessRealProject(doc);
 }catch(error){sourceError=error instanceof Error?error.message:String(error);}
 await loadSourceMetrics();
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
