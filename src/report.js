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
    "https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/43690104506"
  ];
  return '<div class="print-head"><div><div class="print-brand">BARUNA / SENTINEL</div>'
    +'<small>OURDO INDONESIA · BIG BHUMIREKA 2026 · COMPETITION PROTOTYPE</small></div>'
    +'<div style="text-align:right"><b>DEMO EVIDENCE DOSSIER</b><small>Generated '+esc(bundle.generatedAt?.slice(0,19)?.replace("T"," ")||"local")+' UTC</small></div></div>'
    +'<h1>Semarang–Genuk coastal infrastructure</h1>'
    +'<p>Decision question: what should a coastal infrastructure maintenance team verify before scheduling a field inspection, and which observations are actually credible?</p>'
    +'<div class="print-callout"><b>Decision boundary:</b> data readiness and an illustrative verification workflow only. Not a certified asset-risk model, direct structural measurement, flood prediction, or operator recommendation.</div>'
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
    +'<h2>05 / Necessary next validation</h2>'
    +'<p>Acquire representative on-asset or scientifically linked geodetic evidence; verify station, period, reference frame and processing solution; incorporate a trustworthy asset register; validate exposure criteria, inspection triggers and engineering outcomes with the responsible operator.</p>'
    +'<p class="print-tiny"><b>Evidence sources:</b><br>'+refs.map(s=>safeText(s)).join('<br>')+'</p>'
    +'<div class="print-footer">BARUNA Sentinel · Ourdo Indonesia · Responsible screening demonstrator. Public reference positions and historical observations are not equivalent to an operational asset safety certificate.</div>';
}
