/**
 * BARUNA Semarang Coastal: MVP with real, source-backed geospatial context.
 * No fictional assets, simulated risk outputs, or fabricated measurements.
 */
import {decodeDisplayGrid, sampleDisplayGrid, rasterOverlayUrl} from "./real-spatial-evidence.js";
import {installScreeningFlow} from "./real-workspace-flow.js";
import {parseBmkgForecastCsv} from "./real-tide-context.js";

const DATA_PATHS = {
  dsm: "./data/semarang-dsm-preview.json",
  scenes: "./data/semarang-sentinel-scenes.json",
  readiness: "./data/semarang-real-readiness.json"
};
const AOI = [110.375, -7.025, 110.485, -6.875];
const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, ch =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const FORMAT_DATE = value => new Date(value + "T12:00:00Z").toLocaleDateString("id-ID",{
  timeZone:"UTC",day:"numeric",month:"short",year:"numeric"
});

export function validateSceneInventory(catalog,readiness){
// Catalogues can grow as sentinel-helpes downloads additional real scenes.
// Never bind the application to the original snapshot counts (16 + 11).
const rows=catalog.scenes;
if(!Array.isArray(rows)||!rows.length||
   !/REAL_CATALOG_METADATA_ONLY/.test(catalog.sourceMode||"")||
   rows.some(row=>!Array.isArray(row)||![1,2].includes(row[0])||
     typeof row[1]!=="string"||!row[1].startsWith(row[0]===1?"S1":"S2")||
     !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(row[2])||
     !Array.isArray(row[4])||row[4].length<4))
  throw Error("Katalog Sentinel tidak lolos pemeriksaan sumber/format");
const s2Count=rows.filter(row=>row[0]===2).length;
const s1Count=rows.filter(row=>row[0]===1).length;
if(!s1Count||!s2Count)throw Error("Koleksi Sentinel-1/2 tidak lengkap");
for(const [id,count] of [["sentinel1_catalog",s1Count],["sentinel2_catalog",s2Count]]){
  const manifest=readiness.datasets?.find(item=>item.id===id);
  if(!manifest||!Number.isInteger(manifest.count)||manifest.count!==count)
    throw Error("Manifest readiness berbeda dari katalog "+id);
}

  return {s1Count,s2Count};
}

export function selectScenes(index, sensor) {
  if (!Array.isArray(index)) throw new TypeError("Catalogue scenes are required");
  return index.filter(row => row[0] === Number(sensor))
    .sort((a,b) => b[2].localeCompare(a[2]) || a[1].localeCompare(b[1]));
}
export function formatDsmReading(m, lat, lon) {
  return m === null ? "Di luar cakupan DSM atau piksel NoData" :
    "≈ " + m.toFixed(1) + " m · " + lat.toFixed(5) + ", " + lon.toFixed(5);
}
function reportSnapshot({meta, scenes, readiness, selection, sampled, areaScreening=null, tideForecast=null}) {
  return {
    schema:"baruna-coastal-evidence-brief-v1",
    createdAt:new Date().toISOString(),
    project:"Semarang Coastal / BARUNA Sentinel",
    areaOfInterestEPSG4326:meta.aoiEpsg4326,
    snapshotAsOf:readiness.asOf,
    sources:readiness.datasets,
    selectedAreaEPSG4326:areaScreening?.bounds??null,
    areaScreening:areaScreening?{
      ...areaScreening,
      sourceKind:"COPERNICUS_DSM_QUANTIZED_DISPLAY_GRID_NOT_NATIVE_30M",
      notAnInundationModel:true,
      notOperatorAssetBoundaries:true
    }:null,
    bmkgForecastContext:tideForecast,
    crossDatumComparisonAllowed:false,
    analysisWorkflow:"USER_AOI → DSM_DISPLAY_STATISTICS + SEPARATE_BMKG_FORECAST → EVIDENCE_GATE",
    realDsm:{
      name:"Copernicus DEM GLO-30 surface model",
      displaySourceTifSha256:meta.sourceTifSha256,
      previewSize:meta.previewSize,
      previewPurpose:"illustrative georeferenced surface context; NOT surveyed height or rob depth",
      verticalReferenceCaveat:meta.verticalReference,
      sampledLocation:sampled
    },
    satelliteCatalogue:{
      totalScenes:scenes.length,
      countSentinel2:scenes.filter(x=>x[0]===2).length,
      countSentinel1:scenes.filter(x=>x[0]===1).length,
      selectedScene: selection ? {
        sensor:selection[0]===2?"Sentinel-2 L2A":"Sentinel-1 GRD",
        productId:selection[1],
        acquisitionDate:selection[2],
        wholeTileCloudCoverPct:selection[3],
        footprintEPSG4326LonLat:selection[4],
        sourceKind:"CATALOGUE_METADATA_NOT_IMAGE_PIXELS"
      } : null
    },
    evidenceGates:readiness.modelGate,
    unsupported:["No imagery pixels available","No Sentinel-1 InSAR displacement",
      "No operator-surveyed asset polygons","No validated rob-depth model",
      "No asset safety or operational inspection ranking"],
    limitations:"Not a geodetic position solution, on-site survey, flood prediction or risk ranking."
  };
}
export {reportSnapshot};

function downloadJson(obj, filename) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)+"\n"],{type:"application/json"}));
  const link=document.createElement("a");
  link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),800);
}

function renderReadiness(gate) {
  const items=[
    {name:"Actual surface elevation context",enabled:gate.surfaceLayer,
      detail:"Copernicus GLO-30 DSM · nilai grid tampilan, bukan elevasi survei aset"},
    {name:"Satellite acquisition discovery",enabled:gate.sceneDiscovery,
      detail:"Scene Sentinel-1/2 nyata · footprint, tanggal dan metadata produk"},
    {name:"Optical change / water analysis",enabled:gate.realOpticalAnalysis,
      detail:"Belum ada band raster Sentinel-2, cloud mask dan indeks yang tervalidasi"},
    {name:"InSAR displacement",enabled:gate.realInsar,
      detail:"Sentinel-1 GRD tidak mendukung kesimpulan displacement tanpa pemrosesan yang sesuai"},
    {name:"Rob depth and flood forecast",enabled:gate.robDepthModel,
      detail:"Datum vertikal, hidrodinamika dan validasi lapangan belum tersedia"},
    {name:"Operational asset prioritization",enabled:gate.assetLevelInspectionPriority,
      detail:"Perlu batas aset survei, bukti representatif, dan kriteria operator"}
  ];
  $("gate-grid").innerHTML=items.map(item =>
    '<article class="gate-card '+(item.enabled?"available":"blocked")+'">'+
    '<span class="gate-symbol" aria-hidden="true">'+(item.enabled?"✓":"—")+'</span>'+
    '<div><span class="gate-state">'+(item.enabled?"AVAILABLE":"REQUIRES EVIDENCE")+'</span>'+
    '<h3>'+esc(item.name)+'</h3><p>'+esc(item.detail)+'</p></div></article>'
  ).join("");
}

function makeMap() {
  const L=window.L;
  if(!L) throw Error("Library peta tidak tersedia");
  const map=L.map("real-map", {zoomControl:false,preferCanvas:true,
    maxZoom:18,minZoom:9,center:[-6.95,110.43],zoom:12});
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
    attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    maxZoom:19,crossOrigin:true
  }).addTo(map);
  L.control.zoom({position:"bottomright"}).addTo(map);
  const bounds=L.latLngBounds([[AOI[1],AOI[0]],[AOI[3],AOI[2]]]);
  map.fitBounds(bounds,{padding:[26,26],maxZoom:13});
  const outline=L.rectangle(bounds,{color:"#1f6479",weight:2,opacity:.7,fillOpacity:0,
    dashArray:"6 5",interactive:false}).addTo(map);
  $("map-fallback").hidden=true;
  $("reset-map").disabled=false;
  $("reset-map").addEventListener("click",()=>map.fitBounds(bounds,{padding:[26,26],maxZoom:13}));
  return map;
}

async function bootstrap() {
  try {
    const responses=await Promise.all(Object.values(DATA_PATHS).map(url=>fetch(url,{cache:"no-store"})));
    if(responses.some(r=>!r.ok)) throw Error("Source asset tidak ditemukan di build");
    const [meta,catalog,readiness]=await Promise.all(responses.map(r=>r.json()));
    if(!Array.isArray(meta.aoiEpsg4326) || meta.aoiEpsg4326.join()!==AOI.join())
      throw Error("AOI metadata tidak cocok");
    const {s1Count,s2Count}=validateSceneInventory(catalog,readiness);
    if(!readiness.modelGate?.surfaceLayer || !readiness.modelGate?.sceneDiscovery)
      throw Error("Data tidak lulus Evidence Gate");
    if(!window.L) throw Error("Leaflet gagal dimuat");
    const pixels=await decodeDisplayGrid(meta);
    const map=makeMap();
    const {L}=window;
    const [west,south,east,north]=meta.aoiEpsg4326;
    const dsmLayer=L.imageOverlay(rasterOverlayUrl(pixels,meta),
      [[south,west],[north,east]],{opacity:.36,interactive:false,zIndex:340}).addTo(map);
    $("toggle-dsm").addEventListener("change",event=>{
      if(event.target.checked)dsmLayer.addTo(map);else map.removeLayer(dsmLayer);
    });
    $("stat-dsm").textContent="Available";
    $("stat-s2").textContent=s2Count+" scenes";
    $("stat-s1").textContent=s1Count+" scenes";
    $("stat-status").textContent="Source ready";
    $("status-hint").textContent="2 capabilities available · 4 blocked";
    renderReadiness(readiness.modelGate);
    let footprint=null;
    let footprintVisible=false;
    let selected=null;
    let sampled=null;
    let sampleMarker=null;
    const sensor=$("sensor");
    const scene=$("scene");
    const sceneDetails=$("scene-details");
    const showFootprint=()=>{
      const list=selectScenes(catalog.scenes,sensor.value);
      selected=list[Number(scene.value)] || list[0] || null;
      if(footprint){map.removeLayer(footprint);footprint=null;}
      if(!selected){sceneDetails.textContent="Tidak ada produk pada koleksi ini.";return;}
      const coords=selected[4].map(([lon,lat])=>[lat,lon]);
      if(footprintVisible){
        footprint=L.polygon(coords,{color:"#b86b35",weight:2,dashArray:"7 5",
          fillColor:"#eac89e",fillOpacity:.03,interactive:false}).addTo(map);
      }
      const title=selected[0]===2?"Sentinel-2 L2A":"Sentinel-1 GRD";
      sceneDetails.innerHTML=
        '<span class="detail-kicker">REAL SATELLITE CATALOGUE</span>'+
        '<strong>'+esc(title)+' · '+esc(FORMAT_DATE(selected[2]))+'</strong>'+
        '<span class="detail-id">'+esc(selected[1])+'</span>'+
        (selected[3]===null?
          '<span>Radar GRD · footprint metadata</span>':
          '<span>Cloud cover tile: <b>'+Number(selected[3]).toFixed(2)+'%</b> · bukan cloud mask khusus AOI</span>')+
        '<span class="detail-warning">Source metadata only — belum tersedia piksel satelit yang dapat dianalisis.</span>';
      $("focus-scene").disabled=false;
      $("focus-scene").textContent=footprintVisible?"Sembunyikan footprint":"Tampilkan footprint";
    };
    const fillScenes=()=>{
      const list=selectScenes(catalog.scenes,sensor.value);
      scene.innerHTML=list.map((row,index)=>
        '<option value="'+index+'">'+esc(FORMAT_DATE(row[2]))+
        ' · '+esc(row[1].slice(0,15))+'</option>').join("");
      showFootprint();
    };
    sensor.addEventListener("change",fillScenes);
    scene.addEventListener("change",showFootprint);
    $("focus-scene").addEventListener("click",()=>{
      footprintVisible=!footprintVisible;
      showFootprint();
      // Whole-scene boundaries may dwarf the coastal study area.
      map.fitBounds([[south,west],[north,east]],{padding:[26,26],maxZoom:13});
    });
    map.on("click",event=>{
      const lat=event.latlng.lat,lon=event.latlng.lng;
      const value=sampleDisplayGrid(pixels,meta,lat,lon);
      sampled={latitude:lat,longitude:lon,previewDsmMeters:value,
        source:"COPERNICUS_DSM_QUANTIZED_DISPLAY_GRID_NOT_SURVEY"};
      $("elevation-readout").innerHTML=
        '<strong>'+esc(formatDsmReading(value,lat,lon))+'</strong>'+
        '<span>Copernicus DSM display grid · bukan pengukuran aset, deformasi, atau kedalaman rob.</span>';
      if(sampleMarker)map.removeLayer(sampleMarker);
      if(value!==null)sampleMarker=L.circleMarker([lat,lon],{
        radius:6,color:"#fff",weight:2,fillColor:"#1f7484",fillOpacity:1,
        interactive:false}).addTo(map);
    });
    fillScenes();
    // BMKG is a validated forecast context, not a height raster or a rob model.
    // Failure to load this optional CSV must not fabricate tide values or break DSM.
    let tideRecords=null;
    let tideIssue=null;
    try {
      const tideResponse=await fetch("./data/bmkg-semarang-tide-forecast-20261116-20261122.csv",
        {cache:"no-store"});
      if(!tideResponse.ok) throw Error("CSV BMKG tidak ditemukan");
      tideRecords=parseBmkgForecastCsv(await tideResponse.text());
    }catch(error){
      tideIssue=String(error?.message||error);
    }
    let flow=null;
    flow=installScreeningFlow({map,pixels,meta,tideRecords,tideIssue,
      onAreaChanged:area=>{$("export-evidence").disabled=!area;}});
    $("export-evidence").disabled=true;
    $("export-evidence").addEventListener("click",()=>{
      const area=flow.getArea();
      if(!area)return;
      downloadJson(reportSnapshot({meta,scenes:catalog.scenes,readiness,
        selection:selected,sampled,areaScreening:area,tideForecast:flow.getTide()}),
        "BARUNA_Semarang_Real_Evidence_Brief.json");
    });
    document.body.dataset.evidenceState="ready";
    map.invalidateSize();
  }catch(err){
    const message=String(err?.message||err);
    document.body.dataset.evidenceState="error";
    $("stat-status").textContent="Source unavailable";
    $("status-hint").textContent="Gagal memvalidasi data";
    $("stat-dsm").textContent="Unavailable";
    $("scene-details").textContent="Data gagal dimuat: "+message;
    $("map-fallback").hidden=false;
    $("map-fallback").textContent="Sumber GIS belum dapat dimuat. "+message;
    $("gate-grid").innerHTML='<article class="gate-card blocked"><span class="gate-symbol">!</span><div><h3>Evidence Gate blocked</h3><p>'+esc(message)+'</p></div></article>';
    console.error("BARUNA real-workspace",err);
  }
}
if(typeof document!=="undefined"){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bootstrap,{once:true});
  else void bootstrap();
}
