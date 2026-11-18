/**
 * Source-traced public ASF Sentinel-1 BURST readiness for the Semarang AOIs.
 * This is METADATA ONLY plus a separate prior HyP3 QA manifest. No displacement
 * layer, annual rate, structural risk or synthetic values are generated.
 */
import {validateRealInsarQa} from "./real-hyp3-insar.js";

export const INSAR_NETWORK_SOURCE="./data/semarang-asf-burst-network-20261118.json";
export const INSAR_QA_SOURCE="./data/semarang-real-hyp3-insar-qa.json";
export const INSAR_NUMERIC_BASELINE_SOURCE="./data/semarang-asf-15-baseline-candidates-20261118.json";
export const INSAR_AOI_PIXEL_QA_SOURCE="./data/semarang-hyp3-aoi-pixel-screening-20261118.json";
const BURST="076_162214_IW2";
const REF="a96410b0-1418-4e8b-a191-ab6f40e3e615";
const SCENE=/^S1_162214_IW2_(\d{8})T\d{6}_VV_[0-9A-F]{4}-BURST$/;
const fail=why=>{throw new TypeError("ASF burst readiness rejected: "+why);};
const isoDay=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&
 Number.isFinite(Date.parse(d+"T00:00:00Z"))&&new Date(d+"T00:00:00Z").toISOString().slice(0,10)===d;
const days=(a,b)=>(Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000;

export function validateInsarNetwork(doc){
 if(doc?.schema!=="baruna-public-asf-burst-preflight-live-snapshot-v1"||
    doc.retrievedOn!=="2026-11-18"||
    doc.dataset!=="SLC-BURST"||doc.sourceResponseHttpStatus!==200||
    doc.source!=="NASA ASF SAR Search API"||
    typeof doc.sourceQuery!=="string"||
    !doc.sourceQuery.startsWith("https://api.daac.asf.alaska.edu/services/search/param?")||
    doc.targetFullBurstID!==BURST||doc.flightDirection!=="DESCENDING"||
    doc.polarization!=="VV"||doc.platform!=="SENTINEL-1D"||
    doc.searchStart!=="2026-07-20"||doc.searchEnd!=="2026-11-17"||
    JSON.stringify(doc.queryPointWgs84)!==JSON.stringify([110.42,-6.945])||
    doc.sourceFeaturesReturned!==40||doc.distinctTargetBurstVVRecords!==9)
  fail("source identity and provenance");

 if(!Array.isArray(doc.scenes)||doc.scenes.length!==9||
    !Array.isArray(doc.adjacentCandidatePairs)||doc.adjacentCandidatePairs.length!==8||
    doc.candidateTemporalPairsWithin48Days!==25)
  fail("catalog record counts");
 const seenNames=new Set(),dates=[];
 for(const scene of doc.scenes){
  const match=SCENE.exec(scene.sceneName??"");
  if(!match||scene.fullBurstID!==BURST||scene.polarization!=="VV"||
     scene.direction!=="DESCENDING"||
     scene.sourceRole!=="PUBLIC_CATALOG_METADATA_ONLY"||
     !isoDay(scene.date)||match[1]!==scene.date.replaceAll("-","")||
     scene.date<doc.searchStart||scene.date>doc.searchEnd||
     seenNames.has(scene.sceneName)||
     (dates.length&&scene.date<=dates[dates.length-1]))fail("scene chronology and identity");
  dates.push(scene.date);seenNames.add(scene.sceneName);
 }
 for(let i=0;i<8;i++){
  const p=doc.adjacentCandidatePairs[i],gap=days(dates[i],dates[i+1]);
  if(p?.referenceDate!==dates[i]||p.secondaryDate!==dates[i+1]||
     p.referenceBurst!==doc.scenes[i].sceneName||
     p.secondaryBurst!==doc.scenes[i+1].sceneName||
     gap!==p.daysApart||(gap!==12&&gap!==24)||
     p.type!=="TEMPORAL_CANDIDATE_SAME_FULL_BURST_ID_ONLY"||
     p.baselineValidated!==false||p.coherenceValidated!==false||
     p.processedInterferogram!==false)
    fail("network edge scientific readiness");
 }
 const net=doc.network;
 if(net?.nineAcquisitions!==true||net.eightAdjacentTemporalLinks!==true||
    net.connectedByTime!==true||net.geodeticProcessingNetworkVerified!==false||
    net.shortestDaysApart!==12||net.longestAdjacentDaysApart!==24)
  fail("network status");

 const points=doc.footprintAssessment;
 const expectedIds=new Set(["aoi-seed-tanjung-emas","aoi-seed-terboyo-industry","aoi-seed-kaligawe-road"]);
 if(!points||typeof points.method!=="string"||!points.method.includes("point-in-polygon")||
    !Array.isArray(points.centers)||points.centers.length!==3)
  fail("AOI point provenance");
 for(const center of points.centers){
  if(!expectedIds.delete(center.aoiId)||
     !Array.isArray(center.coordinateWgs84)||center.coordinateWgs84.length!==2||
     center.coordinateWgs84.some(v=>typeof v!=="number"||!Number.isFinite(v))||
     center.footprintsContainingCenter!==9||center.totalBursts!==9)
   fail("AOI indicative coverage");
 }
 if(expectedIds.size)fail("AOI source set incomplete");

 const prior=doc.existingProcessedPair,g=doc.scienceGates;
 if(prior?.referenceDate!=="2026-10-02"||prior.secondaryDate!=="2026-10-14"||
    prior.jobId!==REF||
    prior.status!=="EARLIER_SINGLE_PAIR_HYP3_QA_SNAPSHOT_EXISTS_ORIGINAL_ZIP_NOT_REVERIFIED"||
    !g||g.commonFullBurstIdFromPublicAsf!==true||
    Object.entries(g).some(([k,value])=>k!=="commonFullBurstIdFromPublicAsf"&&value!==false)||
    !["perpendicularBaselineValidated","coherenceValidated","timeSeriesProcessed",
      "displacementValidated","independentGnssValidation","annualVerticalRateAvailable",
      "assetRiskRankingAllowed"].every(key=>g[key]===false))
  fail("scientific no-go gates");
 return doc;
}

export function insarReadinessSummary(source,priorQA){
 const doc=validateInsarNetwork(source);
 const qa=validateRealInsarQa(priorQA);
 if(qa.source.jobId!==doc.existingProcessedPair.jobId||
    qa.source.fullBurstID!==doc.targetFullBurstID||
    qa.source.referenceDate!==doc.existingProcessedPair.referenceDate||
    qa.source.secondaryDate!==doc.existingProcessedPair.secondaryDate)
  fail("archive QA disagrees with ASF network");
 return Object.freeze({
  status:"METADATA_NETWORK_ONLY",
  acquisitions:doc.scenes.length,
  adjacentCandidatePairs:doc.adjacentCandidatePairs.length,
  priorSinglePairQaSummaries:1,
  originalZipReverified:false,
  aoiCenterFootprintCount:doc.footprintAssessment.centers.length,
  portLocatorCoherence:qa.portLocator.coherence,
  portQualifiedWithin500m:qa.portLocator.qualified500m,
  portPixelsWithin500m:qa.portLocator.gridPixels500m,
  temporalNetworkValidated:false,
  multiTemporalLosValidated:false,
  annualSubsidenceMmYear:null,
  infrastructureRiskRank:null,
  candidateEdges:doc.adjacentCandidatePairs.map(p=>({start:p.referenceDate,end:p.secondaryDate,gap:p.daysApart}))
 });
}


/** Review source-derived 15 numeric orbit baselines and ONE actual processed pair. */
export function validateSourcedAoiReadiness(baselines,aoiEvidence){
 if(baselines?.schema!=="baruna-real-asf-15-candidate-baselines-v1"||
    baselines.fullBurstId!==BURST||baselines.catalogScenes!==9||
    baselines?.summary?.chronologicalSourceBaselinesConfirmed!==8||
    baselines?.summary?.additionalPotentialLoopSourceBaselinesConfirmed!==7||
    !Array.isArray(baselines.adjacentEdges)||baselines.adjacentEdges.length!==8||
    !Array.isArray(baselines.twoStepRedundantEdges)||baselines.twoStepRedundantEdges.length!==7||
    baselines.summary.existingProcessedInterferograms!==1||
    baselines.minimumPilot?.minimumAdditionalJobsIfApproved!==2||
    baselines.minimumPilot.costEstimateCredits!==null||
    baselines.scientificGates?.phaseClosureMeasured!==false||
    baselines.scientificGates?.MintPyLOSTimeSeriesAvailable!==false||
    baselines.scientificGates?.annualVerticalRateAvailable!==false||
    baselines.scientificGates?.operationalRiskRankAllowed!==false)
  fail("source baseline, processing and science gates");
 const expected=new Set(["aoi-seed-tanjung-emas","aoi-seed-terboyo-industry","aoi-seed-kaligawe-road"]);
 const observed=new Map();
 for(const pair of [...baselines.adjacentEdges,...baselines.twoStepRedundantEdges]){
  if(typeof pair.referenceDate!=="string"||typeof pair.secondaryDate!=="string"||
     pair.sourceStatus!=="NUMERIC_BASELINE_AVAILABLE_REVIEW_REQUIRED"||
     !Number.isFinite(pair.asfPerpendicularBaselineMeters)||
     ![12,24,36].includes(pair.temporalDays)||
     days(pair.referenceDate,pair.secondaryDate)!==pair.temporalDays)
    fail("unverified baseline edge");
  if(pair.processedAsHyP3){
    if(pair.referenceDate!=="2026-10-02"||pair.secondaryDate!=="2026-10-14")
      fail("unapproved processing provenance");
  }
  const key=pair.referenceDate+"/"+pair.secondaryDate;
  if(observed.has(key))fail("duplicate baseline pair");
  observed.set(key,pair);
 }
 if([...observed.values()].filter(x=>x.processedAsHyP3).length!==1)
  fail("source product count");
 if(aoiEvidence?.schema!=="baruna-hyp3-real-aoi-pixel-screening-v1"||
    aoiEvidence.source?.product!=="S1_162214_IW2_20261002_20261014_VV_INT80_5087"||
    aoiEvidence.source?.localAuditStatusOperatorReported!=="PASS_ARCHIVE_INTEGRITY_AND_RASTER_METADATA"||
    aoiEvidence.source?.geocodedEpsg!==32749||
    aoiEvidence.source?.geocodedPixelSpacingMeters!==80||
    !Array.isArray(aoiEvidence.aoiResults)||aoiEvidence.aoiResults.length!==3||
    aoiEvidence.portLocator?.insideIllustrativeTanjungEmasPolygon!==false||
    aoiEvidence.portLocator?.unwrappedPhaseValid!==false||
    aoiEvidence.scientificGates?.multitemporalLOSTimeSeries!==false||
    aoiEvidence.scientificGates?.annualVerticalSubsidenceAvailable!==false||
    aoiEvidence.scientificGates?.infrastructureRiskRankingAllowed!==false)
  fail("raster QA source identity or science gates");
 for(const aoi of aoiEvidence.aoiResults){
  if(!expected.delete(aoi.aoiId)||
     !Number.isInteger(aoi.landPixels)||aoi.landPixels<=0||
     !Number.isInteger(aoi.qualityPixels)||aoi.qualityPixels<0||
     aoi.qualityPixels>aoi.landPixels||
     Math.abs(100*aoi.qualityPixels/aoi.landPixels-aoi.qualityShareOfLandPct)>.011||
     !Number.isInteger(aoi.qualityClusters8Connected)||
     aoi.qualityClusters8Connected<1||
     aoi.qualityClusters8Connected>aoi.qualityPixels||
     aoi.qualityStatus?.includes("RISK"))
    fail("invalid AOI research screening statistic");
 }
 if(expected.size)fail("missing illustrative AOI pixel QA");
 return {baselines,aois:aoiEvidence.aoiResults,observed};
}

/** Three source-documented interferograms are an experiment, NOT a velocity time series. */
export function validatedKaligawePilot(baselines,qa){
 const checked=validateSourcedAoiReadiness(baselines,qa);
 const pilot=checked.baselines.minimumPilot;
 const expected=[
  ["2026-09-20","2026-10-02",12,false],
  ["2026-10-02","2026-10-14",12,true],
  ["2026-09-20","2026-10-14",24,false]
 ];
 if(pilot?.focusAoiId!=="aoi-seed-kaligawe-road"||
    pilot.minimumAdditionalJobsIfApproved!==2||
    pilot.costEstimateCredits!==null||
    JSON.stringify(pilot.dates)!==JSON.stringify(["2026-09-20","2026-10-02","2026-10-14"])||
    !Array.isArray(pilot.threeTemporalEdges)||pilot.threeTemporalEdges.length!==3)
  fail("Kaligawe three-date source pilot");
 for(let i=0;i<expected.length;i++){
  const [start,end,days,processed]=expected[i];
  const edge=pilot.threeTemporalEdges[i];
  const source=checked.observed.get(start+"/"+end);
  if(!source||edge.referenceDate!==start||edge.secondaryDate!==end||
     edge.days!==days||edge.processedProductAvailable!==processed||
     edge.asfPerpendicularBaselineMeters!==source.asfPerpendicularBaselineMeters||
     source.processedAsHyP3!==processed||
     edge.action!==(processed?"REUSE_VERIFIED_EXISTING_HYP3_INTERFEROGRAM":
      "CANDIDATE_NEW_HYP3_JOB_REQUIRES_EXPLICIT_APPROVAL"))
   fail("Kaligawe pilot pair/status does not match ASF and product QA");
 }
 const focus=checked.aois.find(x=>x.aoiId==="aoi-seed-kaligawe-road");
 if(!focus||focus.qualityPixels!==173||focus.landPixels!==178||
    focus.qualityClusters8Connected!==1||
    focus.qualityStatus!=="PREFERRED_PIXEL_QUALITY_CANDIDATE_ONLY")
  fail("Kaligawe source-screening focus is missing or altered");
 return {pilot,focus,sourceBaselinesCount:checked.baselines.summary.totalNumericCandidatePairs};
}

function renderKaligawePilot(baselines,qa,root){
 const {pilot,focus,sourceBaselinesCount}=validatedKaligawePilot(baselines,qa);
 const [first,existing,second]=pilot.threeTemporalEdges;
 const delta=edge=>(edge.asfPerpendicularBaselineMeters>0?"+":"")+
    edge.asfPerpendicularBaselineMeters+" m";
 put(root,"rk-insar-pilot-status","1 HY P3 PAIR · 2 PROCESSING PENDING".replace("HY P3","HyP3"));
 put(root,"rk-insar-existing","Produk HyP3 tersedia · ASF B⊥ "+delta(existing)+" · QA satu pasangan");
 put(root,"rk-insar-next-one","ASF B⊥ "+delta(first)+" · metadata tersedia, job belum diproses");
 put(root,"rk-insar-next-two","ASF B⊥ "+delta(second)+" · metadata tersedia, job belum diproses");
 put(root,"rk-insar-baseline-total",sourceBaselinesCount+" baseline orbit ASF terverifikasi · Kaligawe "+
    focus.qualityPixels+"/"+focus.landPixels+
    " piksel darat lolos screening QA · belum ada time-series atau laju tahunan");
 return pilot;
}

function renderActualPixelQa(baselines,qa,root){
 const verified=validateSourcedAoiReadiness(baselines,qa);
 renderKaligawePilot(baselines,qa,root);
 put(root,"rk-insar-status","SOURCE VERIFIED · SINGLE PAIR QA");
 put(root,"rk-insar-coverage","9 akuisisi nyata; baseline ASF untuk 8 pasangan berurutan + 7 alternatif sudah tersedia. Ketiganya hanya kandidat metadata, belum stack terproses.");
 put(root,"rk-insar-port","Titik kartografis BIG Tanjung Emas berada di LUAR polygon contoh pelabuhan; coherence 0,342, water-mask dan fase NoData. Jangan samakan pengukuran titik dengan screening area.");
 put(root,"rk-insar-science","ZIP asli lolos SHA/CRC dan metadata raster pada Mac. QA piksel satu pasangan tersedia; belum ada time-series LOS, laju tahunan, validasi GNSS terkini atau ranking risiko.");
 const timeline=root.getElementById("rk-insar-timeline");
 if(timeline){
  timeline.replaceChildren();
  for(const edge of verified.baselines.adjacentEdges){
   const li=root.createElement("li"),date=root.createElement("span"),meta=root.createElement("small");
   date.textContent=shortDate(edge.referenceDate)+" → "+shortDate(edge.secondaryDate);
   const bp=edge.asfPerpendicularBaselineMeters;
   meta.textContent=edge.temporalDays+" hari · ASF B⊥ "+(bp>0?"+":"")+bp+
      " m · "+(edge.processedAsHyP3?"1 produk HyP3 tersedia":"belum diproses");
   li.append(date,meta);timeline.append(li);
  }
 }
 const list=root.getElementById("rk-insar-aoi-quality");
 if(list){
  list.replaceChildren();
  for(const aoi of verified.aois){
   const li=root.createElement("li");
   const name=root.createElement("strong"),amount=root.createElement("span"),note=root.createElement("small");
   name.textContent=aoi.name.replace(" (contoh)","");
   amount.textContent=aoi.qualityPixels+"/"+aoi.landPixels+" piksel ("+
      aoi.qualityShareOfLandPct.toLocaleString("id-ID",{maximumFractionDigits:2})+"%)";
   note.textContent="Coherence ≥0,7 + fase valid · "+aoi.qualityClusters8Connected+
      " klaster, data satu pasangan saja";
   li.append(name,amount,note);list.append(li);
  }
 }
 put(root,"rk-insar-aoi-note","Kualitas data daratan, BUKAN penurunan tanah, status bahaya, atau peringkat risiko aset. AOI bersifat ilustratif.");
 return verified;
}

const put=(root,id,value)=>{const node=root.getElementById(id);if(node)node.textContent=value;};
const shortDate=day=>new Date(day+"T12:00:00Z").toLocaleDateString("id-ID",{
 timeZone:"UTC",day:"numeric",month:"short",year:"numeric"
});
export function renderInsarNetwork(source,priorQA,root=document,baselines=null,aoiEvidence=null){
 const report=insarReadinessSummary(source,priorQA);
 put(root,"rk-insar-status","METADATA READY · PROCESSING PENDING");
 put(root,"rk-insar-count",String(report.acquisitions));
 put(root,"rk-insar-edge-count",String(report.adjacentCandidatePairs));
 put(root,"rk-insar-qa-count","1");
 put(root,"rk-insar-coverage","3 area contoh: pusat polygon masuk footprint 9/9 akuisisi. Bukan bukti seluruh AOI tercakup atau piksel coherent.");
 put(root,"rk-insar-port", "Tanjung Emas: coherence "+report.portLocatorCoherence.toLocaleString("id-ID",{maximumFractionDigits:3})+
     " di titik kartografis; "+report.portQualifiedWithin500m+"/"+report.portPixelsWithin500m+
     " piksel lolos kriteria penelitian dalam radius 500 m. Fase titik pelabuhan NoData.");
 put(root,"rk-insar-science","Belum ada time-series LOS tervalidasi, laju penurunan tanah tahunan, atau ranking risiko infrastruktur. ZIP asli belum diverifikasi ulang.");
 const container=root.getElementById("rk-insar-timeline");
 if(container){
  container.replaceChildren();
  for(const edge of report.candidateEdges){
   const li=root.createElement("li");
   const date=root.createElement("span");
   date.textContent=shortDate(edge.start)+" → "+shortDate(edge.end);
   const status=root.createElement("small");
   status.textContent=edge.gap+" hari · kandidat, baseline belum diverifikasi";
   li.append(date,status);container.append(li);
  }
 }
 if(baselines!==null&&aoiEvidence!==null)renderActualPixelQa(baselines,aoiEvidence,root);
 return report;
}
export async function loadInsarNetwork(root=document,loader=fetch){
 try{
  const results=await Promise.all([INSAR_NETWORK_SOURCE,INSAR_QA_SOURCE,INSAR_NUMERIC_BASELINE_SOURCE,INSAR_AOI_PIXEL_QA_SOURCE].map(path=>loader(path,{cache:"no-store"})));
  if(results.some(response=>!response.ok))throw new Error("Dokumen sumber ASF/HyP3 tidak tersedia");
  const [source,qa,baselines,pixels]=await Promise.all(results.map(x=>x.json()));
  return renderInsarNetwork(source,qa,root,baselines,pixels);
 }catch(error){
  put(root,"rk-insar-status","SOURCE UNAVAILABLE");
  put(root,"rk-insar-pilot-status","SOURCE UNAVAILABLE");
  for(const id of ["rk-insar-existing","rk-insar-next-one","rk-insar-next-two"])
   put(root,id,"Sumber InSAR belum tersedia di deployment ini");
  put(root,"rk-insar-baseline-total","Status pemrosesan tidak dapat diverifikasi sampai data sumber tersedia.");

  put(root,"rk-insar-count","—");put(root,"rk-insar-edge-count","—");
  put(root,"rk-insar-qa-count","—");
  put(root,"rk-insar-coverage","Sumber belum dapat diverifikasi. Tidak ada klaim cakupan atau pemrosesan.");
  put(root,"rk-insar-port","QA lokasi pelabuhan tidak tersedia.");
  put(root,"rk-insar-science","Data InSAR tidak dapat diverifikasi. Ranking deformasi dan risiko tetap tidak tersedia.");
  const container=root.getElementById("rk-insar-timeline");
  if(container)container.replaceChildren();
  const list=root.getElementById("rk-insar-aoi-quality");
  if(list)list.replaceChildren();
  put(root,"rk-insar-aoi-note","Sumber screening tidak tersedia atau tidak lolos validasi.");
  return null;
 }
}
