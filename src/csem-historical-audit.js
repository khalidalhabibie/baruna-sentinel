/**
 * Published GPS position series, processed locally through the same OLS engine
 * used elsewhere in BARUNA. This is NOT a multi-GNSS positioning solution.
 * Keep the derived time span and provenance separate from 2021–23 published PPP
 * station rates and BAKO 2025 independent multi-constellation observation QC.
 */
import {parseRneu,analyzeSeries} from "./engine.js";

export const CSEM_HISTORICAL_PROVENANCE=Object.freeze({
  station:"CSEM",
  observationType:"PUBLISHED_PROCESSED_GPS_POSITION_SERIES",
  source:"Susilo et al. (2023), CSEM_clean_Noff1site.rneu; source-derived numeric extract",
  doi:"10.5281/zenodo.7775016",
  sourceUrl:"https://doi.org/10.5281/zenodo.7775016",
  publicationYear:2023,
  observationPeriod:"2010–2021",
  referenceFrameAnnotation:"IGb14 / ITRF2014 realization (source annotation)",
  expectedEpochs:3561,
  expectedStart:"2010-01-13",
  expectedEnd:"2021-12-31"
});
export function summarizeHistoricalCsemGps(raw){
  if(typeof raw!=="string"||
     !raw.includes("CSEM_clean_Noff1site.rneu")||
     !raw.includes("doi.org/10.5281/zenodo.7775016")||
     !raw.includes("IGb14"))
    throw new TypeError("Published CSEM source provenance annotation missing");
  const c=CSEM_HISTORICAL_PROVENANCE;
  const series=parseRneu(raw,{station:c.station,referenceFrame:c.referenceFrameAnnotation});
  const fit=analyzeSeries(series);
  if(fit.epochCount!==c.expectedEpochs||fit.start!==c.expectedStart||fit.end!==c.expectedEnd||
     fit.spanDays<3650||!Number.isFinite(fit.verticalSlopeMmYr)||!Number.isFinite(fit.residualRmsMm))
    throw new TypeError("Incomplete or changed CSEM historical source-derived series");
  return {
    station:"CSEM",sourceMode:c.observationType,source:c.source,doi:c.doi,url:c.sourceUrl,
    period:c.observationPeriod,referenceFrameAnnotation:c.referenceFrameAnnotation,
    epochCount:fit.epochCount,start:fit.start,end:fit.end,
    spanYears:Number((fit.spanDays/365.25).toFixed(2)),
    maxGapDays:fit.maxGapDays,
    verticalSlopeMmYr:fit.verticalSlopeMmYr,
    residualRmsMm:fit.residualRmsMm,
    method:"Descriptive ordinary least-squares (OLS) on processed GPS Up coordinates",
    seasonalDiscontinuityAutocorrelationCorrected:false,
    slopeUncertaintyValidated:false,
    isMultiGnssPositionSolution:false,
    isOnAssetMeasurement:false,
    canInferRealAssetPriority:false,
    comparableToPublishedPpp2021To2023:false,
    warnings:[
      "Derived from published 2010–2021 GPS station coordinates, not from newly processed RINEX or a 2026 multi-GNSS solution.",
      "OLS descriptive fit omits seasonal terms, discontinuities, colored-noise/autocorrelation modeling and reference-frame crosschecks; residual RMS is not slope uncertainty.",
      "Not directly comparable with separately published PPP CSEM/CSMG rates for 2021–2023. It cannot establish current Semarang asset displacement, safety or inspection priority."
    ]
  };
}
