// Scientific guardrails for a competition demonstration. No structural-safety claims.
export const ASSETS = Object.freeze([
  { id: "port", name: "Illustrative port access", exposure: "high", criticality: "high", note: "Synthetic, not operator-provided" },
  { id: "road", name: "Illustrative coastal road", exposure: "moderate", criticality: "high", note: "Synthetic, not operator-provided" },
  { id: "store", name: "Illustrative storage facility", exposure: "moderate", criticality: "low", note: "Synthetic, not operator-provided" }
]);

export const DEMO_RNEU = [
  "# SYNTHETIC fixture. NOT CSEM data or any real GNSS observation.",
  "# YYYYMMDD decimal_year north_m east_m up_m sigmaN_m sigmaE_m sigmaU_m",
  "20240101 2024.000 0.0000 0.0000 0.0000 0.002 0.002 0.004",
  "20240301 2024.164 0.0001 0.0000 -0.0130 0.002 0.002 0.004",
  "20240501 2024.331 0.0001 0.0002 -0.0270 0.002 0.002 0.004",
  "20240701 2024.498 0.0003 0.0003 -0.0410 0.002 0.002 0.004",
  "20240901 2024.667 0.0005 0.0003 -0.0530 0.002 0.002 0.004",
  "20241101 2024.834 0.0004 0.0005 -0.0680 0.002 0.002 0.004",
  "20250101 2025.000 0.0005 0.0006 -0.0810 0.002 0.002 0.004",
  "20250301 2025.164 0.0006 0.0007 -0.0940 0.002 0.002 0.004",
  "20250501 2025.329 0.0007 0.0007 -0.1080 0.002 0.002 0.004",
  "20250701 2025.495 0.0009 0.0008 -0.1200 0.002 0.002 0.004",
  "20250901 2025.666 0.0010 0.0009 -0.1350 0.002 0.002 0.004",
  "20251101 2025.833 0.0010 0.0010 -0.1480 0.002 0.002 0.004"
].join("\n");

export const DEMO_RINEX = [
  "     3.04           OBSERVATION DATA    M                   RINEX VERSION / TYPE",
  "ILLUSTRATIVE-DEMO                                       MARKER NAME",
  "G    4 C1C L1C D1C S1C                                  SYS / # / OBS TYPES",
  "R    4 C1C L1C D1C S1C                                  SYS / # / OBS TYPES",
  "                                                            END OF HEADER",
  "> 2025 01 01 00 00 00.0000000  0  4",
  "G01  23456789.000 1234567.000",
  "G02  23456789.000 1234567.000",
  "R01  23456789.000 1234567.000",
  "R02  23456789.000 1234567.000"
].join("\n");

function utcDay(raw) {
  if (!/^\d{8}$/.test(raw)) throw new Error("Invalid YYYYMMDD epoch: " + raw);
  const date = new Date(raw.slice(0, 4) + "-" + raw.slice(4, 6) + "-" + raw.slice(6, 8) + "T00:00:00Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10).replace(/-/g, "") !== raw) {
    throw new Error("Invalid calendar date: " + raw);
  }
  return date;
}

export function parseRneu(text, options = {}) {
  if (typeof text !== "string" || !text.trim()) throw new Error("Empty .rneu file.");
  const unit = options.unit === "millimeters" ? 0.001 : 1;
  const station = (options.station || "UNVERIFIED").trim().toUpperCase();
  const values = [];
  for (const line of text.split(/\r?\n/)) {
    const cleaned = line.trim();
    if (!/^\d{8}\s/.test(cleaned)) continue;
    const p = cleaned.split(/\s+/);
    if (p.length < 8) throw new Error("Expected 8 .rneu columns at " + p[0]);
    const date = utcDay(p[0]);
    const nums = p.slice(2, 8).map(Number);
    if (nums.some(x => !Number.isFinite(x))) throw new Error("Non-numeric GNSS observation: " + p[0]);
    if (nums.slice(3).some(x => x < 0)) throw new Error("Negative sigma at " + p[0]);
    values.push({
      date: date.toISOString().slice(0, 10),
      t: date.getTime() / 86400000,
      north: nums[0] * unit,
      east: nums[1] * unit,
      up: nums[2] * unit,
      sigmaN: nums[3] * unit,
      sigmaE: nums[4] * unit,
      sigmaU: nums[5] * unit
    });
  }
  if (values.length < 2) throw new Error("At least two observation epochs are required.");
  values.sort((a, b) => a.t - b.t);
  if (values.some((v, i) => i > 0 && v.t === values[i - 1].t)) {
    throw new Error("Duplicate observation date detected.");
  }
  return { station, referenceFrame: options.referenceFrame || "IGb14 (user-declared)", unit: "meters", epochs: values };
}

export function analyzeSeries(series) {
  const points = series.epochs;
  const n = points.length;
  const daySpan = points[n - 1].t - points[0].t;
  const xs = points.map(p => (p.t - points[0].t) / 365.25);
  const ys = points.map(p => p.up * 1000);
  const xbar = xs.reduce((a, b) => a + b, 0) / n;
  const ybar = ys.reduce((a, b) => a + b, 0) / n;
  const sxx = xs.reduce((sum, x) => sum + (x - xbar) ** 2, 0);
  if (!sxx) throw new Error("Cannot estimate trend with identical observation dates.");
  const slope = xs.reduce((sum, x, i) => sum + (x - xbar) * (ys[i] - ybar), 0) / sxx;
  const intercept = ybar - slope * xbar;
  const residualRms = Math.sqrt(ys.reduce((sum, y, i) => sum + (y - intercept - slope * xs[i]) ** 2, 0) / n);
  const maxGap = points.reduce((max, p, i) => i ? Math.max(max, p.t - points[i - 1].t) : 0, 0);
  // Conservative descriptive gate, NOT scientific statistical significance.
  const sufficientForScreening = n >= 10 && daySpan >= 365 && maxGap <= 120;
  return {
    station: series.station,
    epochCount: n,
    start: points[0].date,
    end: points[n - 1].date,
    spanDays: Math.round(daySpan),
    maxGapDays: Math.round(maxGap),
    deltaUpMm: Math.round((points[n - 1].up - points[0].up) * 100000) / 100,
    verticalSlopeMmYr: Math.round(slope * 100) / 100,
    residualRmsMm: Math.round(residualRms * 100) / 100,
    quality: sufficientForScreening ? "SCREENING_READY" : "LIMITED_EVIDENCE",
    direction: slope < 0 ? "DOWNWARD_DESCRIPTIVE" : slope > 0 ? "UPWARD_DESCRIPTIVE" : "NO_DIRECTION",
    points: points.map((p, i) => ({ date: p.date, upMm: ys[i], fittedMm: intercept + slope * xs[i] })),
    warnings: [
      "Ordinary least-squares descriptive slope; no seasonal, discontinuity, autocorrelation or tectonic corrections.",
      "Vertical trend is at a station. It is not a measured displacement of nearby assets.",
      "A negative slope alone is not a validated safety/engineering threshold.",
      ...(sufficientForScreening ? [] : ["Short, sparse or discontinuous series. Do not interpret as a reliable long-term signal."])
    ]
  };
}

const SYS = { G: "GPS", R: "GLONASS", E: "Galileo", C: "BeiDou", J: "QZSS", I: "NavIC", S: "SBAS" };

export function inspectRinex(text) {
  if (typeof text !== "string" || !text.includes("RINEX VERSION / TYPE")) {
    throw new Error("Not a recognizable RINEX observation header.");
  }
  const lines = text.split(/\r?\n/);
  const headerEnd = lines.findIndex(line => line.includes("END OF HEADER"));
  if (headerEnd < 0) throw new Error("RINEX END OF HEADER not found.");
  const versionLine = lines.find(line => line.includes("RINEX VERSION / TYPE")) || "";
  const version = Number(versionLine.slice(0, 9).trim());
  const markerLine = lines.find(line => line.includes("MARKER NAME"));
  const marker = markerLine ? markerLine.slice(0, 60).trim() : "unknown";
  const declared = new Set();
  if (version >= 3) {
    for (const line of lines.slice(0, headerEnd)) {
      if (line.includes("SYS / # / OBS TYPES") && SYS[line.trimStart()[0]]) declared.add(line.trimStart()[0]);
    }
  } else {
    const type = versionLine.slice(40, 41);
    if (SYS[type]) declared.add(type);
  }
  const observed = {};
  let epochCount = 0;
  if (version >= 3) {
    for (const line of lines.slice(headerEnd + 1)) {
      if (line.startsWith(">")) epochCount++;
      const match = /^([GRECJIS])\d{2}\s/.exec(line);
      if (match) observed[match[1]] = (observed[match[1]] || 0) + 1;
    }
  } else {
    // RINEX 2 epoch header uses the satellite list at/after character 33.
    // This intentionally does not claim validated epoch data parsing.
    for (const line of lines.slice(headerEnd + 1)) {
      if (/^\s*\d{2}\s+\d{1,2}\s+\d{1,2}\s+\d{1,2}\s+\d{1,2}\s+/.test(line)) {
        epochCount++;
        for (const match of line.slice(32).matchAll(/([GRECJIS])\d{2}/g)) {
          observed[match[1]] = (observed[match[1]] || 0) + 1;
        }
      }
    }
  }
  const observedSystems = Object.keys(observed);
  const declaredSystems = [...declared];
  const status = observedSystems.length >= 2 ? "MULTI_GNSS_RECORDS_SEEN"
    : declaredSystems.length >= 2 ? "MULTI_GNSS_HEADER_ONLY"
      : observedSystems.length === 1 ? "SINGLE_SYSTEM_RECORDS_SEEN" : "UNVERIFIED";
  return {
    version: Number.isFinite(version) ? version : null,
    marker,
    declaredSystems: declaredSystems.map(code => ({ code, name: SYS[code] })),
    observedSystems: observedSystems.map(code => ({ code, name: SYS[code], lines: observed[code] })),
    epochCount, status,
    warnings: [
      "Constellation/observation presence inspection only; no GNSS positioning, satellite tracking QA, or RTK solution.",
      "RINEX source/receiver metadata must be verified independently.",
      ...(version < 3 ? ["RINEX 2 observation counting is a best-effort satellite-list inspection, not full decoding."] : []),
      ...(status === "MULTI_GNSS_HEADER_ONLY" ? ["Multiple systems declared in header, but observation records are not verified."] : [])
    ]
  };
}

export function rankAssets(movement, assets = ASSETS) {
  return assets.map(asset => {
    const reasons = [];
    let priority = "DATA_INSUFFICIENT";
    if (movement && movement.quality === "SCREENING_READY") {
      if (movement.direction === "DOWNWARD_DESCRIPTIVE" && asset.exposure === "high" && asset.criticality === "high") {
        priority = "REVIEW_SOON";
        reasons.push("DESCRIPTIVE_DOWNWARD_REGIONAL_TREND", "ILLUSTRATIVE_HIGH_EXPOSURE", "ILLUSTRATIVE_HIGH_CRITICALITY");
      } else {
        priority = "ROUTINE_REVIEW";
        reasons.push("NO_DIRECT_ASSET_MOVEMENT_EVIDENCE", "ILLUSTRATIVE_ASSET_CONTEXT");
      }
    } else reasons.push("INSUFFICIENT_STATION_TIME_SERIES");
    reasons.push("REGIONAL_REFERENCE_NOT_ASSET_INSTRUMENT");
    return { ...asset, priority, reasons, operationalDecisionAllowed: false };
  });
}

export function evidenceBundle(meta, movement, rinex, ranks) {
  return {
    schema: "sentinel-competition-evidence-v1",
    generatedAt: new Date().toISOString(),
    prototype: "BARUNA Sentinel (independent Bhumireka demo)",
    source: meta,
    movement: movement ? { ...movement, points: movement.points } : null,
    rinexInspection: rinex,
    illustrativeAssetReview: ranks,
    scientificLimitations: [
      "Synthetic asset locations, context and priorities are not real-world asset risk.",
      "Historical station GPS time series does not prove multi-GNSS signal processing.",
      "RINEX evidence, if supplied separately, is NOT silently linked to the displacement series.",
      "No raw RINEX geodetic solution; no asset safety certification or failure probability."
    ],
    references: [
      "https://doi.org/10.1038/s41597-023-02274-0",
      "https://doi.org/10.5281/zenodo.7775016"
    ]
  };
}
