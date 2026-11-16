/**
 * Real Semarang evidence workspace.
 *
 * DSM display uses real Copernicus GLO-30 surface pixels quantized from a
 * verified 396x540 source mosaic. Display pixels are 72x98 and are NEVER
 * suitable for asset-height, rob-depth or subsidence estimates.
 * Scene polygons/dates are Copernicus STAC catalogue metadata ONLY.
 */
const DATA = {
  dsm: "./data/semarang-dsm-preview.json",
  scenes: "./data/semarang-sentinel-scenes.json",
  readiness: "./data/semarang-real-readiness.json"
};
const $ = (id) => document.getElementById(id);
const safe = v => String(v ?? "").replace(/[&<>"']/g,
  char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

function elevationColor(m) {
  if (m <= 0) return [65, 139, 183];
  if (m <= 2) return [51, 155, 149];
  if (m <= 5) return [106, 166, 113];
  if (m <= 10) return [195, 179, 96];
  if (m <= 20) return [211, 138, 80];
  if (m <= 50) return [176, 104, 82];
  return [125, 83, 84];
}

export function sampleDisplayGrid(grid, meta, lat, lon) {
  const [west, south, east, north] = meta.aoiEpsg4326;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
      lon < west || lon > east || lat < south || lat > north) return null;
  const [width, height] = meta.previewSize;
  const col = Math.min(width - 1, Math.max(0, Math.floor((lon - west) / (east - west) * width)));
  const row = Math.min(height - 1, Math.max(0, Math.floor((north - lat) / (north - south) * height)));
  const value = grid[row * width + col];
  if (value === meta.nodataCode) return null;
  return Number((meta.offsetMeters + value * meta.stepMeters).toFixed(1));
}

export async function decodeDisplayGrid(meta) {
  if (meta.encoded !== "zlib-deflate-base64-u8") throw Error("Unsupported DSM encoding");
  if (typeof DecompressionStream !== "function") throw Error("This browser lacks DecompressionStream");
  const bytes = Uint8Array.from(atob(meta.b64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  const result = new Uint8Array(await new Response(stream).arrayBuffer());
  if (result.length !== meta.previewSize[0] * meta.previewSize[1]) throw Error("DSM preview length mismatch");
  return result;
}

function rasterOverlayUrl(grid, meta) {
  const canvas = document.createElement("canvas");
  const [width, height] = meta.previewSize;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw Error("Canvas 2D unavailable");
  const image = context.createImageData(width, height);
  for (let i = 0; i < grid.length; i++) {
    const datum = grid[i];
    if (datum === meta.nodataCode) continue;
    const heightM = meta.offsetMeters + meta.stepMeters * datum;
    const color = elevationColor(heightM);
    image.data[i * 4] = color[0];
    image.data[i * 4 + 1] = color[1];
    image.data[i * 4 + 2] = color[2];
    image.data[i * 4 + 3] = 232;
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function createSection() {
  const section = document.createElement("section");
  section.id = "real-evidence";
  section.className = "real-evidence-workspace";
  section.setAttribute("aria-label", "Real Geospatial Evidence Workspace");
  section.innerHTML = `
    <div class="real-evidence-heading">
      <div>
        <span class="eyebrow">SOURCE-BACKED / SEMARANG COASTAL</span>
        <h2>Real Geospatial Evidence</h2>
        <p>Layer elevasi aktual, katalog Sentinel, dan batas interpretasinya. Terpisah dari empat aset simulasi di atas.</p>
      </div>
      <span class="real-badge" id="real-source-state">Memuat sumber...</span>
    </div>
    <div class="real-data-stats">
      <div><span>Copernicus DEM GLO-30</span><strong id="real-dsm-state">Memeriksa...</strong><small>DSM nyata · bukan deformasi</small></div>
      <div><span>Sentinel-2 L2A</span><strong id="real-s2-count">—</strong><small>Katalog scene, bukan piksel optik</small></div>
      <div><span>Sentinel-1 GRD</span><strong id="real-s1-count">—</strong><small>Katalog scene, bukan InSAR</small></div>
    </div>
    <div class="real-data-workbench">
      <div class="real-controls">
        <div class="real-control-title"><strong>Layer & sumber</strong><span>AOI Semarang</span></div>
        <label class="real-layer-toggle">
          <input type="checkbox" id="real-dsm-toggle" checked>
          <span><strong>Elevasi permukaan</strong><small>Copernicus DSM · overlay warna</small></span>
        </label>
        <label class="real-input-label" for="real-sensor">Satelit</label>
        <select id="real-sensor" class="real-select">
          <option value="2">Sentinel-2 · optik</option>
          <option value="1">Sentinel-1 · radar GRD</option>
        </select>
        <label class="real-input-label" for="real-scene">Tanggal akuisisi / produk</label>
        <select id="real-scene" class="real-select"></select>
        <button type="button" id="real-show-scene" class="real-outline-button">Lihat footprint scene ↗</button>
        <div id="real-scene-details" class="real-scene-details" role="status" aria-live="polite"></div>
        <div class="real-color-legend"><strong>Skala DSM · meter</strong><div class="real-color-strip"></div>
          <div class="real-color-values"><span>≤ 0</span><span>2</span><span>5</span><span>10</span><span>20</span><span>50+</span></div>
        </div>
        <p class="real-location-value" id="real-location-value">Klik area peta untuk membaca nilai DSM perkiraan pada grid tampilan.</p>
      </div>
      <div class="real-evidence-notes">
        <span class="real-note-kicker">EVIDENCE GATE</span>
        <h3>Apa yang benar-benar dapat dianalisis?</h3>
        <div class="real-gate good"><span>✓</span><div><strong>Konteks elevasi</strong><small>Piksel DSM tersedia, ditampilkan sebagai overview.</small></div></div>
        <div class="real-gate good"><span>✓</span><div><strong>Penelusuran scene satelit</strong><small>Lokasi footprint, tanggal dan metadata bisa diperiksa.</small></div></div>
        <div class="real-gate bad"><span>—</span><div><strong>Perubahan tutupan lahan / genangan optik</strong><small>Butuh piksel Sentinel-2 dan masking awan per-AOI.</small></div></div>
        <div class="real-gate bad"><span>—</span><div><strong>Penurunan tanah / InSAR</strong><small>Butuh sumber dan pemrosesan interferometri yang sesuai; GRD metadata bukan displacement.</small></div></div>
        <div class="real-gate bad"><span>—</span><div><strong>Risiko atau ranking aset nyata</strong><small>Butuh batas aset terukur, datum, model paparan dan review operator.</small></div></div>
        <p class="real-smallprint">Dataset: 16 Nov 2026 · Copernicus DEM GLO-30 + katalog STAC. Datum vertikal DSM belum direkonsiliasi dengan prakiraan pasang surut BMKG. Skor ranking di atas hanya simulasi.</p>
        <a class="real-readiness-link" href="./data/semarang-real-readiness.json" target="_blank" rel="noopener noreferrer">Lihat data readiness JSON ↗</a>
      </div>
    </div>
  `;
  const workbench = $("asset-map");
  if (!workbench?.parentElement) return null;
  workbench.insertAdjacentElement("afterend", section);
  return section;
}

export async function initRealSpatialEvidence(map) {
  if (!map || !window.L) return;
  if (!createSection()) return;
  const state = $("real-source-state");
  try {
    const responses = await Promise.all([
      fetch(DATA.dsm, {cache: "no-store"}),
      fetch(DATA.scenes, {cache: "no-store"}),
      fetch(DATA.readiness, {cache: "no-store"})
    ]);
    if (responses.some(r => !r.ok)) throw Error("Public evidence files missing from build");
    const [meta, catalog, readiness] = await Promise.all(responses.map(r => r.json()));
    if (catalog.scenes?.length !== 27 || catalog.scenes.some(x => ![1,2].includes(x[0])))
      throw Error("Scene index failed validation");
    if (!readiness.modelGate?.surfaceLayer) throw Error("Elevation source failed evidence gate");
    const grid = await decodeDisplayGrid(meta);
    const [west, south, east, north] = meta.aoiEpsg4326;
    const layer = window.L.imageOverlay(rasterOverlayUrl(grid, meta),
      [[south, west], [north, east]], {opacity: .64, interactive: false, zIndex: 350});
    const toggle = $("real-dsm-toggle");
    toggle.addEventListener("change", () => toggle.checked ? layer.addTo(map) : map.removeLayer(layer));
    layer.addTo(map);
    $("real-dsm-state").textContent = "Tersedia";
    const scenes = catalog.scenes;
    $("real-s2-count").textContent = String(scenes.filter(x => x[0] === 2).length) + " scene";
    $("real-s1-count").textContent = String(scenes.filter(x => x[0] === 1).length) + " scene";
    state.textContent = "Data terverifikasi";
    state.dataset.state = "ok";

    map.on("click", event => {
      if (!toggle.checked) return;
      const m = sampleDisplayGrid(grid, meta, event.latlng.lat, event.latlng.lng);
      $("real-location-value").textContent = m === null
        ? "Koordinat di luar AOI raster / NoData."
        : "DSM tampilan ≈ " + m.toFixed(1) + " m · " +
          event.latlng.lat.toFixed(5) + ", " + event.latlng.lng.toFixed(5) +
          " · bukan elevasi survey titik atau pengukuran rob.";
    });

    let outline = null;
    const sensor = $("real-sensor");
    const scene = $("real-scene");
    const details = $("real-scene-details");
    function updateScene() {
      const matching = scenes.filter(x => String(x[0]) === sensor.value);
      scene.innerHTML = matching.map((record, index) =>
        '<option value="' + index + '">' + safe(record[2]) +
        (record[3] === null ? "" : " · cloud tile " + Number(record[3]).toFixed(1) + "%") +
        '</option>').join("");
      renderScene();
    }
    function renderScene() {
      const filtered = scenes.filter(x => String(x[0]) === sensor.value);
      const selected = filtered[Number(scene.value)] ?? filtered[0];
      if (!selected) return;
      if (outline) { map.removeLayer(outline); outline = null; }
      const coordinates = selected[4].map(([lon, lat]) => [lat, lon]);
      outline = window.L.polygon(coordinates,
        {color: "#176e97", weight: 2.3, dashArray: "6 4",
          fillColor: "#2784ae", fillOpacity: .05, interactive: false}).addTo(map);
      // Scene footprints cover wide areas: do NOT auto-fit away from Semarang.
      details.innerHTML =
        '<strong>' + safe(selected[2]) + '</strong>' +
        '<span>' + (selected[0] === 2 ? "Sentinel-2 L2A" : "Sentinel-1 GRD") +
        ' · footprint katalog</span>' +
        '<code title="' + safe(selected[1]) + '">' + safe(selected[1]) + '</code>' +
        (selected[3] === null ? "" :
          '<small>Cloud cover: ' + Number(selected[3]).toFixed(2) +
          '% keseluruhan tile, bukan persentase awan khusus AOI.</small>') +
        '<small>Belum ada raster/piksel Sentinel dari scene ini.</small>';
    }
    sensor.addEventListener("change", updateScene);
    scene.addEventListener("change", renderScene);
    $("real-show-scene").addEventListener("click", () => {
      renderScene();
      $("asset-map")?.scrollIntoView({block: "center", behavior: "smooth"});
    });
    updateScene();
  } catch (error) {
    state.textContent = "Sumber gagal dimuat";
    state.dataset.state = "error";
    $("real-dsm-state").textContent = "Tidak tersedia";
    $("real-scene-details").textContent = "Error validasi sumber: " + String(error?.message || error);
    $("real-dsm-toggle").disabled = true;
  }
}
