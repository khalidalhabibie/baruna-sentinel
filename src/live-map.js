/**
 * Actual OpenStreetMap slippy basemap (Leaflet 1.9.4 bundled with the build).
 * - All visible public markers use coordinates already sourced in geo.js.
 * - No synthetic polygons, sector geocodes, hazard or deformation layers.
 * - External OSM tiles are online-only, requested for viewport, with attribution.
 */
import {LANDMARKS,SCENARIO_MARKERS,GEO_VIEWS} from "./geo.js";
export const OSM_TILES="https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function makeStreetMap({element,onSelect,onTileFailure,onTileSuccess}={}){
  if(!element || !globalThis.L) throw new Error("Leaflet basemap component unavailable.");
  const L=globalThis.L;
  const map=L.map(element,{
    center:[-6.965,110.419],
    zoom:12,
    zoomControl:false,
    scrollWheelZoom:false,
    preferCanvas:false,
    maxBounds:[[-7.35,110.0],[-6.55,110.85]],
    maxBoundsViscosity:0.6,
    attributionControl:true
  });
  L.control.zoom({position:"bottomright"}).addTo(map);
  L.control.scale({imperial:false,metric:true,position:"bottomleft",maxWidth:120}).addTo(map);
  map.attributionControl.setPrefix(false);
  let tileLoaded=false,tileErrors=0;
  const tiles=L.tileLayer(OSM_TILES,{
    minZoom:9,maxZoom:18,maxNativeZoom:18,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
    crossOrigin:true,
    keepBuffer:1,
    updateWhenIdle:true
  }).on("tileload",()=>{
    if(!tileLoaded){tileLoaded=true;onTileSuccess?.();}
  }).on("tileerror",()=>{
    tileErrors+=1;
    if(!tileLoaded && tileErrors>=3) onTileFailure?.();
  }).addTo(map);
  const markers=L.layerGroup().addTo(map);
  let previousView="";
  function redraw({view="all",selectedId="port-terminal",layers={},includeScenarios=false}={}){
    markers.clearLayers();
    const visible=LANDMARKS.filter(p=>p.type==="station"?layers.station!==false:layers.landmarks!==false);
    const shown=includeScenarios?SCENARIO_MARKERS:[];
    for(const point of [...visible,...shown]){
      const fictional=point.type==="fictional",station=point.type==="station";
      const active=point.id===selectedId && !fictional;
      const color=fictional?"#e8a866":station?"#127d75":"#1d5663";
      const circle=L.circleMarker([point.lat,point.lon],{
        radius:active?14:11,
        color:"#fff",
        weight:active?4:3,
        opacity:1,
        fillColor:color,
        fillOpacity:0.98,
        bubblingMouseEvents:false
      }).addTo(markers);
      circle.bindTooltip(fictional?"Fictional scenario marker":point.title,{
        direction:"top",offset:[0,-10],opacity:0.95
      });
      if(!fictional)circle.on("click",()=>onSelect?.(point.id));
      else circle.setStyle({dashArray:"3 5"});
      if(active)circle.bringToFront();
    }
    if(previousView!==view){
      const b=GEO_VIEWS[view]||GEO_VIEWS.all;
      map.fitBounds([[b.south,b.west],[b.north,b.east]],{
        padding:[24,24],animate:false,maxZoom:15
      });
      previousView=view;
    }else{
      // Changing the selected reference updates its marker without forcing
      // the map to zoom away from user-directed exploration.
    }
    map.invalidateSize({pan:false});
  }
  function resize(){map.invalidateSize({pan:false});}
  return {redraw,resize,getMap:()=>map,remove:()=>map.remove(),getTiles:()=>tiles};
}
