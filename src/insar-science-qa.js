/** Source-labelled ASF HyP3 QA snapshot. Never infer a deformation value from coherence or phase. */
export const INSAR_QA_SOURCE="./data/semarang-insar-science-qa.json";
const fail=reason=>{throw new TypeError("InSAR science QA rejected: "+reason);};
export function validateInsarScienceQa(d){
 if(d?.schema!=="baruna-hyp3-insar-science-qa-v1"||
    d.provenance!=="REPORTED_SCIENCE_QA_NOT_INDEPENDENTLY_RECOMPUTED_IN_WEB_APP"||
    d.source?.provider!=="ASF DAAC HyP3"||
    d.source.processing!=="INSAR_ISCE_BURST"||
    !/^[a-f0-9]{64}$/.test(d.source.archiveSha256||"")||
    !/^[0-9a-f-]{36}$/.test(d.source.jobId||"")||
    d.source.referenceDate!=="2026-10-02"||
    d.source.secondaryDate!=="2026-10-14"||d.source.intervalDays!==12||
    d.source.pixelSpacingMeters!==80||d.source.outputCRS!=="EPSG:32749"||
    JSON.stringify(d.aoiEpsg4326)!==JSON.stringify([110.375,-7.025,110.485,-6.875]))
   fail("identity, processing or provenance");
 const q=d.quality,p=d.bigPortReference,g=d.scientificGates;
 if(!q||q.aoiPixelCount!==31464||q.validLandUnwrappedPhasePixels!==16542||
    q.qualifiedMainComponentPixels!==15105||q.coherenceThreshold!==0.7||
    q.mainComponentLabel!==1||q.medianCoherenceOnValidLandPhase!==0.978||
    q.qualifiedMainComponentPixels>q.validLandUnwrappedPhasePixels||
    q.validLandUnwrappedPhasePixels>q.aoiPixelCount)
   fail("quality count or threshold");
 if(!p||p.source!=="BIG RBI Pelabuhan (Titik), layer 861"||
    p.longitude!==110.42332243||p.latitude!==-6.93749333||
    p.coherence!==0.342||p.waterMaskValue!==0||
    p.unwrappedPhase!=="NODATA"||p.surveyedAssetPoint!==false||
    p.within500m?.passed!==0||p.within500m.checked!==122||
    p.within1000m?.passed!==3||p.within1000m.checked!==489)
   fail("port locator or masked no-data status");
 if(!g||g.processedRadarQaAvailable!==true||
    g.geocodedRasterValidatedInSourceReview!==true||
    g.assetSpecificDeformationValidated!==false||
    g.annualVerticalSubsidenceValidated!==false||
    g.operationalRiskRankingAllowed!==false||g.publishedMapRasterIncluded!==false)
   fail("scientific guardrail");
 return d;
}
export function insarQaForExport(doc){
 if(!doc)return {status:"UNAVAILABLE",validatedSubsidence:false,operationalRiskRankingAllowed:false};
 const d=validateInsarScienceQa(doc);
 return {status:"REAL_PROCESSED_RADAR_QA_RESEARCH_ONLY",
   source:d.source,asOf:d.asOf,provenance:d.provenance,
   aoiEpsg4326:d.aoiEpsg4326,quality:d.quality,
   bigPortReference:d.bigPortReference,scientificGates:d.scientificGates,
   limitations:d.limitations,validatedSubsidence:false,operationalRiskRankingAllowed:false};
}
export function renderInsarScienceQa(d,root=document){
 const q=validateInsarScienceQa(d),get=id=>root.getElementById(id);
 const frac=(100*q.quality.qualifiedMainComponentPixels/q.quality.validLandUnwrappedPhasePixels).toFixed(1);
 if(get("insar-qa-status"))get("insar-qa-status").textContent="REAL PROCESSED · RESEARCH ONLY";
 if(get("insar-qa-pair"))get("insar-qa-pair").textContent="Sentinel-1 VV · 2–14 Okt 2026 · 12 hari · 80 m";
 if(get("insar-qa-coherence"))get("insar-qa-coherence").textContent=q.quality.medianCoherenceOnValidLandPhase.toFixed(3);
 if(get("insar-qa-qualified"))get("insar-qa-qualified").textContent=frac+"%";
 if(get("insar-qa-qualified-detail"))get("insar-qa-qualified-detail").textContent=
   q.quality.qualifiedMainComponentPixels.toLocaleString("id-ID")+" / "+
   q.quality.validLandUnwrappedPhasePixels.toLocaleString("id-ID")+
   " piksel darat + fase valid · threshold coherence ≥ 0,7";
 if(get("insar-qa-port"))get("insar-qa-port").textContent=
   "Coherence "+q.bigPortReference.coherence.toFixed(3)+" · unwrapped phase NoData";
 if(get("insar-qa-port-coverage"))get("insar-qa-port-coverage").textContent=
   q.bigPortReference.within500m.passed+" / "+q.bigPortReference.within500m.checked+
   " piksel lolos dalam 500 m; "+q.bigPortReference.within1000m.passed+" / "+
   q.bigPortReference.within1000m.checked+" dalam 1 km.";
 if(get("insar-qa-source"))get("insar-qa-source").textContent=
   "ASF HyP3 "+q.source.processing+" · "+q.source.outputCRS+" · "+q.provenance+
   " · Tidak ada TIFF dipublikasikan di workspace.";
}
export async function loadInsarScienceQa(root=document,loader=fetch){
 try{
  const response=await loader(INSAR_QA_SOURCE,{cache:"no-store"});
  if(!response.ok)throw new Error("QA manifest unavailable");
  const doc=validateInsarScienceQa(await response.json());
  renderInsarScienceQa(doc,root);
  return doc;
 }catch(error){
  const status=root.getElementById("insar-qa-status");
  if(status)status.textContent="EVIDENCE UNAVAILABLE";
  const source=root.getElementById("insar-qa-source");
  if(source)source.textContent="Manifest QA gagal dimuat atau tidak lolos validasi; jangan mengutip angka InSAR di halaman ini.";
  return null;
 }
}
