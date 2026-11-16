/**
 * BARUNA Semarang Coastal: MVP with real, source-backed geospatial context.
 * No fictional assets, simulated risk outputs, or fabricated measurements.
 */
import {decodeDisplayGrid, sampleDisplayGrid, rasterOverlayUrl} from "./real-spatial-evidence.js";
import {installScreeningFlow} from "./real-workspace-flow.js";
import {parseBmkgForecastCsv} from "./real-tide-context.js";
import {validateNdwiMetadata,decodeNdwiGrid,ndwiDisplayOverlayUrl,sampleNdwiDisplay,opticalExportEvidence} from "./real-sentinel2-evidence.js";
import {OPTICAL_VIEWS,validateOpticalSeries,decodeOpticalSeries,opticalGridOverlayUrl,
  sampleOpticalValue,opticalAreaStats,opticalSeriesExport} from "./real-optical-series.js";

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
function reportSnapshot({meta, scenes, readiness, selection, sampled, areaScreening=null, tideForecast=null, optical=null, opticalSeries=null, opticalView="baselineNdwi", opticalArea=null}) {
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
    singleDateOptical:opticalExportEvidence(optical),
    exploratoryTwoDateOptical:opticalSeriesExport(opticalSeries,opticalView,opticalArea),
    evidenceGates:readiness.modelGate,
    unsupported:["No multi-date optical change or validated flood extent","No Sentinel-1 InSAR displacement",
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
    {name:"Single-date NDWI overview",enabled:gate.singleDateNdwiPreview,
      detail:"Piksel Sentinel-2 L2A B03/B08 nyata, dikoreksi reflektansi dan mask SCL; hanya preview satu tanggal"},
    {name:"Exploratory two-date NDWI / MNDWI index contrast",enabled:gate.multiDateOpticalIndexPreview,
      detail:"Piksel dua tanggal tersedia, tetapi selisih indeks bukan luas banjir atau perubahan tutupan lahan terverifikasi"},
    {name:"Temporal optical change / rob validation",enabled:gate.realOpticalAnalysis,
      detail:"Perlu scene pembanding, metode dan validasi independen; NDWI satu tanggal tidak membuktikan rob"},
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
    // Separate source-derived optical evidence; never alter the legacy DSM source.
    // Optional failure does not invalidate the real DEM, catalogue or BMKG input.
    const ndwiToggle=$("toggle-ndwi");
    let optical=null;
    let ndwiGrid=null;
    let ndwiLayer=null;
    let opticalSeries=null;
    let opticalGrids=null;
    let opticalBounds=null;
    const opticalView=$("optical-view");
    try {
      const response=await fetch("./data/semarang-s2-ndwi-preview.json",{cache:"no-store"});
      if(!response.ok)throw Error("Source-derived preview not found in build");
      const candidate=await response.json();
      validateNdwiMetadata(candidate);
      const decoded=await decodeNdwiGrid(candidate);
      ndwiLayer=L.imageOverlay(ndwiDisplayOverlayUrl(decoded,candidate),
        [[candidate.aoiEpsg4326[1],candidate.aoiEpsg4326[0]],
         [candidate.aoiEpsg4326[3],candidate.aoiEpsg4326[2]]],
        {opacity:.82,interactive:false,zIndex:355});
      ndwiGrid=decoded;
      optical=candidate;
      ndwiToggle.disabled=false;
      $("s2-ndwi-status").textContent="Piksel asli terverifikasi · "+candidate.acquisitionUtc.slice(0,10)+
        " · NDWI median "+candidate.sourceValidation.ndwiPercentilesP10P50P90[1].toFixed(3)+
        " · preview 72×98, bukan peta rob.";
      $("stat-s2").textContent=s2Count+" scenes · 1 raster";
    }catch(error){
      ndwiToggle.disabled=true;
      $("s2-ndwi-status").textContent="NDWI belum tersedia: "+String(error?.message||error);
    }
    // Independent Earth Search products do not share IDs with the older CDSE catalogue.
    try {
      const response=await fetch("./data/semarang-s2-optical-series.json",{cache:"no-store"});
      if(!response.ok)throw Error("Multi-date source preview missing from build");
      const candidate=await response.json();
      validateOpticalSeries(candidate);
      if(optical&&candidate.baseline.originalFourBandSha256!==optical.sourceRasterSha256)
        throw Error("Baseline optical source hash mismatch");
      opticalGrids=await decodeOpticalSeries(candidate);
      opticalSeries=candidate;
      opticalView.disabled=false;
      ndwiToggle.disabled=false;
      $("stat-s2").textContent=s2Count+" catalog scenes · 2 optical dates";
      $("s2-ndwi-status").textContent="Real B03/B08/B11/SCL · 14 & 21 Okt 2026 · "+
        (candidate.indices.bothDatesValidFraction*100).toFixed(2)+
        "% valid pada kedua tanggal · preview indeks, bukan rob.";
    }catch(error){
      opticalView.disabled=true;
      $("optical-aoi-stats").textContent="Perbandingan belum tersedia: "+String(error?.message||error);
    }
    const dsmToggle=$("toggle-dsm");
    const mapLabel=document.querySelector(".map-overlay-label");
    const elevationLegend=document.querySelector(".map-scale");
    const ndwiLegend=$("ndwi-legend");
    const mapProvenance=document.querySelector(".map-provenance");
    let currentLayer=ndwiLayer;
    const currentView=()=>OPTICAL_VIEWS.find(v=>v.key===opticalView.value)||OPTICAL_VIEWS[0];
    function updateOpticalStats(){
      if(!opticalSeries||!opticalGrids)return null;
      const key=currentView().key;
      const stats=opticalAreaStats(opticalGrids[key],opticalSeries.previews[key],
        opticalBounds||opticalSeries.aoiEpsg4326);
      $("optical-aoi-stats").innerHTML=stats?.status==="DISPLAY_GRID_INDEX_STATS_NOT_FLOOD"?
        '<strong>'+esc(currentView().short)+' · '+esc(opticalBounds?"AOI terpilih":"Seluruh AOI")+'</strong>'+
        '<span>Median '+stats.median.toFixed(3)+' · P10 '+stats.p10.toFixed(3)+
        ' · P90 '+stats.p90.toFixed(3)+'</span>'+
        '<small>'+stats.validPixels+'/'+stats.selectedPixels+' grid preview valid ('+
        stats.validPct.toFixed(1)+'%). Bukan luas banjir atau survei aset.</small>':
        '<small>AOI terlalu kecil / tidak ada piksel preview valid.</small>';
      return stats;
    }
    function updateOpticalLegend(){
      if(!opticalSeries)return;
      const contrast=currentView().kind==="difference";
      $("ndwi-legend").querySelector(".scale-title").textContent=
        contrast?"Δ MNDWI · 21 − 14 Oktober (indeks)":
        currentView().short+" · "+currentView().date+" (indeks)";
      $("ndwi-legend").querySelector(".scale-ticks").innerHTML=contrast?
        '<span>−0.3</span><span>−0.15</span><span>0</span><span>+0.15</span><span>+0.3</span>':
        '<span>−1</span><span>−0.5</span><span>0</span><span>+0.5</span><span>+1</span>';
      $("ndwi-legend").querySelector(".scale-strip").classList.toggle("optical-contrast-strip",contrast);
    }
    function changeOptical(on){
      if(!currentLayer)return;
      if(on){
        currentLayer.addTo(map);
        map.removeLayer(dsmLayer);
        dsmToggle.checked=false;
      }else{
        map.removeLayer(currentLayer);
        if(!dsmToggle.checked){dsmToggle.checked=true;dsmLayer.addTo(map);}
      }
      if(mapLabel)mapLabel.textContent=on?
        (opticalSeries?"SENTINEL-2 L2A · "+currentView().name.toUpperCase()+" · REAL INDEX PREVIEW":
        "SENTINEL-2 L2A · REAL SINGLE-DATE NDWI"):
        "COPERNICUS DEM · ACTUAL SURFACE DATA";
      if(elevationLegend)elevationLegend.hidden=on;
      if(ndwiLegend)ndwiLegend.hidden=!on;
      if(mapProvenance)mapProvenance.textContent=on?
        (opticalSeries?"Earth Search Sentinel-2 L2A · 14/21 Oct 2026 · 72×98 derived grid · NOT flooding":
        "Sentinel-2 14 Oct 2026 · NDWI derived preview · NOT flooding"):
        "OpenStreetMap basemap · Copernicus DEM GLO-30 surface context";
      updateOpticalLegend();
    }
    opticalView.addEventListener("change",()=>{
      if(!opticalSeries||!opticalGrids)return;
      if(ndwiToggle.checked&&currentLayer)map.removeLayer(currentLayer);
      const key=currentView().key;
      currentLayer=L.imageOverlay(opticalGridOverlayUrl(opticalGrids[key],opticalSeries.previews[key],key),
        [[south,west],[north,east]],{opacity:.82,interactive:false,zIndex:355});
      updateOpticalStats();
      if(ndwiToggle.checked)changeOptical(true);
      else updateOpticalLegend();
    });
    if(opticalSeries)opticalView.dispatchEvent(new Event("change"));
    ndwiToggle.addEventListener("change",()=>changeOptical(ndwiToggle.checked));
    dsmToggle.addEventListener("change",()=>{
      if(dsmToggle.checked&&ndwiToggle.checked){
        ndwiToggle.checked=false;
        changeOptical(false);
      }
    });
    $("stat-dsm").textContent="Available";
    if(!optical)$("stat-s2").textContent=s2Count+" scenes";
    $("stat-s1").textContent=s1Count+" scenes";
    $("stat-status").textContent="Source ready";
    $("status-hint").textContent=opticalSeries?
      "4 evidence streams · no verified flood / asset-risk model":
      optical?"3 evidence streams · no flood / asset-risk model":
      "2 evidence streams · optical unavailable";
    renderReadiness({...readiness.modelGate,
      singleDateNdwiPreview:Boolean(optical||opticalSeries),
      multiDateOpticalIndexPreview:Boolean(opticalSeries)});
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
        (optical&&selected[1]===optical.sceneId?
          '<span class="detail-kicker">REAL B03 / B04 / B08 / SCL PIXELS</span>'+
          '<span>NDWI single-date terverifikasi · AOI 100% · preview 72×98 (bukan resolusi analitik).</span>'+
          '<span>Indeks optik bukan hasil pengukuran banjir rob atau perubahan antarwaktu.</span>':
          '<span class="detail-warning">Produk katalog CDSE ini metadata. Layer optik Earth Search 14 dan 21 Okt punya scene ID terpisah.</span>');
      $("focus-scene").disabled=false;
      $("focus-scene").textContent=footprintVisible?"Sembunyikan footprint":"Tampilkan footprint";
    };
    const fillScenes=()=>{
      const list=selectScenes(catalog.scenes,sensor.value);
      scene.innerHTML=list.map((row,index)=>
        '<option value="'+index+'">'+esc(FORMAT_DATE(row[2]))+
        ' · '+esc(row[1].slice(0,15))+'</option>').join("");
      const opticalIndex=optical&&sensor.value==="2"?list.findIndex(row=>row[1]===optical.sceneId):-1;
      if(opticalIndex>=0)scene.value=String(opticalIndex);
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
      const view=opticalSeries?currentView():null;
      const indexValue=opticalSeries&&opticalGrids?
        sampleOpticalValue(opticalGrids[view.key],opticalSeries.previews[view.key],lat,lon):
        optical&&ndwiGrid?sampleNdwiDisplay(ndwiGrid,optical,lat,lon):null;
      sampled={latitude:lat,longitude:lon,previewDsmMeters:value,
        opticalIndex:ndwiToggle.checked?indexValue:null,
        opticalView:ndwiToggle.checked?(view?.key||"baselineNdwi"):null,
        source:ndwiToggle.checked?"REAL_SENTINEL2_QUANTIZED_INDEX_NOT_FLOOD":
          "COPERNICUS_DSM_QUANTIZED_DISPLAY_GRID_NOT_SURVEY"};
      $("elevation-readout").innerHTML=ndwiToggle.checked?
        '<strong>'+esc(view?.short||"NDWI")+' '+
        (indexValue===null?"NoData":"preview ≈ "+indexValue.toFixed(2))+'</strong>'+
        '<span>Sentinel-2 '+esc(view?.date||"14 Okt 2026")+
        ' · indeks spektral tampilan; bukan rob atau risiko aset.</span>':
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
      onAreaChanged:area=>{
        $("export-evidence").disabled=!area;
        opticalBounds=area?.bounds||null;
        updateOpticalStats();
      }});
    $("export-evidence").disabled=true;
    $("export-evidence").addEventListener("click",()=>{
      const area=flow.getArea();
      if(!area)return;
      downloadJson(reportSnapshot({meta,scenes:catalog.scenes,readiness,
        selection:selected,sampled,areaScreening:area,tideForecast:flow.getTide(),optical,
        opticalSeries,opticalView:opticalSeries?currentView().key:"baselineNdwi",
        opticalArea:opticalSeries?updateOpticalStats():null}),
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
