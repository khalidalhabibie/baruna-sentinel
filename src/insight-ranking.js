/**
 * BARUNA Intelligence: source-gated ranking readiness.
 *
 * A 2005 cumulative historical value is not a 2026 vertical rate.
 * This module deliberately NEVER assigns a rank, score, risk tier, or
 * inspection priority from unreferenced historical sectors or radar QA.
 */
import {validateHistoricalFieldEvidence} from "./historical.js";
import {validateRealInsarQa} from "./real-hyp3-insar.js";

export const INSPECTION_RANKING_STATUS="NOT_ELIGIBLE_FOR_OPERATIONAL_RANKING";
export function buildRankingReadiness(history,qa,readiness){
 const h=validateHistoricalFieldEvidence(history);
 const q=validateRealInsarQa(qa);
 if(readiness?.schema!=="baruna-real-evidence-readiness-v1"||
    readiness?.modelGate?.realInsar!==false||
    readiness?.modelGate?.assetLevelInspectionPriority!==false)
  throw new TypeError("Ranking source gates not verified: fail closed");
 return Object.freeze({
  schema:"baruna-ranking-readiness-v1",
  area:"Tanjung Emas · Semarang Coastal",
  observation:"2005 published cumulative levelling",
  currentRateAvailable:false,
  surveyedAssetGeometryAvailable:false,
  rankingAvailable:false,
  status:INSPECTION_RANKING_STATUS,
  rankedAssetCount:0,
  candidateCount:h.sectors.length,
  sectors:h.sectors.map(s=>({
   id:s.id,name:s.name,type:s.type,
   historicalCumulativeCmRange:[s.minCm,s.maxCm],
   currentVerticalMmPerYear:null,assetGeometry:null,
   rank:null,score:null,riskTier:null,
   status:"NEEDS_SITE_SPECIFIC_EVIDENCE"
  })),
  radarQuality:{productId:q.source.jobId,
   isCurrentPortVelocity:false,
   portPhaseAvailable:false},
  missingEvidence:[
   "Surveyed operator asset geometry",
   "Multi-temporal georeferenced displacement velocity with stable reference and uncertainty",
   "Independent GNSS / levelling ground-truth representative of each asset",
   "Operator-approved decision policy and thresholds"
  ],
  scenarioLabUrl:"./spatial-demo.html#ranking",
  scenarioIsSynthetic:true
 });
}
