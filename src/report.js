/** Pure, dependency-free printable case-study evidence dossier. */
function esc(value) {
  return String(value ?? "—").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}
const fmt = (x,d=1) => Number.isFinite(x) ? Number(x).toFixed(d) : "—";
const safeText = x => esc(x);
const label = x => safeText(String(x || "NOT AVAILABLE").replace(/_/g," "));

export function buildEvidenceReportMarkup(bundle) {
  if(!bundle || !bundle.movement || !bundle.source){
    throw new TypeError("Evidence report requires a parsed movement series and provenance");
  }
  const m=bundle.movement,src=bundle.source,qc=bundle.rinexInspection,g=bundle.evidenceGate||{},geo=bundle.geospatialContext||{};
  const executive = bundle.executiveReadiness || {}, verification = bundle.verificationRequest || null;
  const isPublished=src.mode==="published";
  const audited=src.rinexSource?.mode==="real-qc" && qc?.verifiedRun && qc?.linkedToCsemMovement===false;
  const mode=isPublished?"REAL GPS-DERIVED HISTORICAL SERIES":src.mode==="synthetic"?"SYNTHETIC DEMONSTRATION":"USER-SUPPLIED · UNVERIFIED";
  const meta=audited
    ?'<div class="print-metrics"><div><small>BAKO EPOCHS (20 MIN)</small><strong>'+safeText(qc.epochCount)+'</strong></div><div><small>GPS-ONLY MEAN SATELLITES</small><strong>'+fmt(qc.averageGpsPseudorangeSatellitesPerEpoch,2)+'</strong></div><div><small>ALL SYSTEMS MEAN SATELLITES</small><strong>'+fmt(qc.averageAllPseudorangeSatellitesPerEpoch,2)+'</strong></div></div>'
    :'<p>Independently verified RINEX QC has not been established for the current selection.</p>';
  const rows=(bundle.illustrativeAssetReview||[]).map(a=>'<tr><td>'+safeText(a.name)+'</td><td>'+label(a.scenarioTier||"BLOCKED")+'</td><td>'+label(a.priority)+'</td><td>NO — fictional input only</td></tr>').join("");
  const refs = [
    "https://doi.org/10.1038/s41597-023-02274-0",
    "https://doi.org/10.5281/zenodo.7775016",
    "https://big.go.id/assets/download/InaCORS/InaCORS%20BIG%202018_compressed.pdf",
    "https://network.igs.org/BAKO00IDN",
    "https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/43690104506",
    "https://doi.org/10.32693/bomg.32.1.2017.351"
  ];
  return '<div class="print-head"><div><div class="print-brand">BARUNA / SENTINEL</div>'
    +'<small>OURDO INDONESIA · BIG BHUMIREKA 2026 · COMPETITION PROTOTYPE</small></div>'
    +'<div style="text-align:right"><b>DEMO EVIDENCE DOSSIER</b><small>Generated '+esc(bundle.generatedAt?.slice(0,19)?.replace("T"," ")||"local")+' UTC</small></div></div>'
    +'<h1>Semarang–Genuk coastal infrastructure</h1>'
    +'<p>Decision question: what should a coastal infrastructure maintenance team verify before scheduling a field inspection, and which observations are actually credible?</p>'
    +'<div class="print-callout"><b>Executive decision:</b> REQUEST UPDATED, ASSET-LINKED EVIDENCE before assigning actual inspection priority. '+safeText(executive.sectorCount??"Unknown")+' historical sectors documented; '+safeText(executive.currentInstrumentedAssetMeasurementsInDemo??0)+' current on-asset measurements available in the prototype. This is not a certified asset-risk model or operator recommendation.</div>'
    +'<p class="print-tiny"><b>Urgency context (dated, not live):</b> BMKG included Pesisir Kota Semarang in a rob-potential bulletin for 1–6 November 2026; the interval has ended. This coastal alert does not measure ground displacement. Source: https://maritim.bmkg.go.id/marine2026-data/doc/peringatan-dini-banjir-rob.pdf</p>'
    +'<h2>01 / Historic GNSS movement evidence</h2>'
    +'<p><b>Series provenance:</b> '+safeText(src.name||src.provider||m.station)+' · '+mode+'. '
    +(isPublished?"Published GPS-processed historical station coordinate data, NOT proof of multi-GNSS displacement.":"Series source, physical station and data processing must not be assumed authentic.")+'</p>'
    +'<div class="print-metrics"><div><small>STATION</small><strong>'+safeText(m.station)+'</strong></div>'
    +'<div><small>EPOCHS</small><strong>'+safeText(m.epochCount)+'</strong></div>'
    +'<div><small>OLS VERTICAL SLOPE</small><strong>'+fmt(m.verticalSlopeMmYr,2)+' mm/yr</strong></div>'
    +'<div><small>SCREENING COMPLETENESS</small><strong>'+label(m.quality)+'</strong></div></div>'
    +'<p class="print-tiny">Period '+safeText(m.start)+' to '+safeText(m.end)
    +' · maximum gap '+safeText(m.maxGapDays)+' days · station-level descriptive OLS only, without autocorrelation / seasonal / discontinuity modeling. This is not asset displacement.</p>'
    +'<h2>02 / Authentic multi-GNSS observation quality</h2>'
    +'<p><b>Independent station:</b> '+safeText(qc?.marker||"unavailable")+' (Cibinong when BAKO). '
    +(audited?"Archived 1 January 2025 IGS observation data decoded by GeoRinex; verified CI evidence.":"No independent authenticated QC for the current RINEX choice.")+'</p>'
    +meta
    +'<p class="print-tiny">QC compares populated pseudorange availability within the same epoch window. No PPP/RTK position solution, no quantified accuracy improvement, and no claim this BAKO QC produced the CSEM historical coordinates.</p>'
    +'<h2>03 / Geographic provenance</h2>'
    +'<p><b>CSEM to Tanjung Emas terminal:</b> '+fmt(geo.landmarkDistanceKm)+' km straight-line distance between public reference points. '
    +'<b>CSEM to BAKO:</b> '+safeText(geo.externalObservationQcStationDistanceKm)+' km (approximate). '
    +'Geographic separation is NOT evidence of matching displacement, shared noise or asset influence.</p>'
    +'<p class="print-tiny">Coordinate reference points: BIG InaCORS (CSEM), IGS BAKO, OSM Tanjung Emas terminal, Semarang municipal GIS Genuk office. Three example asset marker coordinates are fictional. No DEMNAS or authoritative coastline/exposure layer is claimed.</p>'
    +'<h2>04 / Evidence linkage and illustrative review</h2>'
    +'<div class="print-callout print-warning"><b>'+label(g.status)+'</b><p>'+safeText(g.explanation||"Evidence sources cannot be assumed linked.")+'</p><b>Asset-level operational decision allowed:</b> NO</div>'
    +'<table><thead><tr><th>FICTIONAL SCENARIO</th><th>DEMO TIER</th><th>NEXT STEP</th><th>OPERATIONAL ADVICE?</th></tr></thead><tbody>'+rows+'</tbody></table>'
    +'<h2>05 / Published Tanjung Emas field evidence (historic only)</h2>'
    +(bundle.publishedFieldEvidence
      ? '<p>Independent levelling / GPR research context: '+safeText(bundle.publishedFieldEvidence.source?.title)
        +' (published '+safeText(bundle.publishedFieldEvidence.source?.year)+', measurements reported in '
        +safeText(bundle.publishedFieldEvidence.reportedSurveyYear)+'). Figures below are cumulative historic centimetres; NOT rates, present-day asset displacement or inspection priorities.</p>'
        +'<table><thead><tr><th>DOCUMENTED SECTOR</th><th>HISTORICAL SETTLEMENT</th><th>STATUS</th></tr></thead><tbody>'
        +bundle.publishedFieldEvidence.sectors.map(s=>'<tr><td>'+safeText(s.name)+'</td><td>'+safeText(s.minCm)+'–'+safeText(s.maxCm)+' cm (historic)</td><td>2026 UNKNOWN · no exact sector geometry</td></tr>').join('')
        +'</tbody></table>'
        +'<p class="print-tiny">Source DOI: '+safeText(bundle.publishedFieldEvidence.source?.doi)
        +'. These are not interpolated to CSEM/GNSS; sector positions are not asserted without survey coordinates.</p>'
      : '<p>Published field-sector extract unavailable; do not interpret missing records as stability.</p>')
    +'<h2>06 / Sector-specific verification brief</h2>'
    +(verification
      ? '<p><b>Selected documented sector:</b> '+safeText(verification.sectorName)+' · historic field survey in '+safeText(verification.historicMeasurementYear)+' ('+safeText(verification.historicCumulativeSettlementCm.join("–"))+' cm cumulative). Current asset condition remains <b>UNKNOWN</b>. This is a request to gather evidence, not a field inspection order.</p>'
        +'<table><thead><tr><th>VERIFICATION REQUEST</th><th>OWNER</th></tr></thead><tbody>'
        +verification.request.map((item,i)=>'<tr><td>'+safeText(item)+'</td><td>To be assigned by operator</td></tr>').join("")
        +'</tbody></table><p class="print-tiny">No site cost estimate, ROI or probability of structural failure is available.</p>'
      : '<p>Select a documented sector in the dashboard to produce a specific evidence request.</p>')
    +'<h2>07 / Necessary next validation</h2>'
    +'<p>Acquire representative on-asset or scientifically linked geodetic evidence; verify station, period, reference frame and processing solution; incorporate a trustworthy asset register; validate exposure criteria, inspection triggers and engineering outcomes with the responsible operator.</p>'
    +'<p class="print-tiny"><b>Evidence sources:</b><br>'+refs.map(s=>safeText(s)).join('<br>')+'</p>'
    +'<div class="print-footer">BARUNA Sentinel · Ourdo Indonesia · Responsible screening demonstrator. Public reference positions and historical observations are not equivalent to an operational asset safety certificate.</div>';
}
