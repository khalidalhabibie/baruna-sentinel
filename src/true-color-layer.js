/** BARUNA real Sentinel-2 RGB basemap for display only. This is NOT InSAR. */
export const TRUE_COLOR_PATH = './data/semarang-true-color-preview.json';
export const VERIFIED_TRUE_COLOR_SCENE = 'S2B_T49MDN_20261014T025716_L2A';
export const VERIFIED_TRUE_COLOR_SOURCE_SHA = '4fb5c295dfe4d52012008f64362b692844bcae24fb2ad4c74c6ed05bc5db9ed8';

export function validateTrueColorMetadata(meta) {
  if (meta?.schema !== 'baruna-sentinel2-truecolor-web-v1' ||
      meta.status !== 'real_pixels_validated' ||
      meta.sceneId !== VERIFIED_TRUE_COLOR_SCENE ||
      meta.sourceRgbGeoTiffSha256 !== VERIFIED_TRUE_COLOR_SOURCE_SHA ||
      meta.rgbBands?.join(',') !== 'B04,B03,B02' ||
      meta.rasterCrs !== 'EPSG:32749' || meta.webCrs !== 'EPSG:4326' ||
      meta.resolutionMeters !== 10 ||
      !Array.isArray(meta.wgs84Bounds) || meta.wgs84Bounds.length !== 4 ||
      !meta.wgs84Bounds.every(Number.isFinite) ||
      meta.wgs84Bounds[0] < 110.37 || meta.wgs84Bounds[2] > 110.49 ||
      meta.wgs84Bounds[1] < -7.03 || meta.wgs84Bounds[3] > -6.87 ||
      meta.wgs84Bounds[0] >= meta.wgs84Bounds[2] ||
      meta.wgs84Bounds[1] >= meta.wgs84Bounds[3] ||
      meta.webPreview?.mime !== 'image/jpeg' ||
      meta.webPreview.displayOnly !== true ||
      meta.webPreview.reprojectedFromSourceRaster !== true ||
      !Number.isInteger(meta.webPreview.width) ||
      !Number.isInteger(meta.webPreview.height) ||
      meta.webPreview.width < 600 || meta.webPreview.height < 700 ||
      typeof meta.webPreview.imageSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(meta.webPreview.imageSha256) ||
      typeof meta.webPreview.base64 !== 'string' ||
      meta.webPreview.base64.length < 10000 || meta.webPreview.base64.length > 1500000) {
    throw new Error('Sentinel-2 True Color provenance / geometry invalid');
  }
  return true;
}

export function trueColorLeafletBounds(meta) {
  validateTrueColorMetadata(meta);
  const [west, south, east, north] = meta.wgs84Bounds;
  return [[south, west], [north, east]];
}

async function verifiedImageUrl(meta) {
  const bytes = Uint8Array.from(atob(meta.webPreview.base64), c => c.charCodeAt(0));
  if (bytes.length < 10000 || bytes.length > 1100000 ||
      bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
      bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
    throw new Error('True Color image bytes invalid');
  }
  if (!globalThis.crypto?.subtle) throw new Error('Image SHA-256 verification unavailable');
  const hash = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
  const hex = [...hash].map(b => b.toString(16).padStart(2, '0')).join('');
  if (hex !== meta.webPreview.imageSha256) throw new Error('True Color image checksum mismatch');
  return URL.createObjectURL(new Blob([bytes], {type: 'image/jpeg'}));
}

export async function installTrueColorLayer(map) {
  const street = document.getElementById('basemap-street');
  const satellite = document.getElementById('basemap-satellite');
  const slider = document.getElementById('satellite-opacity');
  const opacity = document.getElementById('satellite-opacity-value');
  const opacityPanel = document.getElementById('satellite-opacity-control');
  const sourceNote = document.getElementById('satellite-source-note');
  if (!map || !window.L || !street || !satellite || !slider || !sourceNote) return;

  sourceNote.textContent = 'Memeriksa citra Sentinel-2 asli…';
  satellite.disabled = true;
  let objectUrl;
  let layer;
  try {
    const response = await fetch(TRUE_COLOR_PATH, {cache: 'no-store'});
    if (!response.ok) throw new Error('True Color file is missing from deploy');
    const meta = await response.json();
    const bounds = trueColorLeafletBounds(meta);
    objectUrl = await verifiedImageUrl(meta);

    map.createPane('barunaTrueColorPane');
    map.getPane('barunaTrueColorPane').style.zIndex = '230'; // Above OSM tiles, below asset polygons.
    map.getPane('barunaTrueColorPane').style.pointerEvents = 'none';
    layer = window.L.imageOverlay(objectUrl, bounds, {
      opacity: Number(slider.value) / 100,
      interactive: false,
      pane: 'barunaTrueColorPane',
      attribution: 'Imagery: Contains modified Copernicus Sentinel data (2026)'
    });
    let failed = false;
    layer.on('error', () => {
      failed = true;
      map.removeLayer(layer);
      sourceNote.textContent = 'Citra tidak dapat ditampilkan; peta jalan tetap tersedia.';
      satellite.disabled = true;
      satellite.setAttribute('aria-pressed', 'false');
      street.setAttribute('aria-pressed', 'true');
      opacityPanel.hidden = true;
    });
    const setMode = mode => {
      if (failed) return;
      const show = mode === 'satellite';
      if (show && !map.hasLayer(layer)) layer.addTo(map);
      if (!show && map.hasLayer(layer)) map.removeLayer(layer);
      if (satellite.type === 'radio') satellite.checked = show;
      if (street.type === 'radio') street.checked = !show;
      satellite.setAttribute('aria-pressed', String(show));
      street.setAttribute('aria-pressed', String(!show));
      opacityPanel.hidden = !show;
      sourceNote.textContent = show
        ? 'Sentinel-2 L2A · 14 Okt 2026 · RGB 10 m · bukan InSAR / rob'
        : 'Peta jalan OpenStreetMap · citra Sentinel-2 tersedia';
      document.body.dataset.trueColorMode = show ? 'satellite' : 'street';
    };
    street.addEventListener('click', () => setMode('street'));
    satellite.addEventListener('click', () => setMode('satellite'));
    slider.addEventListener('input', () => {
      const value = Number(slider.value);
      layer.setOpacity(value / 100);
      opacity.textContent = value + '%';
    });
    satellite.disabled = false;
    setMode('satellite');
    window.addEventListener('pagehide', () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, {once: true});
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    sourceNote.textContent = 'True Color belum tersedia: ' + String(error?.message || error);
    sourceNote.dataset.state = 'error';
    opacityPanel.hidden = true;
    satellite.disabled = true;
    street.setAttribute('aria-pressed', 'true');
  }
}