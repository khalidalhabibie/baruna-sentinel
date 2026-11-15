/**
 * BARUNA Sentinel executive decision layer.
 * Never infer current asset safety from historic levelling, CORS displacement,
 * or independent observation QC. Decision is evidence-gathering, not diagnosis.
 */
export const COASTAL_CONTEXT = Object.freeze({
  name: "Semarang coastal infrastructure — historic rob context",
  source: "BMKG",
  publishedPeriod: "1–6 November 2026",
  location: "Pesisir Kota Semarang",
  issuedInPast: true,
  sourceUrl: "https://maritim.bmkg.go.id/marine2026-data/doc/peringatan-dini-banjir-rob.pdf",
  caveat: "Archived coastal flood potential bulletin; NOT a current warning, asset deformation observation, or GNSS analysis."
});

export function evidenceReadiness({fieldEvidence, movement, movementMeta, rinex, rinexMeta} = {}) {
  const localHistorical = fieldEvidence?.recordType === "PUBLISHED_HISTORICAL_FIELD_STUDY" &&
    fieldEvidence.reportedSurveyYear === 2005 &&
    Array.isArray(fieldEvidence.sectors) && fieldEvidence.sectors.length === 6;
  const seriesIsPublished = movementMeta?.mode === "published" && movement?.station === "CSEM" &&
    movement?.epochCount === 3561;
  const authenticMultiGnssQc = rinexMeta?.mode === "real-qc" &&
    rinex?.marker === "BAKO00IDN" && rinex?.status === "MULTI_GNSS_RECORDS_SEEN" &&
    rinex?.linkedToCsemMovement === false && typeof rinex?.verifiedRun === "string";

  const loadedEvidenceStreams =
    Number(localHistorical) + Number(seriesIsPublished) + Number(authenticMultiGnssQc);
  return {
    asOf: "2026-11-15", // fixed competition snapshot, not a live data-update timestamp
    state: "NEEDS_ASSET_SPECIFIC_VERIFICATION",
    sectorCount: localHistorical ? fieldEvidence.sectors.length : null,
    loadedEvidenceStreams,
    authenticFieldHistory: localHistorical,
    gpsHistoricalCsem: seriesIsPublished,
    authenticMultiGnssQc,
    currentInstrumentedAssetMeasurementsInDemo: 0,
    validatedCurrentAssetSafetyDecisions: 0,
    availableAction: "PREPARE_UPDATED_EVIDENCE_REQUEST",
    unsupportedConclusions: [
      "No current 2026 structural condition of the documented sectors is established.",
      rinexMeta?.mode === "local-qc"
        ? "Imported GeoRinex QC is from a user-declared station; BIG source identity is unverified and no matching CSEM movement solution exists."
        : "BAKO observations from Cibinong are not a multi-GNSS-derived CSEM displacement solution.",
      "BMKG tidal-flood context does not supply asset deformation, flood probability or current alarm."
    ],
    commercialHypothesis: "Make missing evidence and required field verification visible before operators commit survey/inspection resources; not a proven time or cost saving."
  };
}

export function verificationRequestForSector(fieldEvidence, id) {
  if(fieldEvidence?.recordType !== "PUBLISHED_HISTORICAL_FIELD_STUDY") {
    throw new TypeError("A verified field-study source is required");
  }
  const record=fieldEvidence.sectors?.find(s => s.id === id);
  if(!record) throw new RangeError("Unknown documented infrastructure sector");
  return {
    sectorId: record.id,
    sectorName: record.name,
    historicCumulativeSettlementCm: [record.minCm,record.maxCm],
    historicMeasurementYear: fieldEvidence.reportedSurveyYear,
    currentAssetCondition: "UNKNOWN",
    decision: "REQUEST_UPDATED_EVIDENCE",
    decisionMeaning: "Gather evidence and validate asset context before ranking actual inspections",
    request: [
      "Confirm asset identity, exact site boundary and operating criticality with asset owner.",
      "Obtain updated site survey, repeat levelling or site-representative GNSS/InSAR evidence.",
      "Check datum/reference frame, observation dates, uncertainty and local spatial linkage.",
      "Have qualified geodesy/engineering specialists review trends and operator-approved inspection criteria."
    ],
    estimates: {costIdr:null,roi:null,estimatedFailureProbability:null},
    disclaimer: "No operational inspection ranking, safety judgement or estimated economic loss is produced."
  };
}
