/**
 * Authenticated ASF HyP3 single-burst InSAR QA snapshot.
 *
 * Displays real source provenance and research screening coverage. Does NOT
 * calculate or imply verified asset movement, subsidence, flooding or risk.
 * No mock phase or fabricated raster overlay is created from summary values.
 */
export const REAL_INSAR_QA_SOURCE="./data/semarang-real-hyp3-insar-qa.json";
const EXPECTED_AOI=[110.375,-7.025,110.485,-6.875];
const fail=what=>{throw new TypeError("Real HyP3 QA evidence rejected: "+what);};
const isNumber=value=>typeof value==="number"&&Number.isFinite(value);

export function validateRealInsarQa(doc){
 if(doc?.schema!=="baruna-real-hyp3-insar-qa-v1" ||
    doc.evidenceStatus!=="REAL_HYP3_PROCESSED_RESEARCH_SCREENING_ONLY" ||
    !doc.source || doc.source.officialService!=="ASF DAAC HyP3" ||
    doc.source.jobId!=="a96410b0-1418-4e8b-a191-ab6f40e3e615" ||
    doc.source.referenceDate!=="2026-10-02" ||
    doc.source.secondaryDate!=="2026-10-14" ||
    doc.source.fullBurstID!=="076_162214_IW2" ||
    doc.source.spatialResolutionMeters!==80 ||
    doc.source.crs!=="EPSG:32749" ||
    doc.source.usesBIGDEMNAS!==false ||
    doc.source.referenceDem!=="Copernicus GLO-30" ||
    !/^[a-f0-9]{64}$/.test(doc.source.sha256??""))
   fail("provenance");
 const a=doc.studyArea,port=doc.portLocator,g=doc.scientificGates;
 if(!a || JSON.stringify(a.bboxEPSG4326)!==JSON.stringify(EXPECTED_AOI) ||
    !Number.isInteger(a.totalPixels)||a.totalPixels<=0 ||
    !Number.isInteger(a.landWithValidUnwrappedPhaseAndCoherence) ||
    !Number.isInteger(a.candidatePixelsCoherenceAtLeast07) ||
    a.candidatePixelsCoherenceAtLeast07<0 ||
    a.candidatePixelsCoherenceAtLeast07>a.landWithValidUnwrappedPhaseAndCoherence ||
    a.landWithValidUnwrappedPhaseAndCoherence>a.totalPixels ||
    !isNumber(a.candidateShareOfValidLandPct) ||
    Math.abs(100*a.candidatePixelsCoherenceAtLeast07/
      a.landWithValidUnwrappedPhaseAndCoherence-a.candidateShareOfValidLandPct)>.02 ||
    a.thresholdIsResearchScreeningNotAccuracyGuarantee!==true)
   fail("AOI counts or screening denominator");
 if(!port || port.source!=="BIG RBI Pelabuhan Titik layer 861" ||
    port.isSurveyedAsset!==false ||
    JSON.stringify(port.wgs84)!==JSON.stringify([110.42332243,-6.93749333]) ||
    !isNumber(port.coherence) || port.coherence<0 || port.coherence>1 ||
    port.unwrappedPhaseRadians!==null || port.waterMask!==0 ||
    port.qualified500m!==0 || port.gridPixels500m!==122 ||
    port.qualified1000m!==3 || port.gridPixels1000m!==489 ||
    port.qcStatus!=="INSUFFICIENT_INSAR_EVIDENCE_AT_PORT")
   fail("port QC and source");
 if(!g || g.genuineHyP3Product!==true ||
    g.coherenceScreeningAvailable!==true ||
    ["verifiedPortDisplacement","verifiedVerticalSubsidence","annualRateAvailable",
     "assetRiskRankingAllowed","stableReferenceVerified","GNSSCrossValidation",
     "atmosphericCorrectionsVerified"].some(k=>g[k]!==false) ||
    !Array.isArray(doc.availableEvidence) ||
    !["coherence","unwrapped_phase","connected_components","water_mask"]
     .every(x=>doc.availableEvidence.includes(x)))
   fail("scientific gates");
 return doc;
}

export function insarQaSnapshotForExport(doc){
 if(!doc)return {status:"REAL_INSAR_QA_NOT_LOADED",annualVerticalSubsidenceRate:null};
 const qa=validateRealInsarQa(doc);
 return {
  status:qa.evidenceStatus,
  sourceSha256:qa.source.sha256,jobId:qa.source.jobId,
  dates:[qa.source.referenceDate,qa.source.secondaryDate],
  crs:qa.source.crs,gridSpacingMeters:qa.source.spatialResolutionMeters,
  sourceDem:qa.source.referenceDem,
  AOIPixelCount:qa.studyArea.totalPixels,
  screenedValidLandPhasePixels:qa.studyArea.landWithValidUnwrappedPhaseAndCoherence,
  coherenceThreshold07CandidatePixels:qa.studyArea.candidatePixelsCoherenceAtLeast07,
  candidatePctOfValidLandPhase:qa.studyArea.candidateShareOfValidLandPct,
  portCoherence:qa.portLocator.coherence,
  portUnwrappedPhaseRadians:null,
  portQC:qa.portLocator.qcStatus,
  annualVerticalSubsidenceRate:null,
  validatedPortLOSDisplacement:null,
  assetRiskRankingAllowed:false,
  scientificGates:qa.scientificGates
 };
}

const text=(root,id,value)=>{
 const element=root.getElementById(id);
 if(element)element.textContent=value;
};
export function renderRealInsarQa(doc,root=document){
 const qa=validateRealInsarQa(doc);
 const a=qa.studyArea,port=qa.portLocator;
 text(root,"real-insar-status","REAL PRODUCT · QA ONLY");
 text(root,"real-insar-pair","2–14 Oktober 2026 · Sentinel-1 VV descending · 80 m");
 text(root,"real-insar-source","ASF HyP3 / ISCE2 · "+qa.source.referenceDem+" · EPSG:32749");
 text(root,"real-insar-coverage",
      Number(a.candidateShareOfValidLandPct).toLocaleString("id-ID",{maximumFractionDigits:1})+"%");
 text(root,"real-insar-denominator",
      a.candidatePixelsCoherenceAtLeast07.toLocaleString("id-ID")+" / "+
      a.landWithValidUnwrappedPhaseAndCoherence.toLocaleString("id-ID")+
      " piksel daratan dengan fase valid, bukan seluruh AOI");
 text(root,"real-insar-port-coherence",
      port.coherence.toLocaleString("id-ID",{maximumFractionDigits:3}));
 text(root,"real-insar-port-status","Insufficient InSAR Evidence · fase NoData / water-masked");
 text(root,"real-insar-radius","Radius 500 m: 0 / 122 lolos QC · radius 1 km: 3 / 489");
 text(root,"real-insar-limit",
      "Satu interferogram 12 hari bukan laju penurunan tanah tahunan. Belum ada referensi GNSS, validasi atmosfer, atau geometri aset survei. Fase di titik pelabuhan NoData; jangan tampilkan mm/tahun, risiko aset atau kedalaman rob.");
 return qa;
}

export async function loadRealInsarQa(root=document,loader=fetch){
 try{
  const response=await loader(REAL_INSAR_QA_SOURCE,{cache:"no-store"});
  if(!response.ok)throw Error("metadata HyP3 QA not found");
  const doc=validateRealInsarQa(await response.json());
  renderRealInsarQa(doc,root);
  return doc;
 }catch(_error){
  text(root,"real-insar-status","QA source unavailable");
  text(root,"real-insar-pair","Bukti InSAR belum terverifikasi di build ini");
  text(root,"real-insar-limit","Tidak boleh menampilkan klaim deformasi tanpa QA sumber.");
  return null;
 }
}
