// Geographic context for a competition DEMONSTRATION.
// Real landmark coordinates are externally sourced. Synthetic asset markers
// are intentionally fictional and are NOT surveyed facilities.
//
// CSEM: BIG InaCORS catalogue (2018), p. 112
// https://big.go.id/assets/download/InaCORS/InaCORS%20BIG%202018_compressed.pdf
// BAKO: https://network.igs.org/BAKO00IDN
// Tanjung Emas passenger terminal: OSM node 2085925705
// https://www.openstreetmap.org/node/2085925705
// Genuk district office: municipal official GIS
// https://dataspasial.semarangkota.go.id/detail_kantor/38

export const LANDMARKS = Object.freeze([
  { id: "csem", title: "CSEM (Ina-CORS)", lat: -6 - 59/60 - 14.169/3600, lon: 110 + 22/60 + 36.974/3600, type: "station", source: "BIG InaCORS 2018" },
  { id: "port-terminal", title: "Tanjung Emas terminal", lat: -6.94776, lon: 110.4243, type: "landmark", source: "OpenStreetMap node 2085925705" },
  { id: "genuk-office", title: "Genuk district office", lat: -6.964473, lon: 110.47713, type: "landmark", source: "Semarang municipal GIS" }
]);

export const BAKO = Object.freeze({
  id: "bako", title: "BAKO (IGS)", lat: -6.491055, lon: 106.848910,
  type: "independent", source: "IGS station profile",
  notLinkedToSemarangMovement: true
});

// These coordinates are invented ONLY for demonstration placement.
export const SCENARIO_MARKERS = Object.freeze([
  { id: "port", title: "Illustrative port access", lat: -6.9517, lon: 110.4383, type: "fictional" },
  { id: "road", title: "Illustrative coastal road", lat: -6.9685, lon: 110.4502, type: "fictional" },
  { id: "store", title: "Illustrative storage facility", lat: -6.9511, lon: 110.4692, type: "fictional" }
]);

// Bounds are a schematic coordinate grid, NOT a boundary, coastline or hazard polygon.
export const VIEW_BOUNDS = Object.freeze({
  west: 110.355, east: 110.505,
  south: -7.010, north: -6.925
});

export function haversineKm(a, b) {
  if (![a?.lat,a?.lon,b?.lat,b?.lon].every(Number.isFinite)) {
    throw new TypeError("Valid WGS84 coordinates required");
  }
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const q = Math.sin(dLat/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;
  return 6371.0088 * 2 * Math.asin(Math.min(1,Math.sqrt(q)));
}

export function projectWgs84(point, bounds = VIEW_BOUNDS) {
  return {
    x: (point.lon - bounds.west) / (bounds.east - bounds.west),
    y: (bounds.north - point.lat) / (bounds.north - bounds.south)
  };
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]);
}

/** Zero-network SVG coordinate plot: geographically positioned *points* only. */
export function renderGeoSvg(layers = {}) {
  const selected = {station:true,landmarks:true,fictional:true,...layers};
  const sourcePoints = LANDMARKS.filter(p => p.type === "station" ? selected.station : selected.landmarks);
  const scenarioPoints = selected.fictional ? SCENARIO_MARKERS : [];
  const left = 65, top = 52, width = 800, height = 370;
  const point = p => {
    const xy = projectWgs84(p);
    return {x:left+xy.x*width, y:top+xy.y*height};
  };
  const grid = [];
  const lonTicks = [110.36,110.39,110.42,110.45,110.48];
  const latTicks = [-6.93,-6.95,-6.97,-6.99,-7.01];
  for(const lon of lonTicks){
    const x = point({lon,lat:-6.96}).x;
    grid.push('<path d="M'+x.toFixed(1)+' '+top+'V'+(top+height)+'" stroke="#306377" stroke-opacity=".48" stroke-dasharray="3 7"/>');
    grid.push('<text x="'+x.toFixed(1)+'" y="443" text-anchor="middle" fill="#92b4bb" font-size="11">'+lon.toFixed(2)+'°E</text>');
  }
  for(const lat of latTicks){
    const y = point({lon:110.45,lat}).y;
    grid.push('<path d="M'+left+' '+y.toFixed(1)+'H'+(left+width)+'" stroke="#306377" stroke-opacity=".48" stroke-dasharray="3 7"/>');
    grid.push('<text x="55" y="'+(y+4).toFixed(1)+'" text-anchor="end" fill="#92b4bb" font-size="11">'+Math.abs(lat).toFixed(2)+'°S</text>');
  }
  const marker = p => {
    const {x,y}=point(p), fictional=p.type==="fictional",station=p.type==="station";
    const fill = fictional ? "#e7af68" : station ? "#82eed9" : "#ecf4f1";
    const r = station?9:fictional?7:5;
    return '<g class="geo-marker geo-'+esc(p.id)+'">'
      +'<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="'+(r+8)+'" fill="'+fill+'" opacity=".10"/>'
      +'<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="'+r+'" fill="'+fill+'" stroke="#0d2937" stroke-width="3"/>'
      +(fictional?'<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="3" fill="#0d2937"/>':"")
      +'<title>'+esc(p.title)+(fictional?" — fictional scenario location":" — public geographic reference")+'</title>'
      +'</g>';
  };
  const markerLabel = (p, offsetX, offsetY, anchor="start") => {
    const {x,y}=point(p);
    return '<text x="'+(x+offsetX).toFixed(1)+'" y="'+(y+offsetY).toFixed(1)+'" fill="#e3f5f1" font-size="12" font-weight="700" text-anchor="'+anchor+'">'+esc(p.id==="csem"?"CSEM":p.id==="port-terminal"?"Tanjung Emas":p.id==="genuk-office"?"Genuk office":p.id==="port"?"A":p.id==="road"?"B":"C")+'</text>';
  };
  return '<svg class="geo-plot" role="img" aria-label="WGS84 point-reference plot of Semarang. Public stations and landmarks are not surveyed asset deformation; optional scenario markers are fictional" viewBox="0 0 940 470" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">'
    +'<defs><linearGradient id="geoBg" x2="1" y2="1"><stop stop-color="#071e31"/><stop offset="1" stop-color="#134255"/></linearGradient></defs>'
    +'<rect x="0" y="0" width="940" height="470" rx="10" fill="url(#geoBg)"/>'
    +'<text x="66" y="30" fill="#a3e1d6" font-size="12" font-weight="800" letter-spacing="2">SEMARANG · WGS84 POINT CONTEXT</text>'
    +'<text x="865" y="30" text-anchor="end" fill="#b0cfce" font-size="11">N ↑</text>'
    +'<rect x="'+left+'" y="'+top+'" width="'+width+'" height="'+height+'" rx="5" fill="#12344a" stroke="#487887" stroke-opacity=".7"/>'
    +grid.join("")
    +'<text x="469" y="91" font-size="20" fill="#5e9dad" fill-opacity=".30" font-weight="700" text-anchor="middle" letter-spacing="6">COASTAL STUDY CONTEXT</text>'
    +sourcePoints.map(marker).join("")+scenarioPoints.map(marker).join("")
    +(selected.station ? markerLabel(LANDMARKS[0],16,-14) : "")
    +(selected.landmarks ? markerLabel(LANDMARKS[1],13,-14)+markerLabel(LANDMARKS[2],-12,-15,"end") : "")
    +(selected.fictional ? markerLabel(SCENARIO_MARKERS[0],14,17)
      +markerLabel(SCENARIO_MARKERS[1],14,17)
      +markerLabel(SCENARIO_MARKERS[2],14,17) : "")
    +'<text x="866" y="461" text-anchor="end" fill="#7aabaf" font-size="10">GEOGRAPHIC POINTS ONLY · NO DEMNAS, COASTLINE OR HAZARD MODEL</text>'
    +'</svg>';
}

export function geoContextSummary() {
  const csem=LANDMARKS.find(x=>x.id==="csem");
  const port=LANDMARKS.find(x=>x.id==="port-terminal");
  return {
    referenceStation: "CSEM",
    referenceStationCoordinates: [csem.lat,csem.lon],
    referenceStationSource: csem.source,
    landmarkName: port.title,
    landmarkDistanceKm: Math.round(haversineKm(csem,port)*10)/10,
    landmarkDistanceMeaning: "geographic separation only; does not establish movement correlation",
    externalObservationQcStation: "BAKO",
    externalObservationQcStationDistanceKm: Math.round(haversineKm(csem,BAKO)),
    observationLinkedToMovement: false,
    assets: SCENARIO_MARKERS.map(asset=>({
      id:asset.id,
      locationType:"FICTIONAL_SCENARIO_POINT",
      latitude:asset.lat,
      longitude:asset.lon,
      distanceToReferenceStationKm:Math.round(haversineKm(csem,asset)*10)/10,
      distanceIsEvidenceOfMovement:false
    }))
  };
}

/**
 * GIS provenance audit, never a deformation or hazard model.
 * Distances are WGS84/Haversine approximations from the *real* reference station.
 * Does not create survey geometry for the six documented port sectors.
 */
export function renderSpatialAuditRows() {
  const csem=LANDMARKS.find(x=>x.id==="csem");
  const entries=[
    {site:csem,role:"Historic GPS station",link:"No on-asset GNSS link",type:"STATION"},
    {site:LANDMARKS.find(x=>x.id==="port-terminal"),role:"Public terminal landmark",link:"Location context only",type:"LANDMARK"},
    {site:LANDMARKS.find(x=>x.id==="genuk-office"),role:"Public administrative landmark",link:"Location context only",type:"LANDMARK"},
    {site:BAKO,role:"Independent multi-GNSS QC",link:"Different station and time",type:"QC ONLY"}
  ];
  return entries.map(({site,role,link,type})=>
    '<tr><th scope="row">'+esc(site.title)+'</th><td class="gis-monospace">'
    +site.lat.toFixed(6)+', '+site.lon.toFixed(6)+'</td><td>'
    +haversineKm(csem,site).toFixed(1)+' km</td><td>'+esc(role)
    +'<small>'+esc(site.source)+'</small></td><td><span class="gis-link-status">'
    +esc(type)+'</span><small>'+esc(link)+'</small></td></tr>'
  ).join("");
}
