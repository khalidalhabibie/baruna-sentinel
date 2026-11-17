/**
 * Public ASF Sentinel-1 IW SLC discovery snapshot for the Semarang case study.
 * Catalog candidates are NOT burst-compatible InSAR pairs or deformation results.
 * No protected RINEX, receiver location or user-local metadata are loaded.
 */
export const INSAR_REVIEW_SOURCE="./data/semarang-s1-insar-candidate-review.json";
const fail=reason=>{throw new TypeError("Insar discovery rejected: "+reason);};
function validDate(date) {
 return typeof date==="string"&&/^\d{4}-\d\d-\d\d$/.test(date)&&
   Number.isFinite(Date.parse(date+"T00:00:00Z"));
}
function dateOfScene(scene){
 if(typeof scene!=="string")return null;
 const match=scene.match(/^S1([ABCD])_IW_SLC__\S+?_(\d{8})T\d{6}_/);
 if(!match)return null;
 const d=match[2];
 const date=d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8);
 return validDate(date)?{platform:match[1],date}:null;
}
export function validateInsarCandidateReview(review){
 if(review?.schema!=="baruna-sentinel1-insar-discovery-review-v1" ||
    review.sourceCompleteness!=="SNAPSHOT_SUMMARY_NOT_FULL_CATALOGUE" ||
    !review.source?.includes("IW SLC") ||
    review.sourceUrl!=="https://api.daac.asf.alaska.edu/services/search/param" ||
    !validDate(review.searchStart)||!validDate(review.searchEnd)||
    review.searchStart>review.searchEnd||
    !Array.isArray(review.aoiEpsg4326)||
    JSON.stringify(review.aoiEpsg4326)!==JSON.stringify([110.375,-7.025,110.485,-6.875]))
   fail("identity, scope, dates or AOI");
 if(!Number.isInteger(review.matchingScenes)||review.matchingScenes<2||
    !Number.isInteger(review.candidatePairs)||review.candidatePairs<1||
    !Array.isArray(review.samplePairs)||review.samplePairs.length<1||
    review.samplePairCount!==review.samplePairs.length||
    review.samplePairCount>review.candidatePairs||
    review.samplePairCount>10) fail("candidate counts");
 const gates=review.scientificGates,verified=review.verifiedProcessing;
 if(!gates||gates.insarDisplacementProduced!==false||
    gates.annualSubsidenceMeasured!==false||
    gates.operationalAssetRankingAllowed!==false||
    !verified||Object.values(verified).some(x=>x!==false)||
    !["commonBurst","perpendicularBaseline","coherence","interferogram","unwrappedPhase","groundValidation"]
      .every(k=>verified[k]===false))fail("scientific gates");
 const duplicate=new Set();
 for(const pair of review.samplePairs){
  const a=dateOfScene(pair.referenceScene),b=dateOfScene(pair.secondaryScene);
  if(!a||!b||a.platform!==b.platform||
     a.date<review.searchStart||b.date>review.searchEnd||
     pair.pairStatus!=="CANDIDATE_ONLY_BURST_BASELINE_UNVERIFIED"||
     !Number.isFinite(pair.daysApart)||pair.daysApart<5||pair.daysApart>48||
     Math.abs((Date.parse(b.date+"T00:00:00Z")-Date.parse(a.date+"T00:00:00Z"))/86400000-
     pair.daysApart)>1.1||
     duplicate.has(pair.referenceScene+"|"+pair.secondaryScene))fail("pair metadata");
  duplicate.add(pair.referenceScene+"|"+pair.secondaryScene);
 }
 return review;
}
export function insarSnapshotForExport(candidate){
 if(!candidate)return {status:"UNAVAILABLE",insarDisplacementProduced:false};
 const doc=validateInsarCandidateReview(candidate);
 return {status:"SLC_METADATA_CANDIDATES_ONLY",source:doc.source,
  sourceUrl:doc.sourceUrl,searchStart:doc.searchStart,searchEnd:doc.searchEnd,
  matchingScenes:doc.matchingScenes,candidatePairs:doc.candidatePairs,
  samplePairCount:doc.samplePairCount,
  burstAndBaselineVerified:false,insarDisplacementProduced:false,
  annualSubsidenceMeasured:false,operationalAssetRankingAllowed:false};
}
function sceneDate(scene){
 const day=dateOfScene(scene)?.date;
 if(!day)return "Tidak diketahui";
 return new Date(day+"T12:00:00Z").toLocaleDateString("id-ID",{
  timeZone:"UTC",day:"numeric",month:"short",year:"numeric"});
}
export function renderInsarCandidateReview(doc,root=document){
 const status=root.getElementById("insar-review-status");
 const metrics=root.getElementById("insar-review-summary");
 const examples=root.getElementById("insar-review-pairs");
 const limits=root.getElementById("insar-review-limits");
 if(!status||!metrics||!examples||!limits)return;
 const review=validateInsarCandidateReview(doc);
 status.textContent="Kandidat riset · bukan deformasi";
 metrics.textContent=review.matchingScenes+" Sentinel-1 IW SLC scene · "+
   review.candidatePairs+" kandidat pasangan · "+review.samplePairCount+
   " contoh ditampilkan dari snapshot tersimpan ("+review.searchStart+" – "+review.searchEnd+")";
 examples.replaceChildren();
 for(const pair of review.samplePairs){
  const li=root.createElement("li");
  const dates=root.createElement("strong");
  dates.textContent=sceneDate(pair.referenceScene)+" → "+sceneDate(pair.secondaryScene);
  const note=root.createElement("span");
  note.textContent="Jeda "+pair.daysApart+" hari · burst/baseline belum diverifikasi";
  li.append(dates,note);examples.appendChild(li);
 }
 limits.textContent="Arsip pencarian SLC ini hanya memuat kandidat sebelum pemrosesan. "+
  "Hasil ASF HyP3 2–14 Oktober 2026 tersedia pada panel QA di atas, tetapi belum memvalidasi "+
  "perpindahan LOS, penurunan tanah tahunan, atau ranking risiko aset.";
}
export async function loadInsarCandidateReview(root=document,loader=fetch){
 try{
  const response=await loader(INSAR_REVIEW_SOURCE,{cache:"no-store"});
  if(!response.ok)throw Error("file riset tidak ditemukan");
  const doc=validateInsarCandidateReview(await response.json());
  renderInsarCandidateReview(doc,root);
  return doc;
 }catch(error){
  const status=root.getElementById("insar-review-status");
  const metrics=root.getElementById("insar-review-summary");
  if(status)status.textContent="Belum tersedia";
  if(metrics)metrics.textContent="Kandidat InSAR belum bisa diverifikasi: "+String(error.message||error);
  return null;
 }
}
