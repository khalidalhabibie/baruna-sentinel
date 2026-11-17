/**
 * P1 integration gate for user-owned/authorised pilot data. No raw observations
 * are transmitted. Numerical proximity is descriptive, not a station-to-asset
 * deformation transfer function. BIG raster or PPP metadata from a local file
 * cannot be authenticated simply by parsing it.
 */
import {parseStationQc} from "./station-qc.js";
import {analyzeSeries} from "./engine.js";

export const DEMNAS_SERVICE="https://geoservices.big.go.id/raster/rest/services/DEMNAS/DEM_Indonesia/ImageServer";
export const DEMNAS_DOWNLOAD="https://tanahair.indonesia.go.id/";
export const SEMARANG_BBOX=Object.freeze([110.375,-7.025,110.485,-6.875]);
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const validHash=x=>typeof x==="string"&&/^[a-f0-9]{64}$/.test(x);
const nonempty=x=>typeof x==="string"&&x.trim().length>2&&x.length<=220;
const RAD=Math.PI/180;
function inside(c,b){return finite(c?.[0])&&finite(c?.[1])&&c[0]>=b[0]&&c[0]<=b[2]&&c[1]>=b[1]&&c[1]<=b[3];}
function unwrap(doc,shape){
 const x=typeof doc==="string"?JSON.parse(doc):doc;
 if(x?.crs&&!["EPSG:4326","OGC:CRS84","urn:ogc:def:crs:OGC:1.3:CRS84"].includes(x.crs?.properties?.name))
  throw new TypeError("Hanya koordinat GeoJSON WGS84 (longitude, latitude) didukung.");
 if(x?.type==="FeatureCollection"){
  if(x.features?.length!==1)throw new TypeError("Pilih GeoJSON dengan tepat satu Feature.");
  if(x.features[0]?.crs)throw new TypeError("CRS tingkat Feature tidak didukung.");
  return unwrap(x.features[0],shape);
 }
 if(x?.type!=="Feature"||x.geometry?.type!==shape)
  throw new TypeError("Diperlukan satu GeoJSON Feature "+shape+" dengan atribut sumber.");
 return x;
}
function intersectSegments(a,b,c,d){
 const cross=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]);
 const on=(u,v,w)=>Math.abs(cross(u,v,w))<1e-12&&w[0]>=Math.min(u[0],v[0])-1e-12&&w[0]<=Math.max(u[0],v[0])+1e-12&&w[1]>=Math.min(u[1],v[1])-1e-12&&w[1]<=Math.max(u[1],v[1])+1e-12;
 const t=[cross(a,b,c),cross(a,b,d),cross(c,d,a),cross(c,d,b)];
 return (t[0]*t[1]<0&&t[2]*t[3]<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
}
function segmentsValid(ring){
 const n=ring.length-1;
 for(let i=0;i<n;i++){
  if(ring[i][0]===ring[i+1][0]&&ring[i][1]===ring[i+1][1])return false;
  for(let j=i+1;j<n;j++){
   if(j===i+1||(i===0&&j===n-1))continue;
   if(intersectSegments(ring[i],ring[i+1],ring[j],ring[j+1]))return false;
  }
 }
 return true;
}
export function parseAssetFeature(input){
 const feat=unwrap(input,"Polygon"),coords=feat.geometry.coordinates,p=feat.properties??{};
 if(!Array.isArray(coords)||coords.length!==1||!Array.isArray(coords[0])||coords[0].length<4||coords[0].length>500)
  throw new TypeError("Polygon aset harus satu ring tertutup 4–500 titik; lubang dan MultiPolygon tidak didukung.");
 const ring=coords[0];
 if(ring.some(c=>!Array.isArray(c)||c.length!==2||!inside(c,SEMARANG_BBOX)))throw new RangeError("Setiap vertex aset harus dalam cakupan Semarang dan EPSG:4326.");
 if(ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1]||!segmentsValid(ring))
  throw new TypeError("Polygon harus tertutup, tanpa ruas nol atau self-intersection.");
 const pId=p.assetId??p.id??p.name;
 if(!nonempty(pId)||!nonempty(p.sourceReference))
  throw new TypeError("Aset membutuhkan properties.assetId/name dan sourceReference; deklarasi ini belum verifikasi operator.");
 let doubleArea=0;
 for(let i=0;i<ring.length-1;i++)doubleArea+=ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1];
 if(Math.abs(doubleArea)<1e-10)throw new TypeError("Luas polygon nol atau terlalu kecil untuk diperiksa.");
 return {assetId:pId,sourceReference:p.sourceReference,geometry:{type:"Polygon",coordinates:[ring]},provenance:"USER_DECLARED_UNVERIFIED",operatorConfirmed:false};
}
export function parseStationFeature(input){
 const feat=unwrap(input,"Point"),p=feat.properties??{},c=feat.geometry.coordinates;
 if(!Array.isArray(c)||c.length!==2||!inside(c,[109.5,-7.8,111.5,-6.35]))
  throw new RangeError("Stasiun harus Point lon/lat WGS84 pada wilayah Semarang dan sekitarnya.");
 if(!["CSEM","CSMG"].includes(p.stationCode)||!nonempty(p.sourceReference))
  throw new TypeError("Gunakan properties.stationCode (CSEM/CSMG) dan sourceReference dari sumber koordinat.");
 return {stationCode:p.stationCode,sourceReference:p.sourceReference,coordinates:[...c],provenance:"USER_DECLARED_UNVERIFIED",coordinateAuthenticatedByBig:false};
}
function projected(c,lat0){return [c[0]*111320*Math.cos(lat0*RAD),c[1]*111320];}
function distanceToSegment(p,a,b){
 const v=[b[0]-a[0],b[1]-a[1]],w=[p[0]-a[0],p[1]-a[1]];
 const t=Math.max(0,Math.min(1,(v[0]*w[0]+v[1]*w[1])/(v[0]*v[0]+v[1]*v[1])));
 return Math.hypot(p[0]-a[0]-t*v[0],p[1]-a[1]-t*v[1]);
}
function pointInPolygon(p,ring){
 let inRing=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[j],b=ring[i];
  if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inRing=!inRing;
 }
 return inRing;
}
export function assessStationAssetProximity(asset,station){
 if(asset?.provenance!=="USER_DECLARED_UNVERIFIED"||station?.provenance!=="USER_DECLARED_UNVERIFIED")
  throw new TypeError("Periksa kedua input GeoJSON sebelum hitung kedekatan.");
 const ring=asset.geometry.coordinates[0],pt=station.coordinates,lat0=pt[1],p=projected(pt,lat0);
 const insidePolygon=pointInPolygon(pt,ring);
 const distance=insidePolygon?0:Math.min(...ring.slice(1).map((b,i)=>distanceToSegment(p,projected(ring[i],lat0),projected(b,lat0))));
 return {
  assetId:asset.assetId,stationCode:station.stationCode,
  geometricProximityMeters:Math.round(distance),pointInsideAssetPolygon:insidePolygon,
  method:"Local equirectangular approximate shortest point-to-polygon-edge distance, WGS84",
  result:"GEOMETRIC_PROXIMITY_ONLY",sourceMode:"USER_DECLARED_COORDINATES_UNVERIFIED",
  authoritativeAssetLink:false,onAssetMotionMeasured:false,canTransferStationVelocityToAsset:false,
  canIssueOperationalRanking:false,
  requiredProof:["Validasi CRS, tanggal survei, sumber polygon dan identitas stasiun dengan operator/BIG.","Hubungan benchmark geodetik ke struktur, periode/solusi posisi yang representatif beserta uncertainty.","Verifikasi lapangan dan review ahli; kedekatan tidak membuktikan pergerakan bersama."]
 };
}
export function demnasIdentifyRequest(lon,lat){
 const p=[Number(lon),Number(lat)];
 if(!inside(p,SEMARANG_BBOX))throw new RangeError("Titik DEMNAS harus di dalam area kerja Semarang.");
 const url=new URL(DEMNAS_SERVICE+"/identify");
 url.searchParams.set("f","json");
 url.searchParams.set("geometryType","esriGeometryPoint");
 url.searchParams.set("geometry",JSON.stringify({x:p[0],y:p[1],spatialReference:{wkid:4326}}));
 url.searchParams.set("returnGeometry","false");
 return url.toString();
}
export function validateDemnasIdentify(doc,expected=null){
 if(doc?.error)throw new TypeError("BIG ImageServer melaporkan error "+String(doc.error.code||""));
 if(doc?.location?.spatialReference?.wkid!==4326||!finite(doc.location.x)||!finite(doc.location.y))
  throw new TypeError("Respons DEMNAS tidak memiliki titik WGS84 valid.");
 const pos=[doc.location.x,doc.location.y];
 if(!inside(pos,SEMARANG_BBOX)||expected&&Math.hypot(pos[0]-expected[0],pos[1]-expected[1])>1e-4)
  throw new TypeError("Koordinat hasil tidak sesuai titik permintaan.");
 const v=Number(doc.value);
 const good=doc.value!==null&&doc.value!==undefined&&doc.value!==""&&finite(v)&&v>=-500&&v<=9000;
 return {status:good?"RASTER_VALUE_UNVERIFIED_DATUM":"NODATA_OR_INVALID_RASTER_VALUE",
  valueMeters:good?v:null,rawValue:String(doc.value??""),coordinates:pos,
  source:DEMNAS_SERVICE,officialImageServer:true,
  canCompareWithTidalDatum:false,canMeasureGroundSubsidence:false,canRankAsset:false,
  warning:good?"Nilai layanan raster BIG; referensi vertikal, kualitas piksel dan kecocokan aset perlu diaudit. Bukan kedalaman banjir.":"ImageServer menghasilkan NoData/angka di luar elevasi fisik; dilarang dipakai sebagai ketinggian. Jangan pakai Values[] dari katalog mosaik sebagai pengganti."};
}
export function validateDemnasLocalPreview(doc){
 if(doc?.schema!=="baruna-demnas-local-raster-preview-v1"||
    doc.sourceMode!=="USER_SUPPLIED_GEOTIFF_DERIVED_NOT_BIG_AUTHENTICATED"||
    !validHash(doc.sourceSha256)||!nonempty(doc.fileName)||doc.crs!=="EPSG:4326"||
    !Array.isArray(doc.bboxWgs84)||doc.bboxWgs84.length!==4||doc.bboxWgs84.some((n,i)=>!finite(n)||Math.abs(n-SEMARANG_BBOX[i])>0.001)||
    !Array.isArray(doc.grid)||doc.grid.length!==20||
    doc.grid.some(row=>!Array.isArray(row)||row.length!==20||row.some(v=>v!==null&&(!finite(v)||v< -500||v>9000)))||
    doc.originVerifiedByBig!==false||doc.canCompareTidalDatum!==false)
  throw new TypeError("Preview DEMNAS tidak valid: verifikasi raster, grid, CRS dan provenance.");
 const vals=doc.grid.flat().filter(finite);
 if(vals.length<10)throw new TypeError("DEMNAS tidak memiliki minimal 10 piksel elevasi valid; tidak diterima.");
 return {status:"LOCAL_DEMNAS_PIXELS_USER_SUPPLIED",validPixels:vals.length,totalPixels:400,
  minMeters:Math.min(...vals),maxMeters:Math.max(...vals),sourceSha256:doc.sourceSha256,
  bboxWgs84:doc.bboxWgs84,originVerifiedByBig:false,canCompareTidalDatum:false,
  canMeasureSubsidence:false,canRankRealAsset:false,
  warning:"Ekstrak raster yang diberikan pengguna. Metadata asli dan datum belum diverifikasi oleh BIG; grid 20x20 hanya preview, bukan DEM analitik atau elevasi struktur."};
}
export function inspectLocalCorsSummary(doc){
 const data=parseStationQc(doc);
 return {status:"AUTHORISED_LOCAL_RINEX_OBSERVATION_QC",stationDays:data.totals.map(x=>({station:x.station.toUpperCase(),files:x.files,epochs:x.epochs})),
  firstDate:data.firstDate,lastDate:data.lastDate,sharedFullDays:data.jointFullDays.length,totalEpochs:data.totalEpochs,
  hasPositionSolution:false,canEstimateCurrentVelocity:false,canLinkToAssets:false,
  warning:"QC arsip RINEX lokal saja. Bukan solusi posisi PPP, laju subsidence ataupun inspeksi aset; sumber stasiun masih operator-declared."};
}
export function inspectProcessedPositionSeries(doc){
 if(doc?.schema!=="baruna-processed-multignss-station-series-v1"||
  !["CSEM","CSMG"].includes(doc.station)||
  doc.sourceMode!=="USER_SUPPLIED_PPP_SOLUTIONS_NOT_SOURCE_VERIFIED"||
  !["PPP","NETWORK_ADJUSTMENT"].includes(doc.processing?.method)||
  !nonempty(doc.processing?.referenceFrame)||!nonempty(doc.processing?.processor)||
  !validHash(doc.processing?.rinexArchiveSha256)||
  !Array.isArray(doc.processing?.constellations)||!doc.processing.constellations.includes("GPS")||
  new Set(doc.processing.constellations).size<2||
  !Array.isArray(doc.epochs)||doc.epochs.length<2||doc.epochs.length>20000)
  throw new TypeError("Perlu output PPP/network multi-GNSS dengan metadata frame, operator, SHA arsip, dan >=2 epoch.");
 const points=doc.epochs.map(e=>{
  if(typeof e.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||
     !finite(e.upMeters)||!finite(e.sigmaUpMeters)||e.sigmaUpMeters<=0||e.sigmaUpMeters>1||Math.abs(e.upMeters)>100)
   throw new TypeError("Epoch solusi posisi tidak valid / uncertainty hilang.");
  const dt=new Date(e.date+"T00:00:00Z");
  if(!Number.isFinite(dt.getTime())||dt.toISOString().slice(0,10)!==e.date)throw new TypeError("Tanggal epoch tidak valid.");
  return {date:e.date,t:dt.getTime()/86400000,up:e.upMeters,sigmaU:e.sigmaUpMeters};
 });
 points.sort((a,b)=>a.t-b.t);
 if(points.some((p,i)=>i>0&&p.t===points[i-1].t))throw new TypeError("Epoch duplikat dalam solusi posisi.");
 const spanDays=points.at(-1).t-points[0].t;
 // Even a real short PPP campaign cannot support an annualized subsidence claim.
 const sufficient=spanDays>=365&&points.length>=10;
 const fit=sufficient?analyzeSeries({station:doc.station,epochs:points}):null;
 return {station:doc.station,sourceMode:doc.sourceMode,epochCount:points.length,
  start:points[0].date,end:points.at(-1).date,spanDays,
  processingMethod:doc.processing.method,referenceFrame:doc.processing.referenceFrame,
  externalSourceVerified:false,isMultiConstellationDeclared:true,
  descriptiveSlopeMmYear:fit?.quality==="SCREENING_READY"?fit.verticalSlopeMmYr:null,
  slopeUncertaintyValidated:false,currentOperationalVelocityValidated:false,
  isOnAssetMeasurement:false,canIssueRealAssetRanking:false,
  status:fit?.quality==="SCREENING_READY"?"DESCRIPTIVE_EXTERNAL_SOLUTION_NEEDS_GEODETIC_REVIEW":"INSUFFICIENT_SPAN_OR_CONTINUITY",
  warnings:["File ini output posisi dari pemroses eksternal, bukan hasil PPP yang dihitung BARUNA. Identitas sumber dan reference frame masih user-declared.","OLS deskriptif bukan solusi ketidakpastian geodetik yang telah menangani sinyal musiman, autokorelasi, lompatan dan referensi frame.","Satu stasiun tidak mewakili deformasi aset di dekatnya; quality gate tetap DATA_INSUFFICIENT."]
 };
}
