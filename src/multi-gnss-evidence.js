/**
 * Multi-GNSS Center / public evidence readiness.
 *
 * One historical CSEM GPS-derived position series and one independently
 * verified BAKO multi-GNSS RINEX QC sample. Never join them as a common
 * station solution or infer current Semarang deformation.
 */
import {parseRneu} from "./engine.js";
import {SITE_LOG_REFERENCES,MISSING_EVIDENCE} from "./evidence-inventory.js";
export const GNSS_CENTER_SOURCES=Object.freeze({
 csem:"./data/CSEM_clean_Noff1site.source-derived.rneu",
 bako:"./data/BAKO_IGS_2025-001_20min_qc_summary.json"
});
const SOURCE="https://doi.org/10.5281/zenodo.7775016";
const BAKO_ORIGINAL="BAKO00IDN_R_20250010000_01D_30S_MO.crx.gz";
const STAGES=Object.freeze([
 Object.freeze({order:1,id:"paired-observations",title:"Confirm paired CSEM / CSMG RINEX observation QC",status:"LOCAL_IMPORT_REQUIRED",evidence:"Official, date-matched CSEM / CSMG station-day QC summaries have not been published in this SaaS bundle.",next:"Import a permitted local RINEX-derived summary in the existing GNSS Lab and verify matching observation days.",riskRanking:false}),
 Object.freeze({order:2,id:"position-solution",title:"Validate a position solution with reference metadata",status:"GEODETIC_PROCESSING_REQUIRED",evidence:"BAKO pseudorange counts are not positioning accuracy or Semarang coordinate solutions.",next:"Process authorized matched observations using orbit/clock, receiver/antenna metadata, reference frame, and uncertainty checks.",riskRanking:false}),
 Object.freeze({order:3,id:"station-comparison",title:"Establish a comparable station movement analysis",status:"ALIGNED_SERIES_REQUIRED",evidence:"CSEM historic positions and BAKO QC are from different stations and epochs.",next:"Align station epochs, method, reference frame and uncertainty before comparing CSEM/CSMG station movement.",riskRanking:false}),
 Object.freeze({order:4,id:"site-link",title:"Validate the link from stations to an operational area",status:"SURVEY_GEOMETRY_REQUIRED",evidence:"No current station-derived movement of a surveyed Tanjung Emas asset is available.",next:"Request surveyed asset geometry and site-representative levelling/GNSS before asset risk assessment.",riskRanking:false})
]);
function fail(message){throw new TypeError("GNSS source validation failed: "+message);}
export function buildMultiGnssReview(csemRneu,bako){
 if(typeof csemRneu!=="string"||
   !csemRneu.includes("https://doi.org/10.5281/zenodo.7775016")||
   !csemRneu.includes("Station CSEM")||
   !csemRneu.includes("2010-2021")||
   !csemRneu.includes("IGb14 / ITRF2014"))fail("CSEM source provenance");
 const parsed=parseRneu(csemRneu,{station:"CSEM",referenceFrame:"IGb14 / ITRF2014 (source-derived)"});
 if(parsed.station!=="CSEM"||parsed.epochs.length!==3561||
    parsed.epochs[0]?.date!=="2010-01-13"||
    parsed.epochs.at(-1)?.date!=="2021-12-31")fail("CSEM epoch inventory");
 if(bako?.schema!=="baruna-sentinel-public-igs-qc-summary-v1"||
    bako.status!=="VERIFIED_REAL_RINEX_OBSERVATIONS"||
    bako.source?.station!=="BAKO00IDN"||
    bako.source?.observationDate!=="2025-01-01"||
    !String(bako.source?.stationLocation??"").includes("Cibinong")||
    bako.source?.filename!==BAKO_ORIGINAL||
    bako.audit?.epochs!==41||
    bako.audit?.sampleWindowUtc!=="2025-01-01T00:00–00:20 UTC"||
    bako.audit?.notAPositionAccuracyComparison!==true||
    bako.relationshipToSemarang?.linkedToCsemMovement!==false||
    !Array.isArray(bako.audit?.constellationsObservedWithPseudorange)||
    JSON.stringify(bako.audit.constellationsObservedWithPseudorange)!==
      JSON.stringify(["GPS","GLONASS","Galileo","BeiDou","QZSS","SBAS"])||
    !Number.isFinite(bako.audit.gpsOnlyAveragePseudorangeSatellitesPerEpoch)||
    !Number.isFinite(bako.audit.multiGnssAveragePseudorangeSatellitesPerEpoch)||
    !String(bako.verifiedRun??"").startsWith("https://github.com/"))
  fail("BAKO source or QC provenance");
 if(SITE_LOG_REFERENCES.length!==2||
    SITE_LOG_REFERENCES[0]?.station!=="CSEM"||
    SITE_LOG_REFERENCES[1]?.station!=="CSMG"||
    !MISSING_EVIDENCE.some(x=>x.id==="official-position-series"))fail("Semarang site log inventory");
 return Object.freeze({
   schema:"baruna-multi-gnss-evidence-priority-v1",
   mainUseCase:"MULTI_GNSS_OBSERVATION_AND_GEODETIC_VALIDATION",
   status:"OBSERVATIONS_VERIFIED_SOLUTION_INCOMPLETE",
   csem:Object.freeze({station:"CSEM",kind:"HISTORICAL_GPS_DERIVED_STATION_POSITIONS",
     epochs:parsed.epochs.length,first:parsed.epochs[0].date,last:parsed.epochs.at(-1).date,
     referenceFrame:parsed.referenceFrame,sourceUrl:SOURCE,assetMovementInferred:false}),
   bako:Object.freeze({station:"BAKO00IDN",kind:"PUBLIC_MULTI_GNSS_RINEX_QC_SAMPLE",
     date:bako.source.observationDate,place:"Cibinong · NOT Semarang",
     epochs:bako.audit.epochs,sampleWindow:bako.audit.sampleWindowUtc,
     constellations:[...bako.audit.constellationsObservedWithPseudorange],
     gpsOnlyAvgPseudorangeSatellites:bako.audit.gpsOnlyAveragePseudorangeSatellitesPerEpoch,
     multiGnssAvgPseudorangeSatellites:bako.audit.multiGnssAveragePseudorangeSatellitesPerEpoch,
     verifiedRun:bako.verifiedRun,improvedPositionAccuracyClaimed:false,
     semarangMovementValidated:false}),
   csmg:Object.freeze({station:"CSMG",kind:"BIG_SITE_LOG_REFERENCE",
     status:"SITE_LOG_ONLY_IN_PUBLIC_BUNDLE",
     siteLogUrl:SITE_LOG_REFERENCES[1].url,
     stationDaysPubliclyImported:false,stationVelocityFromQC:null}),
   stations:[{id:"CSEM",status:"HISTORICAL_POSITION_SERIES",role:"Historical Semarang station context"},
     {id:"CSMG",status:"SITE_LOG_ONLY",role:"Semarang Genuk station metadata; matched QC pending"},
     {id:"BAKO",status:"INDEPENDENT_MULTI_GNSS_QC",role:"Authentic multi-constellation QC; different location"}],
   reviewPriority:STAGES.map(stage=>({...stage})),
   operationalAssetRiskRankingAvailable:false,
   stageRankingType:"EVIDENCE_WORKFLOW_ORDER_NOT_RISK_SEVERITY",
   validationGates:Object.freeze({semarangMatchedCsemCsmgObservationQc:false,
     newCommonPositionSolution:false,independentOnAssetGroundTruth:false,
     comparablePositionReferenceFrame:false}),
   limitations:[
     "BAKO observation counts are not an accuracy, precision or displacement comparison.",
     "CSEM 2010–2021 GPS-derived station positions and BAKO 2025 QC cannot form a common rate or Semarang GNSS baseline.",
     "CSEM and CSMG QC from local uploads must not be asserted as publicly imported.",
     "Workflow priority numbers identify next evidence steps, not asset-risk ranks or receiver failures."
   ]
 });
}
