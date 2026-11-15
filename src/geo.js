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

/**
 * Documented reference-point views; only the viewport changes.
 * These bounds DO NOT represent surveyed assets, coastline or coastal hazards.
 */
export const GEO_VIEWS = Object.freeze({
  all: VIEW_BOUNDS,
  port: Object.freeze({west:110.394,east:110.493,south:-6.996,north:-6.932}),
  station: Object.freeze({west:110.353,east:110.413,south:-7.006,north:-6.959})
});

export const GEO_SOURCE_LINKS = Object.freeze({
  csem:"https://big.go.id/assets/download/InaCORS/InaCORS%20BIG%202018_compressed.pdf",
  "port-terminal":"https://www.openstreetmap.org/node/2085925705",
  "genuk-office":"https://dataspasial.semarangkota.go.id/detail_kantor/38"
});

export function geoPointDetails(id) {
  const point = LANDMARKS.find(p=>p.id===id);
  if(!point) throw new RangeError("Unknown public geographic reference point");
  const csem=LANDMARKS.find(p=>p.id==="csem");
  return {
    id:point.id,
    title:point.title,
    category:point.type==="station"?"GNSS reference station":"Public landmark",
    latitude:point.lat,
    longitude:point.lon,
    source:point.source,
    sourceUrl:GEO_SOURCE_LINKS[point.id],
    fromCsemKm:Math.round(haversineKm(csem,point)*10)/10,
    limitation:point.type==="station"
      ?"Historical station positions; not a measurement on a port asset."
      :"Geographic context only; not a surveyed port-asset boundary."
  };
}

/**
 * Source-grounded point map. The plot is an actual EPSG:4326 coordinate
 * transform with selectable references and bounded zoom presets, NOT a
 * synthesized street map or a fabricated coastline/DEMNAS product.
 */
export function renderGeoSvg(layers={}, options={}) {
  const selected={station:true,landmarks:true,fictional:true,...layers};
  const view=GEO_VIEWS[options.view] ? options.view : "all";
  const bounds=GEO_VIEWS[view];
  const selectedId=options.selectedId || "port-terminal";
  const left=74,top=58,width=796,height=340;
  const within=p=>p.lon>=bounds.west && p.lon<=bounds.east
    && p.lat>=bounds.south && p.lat<=bounds.north;
  const mapPoint=p=>{
    const xy=projectWgs84(p,bounds);
    return {x:left+xy.x*width,y:top+xy.y*height};
  };
  const to=(v)=>Number(v).toFixed(1);
  const grid=[];
  for(let i=0;i<=4;i++){
    const lon=bounds.west+(bounds.east-bounds.west)*i/4;
    const lat=bounds.north-(bounds.north-bounds.south)*i/4;
    const x=left+i*width/4,y=top+i*height/4;
    grid.push('<path d="M'+to(x)+' '+top+'V'+(top+height)+'" stroke="#6b9cab" stroke-opacity=".23" stroke-dasharray="3 8"/>');
    grid.push('<text x="'+to(x)+'" y="416" fill="#9bc3c8" font-size="11" text-anchor="middle">'+lon.toFixed(3)+'°E</text>');
    grid.push('<path d="M'+left+' '+to(y)+'H'+(left+width)+'" stroke="#6b9cab" stroke-opacity=".23" stroke-dasharray="3 8"/>');
    grid.push('<text x="65" y="'+to(y+4)+'" fill="#9bc3c8" font-size="11" text-anchor="end">'+Math.abs(lat).toFixed(3)+'°S</text>');
  }
  const points=LANDMARKS.filter(p=>
    (p.type==="station"?selected.station:selected.landmarks)&&within(p));
  const scenarios=selected.fictional?SCENARIO_MARKERS.filter(within):[];
  const labels={"csem":"CSEM","port-terminal":"Tanjung Emas","genuk-office":"Genuk office","port":"A · DEMO","road":"B · DEMO","store":"C · DEMO"};
  const marker=p=>{
    const {x,y}=mapPoint(p),fictional=p.type==="fictional",
      station=p.type==="station",active=p.id===selectedId&&!fictional;
    const fill=fictional?"#e7b879":station?"#7ae4ce":"#f2fffa";
    const r=station?8:fictional?6:7;
    const labelX=x+12,labelY=y-14;
    return '<g class="geo-marker geo-'+esc(p.id)+(active?" geo-marker-active":"")+
      '"'+(fictional?'':' role="button" tabindex="0" data-point-id="'+esc(p.id)+
        '" aria-label="Show '+esc(p.title)+' geographic reference"')+'>'
      +(active?'<circle cx="'+to(x)+'" cy="'+to(y)+'" r="23" fill="#80efdc" fill-opacity=".18" stroke="#80efdc" stroke-width="1.5" stroke-opacity=".7"/>':'')
      +'<circle cx="'+to(x)+'" cy="'+to(y)+'" r="'+(r+9)+'" fill="'+fill+'" opacity=".10"/>'
      +'<circle cx="'+to(x)+'" cy="'+to(y)+'" r="'+r+'" fill="'+fill+'" stroke="#0d2937" stroke-width="2.5"/>'
      +(station?'<path d="M'+to(x-11)+' '+to(y)+'h22 M'+to(x)+' '+to(y-11)+'v22" stroke="#ccfff5" stroke-width="1.2" stroke-opacity=".65"/>':'')
      +(fictional?'<circle cx="'+to(x)+'" cy="'+to(y)+'" r="2.5" fill="#0d2937"/>':'')
      +'<text x="'+to(labelX)+'" y="'+to(labelY)+'" fill="'+(active?"#a4ffe7":"#e3f5f1")+
        '" font-size="12" font-weight="700">'+esc(labels[p.id])+'</text>'
      // Transparent hit target matches label + marker, for mouse, touch and Playwright.
      +(fictional?'':'<rect class="geo-marker-hit" x="'+to(x-24)+'" y="'+to(y-33)+
        '" width="168" height="57" fill="transparent" pointer-events="all"/>')
      +'<title>'+esc(p.title)+(fictional?" — fictional scenario location":" — public geographic reference")+'</title></g>';
  };
  const a=LANDMARKS.find(p=>p.id==="csem");
  const b=LANDMARKS.find(p=>p.id==="port-terminal");
  let referenceLine="";
  if(selected.station && selected.landmarks && within(a) && within(b)){
    const p=mapPoint(a),q=mapPoint(b);
    referenceLine='<path d="M'+to(p.x)+' '+to(p.y)+'L'+to(q.x)+' '+to(q.y)+
      '" stroke="#a1f2de" stroke-width="1.4" stroke-opacity=".57" stroke-dasharray="6 7"/>'
      +'<title>Approximate straight-line station-to-terminal separation; NOT a displacement vector</title>';
  }
  const kmPerLon=haversineKm({lat:(bounds.north+bounds.south)/2,lon:bounds.west},
    {lat:(bounds.north+bounds.south)/2,lon:bounds.east});
  const scaleKm=view==="all"?5:2;
  const scalePx=width*scaleKm/kmPerLon;
  const sx=left+22,sy=top+height-23;
  const scale='<g aria-hidden="true"><path d="M'+to(sx)+' '+to(sy)+'v-8h'+to(scalePx)+'v8" fill="none" stroke="#bcefe3" stroke-width="2.4"/>'
    +'<text x="'+to(sx+scalePx/2)+'" y="'+to(sy+16)+'" text-anchor="middle" fill="#c0e8e4" font-size="12">≈ '+scaleKm+' km</text></g>';
  return '<svg class="geo-plot" role="group" aria-label="Interactive WGS84 point-reference map for Semarang; only public source-grounded coordinates are selectable" viewBox="0 0 940 470" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">'
    +'<defs><linearGradient id="geoBg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#061e2b"/><stop offset="1" stop-color="#185365"/></linearGradient>'
    +'<clipPath id="geoFrameClip"><rect x="'+left+'" y="'+top+'" width="'+width+'" height="'+height+'" rx="8"/></clipPath></defs>'
    +'<rect x="0" y="0" width="940" height="470" rx="9" fill="url(#geoBg)"/>'
    +'<text x="75" y="31" fill="#a4e1d5" font-size="12" font-weight="800" letter-spacing="1.8">SEMARANG · WGS84 POINT CONTEXT</text>'
    +'<text x="866" y="31" text-anchor="end" fill="#b9e0dc" font-size="11">N ↑ · EPSG:4326</text>'
    +'<rect x="'+left+'" y="'+top+'" width="'+width+'" height="'+height+'" rx="8" fill="#153e50" stroke="#6b9cab" stroke-opacity=".65"/>'
    +grid.join("")
    +'<g clip-path="url(#geoFrameClip)">'+referenceLine+points.map(marker).join("")+scenarios.map(marker).join("")+'</g>'
    +scale
    +'<text x="866" y="461" text-anchor="end" fill="#a3c2c4" font-size="10">REFERENCE COORDINATES · NO SURVEYED SECTOR GEOMETRY · NO HAZARD MODEL</text>'
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
