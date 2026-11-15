import {
  parseAssetGeoJSON,assessImportedAssets,makeAssetIntakePrint,
  EXAMPLE_ASSETS,ASSET_TEMPLATE,MAX_ASSET_FILE_BYTES
} from "./asset-evidence.js";
import {LANDMARKS} from "./geo.js";

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
let documentRecord=null;
let assessment=null;
let selectedAssetId=null;
let intakeFileName="";
let error=null;
let leafletMap=null;
let persistentMapNode=null;
let assetShapeLayer=null;
let assetLinkLine=null;
const csem=LANDMARKS.find(x=>x.id==="csem");

export function loadSyntheticAssetExample(){
  documentRecord=parseAssetGeoJSON(EXAMPLE_ASSETS,{synthetic:true});
  assessment=assessImportedAssets(documentRecord);
  selectedAssetId=assessment.records[0].id;
  intakeFileName="Fictional scenario from BARUNA";
  error=null;
  return assessment;
}
export async function importGeoJSONFile(file){
  try{
    if(!file)throw new TypeError("Select a GeoJSON file");
    if(file.size>MAX_ASSET_FILE_BYTES)throw new RangeError("GeoJSON file exceeds 1.5 MB");
    if(!/\.geojson$|\.json$/i.test(file.name))
      throw new TypeError("Supported files are .geojson and .json");
    const parsed=parseAssetGeoJSON(await file.text(),{synthetic:false});
    const next=assessImportedAssets(parsed);
    documentRecord=parsed;
    assessment=next;
    selectedAssetId=next.records[0].id;
    intakeFileName=file.name.slice(0,120);
    error=null;
    return {ok:true,count:next.importedAssetCount};
  }catch(e){
    error=e instanceof Error?e.message:String(e);
    // Do not replace a valid analysis with a broken upload; report error.
    return {ok:false,message:error};
  }
}
export function selectImportedAsset(id){
  if(!assessment?.records?.some(x=>x.id===id))return false;
  selectedAssetId=id;return true;
}
export function clearImportedAssets(){
  disposeIntakeMap();
  documentRecord=null;assessment=null;selectedAssetId=null;intakeFileName="";error=null;
}
export function selectedAssetAssessment(){
  return assessment?.records?.find(x=>x.id===selectedAssetId)||null;
}
export function printableImportedAssetReport(){
  return makeAssetIntakePrint(assessment);
}
export function downloadAssetTemplate(){
  const blob=new Blob([JSON.stringify(ASSET_TEMPLATE,null,2)],{type:"application/geo+json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  try{
    const a=document.createElement("a");
    a.href=url;a.download="baruna-asset-template.geojson";document.body.append(a);a.click();a.remove();
  }finally{setTimeout(()=>URL.revokeObjectURL(url),2000);}
}
function displayAssetRecord(r){
  return '<div class="ai-record-head"><h3>'+esc(r.name)+'</h3>'+
    '<span class="as-decision-status">DATA INSUFFICIENT</span></div>'+
    '<div class="ai-facts">'+
      '<div><small>GEOMETRY</small><strong>'+esc(r.geometryType)+'</strong><span>Imported; not independently surveyed by BARUNA</span></div>'+
      '<div><small>DISTANCE TO CSEM</small><strong>'+esc(r.proximityKm.toFixed(2))+' km</strong><span>'+esc(r.distanceMethod)+'</span></div>'+
      '<div><small>CRITICALITY</small><strong>'+esc(r.declaredCriticality||"Not supplied")+'</strong><span>User-declared; not owner approved</span></div>'+
      '<div><small>COASTAL EXPOSURE</small><strong>'+esc(r.declaredExposure||"Not supplied")+'</strong><span>No validated DEMNAS / shoreline layer</span></div></div>'+
    '<div class="ai-assessment-note"><strong>Geographic proximity ≠ asset displacement</strong>'+
    '<p>Mapping this asset near a GNSS reference station does not establish a shared movement signal, asset condition, flood hazard, or operational inspection priority.</p></div>'+
    '<h4>To turn this into a defensible field assessment</h4>'+
    '<ol class="ai-gap-list">'+r.gaps.map(g=>'<li>'+esc(g)+'</li>').join("")+'</ol>'+
    '<div class="as-action-row"><button type="button" id="ai-print" class="pw-btn pw-btn-primary">Export verification brief</button>'+
      '<button type="button" data-pw-page="analyst" class="pw-btn pw-btn-secondary">Open GNSS Lab</button></div>';
}
export function renderAssetIntake(){
 const chosen=selectedAssetAssessment();
 const synthetic=documentRecord?.mode==="SYNTHETIC_GEOJSON_EXERCISE";
 return '<section class="ai-intro">'+
   '<div class="ai-intro-head"><div><span class="as-pane-label">SPATIAL EVIDENCE INTAKE · REAL GEOJSON SUPPORT</span>'+
   '<h2>Link an actual asset location to the GNSS evidence review</h2>'+
   '<p>Upload locally held asset geometry in WGS84 (EPSG:4326). BARUNA validates the input, maps the asset and calculates the straight-line distance to the public CSEM reference station. It does not infer deformation from proximity.</p></div>'+
   '<div class="ai-import-tools"><label class="pw-btn pw-btn-primary ai-file-control" for="ai-file">Choose GeoJSON file</label>'+
   '<input id="ai-file" class="ai-file-input" type="file" accept=".geojson,.json,application/geo+json,application/json" aria-label="Import asset GeoJSON">'+
   '<button type="button" class="pw-btn pw-btn-secondary" id="ai-example">Load clearly fictional example</button>'+
   '<button type="button" class="ai-text-button" id="ai-template">Download empty template</button></div></div>'+
   '<p class="ai-privacy">Files are parsed in this browser session; no backend submission. Maximum 1.5 MB / 50 features. Supported geometry: Point, Polygon, MultiPolygon. Required attributes: asset_id, asset_name. Optional: geometry_source, survey_date, criticality, exposure.</p></section>'+
   (error?'<p role="alert" class="as-error ai-error">Input validation failed: '+esc(error)+'</p>':"")+
   (!assessment?'<div class="ai-empty"><div class="ai-empty-mark">01 → 02 → 03</div><h3>Import → Locate → Identify missing evidence</h3>'+
      '<p>Start with a surveyed GeoJSON file, or try the separately marked fictional example. Uploaded records are never automatically qualified for operational inspection ranking.</p></div>':
     '<div class="ai-loaded">'+
      '<div class="ai-status-line"><div><strong>'+assessment.importedAssetCount+' imported asset(s)</strong>'+
        '<span>Source: '+esc(intakeFileName)+(synthetic?" · FICTIONAL GEOMETRY":" · USER-DECLARED, UNVERIFIED")+'</span></div>'+
        '<div><span class="ai-no-rank">0 operational rankings</span><button type="button" id="ai-clear" class="ai-text-button">Clear input</button></div></div>'+
      (synthetic?'<div class="as-synthetic-warning"><strong>Fictional geography — sample only</strong><p>All sample positions, exposure and criticality classes are invented. Use an authorized GeoJSON input for a real location check.</p></div>':
       '<div class="ai-source-warning">Imported location data have not been certified by the asset owner. This tool reports evidence gaps, not a risk assessment.</div>')+
      '<div class="ai-results-layout"><aside class="ai-asset-sidebar"><div class="as-pane-label">SELECT IMPORTED ASSET</div>'+
      assessment.records.map(r=>'<button class="ai-select-asset'+(r.id===chosen?.id?" is-selected":"")+
        '" type="button" data-ai-asset="'+esc(r.id)+'" aria-pressed="'+(r.id===chosen?.id)+'">'+
        '<strong>'+esc(r.name)+'</strong><span>'+esc(r.geometryType)+' · '+r.proximityKm.toFixed(2)+' km from CSEM</span></button>').join("")+
      '</aside><div class="ai-results-content"><div class="ai-map-wrap">'+
        '<div class="ai-map-header"><strong>Imported geometry and public CSEM reference</strong><span>EPSG:4326 · location context only</span></div>'+
        '<div id="ai-map" role="img" aria-label="Map of imported asset boundaries and CSEM reference station"></div>'+
        '<p>Distance is straight-line. Polygon centre is approximate. Map does not show DEMNAS, official shoreline, deformation, hazard or surveyed location verification.</p></div>'+
        '<div class="ai-asset-result">'+(chosen?displayAssetRecord(chosen):"")+'</div></div></div></div>')+
   '<div class="ai-interpretation"><strong>Published comparison available:</strong> CSMG and CSEM 2021–2023 show different station vertical trends in the same PPP study. Differences between stations do not assign a motion rate to any imported asset.</div>';
}
/**
 * Preserve the same Leaflet map through tab/asset re-renders instead of
 * rapidly destroying and recreating SVG renderers and tile layers.
 * An unmounted map node remains in memory only for this page session.
 */
export function disposeIntakeMap(){
  if(persistentMapNode?.parentNode)persistentMapNode.parentNode.removeChild(persistentMapNode);
}
export function renderImportedAssetMap(){
  const slot=document.getElementById("ai-map");
  if(!slot||!documentRecord||!window.L||document.body.dataset.page!=="assessment")return;
  if(!leafletMap){
    persistentMapNode=slot;
    leafletMap=L.map(persistentMapNode,{
      center:[csem.lat,csem.lon],zoom:11,
      scrollWheelZoom:false,zoomControl:true,preferCanvas:false,
      zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,
      trackResize:false
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom:19
    }).addTo(leafletMap);
    assetShapeLayer=L.geoJSON(null,{
      style:feature=>({
        color:feature.properties.id===selectedAssetId?"#0d6d61":"#448a85",
        weight:feature.properties.id===selectedAssetId?4:2,
        fillColor:"#4b9e95",fillOpacity:.16
      }),
      pointToLayer:(feature,latlng)=>L.circleMarker(latlng,{
        radius:feature.properties.id===selectedAssetId?10:7,color:"#0d6d61",
        weight:2,fillColor:"#51ae9e",fillOpacity:.75
      }),
      onEachFeature:(feature,layer)=>{
        const info=assessment?.records.find(x=>x.id===feature.properties.id);
        layer.bindPopup('<strong>'+esc(info?.name||"Asset")+'</strong><p>Location context only · rank unavailable</p>');
        if(feature.properties.id===selectedAssetId)layer.bindTooltip(esc(info?.name||"Asset"),{permanent:true,direction:"top",className:"ai-map-label"});
      }
    }).addTo(leafletMap);
    L.circleMarker([csem.lat,csem.lon],{
      radius:6,color:"#314b7d",fillColor:"#5c7fc0",fillOpacity:.95
    }).bindPopup("CSEM reference station · not linked to imported assets")
      .bindTooltip("CSEM reference station",{permanent:true,direction:"right",className:"ai-map-label"})
      .addTo(leafletMap);
  }else{
    // The prior layout detached the map container but did not destroy its
    // overlays. Keep those objects stable through rapid user interactions.
    slot.replaceWith(persistentMapNode);
    leafletMap.invalidateSize({pan:false,debounceMoveend:true});
  }
  const collection={
    type:"FeatureCollection",
    features:documentRecord.features.map(f=>({
      type:"Feature",properties:{id:f.id},geometry:f.geometry
    }))
  };
  leafletMap.stop();
  assetShapeLayer.clearLayers();
  assetShapeLayer.addData(collection);
  if(assetLinkLine){leafletMap.removeLayer(assetLinkLine);assetLinkLine=null;}
  const selected=assessment?.records.find(x=>x.id===selectedAssetId);
  if(selected){
    assetLinkLine=L.polyline([
      [csem.lat,csem.lon],
      [selected.approxCenter.lat,selected.approxCenter.lon]
    ],{color:"#849c9d",weight:2,dashArray:"6 6",opacity:.9}).addTo(leafletMap);
    assetLinkLine.bindTooltip(selected.proximityKm.toFixed(2)+" km · geographic proximity only",{
      sticky:true,direction:"auto",className:"ai-map-distance"
    });
  }
  const bounds=assetShapeLayer.getBounds();
  if(bounds?.isValid()){
    leafletMap.fitBounds(bounds.extend([csem.lat,csem.lon]).pad(.22),{
      maxZoom:13,animate:false
    });
  }else{
    leafletMap.setView([csem.lat,csem.lon],11,{animate:false});
  }
  requestAnimationFrame(()=>{
    if(leafletMap&&persistentMapNode?.isConnected)
      leafletMap.invalidateSize({pan:false,debounceMoveend:true});
  });
}
