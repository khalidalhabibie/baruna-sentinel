/**
 * BARUNA Sentinel RGPD evidence-to-decision prototype.
 *
 * The operational case MUST NOT rank real assets from regional CORS stations,
 * independent QC, or 2005 cumulative levelling observations.
 * A distinct, conspicuously SYNTHETIC scenario demonstrates a transparent
 * configurable inspection-screening policy, not engineering thresholds.
 */
export const ASSESSMENT_POLICY=Object.freeze({
  id:"SYNTHETIC_DEMO_POLICY_V1",
  title:"Illustrative policy only — NOT an operator inspection standard",
  minimumSpanYears:1,
  minimumContinuityPct:80,
  maximumSlopeUncertaintyMmYr:25,
  rateHighMmYr:80,
  rateMediumMmYr:30,
  exposureWeights:Object.freeze({high:2,moderate:1,low:0}),
  criticalityWeights:Object.freeze({high:2,moderate:1,low:0}),
  highScore:5,
  mediumScore:3
});
export const ASSESSMENT_REASON=Object.freeze({
  GEOMETRY:"Exact asset location or geometry unverified",
  REPRESENTATIVENESS:"No current, representative measurement on or linked defensibly to the asset",
  SOURCE:"Source provenance or reference frame requires validation",
  PERIOD:"Insufficient multi-epoch observation period for the configured screening policy",
  CONTINUITY:"Observation coverage below the configured screening policy",
  UNCERTAINTY:"Trend uncertainty exceeds the configured screening policy",
  CONTEXT:"Asset exposure and operational criticality are not both supplied"
});
const isFiniteNum=v=>typeof v==="number"&&Number.isFinite(v);
const allowed=new Set(["high","moderate","low"]);
const asText=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

export function assessHistoricalSector(sector){
  if(!sector || !sector.id || !sector.name ||
     !isFiniteNum(sector.minCm)||!isFiniteNum(sector.maxCm)||
     sector.minCm>sector.maxCm)throw new TypeError("Validated published sector record required");
  return {
    id:sector.id,name:sector.name,sourceMode:"PUBLISHED_HISTORICAL_CONTEXT",
    year:2005,measuredQuantity:"CUMULATIVE_SETTLEMENT_CM",
    historicRangeCm:[sector.minCm,sector.maxCm],
    operationalPriority:"DATA_INSUFFICIENT",
    screeningTier:null,canIssueOperationalOrder:false,
    evidence: [
      {label:"2005 field-study record",state:"AVAILABLE",detail:"Historical cumulative measurement; no annual rate"},
      {label:"CSEM station positions",state:"REGIONAL_REFERENCE",detail:"Historical GNSS station, not a measurement on this asset"},
      {label:"BAKO multi-GNSS observation QC",state:"INDEPENDENT_REFERENCE",detail:"Different station and period; not a CSEM movement solution"},
      {label:"Exact sector geometry",state:"MISSING",detail:ASSESSMENT_REASON.GEOMETRY},
      {label:"Current on-asset movement",state:"MISSING",detail:ASSESSMENT_REASON.REPRESENTATIVENESS},
      {label:"Exposure and criticality",state:"MISSING",detail:ASSESSMENT_REASON.CONTEXT}
    ],
    requiredActions:[
      "Confirm operator asset ID, authoritative polygon and location of historical survey points.",
      "Obtain current representative levelling/GNSS measurements with dates, datum, method and uncertainty.",
      "Validate station-to-asset linkage, local exposure and owner-approved operational criticality.",
      "Have a qualified geodetic and asset engineer approve screening criteria before prioritizing inspections."
    ],
    explanation:"Historic settlement and independently observed stations support an evidence request, not a current asset-level inspection rank."
  };
}
export function assessRealProject(fieldEvidence){
  if(fieldEvidence?.recordType!=="PUBLISHED_HISTORICAL_FIELD_STUDY"||
     fieldEvidence.reportedSurveyYear!==2005||
     !Array.isArray(fieldEvidence.sectors)||fieldEvidence.sectors.length===0)
    throw new TypeError("Validated 2005 field evidence is required");
  const results=fieldEvidence.sectors.map(assessHistoricalSector);
  return {
    mode:"SOURCE_BACKED_RESEARCH",project:"Tanjung Emas coastal infrastructure",
    source:"Raharjo & Yosi, historical field study published 2017",
    surveyYear:2005,records:results,
    sufficientForOperationalRanking:0,
    needsUpdatedEvidence:results.length,
    assetsWithVerifiedModernGeometry:0,
    certifiedStructuralDecisions:0,
    statement:"These six records are sectors from published research, not verified modern asset geometry."
  };
}

/** This function is intentionally isolated from actual port-sector records. */
export function assessSyntheticAsset(input,policy=ASSESSMENT_POLICY){
  if(input?.sourceMode!=="SYNTHETIC" || !input.id||!input.name)
    throw new TypeError("Only explicitly labelled synthetic scenario records are accepted");
  const failed=[];
  if(input.geometryVerified!==true)failed.push("GEOMETRY");
  if(input.siteRepresentative!==true)failed.push("REPRESENTATIVENESS");
  if(input.sourceVerified!==true||input.referenceFrameVerified!==true)failed.push("SOURCE");
  if(!isFiniteNum(input.spanYears)||input.spanYears<policy.minimumSpanYears)failed.push("PERIOD");
  if(!isFiniteNum(input.continuityPct)||input.continuityPct<policy.minimumContinuityPct||input.continuityPct>100)failed.push("CONTINUITY");
  if(!isFiniteNum(input.slopeUncertaintyMmYr)||input.slopeUncertaintyMmYr<0||
    input.slopeUncertaintyMmYr>policy.maximumSlopeUncertaintyMmYr)failed.push("UNCERTAINTY");
  if(!isFiniteNum(input.verticalRateMmYr))failed.push("REPRESENTATIVENESS");
  if(!allowed.has(input.exposure)||!allowed.has(input.criticality))failed.push("CONTEXT");
  const gates=[...new Set(failed)];
  if(gates.length){
    return {
      id:input.id,name:input.name,sourceMode:"SYNTHETIC",
      operationalPriority:"DATA_INSUFFICIENT",screeningTier:"BLOCKED",
      score:null,canIssueOperationalOrder:false,gateFailures:gates,
      explanation:"Illustrative input did not meet the stated screening prerequisites; missing evidence cannot become low risk."
    };
  }
  // Negative vertical rate is descriptive downward movement; illustrative
  // policy uses magnitude of downward motion only. It is not calibrated.
  const downwardRate=Math.max(0,-input.verticalRateMmYr);
  const motionPoints=downwardRate>=policy.rateHighMmYr?2:downwardRate>=policy.rateMediumMmYr?1:0;
  const score=motionPoints+policy.exposureWeights[input.exposure]+policy.criticalityWeights[input.criticality];
  const tier=score>=policy.highScore?"HIGH":
    score>=policy.mediumScore?"MEDIUM":"MONITOR";
  return {
    id:input.id,name:input.name,sourceMode:"SYNTHETIC",
    operationalPriority:"SIMULATION_ONLY",screeningTier:tier,
    canIssueOperationalOrder:false,gateFailures:[],
    score,downwardRateMmYr:downwardRate,
    reasons:[
      "DOWNWARD_RATE_"+motionPoints+"_POINTS",
      "EXPOSURE_"+input.exposure.toUpperCase()+"_"+policy.exposureWeights[input.exposure]+"_POINTS",
      "CRITICALITY_"+input.criticality.toUpperCase()+"_"+policy.criticalityWeights[input.criticality]+"_POINTS"
    ],
    explanation:"A transparent prototype policy computed a fictional tier from fictional site-representative measurements, exposure, and criticality. It is not validated engineering risk."
  };
}
export const SYNTHETIC_SCENARIO=Object.freeze([
  Object.freeze({
    id:"sim-port",name:"Illustrative port access",sourceMode:"SYNTHETIC",
    geometryVerified:true,siteRepresentative:true,sourceVerified:true,referenceFrameVerified:true,
    spanYears:2.5,continuityPct:92,slopeUncertaintyMmYr:5,
    verticalRateMmYr:-92,exposure:"high",criticality:"high"
  }),
  Object.freeze({
    id:"sim-road",name:"Illustrative coastal road",sourceMode:"SYNTHETIC",
    geometryVerified:true,siteRepresentative:true,sourceVerified:true,referenceFrameVerified:true,
    spanYears:2,continuityPct:89,slopeUncertaintyMmYr:9,
    verticalRateMmYr:-44,exposure:"moderate",criticality:"high"
  }),
  Object.freeze({
    id:"sim-store",name:"Illustrative storage facility",sourceMode:"SYNTHETIC",
    geometryVerified:true,siteRepresentative:true,sourceVerified:true,referenceFrameVerified:true,
    spanYears:1.8,continuityPct:96,slopeUncertaintyMmYr:3,
    verticalRateMmYr:-9,exposure:"moderate",criticality:"low"
  }),
  Object.freeze({
    id:"sim-incomplete",name:"Illustrative unverified shoreline asset",sourceMode:"SYNTHETIC",
    geometryVerified:false,siteRepresentative:false,sourceVerified:true,referenceFrameVerified:true,
    spanYears:0.1,continuityPct:53,slopeUncertaintyMmYr:28,
    verticalRateMmYr:-103,exposure:"high",criticality:"high"
  })
]);
export function assessSyntheticScenario(policy=ASSESSMENT_POLICY){
  return {
    mode:"SYNTHETIC_POLICY_EXERCISE",
    policy,records:SYNTHETIC_SCENARIO.map(record=>assessSyntheticAsset(record,policy)),
    validForRealAssets:false,
    statement:"Every location, rate, exposure and criticality in this comparison is invented and used only to demonstrate the decision rules."
  };
}
export function buildAssessmentPrint({real,scenario=null,generatedAt=new Date().toISOString()}={}){
  if(real?.mode!=="SOURCE_BACKED_RESEARCH")throw new TypeError("Real evidence review is required");
  const esc=asText;
  const rows=real.records.map(r=>'<tr><td>'+esc(r.name)+'</td><td>'+r.historicRangeCm.join('–')+' cm</td><td>'+esc(r.operationalPriority)+'</td><td>Geometry + current representative data + criticality</td></tr>').join("");
  const simulations=scenario?.mode==="SYNTHETIC_POLICY_EXERCISE"
    ?'<section class="simulation-annex" aria-label="Simulasi fiktif terpisah dari hasil penelitian"><h2>SIMULASI / DATA FIKTIF — BUKAN HASIL ASET NYATA</h2>'+
      '<p>All scenario inputs are fictional; these are not operational recommendations.</p><table><thead><tr><th>FICTIONAL EXAMPLE</th><th>ILLUSTRATIVE TIER</th><th>EXPLANATION</th></tr></thead><tbody>'+
      scenario.records.map(r=>'<tr><td>'+esc(r.name)+' (FICTIONAL)</td><td>'+esc(r.screeningTier)+'</td><td>'+esc(r.explanation)+'</td></tr>').join("")+'</tbody></table><p>Setiap baris di lampiran ini menggunakan input fiktif dan bukan rekomendasi inspeksi nyata.</p></section>':'';
  return '<div class="brief-sheet"><div class="print-head"><div><div class="print-brand">BARUNA / SENTINEL</div><small>OURDO INDONESIA · RGPD 2026 · PROTOTYPE</small></div><div><b>INSPECTION EVIDENCE ASSESSMENT</b><small>'+esc(generatedAt.slice(0,10))+'</small></div></div>'+
    '<h1>'+esc(real.project)+'</h1><div class="print-callout"><b>Decision: DATA INSUFFICIENT.</b> Six historical sectors have no verified current representative on-asset observations or exact surveyed geometry. Do not issue operational inspection priorities.</div>'+
    '<div class="print-metrics"><div><small>PUBLISHED SECTORS</small><strong>'+real.records.length+'</strong></div><div><small>ASSET RANKINGS PERMITTED</small><strong>0</strong></div><div><small>FOLLOW-UP REQUESTS</small><strong>'+real.needsUpdatedEvidence+'</strong></div></div>'+
    '<h2>Source-backed review (2005 cumulative measurements only)</h2><table><thead><tr><th>SECTOR</th><th>HISTORIC SETTLEMENT</th><th>RESULT</th><th>REQUIRED INPUT</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<h2>Evidence provenance</h2><p>CSEM: 2010–2021 historical GPS-derived station positions. BAKO: independent 2025 archived multi-GNSS QC from Cibinong. Neither establishes on-asset displacement for the six study sectors.</p>'+
    '<h2>Minimum next verification</h2><ol>'+real.records[0].requiredActions.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>'+simulations+
    '<p class="print-tiny">Cumulative historic settlement cannot be treated as an annual rate, station QC cannot be treated as a position solution, and an unknown asset condition is not a low-risk conclusion.</p>'+
    '<div class="print-footer">BARUNA Sentinel · Methodological prototype — not certified structural risk or operator inspection advice.</div></div>';
}
