/**
 * Real single-date Sentinel-2 NDWI preview. Source is a validated four-band
 * L2A GeoTIFF processed offline. Browser grid is a quantized DISPLAY preview,
 * never an inundation map, change-detection product or asset risk model.
 */
const EXPECTED_AOI = [110.375, -7.025, 110.485, -6.875];
const EXPECTED_SOURCE_HASH = "d398e1af132b23fb3daecaf6477ed8f142d25dd02b6b3218a5c572c15d294363";
const EXPECTED_SCENE_ID = "S2B_T49MDN_20261014T025716_L2A";

export function validateNdwiMetadata(meta) {
  if (meta?.schema !== "baruna-sentinel2-ndwi-preview-v1" ||
      meta.sourceKind !== "SOURCE_DERIVED_REAL_OPTICAL_SINGLE_DATE" ||
      meta.sourceRasterSha256 !== EXPECTED_SOURCE_HASH ||
      meta.sceneId !== EXPECTED_SCENE_ID ||
      !Number.isFinite(Date.parse(meta.acquisitionUtc)) ||
      !Array.isArray(meta.aoiEpsg4326) ||
      meta.aoiEpsg4326.join(",") !== EXPECTED_AOI.join(",") ||
      meta.sourceCrs !== "EPSG:32749" ||
      meta.sourceBands?.join(",") !== "B03,B04,B08,SCL" ||
      meta.encoded !== "zlib-deflate-base64-u8" ||
      meta.quantization?.nodataCode !== 255 ||
      meta.quantization?.minimum !== -1 ||
      meta.quantization?.step !== .02 ||
      meta.radiometry?.scale !== .0001 || meta.radiometry?.offset !== -.1 ||
      !Array.isArray(meta.previewSize) ||
      meta.previewSize.length !== 2 ||
      meta.previewSize.some(n => !Number.isInteger(n) || n < 32 || n > 512) ||
      typeof meta.b64 !== "string" || meta.b64.length < 100 ||
      typeof meta.gridSha256 !== "string" || !/^[0-9a-f]{64}$/.test(meta.gridSha256)) {
    throw Error("Sentinel-2 NDWI preview provenance / format is invalid");
  }
  // Independent Earth Search scene. Existing Copernicus catalogue uses different
  // product IDs; they must not be equated without verified cross-provider lineage.
  return true;
}

export async function decodeNdwiGrid(meta) {
  validateNdwiMetadata(meta);
  if (typeof DecompressionStream !== "function") throw Error("Browser cannot decompress NDWI preview");
  const bytes = Uint8Array.from(atob(meta.b64), ch => ch.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  const grid = new Uint8Array(await new Response(stream).arrayBuffer());
  if (grid.length !== meta.previewSize[0] * meta.previewSize[1] ||
      grid.some(code => code !== 255 && code > 100)) {
    throw Error("NDWI grid dimensions or pixel codes are invalid");
  }
  // SHA256 is checked in the repository's build tests. File is an approved
  // source-derived public asset, not arbitrary user-provided runtime pixels.
  return grid;
}

export function sampleNdwiDisplay(grid, meta, latitude, longitude) {
  const [w, s, e, n] = meta.aoiEpsg4326;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < s || latitude > n || longitude < w || longitude > e) return null;
  const [width, height] = meta.previewSize;
  const col = Math.min(width - 1, Math.floor((longitude - w) / (e - w) * width));
  const row = Math.min(height - 1, Math.floor((n - latitude) / (n - s) * height));
  const code = grid[row * width + col];
  if (code === 255 || !Number.isInteger(code) || code < 0 || code > 100) return null;
  return Number((meta.quantization.minimum + code * meta.quantization.step).toFixed(2));
}

const stops = [
  [0,  [146, 91, 60]],
  [.3, [213, 173, 111]],
  [.5, [243, 241, 208]],
  [.7, [80, 174, 173]],
  [1,  [17, 92, 157]]
];

function ndwiColor(value) {
  const fraction = Math.max(0, Math.min(1, (value + 1) / 2));
  for (let i = 1; i < stops.length; i++) {
    if (fraction <= stops[i][0]) {
      const [left, c0] = stops[i - 1], [right, c1] = stops[i];
      const k = (fraction - left) / (right - left);
      return c0.map((v, channel) => Math.round(v + (c1[channel] - v) * k));
    }
  }
  return stops.at(-1)[1];
}

export function ndwiDisplayOverlayUrl(grid, meta) {
  const [width, height] = meta.previewSize;
  if (grid.length !== width * height) throw Error("NDWI grid size mismatch");
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Canvas 2D unavailable");
  const image = ctx.createImageData(width, height);
  for (let i = 0; i < grid.length; i++) {
    const code = grid[i];
    if (code === 255) continue;
    const color = ndwiColor(-1 + code * .02);
    image.data.set(color, i * 4);
    image.data[i * 4 + 3] = 228;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

export function opticalExportEvidence(meta) {
  if (!meta) return null;
  return {
    sourceKind: "SOURCE_DERIVED_REAL_OPTICAL_SINGLE_DATE",
    sceneId: meta.sceneId,
    acquiredUtc: meta.acquisitionUtc,
    sourceFourBandTifSha256: meta.sourceRasterSha256,
    rasterSourceCrs: meta.sourceCrs,
    bandOrder: meta.sourceBands,
    previewGrid: meta.previewSize,
    previewPurpose: "DISPLAY_ONLY_72x98_QUANTIZED_NDWI_NOT_NATIVE_10M",
    spectralIndex: meta.formula,
    radiometricScaleOffset: meta.radiometry,
    sclMask: meta.cloudMask,
    sourceStatistics: meta.sourceValidation,
    temporalChangeAvailable: false,
    floodExtentVerified: false,
    onAssetRiskScoringAllowed: false
  };
}
