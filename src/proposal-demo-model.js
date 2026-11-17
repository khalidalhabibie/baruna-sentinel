/** Proposal-faithful four-step narrative. SOURCE_BACKED and SYNTHETIC remain disjoint. */
import {PUBLISHED_CORS_CONTRAST} from './published-cors.js';
import {assessRealProject,assessSyntheticScenario,SYNTHETIC_SCENARIO,ASSESSMENT_POLICY} from './assessment.js';
export const DEMO_SCHEMA='baruna-rgpd-proposal-demo-v1';
export function validateDemoData(doc){
 if(doc?.schema!==DEMO_SCHEMA||doc.workspaceId!=='semarang-coastal'||doc?.cors?.period!=='2021–2023'||doc.cors.doi!==PUBLISHED_CORS_CONTRAST.doi)
  throw new TypeError('Metadata demo GNSS tidak cocok dengan proposal.');
 if(!Array.isArray(doc.cors.stations)||doc.cors.stations.length!==2)throw new TypeError('Harus dua stasiun dari publikasi.');
 for(const station of PUBLISHED_CORS_CONTRAST.stations){
  const row=doc.cors.stations.find(x=>x.id===station.id);
  if(!row||row.verticalMmYr!==station.verticalMmYr||!Number.isFinite(row.uncertaintyMmYr)||row.uncertaintyMmYr<=0)
   throw new TypeError('Data CORS tidak sesuai publikasi/proposal.');
 }
 if(!Array.isArray(doc.evidenceGates)||doc.evidenceGates.length!==5||
    !Array.isArray(doc.observationEvidence)||doc.observationEvidence.length<3||
    !Array.isArray(doc.proposalMethodology)||doc.proposalMethodology.length!==5||
    !doc.evidenceGates.some(g=>g.id==='asset-link'&&g.state==='MISSING'))
  throw new TypeError('Evidence gate tidak lengkap atau menyesatkan.');
 return doc;
}
export function buildDemoDecision({data,field,sectorId,aoi=null,generatedAt=new Date().toISOString()}){
 const doc=validateDemoData(data);
 const real=assessRealProject(field);
 const chosen=real.records.find(r=>r.id===sectorId)||real.records[0];
 if(!chosen||chosen.operationalPriority!=='DATA_INSUFFICIENT'||real.sufficientForOperationalRanking!==0)
  throw new TypeError('Tidak boleh memberi ranking aset nyata tanpa bukti.');
 const simulated=assessSyntheticScenario();
 if(simulated.mode!=='SYNTHETIC_POLICY_EXERCISE'||simulated.validForRealAssets!==false||
    simulated.records.some(r=>r.canIssueOperationalOrder!==false))throw new Error('Simulasi tidak dipisahkan.');
 const inputById=new Map(SYNTHETIC_SCENARIO.map(r=>[r.id,r]));
 const ranking=[...simulated.records].sort((a,b)=>(b.score??-1)-(a.score??-1));
 const safeAoi=aoi&&aoi.workspaceId==='semarang-coastal'&&aoi.sourceStatus==='USER_DECLARED_UNVERIFIED'?{
  id:aoi.id,name:aoi.name,geometry:aoi.geometry,boundarySource:aoi.boundarySource,
  checkedAt:aoi.lastEvidenceCheck?.checkedAt||null,sourceSnapshotAsOf:aoi.lastEvidenceCheck?.sourceSnapshotAsOf||null,
  sourceMode:'USER_DECLARED_UNVERIFIED'
 }:null;
 return {
  schema:'baruna-rgpd-evidence-brief-v1',generatedAt,project:'BARUNA Sentinel RGPD 2026',workspaceId:'semarang-coastal',
  context:'Tanjung Emas–Genuk (Semarang), illustrative geographic scenario',
  aoi:safeAoi,
  stationPublication:{sourceMode:'PUBLISHED_STATION_RESULT_NOT_BARUNA_MEASUREMENT',
    source:doc.cors.source,period:doc.cors.period,method:doc.cors.method,doi:doc.cors.doi,url:doc.cors.url,
    stations:doc.cors.stations.map(s=>({...s})),isOnAssetMeasurement:false},
  separateObservationEvidence:doc.observationEvidence,
  historicalSector:{id:chosen.id,name:chosen.name,year:real.surveyYear,
    sourceMode:'PUBLISHED_HISTORICAL_CONTEXT',cumulativeSettlementCm:chosen.historicRangeCm,
    operationalPriority:chosen.operationalPriority,
    source:doc.historicalStudy,requiredActions:chosen.requiredActions},
  qualityGates:doc.evidenceGates,
  decision:{operationalRanking:'DATA_INSUFFICIENT',rankedRealAssets:0,reason:
    'Regional station velocities cannot be assigned to an asset. Validated geometry, representative contemporary measurements, exposure, operator criticality and approved policy are unavailable.'},
  syntheticAnnex:{sourceMode:'SYNTHETIC_POLICY_EXERCISE',policyId:ASSESSMENT_POLICY.id,
    policyCalibratedForRealAssets:false,inputsEntirelyFictional:true,
    records:ranking.map(row=>({id:row.id,name:row.name,fictionalRateMmYr:inputById.get(row.id)?.verticalRateMmYr,
       fictionalExposure:inputById.get(row.id)?.exposure,fictionalCriticality:inputById.get(row.id)?.criticality,
       evidenceGatesPassed:row.gateFailures?.length===0,score:row.score,tier:row.screeningTier,
       gateFailures:row.gateFailures||[],reasons:row.reasons||[]}))},
  limitations:[
    'Station PPP values are published 2021–2023 station results, not direct measurements on any port asset.',
    'The published 2005 sector ranges are cumulative centimeters, not annual 2026 deformation rates.',
    'CSEM 2010–2021 time-series and independent BAKO 2025 RINEX QC use different scope/period, and cannot be combined as one solution.',
    'AOI polygon is user-declared and stored in this browser only; no cadastral/survey validation.',
    'Sentinel scene discovery is metadata, not InSAR deformation, inundation, physical change or operational monitoring.',
    'All simulation assets and thresholds are fictional; this report is not an inspection order or structural safety certification.'
  ]
 };
}