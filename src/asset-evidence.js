/**
 * BARUNA asset input adapter.
 *
 * Real geometries are accepted only as USER_DECLARED / locally uploaded.
 * GeoJSON location, station proximity and owner-entered criticality do not
 * establish geodetic linkage, observed asset deformation or structural risk.
 */
import {haversineKm,LANDMARKS} from "./geo.js";

export const MAX_ASSET_FEATURES=50;
export const MAX_ASSET_FILE_BYTES=1_500_000;
export const EXAMPLE_ASSETS=Object.freeze({
  type:"FeatureCollection",
  name:"SYNTHETIC EXAMPLE — NOT real port assets",
  features:Object.freeze([
    Object.freeze({type:"Feature",properties:{asset_id:"demo-access",asset_name:"Fictional port access",criticality:"high",exposure:"high",source:"BARUNA fictional sample"},geometry:{type:"Point",coordinates:[110.4383,-6.9517]}}),
    Object.freeze({type:"Feature",properties:{asset_id:"demo-road",asset_name:"Fictional coastal road",criticality:"moderate",exposure:"moderate",source:"BARUNA fictional sample"},geometry:{type:"Point",coordinates:[110.4502,-6.9685]}}),
    Object.freeze({type:"Feature",properties:{asset_id:"demo-store",asset_name:"Fictional storage",criticality:"low",exposure:"low",source:"BARUNA fictional sample"},geometry:{type:"Point",coordinates:[110.4692,-6.9511]}})
  ])
});
export const ASSET_TEMPLATE=Object.freeze({
  type:"FeatureCollection",
  name:"Provide surveyed WGS84 asset geometries; no real asset data included",
  features:[]
});
const validClass=new Set(["high","moderate","low"]);
const safeLabel=(value,max=140)=>typeof value==="string"?value.trim().slice(0,max):"";
const finite=v=>typeof v==="number"&&Number.isFinite(v);
const coord=p=>{
  if(!Array.isArray(p)||(p.length!==2&&p.length!==3)||
     !finite(p[0])||!finite(p[1])||p[0]<-180||p[0]>180||p[1]<-90||p[1]>90||
     (p.length===3&&!finite(p[2])))throw new TypeError("Invalid WGS84 [longitude, latitude]");
  return [p[0],p[1]];
};
function ringPoints(ring){
  if(!Array.isArray(ring)||ring.length<4)throw new TypeError("Polygon ring needs at least four positions");
  const pts=ring.map(coord);
  if(pts[0][0]!==pts.at(-1)[0]||pts[0][1]!==pts.at(-1)[1])
    throw new TypeError("Polygon ring must be closed");
  return pts;
}
function geometryPoints(geometry){
  if(!geometry||typeof geometry!=="object")throw new TypeError("Asset geometry required");
  switch(geometry.type){
    case "Point":return [coord(geometry.coordinates)];
    case "Polygon":{
      if(!Array.isArray(geometry.coordinates)||!geometry.coordinates.length)throw new TypeError("Empty polygon");
      return geometry.coordinates.flatMap(ringPoints);
    }
    case "MultiPolygon":{
      if(!Array.isArray(geometry.coordinates)||!geometry.coordinates.length)throw new TypeError("Empty multipolygon");
      return geometry.coordinates.flatMap(poly=>{
        if(!Array.isArray(poly)||!poly.length)throw new TypeError("Empty polygon");
        return poly.flatMap(ringPoints);
      });
    }
    default:throw new TypeError("Supported asset types: Point, Polygon, MultiPolygon");
  }
}
function boundsSummary(points){
  if(points.length>25000)throw new RangeError("Geometry too detailed for this local prototype (max 25,000 vertices)");
  const west=Math.min(...points.map(x=>x[0]));
  const east=Math.max(...points.map(x=>x[0]));
  const south=Math.min(...points.map(x=>x[1]));
  const north=Math.max(...points.map(x=>x[1]));
  return {west,east,south,north,approxCenter:{lon:(west+east)/2,lat:(south+north)/2}};
}
function declaredClass(value){
  const normalized=typeof value==="string"?value.toLowerCase().trim():"";
  return validClass.has(normalized)?normalized:null;
}
export function parseAssetGeoJSON(input,{synthetic=false}={}){
  let doc=input;
  if(typeof input==="string"){
    if(new TextEncoder().encode(input).byteLength>MAX_ASSET_FILE_BYTES)
      throw new RangeError("File exceeds 1.5 MB local intake limit");
    try{doc=JSON.parse(input);}catch{throw new SyntaxError("Invalid GeoJSON syntax");}
  }
  if(doc?.type!=="FeatureCollection"||!Array.isArray(doc.features)||
    doc.features.length<1||doc.features.length>MAX_ASSET_FEATURES)
    throw new TypeError("Supply a FeatureCollection with 1–50 features");
  if(doc.crs){
    const declared=doc.crs?.properties?.name;
    if(!["EPSG:4326","urn:ogc:def:crs:OGC:1.3:CRS84","OGC:CRS84"].includes(declared))
      throw new TypeError("Only WGS84 longitude/latitude GeoJSON supported; reproject before import");
  }
  const ids=new Set();
  const features=doc.features.map((f,i)=>{
    if(f?.type!=="Feature")throw new TypeError("Feature "+(i+1)+" is not GeoJSON Feature");
    const properties=f.properties||{};
    const id=safeLabel(properties.asset_id,48);
    if(!/^[A-Za-z0-9][A-Za-z0-9_-]{1,47}$/.test(id)||ids.has(id))
      throw new TypeError("Each asset needs a unique asset_id (2–48 letters/numbers/_/-)");
    ids.add(id);
    const name=safeLabel(properties.asset_name,120);
    if(name.length<2)throw new TypeError("Every asset needs asset_name");
    const points=geometryPoints(f.geometry);
    const box=boundsSummary(points);
    const date=safeLabel(properties.survey_date,32);
    if(date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new TypeError("survey_date must use YYYY-MM-DD if supplied");
    return {
      id,name,
      geometry:f.geometry,
      geometryType:f.geometry.type,
      ...box,
      criticality:declaredClass(properties.criticality),
      exposure:declaredClass(properties.exposure),
      geometrySource:safeLabel(properties.geometry_source||properties.source,160),
      surveyDate:date||null,
      owner:safeLabel(properties.data_owner,120),
      sourceStatus:synthetic?"SYNTHETIC_EXAMPLE":"USER_DECLARED_UNVERIFIED"
    };
  });
  return {
    mode:synthetic?"SYNTHETIC_GEOJSON_EXERCISE":"USER_DECLARED_GEOJSON",
    features,
    featureCount:features.length,
    isOperatorCertified:false,
    importedAt:null,
    scopeWarning:synthetic?
      "All geometries and properties are fictional example inputs.":
      "The uploaded geometry and metadata are user-declared, not independently verified as operator asset records."
  };
}
export function assessImportedAssets(parsed,station=LANDMARKS.find(x=>x.id==="csem")){
  if(!["USER_DECLARED_GEOJSON","SYNTHETIC_GEOJSON_EXERCISE"].includes(parsed?.mode)||
    !Array.isArray(parsed?.features)||parsed.features.length===0||
    station?.id!=="csem")throw new TypeError("Validated asset intake and known CSEM reference required");
  const records=parsed.features.map(f=>{
    const proximityKm=Math.round(haversineKm(f.approxCenter,station)*100)/100;
    const gaps=[
      "Confirm asset geometry, coordinate reference frame, ownership and survey date",
      "Obtain current site-representative displacement series with uncertainty and method",
      "Verify monitor-to-asset relationship; CSEM proximity is NOT geodetic linkage",
      ...(!f.criticality?["Request operator-defined asset criticality"]:["Validate operator-declared criticality with asset owner"]),
      ...(!f.exposure?["Acquire licensed DEMNAS/coastal exposure context and vertical datum"]:["Validate declared exposure using official spatial data and aligned datum"])
    ];
    return {
      id:f.id,name:f.name,sourceStatus:f.sourceStatus,
      geometryType:f.geometryType,
      geometrySource:f.geometrySource,
      approxCenter:f.approxCenter,
      proximityKm,
      distanceMethod:f.geometryType==="Point"?"WGS84 point-to-station distance":"Approximate geometry envelope centre to station; NOT measured site offset",
      declaredCriticality:f.criticality,
      declaredExposure:f.exposure,
      readiness:{
        geojsonAccepted:true,locationIndependentVerification:false,
        sourceReferencePresent:!!f.geometrySource,
        siteRepresentativeGnssEvidence:false,
        currentSiteConditionEvidence:false,
        coastalExposureValidated:false,
        ownerApprovedCriticality:false
      },
      decision:"DATA_INSUFFICIENT",
      operationalRank:null,
      canIssueOperationalOrder:false,
      gaps,
      explanation:"Location proximity does not show asset deformation. This record requires current on-asset measurements and independent verification."
    };
  });
  return {
    mode:parsed.mode,station:station.id,records,importedAssetCount:records.length,
    operationallyRankableAssets:0,
    spatialLinkageEstablished:0,
    ownerCertifiedAssets:0,
    statement:"Imported WGS84 geometry is an input for verifying asset/station proximity only, not an established monitoring relationship or hazard exposure."
  };
}
export function makeAssetIntakePrint(assessment){
  if(!assessment||!Array.isArray(assessment.records)||assessment.records.length===0)
    throw new TypeError("Asset evidence review required");
  const esc=s=>String(s??"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const rows=assessment.records.map(r=>"<tr><td>"+esc(r.name)+"</td><td>"+esc(r.geometryType)+"</td><td>"+
    r.proximityKm+" km</td><td>DATA INSUFFICIENT</td></tr>").join("");
  const details=assessment.records.map(r=>"<h3>"+esc(r.name)+"</h3><ul>"+
    r.gaps.map(g=>"<li>"+esc(g)+"</li>").join("")+"</ul>").join("");
  return '<div class="brief-sheet"><div class="print-head"><div><div class="print-brand">OURDO INDONESIA / BARUNA SENTINEL</div><small>PROJECT GEOJSON EVIDENCE INTAKE</small></div><div>RGPD 2026 · PROTOTYPE</div></div>'+
    '<h1>Imported asset evidence review</h1><div class="print-callout print-warning"><b>No operational ranking permitted.</b> User-supplied locations and station proximity do not establish asset displacement, flood exposure or structural safety.</div>'+
    '<div class="print-metrics"><div><small>GEOJSON FEATURES</small><strong>'+assessment.records.length+'</strong></div><div><small>SITE-LINKED MEASUREMENTS</small><strong>0</strong></div><div><small>ASSET RANKINGS</small><strong>0</strong></div></div>'+
    '<h2>Asset geometry and CSEM reference proximity</h2><table><thead><tr><th>INPUT ASSET</th><th>GEOMETRY</th><th>DISTANCE (CONTEXT)</th><th>DECISION</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<p class="print-tiny">Polygon distance uses an approximate envelope centre. The CSEM reference station was not verified as a local instrument on any imported asset. Uploaded features are '+esc(assessment.mode)+'.</p>'+
    '<h2>Evidence gaps and next verification actions</h2>'+details+
    '<p class="print-footer">Locally processed, user-provided input. No certified asset boundaries, on-site deformation solution, risk probabilities, or commercial performance claims.</p></div>';
}
