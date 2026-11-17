/** Additional *published* context. Never transform these into asset velocities or risk. */
export const ADDENDUM_SCHEMA="baruna-public-secondary-evidence-addendum-v1";
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const distance2=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
export function verifyPublicAddendum(doc){
 if(doc?.schema!==ADDENDUM_SCHEMA||doc.workspaceId!=="semarang-coastal")throw new TypeError("Unexpected BARUNA source addendum.");
 const b=doc.surveyReference,p=doc.assetExposureCase;
 if(b?.doi!=="10.32693/bomg.32.1.2017.351"||!Array.isArray(b.benchmarkPoints)||b.benchmarkPoints.length!==6)
  throw new TypeError("Published benchmark source or count not validated.");
 if(b.qa?.status!=="SOURCE_TABLE_QA_REQUIRED"||b.qa.safeToPlotAsVerifiedAssets!==false||b.qa.validForCurrentAssetGeometry!==false||
   b.qa.assetVelocityMmYr!==null||b.qa.rawTableCrossCheckedAgainstRenderedPdf!==false)
  throw new TypeError("Historical benchmark uncertainty must be retained.");
 const ids=new Set();
 for(const item of b.benchmarkPoints){
  if(ids.has(item.id)||typeof item.id!=="string"||item.localXY?.length!==2||item.utmXY?.length!==2||
   ![...item.localXY,...item.utmXY,item.elevationMReferencedToHistoricalLws].every(finite))
    throw new TypeError("Invalid published historical benchmark row.");
  ids.add(item.id);
 }
 const tb1=b.benchmarkPoints.find(x=>x.id==="TB 1"),tb2=b.benchmarkPoints.find(x=>x.id==="TB 2");
 if(!tb1||!tb2||distance2(tb1.utmXY,tb2.utmXY)>1||distance2(tb1.localXY,tb2.localXY)<1000)
  throw new TypeError("Known source-table coordinate collision must be flagged.");
 if(p?.id!=="coaster-street-south-2026-secondary-study"||p.linkedPublishedHistoricalSectorId!=="coaster-street"||
  p.publicationYear!==2026||p.evidenceMode!=="PUBLISHED_SECONDARY_EXPOSURE_CONTEXT_NOT_GNSS"||
  p.segmentLengthMApprox!==725||JSON.stringify(p.reportedRoadElevationMlwsRangeM)!=="[0.5,0.7]"||
  p.reportedMaximumSeaLevelMlwsM!==1.1||p.onAssetGnssOrLevellingSolution!==null||
  p.operatorApprovedCriticality!==null||p.fieldRiskRank!==null||p.geometryGeojson!==null)
  throw new TypeError("Coaster Road context cannot become a real asset-risk assessment.");
 if(doc.decisionBoundary?.operationalAssetRankAllowed!==false||doc.decisionBoundary.qualityGateStatus!=="DATA_INSUFFICIENT")
  throw new TypeError("Missing evidence must block operational rank.");
 return doc;
}
export function sectorPublicContext(addendum,sectorId){
 const doc=verifyPublicAddendum(addendum);
 return sectorId==="coaster-street"?{
  sourceMode:doc.assetExposureCase.evidenceMode,title:doc.assetExposureCase.title,sourceUrl:doc.assetExposureCase.url,
  year:2026,segmentLengthMApprox:doc.assetExposureCase.segmentLengthMApprox,
  reportedRoadElevationMlwsRangeM:[...doc.assetExposureCase.reportedRoadElevationMlwsRangeM],
  reportedMaximumSeaLevelMlwsM:doc.assetExposureCase.reportedMaximumSeaLevelMlwsM,
  unverifiedSegmentMatch:true,rankAllowed:false
 }:null;
}
export function historicalBenchmarkSummary(addendum){
 const d=verifyPublicAddendum(addendum);
 return {sourceMode:"PUBLISHED_HISTORICAL_REFERENCE_ONLY",
  count:d.surveyReference.benchmarkPoints.length,year:2004,
  qaStatus:d.surveyReference.qa.status,collisionIds:[...d.surveyReference.qa.duplicateOrNearlyIdenticalUtmPair],
  sourceUrl:d.surveyReference.url,rankAllowed:false,verifiedAssetGeometry:false};
}
