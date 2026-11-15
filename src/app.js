import {
  ASSETS, DEMO_RNEU, DEMO_RINEX, parseRneu, analyzeSeries,
  inspectRinex, rankAssets, evaluateEvidenceLink, evidenceBundle
} from "./engine.js";

const $ = id => document.getElementById(id);
let seriesInput = "";
let seriesMeta = null;
let movement = null;
let rinexResult = null;
let rinexMeta = { mode: "none", name: "No RINEX" };
let ranks = [];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}
function notify(message, error = false) {
  $("status-note").textContent = message;
  $("status-note").classList.toggle("is-error", error);
  $("live-region").textContent = message;
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
  } catch (error) {
    notify(error instanceof Error ? error.message : "Unable to parse GNSS input.", true);
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
    processSeries(await response.text(), {
      mode: "published",
      name: "CSEM 2010–2021 — source-derived numeric extract",
      provider: "Susilo et al. (2023), Zenodo 7775016",
      reference: "https://doi.org/10.5281/zenodo.7775016",
      constellationClaim: "GPS-processed historical station series, not proven multi-GNSS"
    });
  } catch (error) {
    runDemo();
    notify("Could not open local CSEM data. Illustrative fallback loaded. " + error.message, true);
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
  } catch (error) {
    notify("GeoRinex-verified QC summary unavailable: " + (error instanceof Error ? error.message : String(error)), true);
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
function renderRinex() {
  if (!rinexResult) return;
  const modeText = rinexMeta.mode === "real-qc" ? " · REAL ARCHIVE, VERIFIED VIA GEORINEX" : rinexMeta.mode === "synthetic" ? " · illustrative fixture" : " · user-supplied, not independently verified";
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
    : "RINEX " + (rinexResult.version || "unknown") + " · "
      + rinexResult.epochCount + " epoch markers · Station: " + rinexResult.marker
      + ". This is a separate audit; it is not linked to station displacement without matching processing provenance.";
  const shown = systems.length ? systems : rinexResult.declaredSystems;
  $("rinex-systems").innerHTML = shown.length
    ? shown.map(s => '<span class="system"><b>' + escapeHtml(s.name) + '</b><small>' + (rinexMeta.mode === "real-qc" ? "pseudorange observed" : s.lines ? s.lines + " records" : "header only") + '</small></span>').join("")
    : '<span class="system muted">No verifiable GNSS systems found</span>';
  renderEvidenceGate();
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
}
$("sample-btn").addEventListener("click", runDemo);
$("published-btn").addEventListener("click", runPublished);
$("rinex-demo").addEventListener("click", () => inspect(DEMO_RINEX, {mode: "synthetic", name: "Illustrative RINEX 3.04 fixture"}));
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
  const bundle = evidenceBundle({ ...seriesMeta, rinexSource: rinexMeta }, movement, rinexResult, ranks);
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "baruna-sentinel-bhumireka-evidence.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Evidence bundle exported. Keep original source files and document their origin.");
});
// Separate authentic sources: CSEM historical positions versus archived BAKO multi-GNSS QC.
// BAKO QC is verified by GeoRinex, but NEVER merged into the CSEM movement solution.
runPublished();
loadVerifiedRinexQC();