import {
  ASSETS, DEMO_RNEU, DEMO_RINEX, parseRneu, analyzeSeries,
  inspectRinex, rankAssets, evaluateEvidenceLink, evidenceBundle
} from "./engine.js";
import {renderGeoSvg, geoContextSummary, renderSpatialAuditRows,geoPointDetails,GEO_VIEWS,LANDMARKS} from "./geo.js";
import {buildEvidenceReportMarkup, buildVerificationBriefMarkup} from "./report.js";
import {parseLocalQcReport} from "./qc-source.js";
import {resolveFeatureFlags} from "./feature-flags.js";
import {makeStreetMap} from "./live-map.js";
import {parseStationQc,renderStationQc} from "./station-qc.js";
import {validateHistoricalFieldEvidence, historicalEvidenceSummary, renderHistoricalSectorCards, renderHistoricalSectorDetail} from "./historical.js";
import {evidenceReadiness, verificationRequestForSector} from "./readiness.js";

const $ = id => document.getElementById(id);
let seriesInput = "";
let seriesMeta = null;
let movement = null;
let rinexResult = null;
let rinexMeta = { mode: "none", name: "No RINEX" };
let ranks = [];
let historicalDoc = null;
let historicalFilter = "all";
let selectedSectorId = null;
let labEnabled = new URLSearchParams(window.location.search).get("lab") === "1";
const currentFlags = () => resolveFeatureFlags(labEnabled ? "?lab=1" : "");
const geoLayers = {station:true,landmarks:true,fictional:currentFlags().fictionalMapMarkers};
let geoView = "all";
let geoSelectedId = "port-terminal";
let streetMap = null;
let requestedOnlineMap = true;
function setGeoFocus(view) {
  if (!GEO_VIEWS[view]) return;
  geoView = view;
  if(view==="port") geoSelectedId="port-terminal";
  if(view==="station") geoSelectedId="csem";
  renderGeographicContext();
  $("live-region").textContent = "Map view: "+(view==="all"?"Semarang":view==="port"?"Tanjung Emas":"CSEM station")+
    ". Select a public reference point for coordinates and source.";
}
function selectGeoPoint(id) {
  const point=LANDMARKS.find(p=>p.id===id);
  if(!point) return;
  geoSelectedId=id;
  if (point.type==="station") geoLayers.station=true;
  else geoLayers.landmarks=true;
  const bounds=GEO_VIEWS[geoView];
  if(point.lon<bounds.west || point.lon>bounds.east || point.lat<bounds.south || point.lat>bounds.north)
    geoView = point.id==="csem" ? "station" : "port";
  renderGeographicContext();
  $("live-region").textContent = point.title + ": public reference coordinate selected; not an infrastructure condition measurement.";
}

function applyFeatureFlags() {
  const flags = currentFlags();
  document.body.dataset.inacors = flags.inaCorsImport ? "on" : "off";
  document.body.dataset.sandbox = flags.syntheticSandbox ? "on" : "off";
  document.body.dataset.fictional = flags.fictionalMapMarkers ? "on" : "off";
  $("lab-toggle").setAttribute("aria-pressed", String(labEnabled));
  $("lab-toggle").textContent = labEnabled ? "Hide experimental tools" : "Enable experimental tools";
  geoLayers.fictional = flags.fictionalMapMarkers;
  renderGeographicContext();
}


function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}
function notify(message, error = false) {
  $("status-note").textContent = message;
  $("status-note").classList.toggle("is-error", error);
  $("live-region").textContent = message;
  if ($("inline-feedback")) {
    $("inline-feedback").textContent = message;
    $("inline-feedback").classList.toggle("is-error", error);
  }
}
function reviewStep(sectionId) {
  $(sectionId).scrollIntoView({behavior:"smooth",block:"start"});
}
function updateSelectedSector() {
  const selected = historicalDoc?.sectors?.find(row => row.id === selectedSectorId);
  $("selected-sector-title").textContent = selected?.name || "Research record unavailable";
  $("selected-sector-range").textContent = selected
    ? selected.minCm + "–" + selected.maxCm + " cm cumulative settlement (2005 only)"
    : "No current site evidence is included";
  $("case-outcome-name").textContent = selected?.name || "Published sector record unavailable";
  $("case-outcome-history").textContent = selected
    ? selected.minCm + "–" + selected.maxCm + " cm"
    : "—";
}
function number(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}
function processSeries(content, meta) {
  try {
    const parsed = parseRneu(content, {
      station: $("station").value,
      unit: $("unit").value,
      referenceFrame: "IGb14 (user-declared)"
    });
    seriesInput = content;
    seriesMeta = { ...meta, station: parsed.station, referenceFrame: parsed.referenceFrame, unit: $("unit").value };
    movement = analyzeSeries(parsed);
    ranks = rankAssets(movement, ASSETS);
    renderAll();
    notify(meta.mode === "synthetic"
      ? "Illustrative data loaded. Numbers are invented for UI demonstration."
      : meta.mode === "published"
        ? "Historical CSEM observations loaded from the cited public dataset. GPS-based, not multi-GNSS proof."
        : "Imported and calculated locally. Source, station identity and frame still require verification.");
    return true;
  } catch (error) {
    notify(error instanceof Error ? error.message : "Unable to parse GNSS input.", true);
    return false;
  }
}
function runDemo() {
  $("station").value = "CSEM";
  $("unit").value = "meters";
  processSeries(DEMO_RNEU, { mode: "synthetic", name: "CSEM-style invented fixture (not a real station record)", provider: "BARUNA Sentinel demo fixture", reference: "None – synthetic" });
}
async function runPublished() {
  try {
    const response = await fetch("./data/CSEM_clean_Noff1site.source-derived.rneu");
    if (!response.ok) throw new Error("Historical dataset is not available at this deployment.");
    $("station").value = "CSEM";
    $("unit").value = "meters";
    return processSeries(await response.text(), {
      mode: "published",
      name: "CSEM 2010–2021 — source-derived numeric extract",
      provider: "Susilo et al. (2023), Zenodo 7775016",
      reference: "https://doi.org/10.5281/zenodo.7775016",
      constellationClaim: "GPS-processed historical station series, not proven multi-GNSS"
    });
  } catch (error) {
    // Do not silently substitute synthetic observations for a failed authentic source.
    seriesInput = "";
    seriesMeta = null;
    movement = null;
    ranks = [];
    $("source-badge").textContent = "UNAVAILABLE";
    $("source-title").textContent = "CSEM · not loaded";
    $("mode-movement").textContent = "SOURCE UNAVAILABLE";
    $("stat-epochs").textContent = "—";
    $("stat-trend").textContent = "—";
    $("stat-quality").textContent = "NO DATA";
    $("plot").textContent = "Published CSEM evidence could not be loaded. Choose the illustrative scenario explicitly if needed.";
    $("asset-rows").textContent = "No valid GNSS time series loaded.";
    $("boundary-notice").textContent = "CSEM source unavailable; no synthetic observations were substituted.";
    renderExecutiveDesk();
    notify("Published CSEM data unavailable: " + error.message + ". The application did not switch to synthetic data.", true);
    return false;
  }
}
async function loadVerifiedRinexQC() {
  try {
    const response = await fetch("./data/BAKO_IGS_2025-001_20min_qc_summary.json");
    if (!response.ok) throw new Error("Verified QC summary is missing from this build.");
    const qc = await response.json();
    if (qc.status !== "VERIFIED_REAL_RINEX_OBSERVATIONS" || qc.audit.epochs < 2 || qc.audit.constellationsObservedWithPseudorange.length < 2) {
      throw new Error("Verified QC report is invalid.");
    }
    rinexResult = {
      status: "MULTI_GNSS_RECORDS_SEEN",
      version: "3.x",
      marker: qc.source.station,
      epochCount: qc.audit.epochs,
      observedSystems: qc.audit.constellationsObservedWithPseudorange.map(name => ({ name, lines: null })),
      declaredSystems: [],
      averageGpsPseudorangeSatellitesPerEpoch: qc.audit.gpsOnlyAveragePseudorangeSatellitesPerEpoch,
      averageAllPseudorangeSatellitesPerEpoch: qc.audit.multiGnssAveragePseudorangeSatellitesPerEpoch,
      sourceUrl: qc.source.originalArchive,
      verifiedRun: qc.verifiedRun,
      verifiedObservationDate: qc.source.observationDate,
      warnings: qc.limitations,
      linkedToCsemMovement: false
    };
    rinexMeta = { mode: "real-qc", name: qc.source.filename, verifiedRun: qc.verifiedRun };
    renderRinex();
    return true;
  } catch (error) {
    rinexResult = null;
    rinexMeta = {mode:"none",name:"QC unavailable"};
    renderEvidenceGate();
    renderExecutiveDesk();
    notify("GeoRinex-verified QC summary unavailable: " + (error instanceof Error ? error.message : String(error)), true);
    return false;
  }
}
function inspect(content, meta) {
  try {
    rinexResult = inspectRinex(content);
    rinexMeta = meta;
    renderRinex();
    notify(meta.mode === "synthetic" ? "Illustrative RINEX parsed. Not proof of live multi-GNSS data." : "RINEX inspected locally. Verify provenance before making multi-GNSS claims.");
  } catch (error) {
    notify(error instanceof Error ? error.message : "RINEX inspection failed.", true);
  }
}
function drawPlot() {
  if (!movement || !movement.points.length) {
    $("plot").textContent = "No observation series loaded.";
    return;
  }
  const source = movement.points;
  const sampleEvery = Math.max(1, Math.ceil(source.length / 360));
  const plotted = source.filter((_, i) => i % sampleEvery === 0 || i === source.length - 1);
  const vals = source.map(p => p.upMm);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  const padding = Math.max(6, (max - min) * 0.14);
  min -= padding; max += padding;
  const w = 860, h = 250, l = 56, r = 22, t = 14, b = 34;
  const usableW = w - l - r, usableH = h - t - b;
  const getX = i => l + usableW * (i / (source.length - 1));
  const getY = val => t + usableH * (max - val) / (max - min);
  const points = plotted.map(p => {
    const idx = source.indexOf(p);
    return number(getX(idx), 2) + "," + number(getY(p.upMm), 2);
  }).join(" ");
  const fitted = number(getX(0), 2) + "," + number(getY(source[0].fittedMm), 2) + " "
    + number(getX(source.length - 1), 2) + "," + number(getY(source[source.length - 1].fittedMm), 2);
  let lines = "";
  for (let i = 0; i <= 4; i++) {
    const y = t + i * usableH / 4;
    const label = max - i * (max - min) / 4;
    lines += '<line x1="' + l + '" x2="' + (w - r) + '" y1="' + y + '" y2="' + y + '" class="gridline"/>';
    lines += '<text x="' + (l - 10) + '" y="' + (y + 4) + '" text-anchor="end" class="axis-label">' + number(label, 0) + '</text>';
  }
  $("plot").innerHTML =
    '<svg role="img" aria-label="Station vertical displacement in millimeters over time" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet">'
    + lines
    + '<polyline points="' + fitted + '" fill="none" stroke="#f2aa52" stroke-width="2.2" stroke-dasharray="5 5"/>'
    + '<polyline points="' + points + '" fill="none" stroke="#187a76" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<circle cx="' + getX(source.length - 1) + '" cy="' + getY(source[source.length - 1].upMm) + '" r="4.5" fill="#187a76" stroke="#fff" stroke-width="2"/>'
    + '<text class="axis-label" x="' + l + '" y="' + (h - 8) + '">' + escapeHtml(source[0].date) + '</text>'
    + '<text class="axis-label" text-anchor="end" x="' + (w-r) + '" y="' + (h-8) + '">' + escapeHtml(source[source.length - 1].date) + '</text>'
    + '</svg>';
}
function renderExecutiveDesk() {
  const snapshot = evidenceReadiness({
    fieldEvidence: historicalDoc,
    movement, movementMeta: seriesMeta,
    rinex: rinexResult, rinexMeta
  });
  $("exec-sectors").textContent = snapshot.sectorCount === null ? "—" : String(snapshot.sectorCount);
  $("exec-streams").textContent = snapshot.loadedEvidenceStreams + " / 3";
  $("exec-current").textContent = String(snapshot.currentInstrumentedAssetMeasurementsInDemo);
}

function renderHistoricalResearch() {
  if (!historicalDoc) return;
  $("historical-sector-list").innerHTML = renderHistoricalSectorCards(historicalDoc, historicalFilter);
  const selected = $("historical-sector-list").querySelector(".historical-sector");
  if (selected) {
    const chosen = [...$("historical-sector-list").querySelectorAll("button[data-sector]")]
      .find(row => row.dataset.sector === selectedSectorId) || selected;
    selectedSectorId = chosen.dataset.sector;
    $("historical-sector-detail").innerHTML = renderHistoricalSectorDetail(historicalDoc, selectedSectorId);
    chosen.setAttribute("aria-current", "true");
  }
  for (const button of $("historical-filters").querySelectorAll("button[data-filter]")) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === historicalFilter));
  }
  updateSelectedSector();
  renderExecutiveDesk();
}

async function loadHistoricalResearch() {
  try {
    const response = await fetch("./data/tanjung-emas-historical-field-evidence.json");
    if(!response.ok) throw new Error("Original published field evidence extract unavailable.");
    historicalDoc = validateHistoricalFieldEvidence(await response.json());
    renderHistoricalResearch();
    return true;
  } catch(error) {
    $("historical-sector-list").textContent = "Historical research records unavailable: " + (error instanceof Error?error.message:String(error));
    $("historical-sector-detail").textContent = "Do not infer that absent records indicate no historic subsidence.";
    historicalDoc = null;
    selectedSectorId = null;
    updateSelectedSector();
    renderExecutiveDesk();
    return false;
  }
}

function showLiveOsmMap(show) {
  requestedOnlineMap = show;
  const embed=$("geo-osm-embed");
  const grid=$("geo-map");
  const status=$("basemap-status");
  if(show && !window.L){
    status.textContent = "Live map library unavailable. Offline coordinate grid shown.";
    embed.hidden=true;
    grid.hidden=false;
    $("osm-toggle").textContent="Retry street map";
    $("osm-toggle").setAttribute("aria-pressed","false");
    return;
  }
  embed.hidden=!show;
  grid.hidden=show;
  $("osm-toggle").setAttribute("aria-pressed",String(show));
  $("osm-toggle").textContent=show?"Coordinate grid / Offline":"Show street map";
  if(!show){
    status.textContent="Offline WGS84 coordinate reference · no street tiles";
    return;
  }
  status.textContent="Live OpenStreetMap · pan, zoom and select references";
  if(!streetMap){
    try {
      streetMap=makeStreetMap({
        element:$("street-map"),
        onSelect:id=>selectGeoPoint(id),
        onTileFailure:()=>{
          if(requestedOnlineMap){
            showLiveOsmMap(false);
            $("basemap-status").textContent="Map tiles unavailable. Offline coordinate grid shown.";
          }
        }
      });
    } catch(error) {
      streetMap=null;
      showLiveOsmMap(false);
      status.textContent="Could not initialize live map. Offline grid remains available.";
      return;
    }
  }
  const layers={...geoLayers,fictional:geoLayers.fictional && document.body.dataset.view==="analyst"};
  streetMap.redraw({view:geoView,selectedId:geoSelectedId,layers,includeScenarios:layers.fictional});
  requestAnimationFrame(()=>streetMap?.resize());
}

function renderGeographicContext() {
  const geo = geoContextSummary();
  // Competition decision view never displays invented scenario markers, even when the lab is enabled.
  const visibleLayers = { ...geoLayers, fictional: geoLayers.fictional && document.body.dataset.view === "analyst" };
  $("geo-map").innerHTML = renderGeoSvg(visibleLayers,{view:geoView,selectedId:geoSelectedId});
  const selectedPoint=geoPointDetails(geoSelectedId);
  $("geo-selected-category").textContent = selectedPoint.category;
  $("geo-selected-title").textContent = selectedPoint.title;
  $("geo-selected-coordinates").textContent = selectedPoint.latitude.toFixed(6)+", "+selectedPoint.longitude.toFixed(6);
  $("geo-selected-distance").textContent = selectedPoint.fromCsemKm.toFixed(1)+" km";
  $("geo-selected-limitation").textContent = selectedPoint.limitation;
  $("geo-selected-source").href = selectedPoint.sourceUrl;
  for(const button of document.querySelectorAll("[data-geo-view]")){
    button.setAttribute("aria-pressed",String(button.dataset.geoView===geoView));
  }
  for(const button of document.querySelectorAll("[data-geo-point]")){
    button.setAttribute("aria-pressed",String(button.dataset.geoPoint===geoSelectedId));
  }
  $("geo-audit-rows").innerHTML = renderSpatialAuditRows();
  const available = currentFlags().fictionalMapMarkers ? 3 : 2;
  $("geo-layer-summary").textContent = Object.values(geoLayers).filter(Boolean).length + " / " + available + " layers visible";
  $("geo-distance").textContent = geo.landmarkDistanceKm.toFixed(1) + " km";
  $("geo-bako-distance").textContent = "≈ " + geo.externalObservationQcStationDistanceKm + " km apart";
  for (const button of document.querySelectorAll("[data-map-layer]")) {
    button.setAttribute("aria-pressed", String(geoLayers[button.dataset.mapLayer]));
  }
  if(requestedOnlineMap) showLiveOsmMap(true);
}

function currentEvidenceBundle() {
  const bundle = evidenceBundle({ ...seriesMeta, rinexSource: rinexMeta }, movement, rinexResult, ranks);
  return { ...bundle, geospatialContext: geoContextSummary(),
    publishedFieldEvidence: historicalDoc ? historicalEvidenceSummary(historicalDoc) : null,
    executiveReadiness: evidenceReadiness({
      fieldEvidence: historicalDoc,
      movement, movementMeta: seriesMeta, rinex: rinexResult, rinexMeta
    }),
    verificationRequest: historicalDoc && selectedSectorId ?
      verificationRequestForSector(historicalDoc, selectedSectorId) : null
  };
}

function printEvidenceReport() {
  if (!movement || !seriesMeta) return notify("Load a station time series before printing the evidence dossier.", true);
  try {
    $("print-report").innerHTML = buildEvidenceReportMarkup(currentEvidenceBundle());
    window.print();
    notify("Evidence dossier prepared. Select Print / Save as PDF in your browser.");
  } catch (error) {
    notify("Could not generate evidence report: " + (error instanceof Error ? error.message : String(error)), true);
  }
}

function printVerificationBrief() {
  if(!historicalDoc || !selectedSectorId) {
    return notify("Historical sector data are not available yet. Cannot prepare a source-backed verification brief.", true);
  }
  try {
    const verification = verificationRequestForSector(historicalDoc, selectedSectorId);
    $("print-report").innerHTML = buildVerificationBriefMarkup({
      verification, source: historicalDoc, generatedAt: new Date().toISOString()
    });
    window.print();
    notify("Sector verification brief prepared. Select Print / Save as PDF in your browser.");
  } catch (error) {
    notify("Could not prepare verification brief: " + (error instanceof Error ? error.message : String(error)), true);
  }
}

async function runCaseStudy() {
  const button = $("case-study-btn");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  $("demo-status").textContent = "Loading authentic historical positions and independent multi-GNSS QC…";
  try {
    const csemLoaded = await runPublished();
    const qcLoaded = await loadVerifiedRinexQC();
    const fieldLoaded = historicalDoc ? true : await loadHistoricalResearch();
    const complete = Boolean(csemLoaded && qcLoaded && fieldLoaded &&
      seriesMeta?.mode === "published" && rinexMeta.mode === "real-qc");
    $("demo-status").textContent = complete
      ? "Case ready · authentic CSEM + real BAKO QC · explicitly independent"
      : "Case incomplete · check missing sources below. No simulated replacement.";
    if (complete) {
      reviewStep("field-evidence");
      notify("Case ready. Select an infrastructure sector, review evidence limits, and prepare a verification brief.");
    } else {
      notify("One or more real sources could not load. Choose illustrative data manually only if you want to simulate.",true);
    }
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

function renderRinex() {
  if (!rinexResult) return;
  const modeText = rinexMeta.mode === "real-qc" ? " · REAL ARCHIVE, VERIFIED VIA GEORINEX" : rinexMeta.mode === "local-qc" ? " · LOCALLY DECODED, SOURCE DECLARED BY USER" : rinexMeta.mode === "synthetic" ? " · illustrative fixture" : " · user-supplied, not independently verified";
  const systems = rinexResult.observedSystems;
  if (rinexResult.status === "MULTI_GNSS_RECORDS_SEEN" || rinexResult.status === "MULTI_GNSS_EPOCH_IDS_SEEN") {
    $("rinex-status").textContent = systems.length + (rinexResult.status === "MULTI_GNSS_EPOCH_IDS_SEEN" ? " GNSS systems in RINEX 2 epoch satellite lists" : " GNSS systems identified in observation records") + modeText;
  } else if (rinexResult.status === "MULTI_GNSS_HEADER_ONLY") {
    $("rinex-status").textContent = "Multiple systems declared; observations not verified" + modeText;
  } else {
    $("rinex-status").textContent = "Multi-GNSS observation evidence not established" + modeText;
  }
  $("rinex-caption").textContent = rinexMeta.mode === "real-qc"
    ? "IGS BAKO · 1 Jan 2025 · " + rinexResult.epochCount + " epochs · GPS-only " + rinexResult.averageGpsPseudorangeSatellitesPerEpoch
      + " vs multi-GNSS " + rinexResult.averageAllPseudorangeSatellitesPerEpoch
      + " average satellites with pseudorange per epoch. NOT Semarang movement or positioning accuracy."
    : rinexMeta.mode === "local-qc"
      ? "Local GeoRinex QC · " + rinexResult.marker + " (operator-declared identity) · " + rinexResult.epochCount
        + " epochs · GPS-only " + rinexResult.averageGpsPseudorangeSatellitesPerEpoch
        + " vs all observed systems " + rinexResult.averageAllPseudorangeSatellitesPerEpoch
        + " mean pseudorange satellites/epoch. Not independently verified by BIG; no asset movement solution."
      : "RINEX " + (rinexResult.version || "unknown") + " · "
        + rinexResult.epochCount + " epoch markers · Station: " + rinexResult.marker
        + ". This is a separate audit; it is not linked to station displacement without matching processing provenance.";
  const shown = systems.length ? systems : rinexResult.declaredSystems;
  $("rinex-systems").innerHTML = shown.length
    ? shown.map(s => '<span class="system"><b>' + escapeHtml(s.name) + '</b><small>' + ((rinexMeta.mode === "real-qc" || rinexMeta.mode === "local-qc") ? "pseudorange observed" : s.lines ? s.lines + " records" : "header only") + '</small></span>').join("")
    : '<span class="system muted">No verifiable GNSS systems found</span>';
  renderEvidenceGate();
  renderExecutiveDesk();
}

function renderEvidenceGate() {
  const gate = evaluateEvidenceLink(movement, seriesMeta, rinexResult, rinexMeta);
  const title = gate.status === "INDEPENDENT_SOURCES_NOT_LINKED"
    ? "Independent observations — no verified solution link"
    : gate.status === "MOVEMENT_EVIDENCE_LIMITED"
      ? "Movement evidence needs further verification"
      : "Multi-GNSS solution linkage not verified";
  $("evidence-gate-title").textContent = title;
  $("evidence-gate-caption").textContent = gate.explanation
    + " Asset-level decisions are not authorized by this demonstration.";
}
function renderAssets() {
  $("asset-rows").innerHTML = ranks.map((asset, i) => {
    const cls = asset.priority === "DATA_INSUFFICIENT" ? "gray" : "teal";
    const tierText = asset.scenarioTier.replace(/_/g, " ");
    const desc = asset.priority === "DATA_INSUFFICIENT"
      ? "Insufficient time-series evidence. Do not treat unknown as stability."
      : "Fictional triage tier based on illustrative exposure/criticality, NOT measured asset displacement.";
    return '<div class="asset-row"><div class="asset-left"><span class="asset-index">0' + (i+1) + '</span><div><h4>'
      + escapeHtml(asset.name) + '</h4><p>Exposure: ' + escapeHtml(asset.exposure) + ' · Criticality: ' + escapeHtml(asset.criticality)
      + '</p></div></div><div class="asset-right"><span class="priority ' + cls + '">' + escapeHtml(tierText) + '</span><small>'
      + escapeHtml(asset.priority.replace(/_/g, " ")) + ' · ' + escapeHtml(desc) + '</small></div></div>';
  }).join("");
}
function renderAll() {
  if (!movement) return;
  const isSynthetic = seriesMeta && seriesMeta.mode === "synthetic";
  const isPublished = seriesMeta && seriesMeta.mode === "published";
  $("source-badge").textContent = isSynthetic ? "SIMULATED" : isPublished ? "HISTORICAL GPS" : "USER FILE";
  $("source-title").textContent = movement.station + (isSynthetic ? " · fictional" : isPublished ? " · 2010–2021" : " · unverified");
  $("mode-movement").textContent = isSynthetic ? "ILLUSTRATIVE MODE" : isPublished ? "PUBLISHED GPS · HISTORICAL" : "IMPORTED · PROVENANCE UNVERIFIED";
  $("stat-trend").textContent = (movement.verticalSlopeMmYr > 0 ? "+" : "") + number(movement.verticalSlopeMmYr, 1);
  $("stat-epochs").textContent = movement.epochCount.toLocaleString("en-US");
  $("stat-quality").textContent = movement.quality === "SCREENING_READY" ? "SCREENING" : "LIMITED";
  $("stat-quality").className = movement.quality === "SCREENING_READY" ? "quality-good" : "quality-warn";
  $("plot-caption").textContent = movement.station + " · " + (isSynthetic ? "invented observations" : isPublished ? "published GPS historical positions" : "uploaded observations (not verified)") + " · OLS trend is descriptive";
  $("audit-series").textContent = movement.start + " → " + movement.end + " · max gap " + movement.maxGapDays + " days · endpoint precision ratio " + (movement.endpointPrecisionRatio === null ? "n/a" : number(movement.endpointPrecisionRatio, 1) + "×");
  $("boundary-notice").textContent = isSynthetic
    ? "All plotted numbers are SYNTHETIC, not Semarang GNSS observations. RINEX constellation audit is a separate source."
    : isPublished
      ? "CSEM is a real 2010–2021 GPS-derived historical dataset; it is not 2026 monitoring or proof of multi-GNSS processing. RINEX inspection is a separate source."
      : "Imported observation values are user-supplied; station metadata and processing provenance have not been independently verified. RINEX audit is separate.";
  drawPlot();
  renderAssets();
  renderEvidenceGate();
  renderExecutiveDesk();
}
$("sample-btn").addEventListener("click", runDemo);
$("published-btn").addEventListener("click", runPublished);
$("rinex-demo").addEventListener("click", () => inspect(DEMO_RINEX, {mode: "synthetic", name: "Illustrative RINEX 3.04 fixture"}));
$("load-bako").addEventListener("click", async () => {
  const success=await loadVerifiedRinexQC();
  notify(success ? "Plan B active: verified BAKO original observation QC, Cibinong, independent from CSEM."
    : "BAKO fallback is not available in this build.", !success);
});
$("qc-report-file").addEventListener("change", async event => {
  const file=event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2*1024*1024) throw new Error("QC summary exceeds 2 MB; upload a compact GeoRinex JSON, not raw RINEX.");
    const parsed=parseLocalQcReport(JSON.parse(await file.text()));
    rinexResult=parsed;
    rinexMeta={mode:"local-qc",name:file.name,stationEvidence:"operator_declared_unverified"};
    renderRinex();
    notify("Plan A file decoded: "+parsed.marker+". Provenance/station declared by operator; no BIG verification or asset deformation claim.");
  } catch(error) {
    notify("QC JSON rejected: "+(error instanceof Error?error.message:String(error))+". BAKO remains available via Restore.", true);
  } finally {
    event.target.value="";
  }
});
$("series-file").addEventListener("change", async e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) return notify("File too large. Limit: 10 MB.", true);
  const stationGuess = /^([A-Z0-9]{4})[._-]/i.exec(file.name);
  if (stationGuess) $("station").value = stationGuess[1].toUpperCase();
  processSeries(await file.text(), { mode: "user", name: file.name, provider: "User supplied; not independently verified", reference: "Confirm original repository / checksum" });
});
$("rinex-file").addEventListener("change", async e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) return notify("RINEX file too large for browser audit. Limit: 20 MB.", true);
  inspect(await file.text(), {mode: "user", name: file.name});
});
$("unit").addEventListener("change", () => {
  if (seriesInput && seriesMeta) processSeries(seriesInput, seriesMeta);
});
$("station").addEventListener("change", () => {
  if (seriesInput && seriesMeta) processSeries(seriesInput, seriesMeta);
});
$("export-json").addEventListener("click", () => {
  if (!movement) return notify("Load a station series before exporting.", true);
  const bundle = currentEvidenceBundle();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "baruna-sentinel-bhumireka-evidence.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Evidence bundle exported. Keep original source files and document their origin.");
});
$("case-study-btn").addEventListener("click", runCaseStudy);
$("lab-toggle").addEventListener("click", async () => {
  labEnabled = !labEnabled;
  applyFeatureFlags();
  if (!labEnabled) {
    if (seriesMeta?.mode === "synthetic") await runPublished();
    if (rinexMeta.mode === "local-qc" || rinexMeta.mode === "synthetic") await loadVerifiedRinexQC();
  }
  notify(labEnabled ? "Experimental data tools enabled. BAKO remains the verified default." :
    "Data lab closed. Verified evidence restored when experimental data had been selected.");
});
// View switching is owned by independent navigation.js, not by this analytics module.
window.addEventListener("baruna:viewchange",()=>renderGeographicContext());
$("step-sector").addEventListener("click", () => reviewStep("field-evidence"));
$("step-evidence").addEventListener("click", () => reviewStep("geo-context"));
$("step-report").addEventListener("click", printVerificationBrief);
document.querySelector(".geo-layer-toolbar").addEventListener("click", event => {
  const button = event.target.closest("button[data-map-layer]");
  if (!button) return;
  const layer = button.dataset.mapLayer;
  if (!Object.hasOwn(geoLayers,layer)) return;
  geoLayers[layer] = !geoLayers[layer];
  renderGeographicContext();
  notify("Map layer " + layer + (geoLayers[layer] ? " visible." : " hidden.") +
    " Coordinates show geographic context, not measured asset deformation.");
});
document.querySelectorAll('label[role="button"][for]').forEach(label => {
  label.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      $(label.htmlFor).click();
    }
  });
});
document.querySelector(".geo-focus-toolbar").addEventListener("click",event=>{
  const button=event.target.closest("button[data-geo-view]");
  if(button) setGeoFocus(button.dataset.geoView);
});
document.querySelector(".geo-reference-choices").addEventListener("click",event=>{
  const button=event.target.closest("button[data-geo-point]");
  if(button) selectGeoPoint(button.dataset.geoPoint);
});
$("geo-map").addEventListener("click",event=>{
  const node=event.target.closest("[data-point-id]");
  if(node) selectGeoPoint(node.dataset.pointId);
});
$("geo-map").addEventListener("keydown",event=>{
  if(event.key!=="Enter" && event.key!==" ") return;
  const node=event.target.closest("[data-point-id]");
  if(node){event.preventDefault();selectGeoPoint(node.dataset.pointId);}
});
$("map-disclosure").addEventListener("toggle", () => {
  if ($("map-disclosure").open) {
    // Recalculate map dimensions after opening a previously hidden Leaflet map.
    requestAnimationFrame(() => {
      if(streetMap) streetMap.resize();
      else showLiveOsmMap(true);
    });
  }
});
$("osm-toggle").addEventListener("click", () => showLiveOsmMap(!requestedOnlineMap));
$("osm-close").addEventListener("click", () => showLiveOsmMap(false));
$("historical-filters").addEventListener("click", e => {
  const button = e.target.closest("button[data-filter]");
  if(!button || !historicalDoc) return;
  historicalFilter = button.dataset.filter;
  renderHistoricalResearch();
});
$("historical-sector-list").addEventListener("click", e => {
  const button = e.target.closest("button[data-sector]");
  if(!button || !historicalDoc) return;
  for (const row of $("historical-sector-list").querySelectorAll("button[data-sector]")) row.removeAttribute("aria-current");
  button.setAttribute("aria-current", "true");
  selectedSectorId = button.dataset.sector;
  $("historical-sector-detail").innerHTML = renderHistoricalSectorDetail(historicalDoc, selectedSectorId);
  // Technical detail stays closed until the user explicitly expands it.
  updateSelectedSector();
  notify("Selected "+ historicalDoc.sectors.find(s => s.id === selectedSectorId).name + ". Historical study only; current condition unknown.");
});
$("report-btn").addEventListener("click", printEvidenceReport);
$("executive-brief").addEventListener("click", printVerificationBrief);
$("case-workspace-brief").addEventListener("click",printVerificationBrief);
$("cors-qc-file").addEventListener("change", async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  const notice=$("cors-qc-notice");
  const result=$("cors-qc-result");
  if(file.size>3*1024*1024){
    notice.textContent="This browser viewer accepts QC JSON smaller than 3 MB. Process larger sets locally first.";
    notice.classList.add("is-error");
    return;
  }
  result.setAttribute("aria-busy","true");
  notice.classList.remove("is-error");
  notice.textContent="Validating locally derived RINEX coverage summary…";
  try{
    const parsed=parseStationQc(JSON.parse(await file.text()));
    result.innerHTML=renderStationQc(parsed);
    $("cors-qc-reset").hidden=false;
    notice.textContent="Local QC ready · "+parsed.records.length+" station-day files · "+parsed.firstDate+
      " to "+parsed.lastDate+". These measurements remain in this tab only.";
    $("live-region").textContent="CSEM and CSMG local QC loaded. "+
      parsed.jointFullDays.length+" matching days with complete observed epoch grids.";
  }catch(error){
    result.innerHTML='<div class="cors-qc-empty"><strong>Invalid QC summary</strong><span>Review your local data and try again. No source files were transmitted.</span></div>';
    notice.textContent="QC validation failed: "+error.message;
    notice.classList.add("is-error");
    $("cors-qc-reset").hidden=true;
  }finally{
    result.removeAttribute("aria-busy");
  }
});
$("cors-qc-reset").addEventListener("click",()=>{
  $("cors-qc-file").value="";
  $("cors-qc-reset").hidden=true;
  $("cors-qc-result").innerHTML='<div class="cors-qc-empty"><strong>Evidence comparison is ready.</strong><span>Choose a local CSEM/CSMG QC JSON to review station-day observations.</span></div>';
  $("cors-qc-notice").textContent="Local QC cleared. No station data was stored or uploaded.";
  $("cors-qc-notice").classList.remove("is-error");
});
applyFeatureFlags();
showLiveOsmMap(true);
renderExecutiveDesk();
loadHistoricalResearch();
// Separate authentic sources: CSEM historical positions versus archived BAKO multi-GNSS QC.
// BAKO QC is verified by GeoRinex, but NEVER merged into the CSEM movement solution.
runPublished();
loadVerifiedRinexQC();