/**
 * BARUNA source-separated subsidence evidence atlas.
 * 2005 harbour settlement, 2015-2022 regional InSAR literature, and 2026
 * HyP3 radar QA must NEVER be merged into a time series or asset risk score.
 */
import {validateHistoricalFieldEvidence,filterHistoricalSectors} from "./historical.js";
import {validateRealInsarQa} from "./real-hyp3-insar.js";

export const ATLAS_SOURCES=Object.freeze({
 historical:"./data/tanjung-emas-historical-field-evidence.json",
 radar:"./data/semarang-real-hyp3-insar-qa.json",
 regional:"./data/semarang-published-subsidence-context.json"
});
const EXPECTED_DOI="10.1016/j.jag.2023.103579";
export function validateRegionalPublishedFinding(d){
 if(d?.schema!=="baruna-regional-published-subsidence-v1"||
    d.metric!=="PUBLISHED_REGIONAL_MAXIMUM_SUBSIDENCE_RATE"||
    d.referencePeriod?.start!=="2015"||d.referencePeriod?.end!=="2022"||
    d.publication?.doi!==EXPECTED_DOI||d.publication?.year!==2023||
    JSON.stringify(d.maximumRangeMmPerYear)!==JSON.stringify([100,120])||
    d.historicalFrameReference?.frameId!=="076D_09725_121107"||
    d.historicalFrameReference?.period!=="2015–2020"||
    d.dataStatus?.publishedRegionalFinding!==true||
    ["originalPixelVelocityMapInBARUNA","independentlyVerified2026Rate","harbourSiteSpecificRate",
     "surveyedHarbourAssetGeometry"].some(key=>d.dataStatus[key]!==false))
  throw new TypeError("Published regional finding provenance or scientific guardrail invalid");
 return d;
}
export function atlasEvidenceSummary(historical,radar,regional){
 const h=validateHistoricalFieldEvidence(historical);
 const q=validateRealInsarQa(radar);
 const r=validateRegionalPublishedFinding(regional);
 return {
  schema:"baruna-subsidence-evidence-atlas-export-v1",
  historical:{surveyYear:h.reportedSurveyYear,units:h.units,sectors:h.sectors.map(s=>({
    id:s.id,name:s.name,minimumCm:s.minCm,maximumCm:s.maxCm,
    exactGeometryAvailable:false,currentCondition:"UNKNOWN"})),
    publication:h.publication},
  regional:{referencePeriod:r.referencePeriod,reportedRegionalMaximumMmPerYear:r.maximumRangeMmPerYear,
    region:r.referenceSpatialScope,publication:r.publication,
    portSpecific:false,velocityRasterInApplication:false},
  radar:{reference:q.source.referenceDate,secondary:q.source.secondaryDate,
    archiveSha256:q.source.sha256,jobId:q.source.jobId,
    qualifiedPixels:q.studyArea.candidatePixelsCoherenceAtLeast07,
    validLandPhasePixels:q.studyArea.landWithValidUnwrappedPhaseAndCoherence,
    portCoherence:q.portLocator.coherence,portPhaseNoData:true},
  scientificGates:{measured2026PortSubsidence:false,verifiedVerticalMmPerYear:false,
    portOperationalRiskRanking:false}
 };
}
export function createHistoricalRangeRows(historical,filter="all"){
 const rows=filterHistoricalSectors(historical,filter);
 return rows.map(s=>({
  id:s.id,name:s.name,type:s.type,minCm:s.minCm,maxCm:s.maxCm,
  leftPercent:100*s.minCm/140,widthPercent:100*(s.maxCm-s.minCm)/140,
  currentCondition:"UNKNOWN",geometryAvailable:false
 }));
}

const get=id=>document.getElementById(id);
const fmt=value=>Number(value).toLocaleString("id-ID",{maximumFractionDigits:2});
const label=(id,value)=>{const target=get(id);if(target)target.textContent=String(value);};
const escape=v=>String(v??"").replace(/[&<>"']/g,c=>
 ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function writeDownload(data){
 const text=JSON.stringify(data,null,2)+"\n";
 const link=document.createElement("a");
 const url=URL.createObjectURL(new Blob([text],{type:"application/json"}));
 link.href=url;link.download="BARUNA_Semarang_Subsidence_Evidence.json";
 document.body.appendChild(link);link.click();link.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),900);
}
function showSectorDetail(h,id){
 const item=h.sectors.find(s=>s.id===id);
 if(!item)return;
 label("selected-name",item.name);
 label("selected-range",fmt(item.minCm)+"–"+fmt(item.maxCm)+" cm");
 label("selected-type",item.type+" · 2005 · cumulative");
 label("selected-evidence","Bukti nyata dari levelling historis yang dipublikasikan. Bukan laju tahunan atau kondisi 2026. Koordinat persis sektor tidak tersedia sehingga tidak ditempatkan sebagai pin peta.");
 const badges=get("selected-gaps");
 badges.replaceChildren();
 for(const text of ["Geometri aset belum terverifikasi","Pengukuran terkini belum tersedia","Risiko operasional belum dapat dinilai"]){
  const node=document.createElement("span");node.textContent=text;badges.append(node);
 }
}
function renderBars(h,filter="all"){
 const rows=createHistoricalRangeRows(h,filter);
 const parent=get("historic-bars");parent.replaceChildren();
 if(!rows.length)return;
 const max=140;
 for(const item of rows){
  const button=document.createElement("button");
  button.className="hist-row";button.type="button";button.dataset.sector=item.id;
  button.setAttribute("aria-label",item.name+" · historical cumulative settlement "+item.minCm+" to "+item.maxCm+" centimetres");
  const title=document.createElement("span");title.className="hist-title";
  title.innerHTML="<strong>"+escape(item.name)+"</strong><small>"+escape(item.type)+"</small>";
  const track=document.createElement("span");track.className="hist-track";
  const fill=document.createElement("span");fill.className="hist-fill";
  fill.style.left=(item.minCm/max*100)+"%";
  fill.style.width=((item.maxCm-item.minCm)/max*100)+"%";
  track.appendChild(fill);
  const number=document.createElement("span");number.className="hist-number";
  number.textContent=item.minCm+"–"+item.maxCm+" cm";
  button.append(title,track,number);button.addEventListener("click",()=>{
   for(const el of parent.querySelectorAll("button"))el.setAttribute("aria-pressed","false");
   button.setAttribute("aria-pressed","true");showSectorDetail(h,item.id);
  });
  parent.appendChild(button);
 }
 const first=parent.querySelector("button");first?.click();
}
async function boot(){
 try{
  const entries=Object.entries(ATLAS_SOURCES);
  const responses=await Promise.all(entries.map(([,url])=>fetch(url,{cache:"no-store"})));
  if(responses.some(r=>!r.ok))throw Error("Data evidence belum tersedia pada build ini");
  const docs=await Promise.all(responses.map(r=>r.json()));
  const data=Object.fromEntries(entries.map(([name],i)=>[name,docs[i]]));
  const h=validateHistoricalFieldEvidence(data.historical);
  const q=validateRealInsarQa(data.radar);
  const r=validateRegionalPublishedFinding(data.regional);
  const exportDoc=atlasEvidenceSummary(h,q,r);
  label("historical-count",h.sectors.length+" sektor");
  label("regional-rate",r.maximumRangeMmPerYear.join("–")+" mm/tahun");
  label("radar-coverage",fmt(q.studyArea.candidateShareOfValidLandPct)+"%");
  label("radar-qualified",fmt(q.studyArea.candidatePixelsCoherenceAtLeast07)+" / "+
    fmt(q.studyArea.landWithValidUnwrappedPhaseAndCoherence));
  label("radar-port",fmt(q.portLocator.coherence));
  label("radar-radius","500 m: "+q.portLocator.qualified500m+" / "+q.portLocator.gridPixels500m+
    " lolos QC · 1 km: "+q.portLocator.qualified1000m+" / "+q.portLocator.gridPixels1000m+" lolos QC");
  label("radar-id",q.source.jobId);
  const progress=get("radar-valid-bar");progress.style.width=q.studyArea.candidateShareOfValidLandPct+"%";
  const sourceA=get("historic-source-link");sourceA.href=h.publication.url;
  const regionalA=get("regional-source-link");regionalA.href=r.publication.url;
  const filters=get("sector-filters");
  filters.addEventListener("click",event=>{
   const button=event.target.closest("button[data-filter]");
   if(!button)return;
   for(const el of filters.querySelectorAll("button"))el.setAttribute("aria-pressed",String(el===button));
   renderBars(h,button.dataset.filter);
  });
  renderBars(h);
  get("export-evidence").disabled=false;
  get("export-evidence").addEventListener("click",()=>writeDownload(exportDoc));
  label("atlas-status","3 sumber terverifikasi · batas ilmiah aktif");
  document.body.dataset.sourceState="ready";
 }catch(error){
  document.body.dataset.sourceState="error";
  label("atlas-status","DATA UNAVAILABLE · source check failed");
  label("historic-bars","Gagal memvalidasi sumber asli. Angka penelitian tidak ditampilkan.");
  label("selected-evidence","Halaman tidak memuat angka dari sumber yang gagal.");
  get("export-evidence").disabled=true;
 }
}
if(typeof document!=="undefined"){
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
 else void boot();
}
