/**
 * BARUNA AOI pilot — client-side evidence registry, never an operational risk engine.
 * Scoped to the actual Semarang source snapshot (EPSG:4326); no server scheduler.
 */
export const AOI_BOUNDS=Object.freeze([110.375,-7.025,110.485,-6.875]);
export const STORE_KEY="baruna:semarang:aoi-registry:v1";
export const MAX_AOIS=20;
export const MAX_POINTS=200;
export const MAX_FILE_BYTES=524288;
const eps=1e-10;
const finite=v=>typeof v==="number"&&Number.isFinite(v);
const same=(a,b)=>Math.abs(a[0]-b[0])<eps&&Math.abs(a[1]-b[1])<eps;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const between=(a,b,c)=>c>=Math.min(a,b)-eps&&c<=Math.max(a,b)+eps;
function onSegment(a,b,p){return Math.abs(cross(a,b,p))<eps&&between(a[0],b[0],p[0])&&between(a[1],b[1],p[1]);}
function intersects(a,b,c,d){
 const a1=cross(a,b,c),a2=cross(a,b,d),b1=cross(c,d,a),b2=cross(c,d,b);
 if((a1>eps&&a2< -eps||a1< -eps&&a2>eps)&&(b1>eps&&b2< -eps||b1< -eps&&b2>eps))return true;
 return Math.abs(a1)<eps&&onSegment(a,b,c)||Math.abs(a2)<eps&&onSegment(a,b,d)||
   Math.abs(b1)<eps&&onSegment(c,d,a)||Math.abs(b2)<eps&&onSegment(c,d,b);
}
export function bboxOf(ring){const lon=ring.map(c=>c[0]),lat=ring.map(c=>c[1]);return [Math.min(...lon),Math.min(...lat),Math.max(...lon),Math.max(...lat)];}
export function areaKm2(ring){
 const meanLat=ring.reduce((n,p)=>n+p[1],0)/ring.length*Math.PI/180;
 const x=111.31949*Math.cos(meanLat),y=111.31949;
 let sum=0;
 for(let i=0;i<ring.length-1;i++)sum+=(ring[i][0]*x)*(ring[i+1][1]*y)-(ring[i+1][0]*x)*(ring[i][1]*y);
 return Math.abs(sum/2);
}
export function validateAoiPolygon(input){
 if(!Array.isArray(input))throw new TypeError("Polygon AOI wajib berupa koordinat [longitude,latitude].");
 let points=input.map(p=>Array.isArray(p)?[p[0],p[1]]:null);
 if(points.length>MAX_POINTS+1)throw new RangeError("Maksimal 200 vertex per AOI.");
 if(points.length>=2&&points[0]&&points.at(-1)&&same(points[0],points.at(-1)))points=points.slice(0,-1);
 if(points.length<3)throw new RangeError("AOI memerlukan minimal 3 titik berbeda.");
 if(points.some(p=>!p||!p.every(finite)))throw new TypeError("Koordinat AOI harus angka lon/lat yang valid.");
 if(points.some(([x,y])=>x<AOI_BOUNDS[0]-eps||x>AOI_BOUNDS[2]+eps||y<AOI_BOUNDS[1]-eps||y>AOI_BOUNDS[3]+eps))
  throw new RangeError("AOI saat ini harus di dalam cakupan dataset Semarang. Jakarta/Surabaya belum tersedia.");
 if(points.some((p,i)=>same(p,points[(i+1)%points.length])))throw new RangeError("Terdapat vertex duplikat/segmen nol.");
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
  if(j===i+1||(i===0&&j===points.length-1))continue;
  if(intersects(points[i],points[(i+1)%points.length],points[j],points[(j+1)%points.length]))
   throw new RangeError("Polygon AOI memotong dirinya sendiri. Perbaiki vertex atau gunakan GeoJSON valid.");
 }
 const closed=[...points,points[0]];
 const area=areaKm2(closed);
 if(area<0.005)throw new RangeError("Luas AOI terlalu kecil untuk preview regional (minimum 0,005 km²).");
 if(area>250)throw new RangeError("Luas AOI di luar cakupan MVP Semarang (maksimum 250 km²).");
 return {type:"Polygon",coordinates:[closed],bbox:bboxOf(closed),areaKm2:Number(area.toFixed(4))};
}
export function parseAoiGeoJSON(input){
 const doc=typeof input==="string"?JSON.parse(input):input;
 let geometry=doc;
 if(doc?.type==="FeatureCollection"){
  if(!Array.isArray(doc.features)||doc.features.length!==1)throw new TypeError("Pilih GeoJSON dengan tepat satu polygon AOI.");
  geometry=doc.features[0]?.geometry;
 }else if(doc?.type==="Feature")geometry=doc.geometry;
 if(doc?.crs){const crs=doc.crs?.properties?.name;
  if(!["EPSG:4326","urn:ogc:def:crs:OGC:1.3:CRS84","OGC:CRS84"].includes(crs))throw new TypeError("Hanya GeoJSON EPSG:4326 didukung.");}
 if(geometry?.type!=="Polygon"||!Array.isArray(geometry.coordinates)||geometry.coordinates.length!==1)
  throw new TypeError("Gunakan satu Polygon GeoJSON tanpa holes; MultiPolygon belum didukung.");
 return validateAoiPolygon(geometry.coordinates[0]);
}
function pointInPolygon(point,ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];
  if(onSegment(a,b,point))return true;
  if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
export function polygonIntersects(a,b){
 const [w,s,e,n]=bboxOf(a),[x,y,z,t]=bboxOf(b);
 if(e<x||z<w||n<y||t<s)return false;
 if(a.some(p=>pointInPolygon(p,b))||b.some(p=>pointInPolygon(p,a)))return true;
 for(let i=0;i<a.length-1;i++)for(let j=0;j<b.length-1;j++)if(intersects(a[i],a[i+1],b[j],b[j+1]))return true;
 return false;
}
export function validateRecord(record){
 if(!record||typeof record!=="object")throw new TypeError("Catatan AOI tidak valid.");
 if(typeof record.id!=="string"||!/^aoi-[a-zA-Z0-9-]{6,60}$/.test(record.id))throw new TypeError("AOI ID tidak valid.");
 if(typeof record.name!=="string"||record.name.trim().length<3||record.name.length>70)throw new TypeError("Nama AOI harus 3–70 karakter.");
 if(!["evidence_review","coastal_context","deformation_screening"].includes(record.purpose))throw new TypeError("Tujuan AOI tidak dikenal.");
 if(!["USER_DRAWN_UNVERIFIED","USER_IMPORTED_UNVERIFIED"].includes(record.boundarySource))throw new TypeError("Sumber batas AOI tidak sah.");
 if(typeof record.createdAt!=="string"||!Number.isFinite(Date.parse(record.createdAt)))throw new TypeError("Tanggal registrasi AOI tidak valid.");
 const geometry=validateAoiPolygon(record.geometry?.coordinates?.[0]);
 return {...record,name:record.name.trim(),geometry,boundarySource:record.boundarySource,sourceStatus:"USER_DECLARED_UNVERIFIED",rankingEligibility:"DATA_INSUFFICIENT",workspaceId:"semarang-coastal",regionId:"semarang"};
}
export function readRegistry(storage){
 const raw=storage.getItem(STORE_KEY);
 if(!raw)return [];
 const parsed=JSON.parse(raw);
 if(!Array.isArray(parsed)||parsed.length>MAX_AOIS)throw new Error("Registry lokal tidak valid; ekspor cadangan sebelum mengubah data.");
 const seen=new Set();
 return parsed.map(x=>{
  const record=validateRecord(x);
  if(seen.has(record.id))throw new Error("Registry berisi ID AOI duplikat.");
  seen.add(record.id);
  return record;
 });
}
export function writeRegistry(storage,records){
 if(!Array.isArray(records)||records.length>MAX_AOIS)throw new RangeError("Maksimal 20 AOI per browser.");
 const ids=new Set();const data=records.map(record=>{
  const v=validateRecord(record);
  if(ids.has(v.id))throw new Error("ID AOI duplikat.");
  ids.add(v.id);return v;
 });
 storage.setItem(STORE_KEY,JSON.stringify(data));
 return data;
}
function intersectsScene(geometry,row){
 if(!Array.isArray(row)||!Array.isArray(row[4])||row[4].length<3)return false;
 const footprint=row[4];
 return polygonIntersects(geometry.coordinates[0],same(footprint[0],footprint.at(-1))?footprint:[...footprint,footprint[0]]);
}
export function evaluateEvidenceSnapshot(geometry,catalog,readiness,checkedAt){
 if(!catalog||catalog.schema!=="baruna-real-scene-index-v1"||
  !String(catalog.sourceMode).includes("REAL_CATALOG_METADATA_ONLY")||!Array.isArray(catalog.scenes))
  throw new Error("Sumber katalog bukan manifest STAC yang tervalidasi.");
 if(!readiness||readiness.schema!=="baruna-real-evidence-readiness-v1"||!readiness.asOf)
  throw new Error("Manifest status sumber tidak valid.");
 const seen=new Set();
 const matched=catalog.scenes.filter(row=>{
  if(!Array.isArray(row)||![1,2].includes(row[0])||typeof row[1]!=="string"||!/^20\d\d-\d\d-\d\d$/.test(row[2])||seen.has(row[1]))
   throw new Error("Sumber scene memiliki metadata yang tidak valid atau ID duplikat.");
  seen.add(row[1]);
  return intersectsScene(geometry,row);
 });
 const s1=matched.filter(row=>row[0]===1),s2=matched.filter(row=>row[0]===2);
 const format=rows=>rows.sort((a,b)=>b[2].localeCompare(a[2])).map(row=>({id:row[1],date:row[2]}));
 return {schema:"baruna-aoi-evidence-check-v1",checkedAt,sourceSnapshotAsOf:readiness.asOf,
  catalogSource:catalog.source,coverageMethod:"SCENE_FOOTPRINT_POLYGON_INTERSECTION_NOT_PIXEL_COVERAGE",
  s1Grd:format(s1),s2L2a:format(s2),
  capabilities:{grdIsInSAR:false,assetDeformation:false,assetRanking:false,scheduledMonitoring:false},
  warning:"Katalog deployment lokal, bukan pencarian satelit langsung. GRD bukan interferogram; citra optik bukan deformasi aset."};
}
export function diffEvidenceSnapshots(previous,next){
 if(!previous||previous.schema!=="baruna-aoi-evidence-check-v1")return {isBaseline:true,newS1:[],newS2:[],newTotal:0};
 const p1=new Set(previous.s1Grd?.map(s=>s.id)||[]),p2=new Set(previous.s2L2a?.map(s=>s.id)||[]);
 const newS1=next.s1Grd.filter(s=>!p1.has(s.id));
 const newS2=next.s2L2a.filter(s=>!p2.has(s.id));
 return {isBaseline:false,newS1,newS2,newTotal:newS1.length+newS2.length};
}
export function verificationQueue(aoi){
 if(!aoi)return [];
 return [
  {id:"boundary",label:"Verifikasi batas AOI",detail:"Polygon masih ditentukan pengguna; bukan survei resmi atau batas aset operator.",responsible:"Pengelola wilayah / GIS",state:"NEEDS_VERIFICATION"},
  {id:"assets",label:"Daftar aset & geometri tervalidasi",detail:"Impor batas aset dan ID otoritatif, bukan hanya polygon AOI kawasan.",responsible:"Operator aset",state:"MISSING_EVIDENCE"},
  {id:"movement",label:"Pengukuran pergerakan representatif",detail:"Perlu time series GNSS/levelling pada aset atau InSAR tervalidasi dan terhubung ke aset; GRD tidak cukup.",responsible:"Ahli geodesi",state:"MISSING_EVIDENCE"},
  {id:"exposure",label:"Validasi paparan pesisir",detail:"DSM dan indeks optik adalah konteks; butuh datum, masking, dan metode paparan yang sesuai.",responsible:"Analis spasial",state:"MISSING_EVIDENCE"},
  {id:"criticality",label:"Kekritisan dan kebijakan prioritas",detail:"Perlu penilaian kekritisan dari operator serta bobot/ambang yang disetujui ahli.",responsible:"Operator / reviewer",state:"MISSING_EVIDENCE"}
 ];
}
export function makeEvidenceBrief(aoi){
 const record=validateRecord(aoi);
 return {schema:"baruna-aoi-verification-brief-v1",createdAt:new Date().toISOString(),
  aoi:{id:record.id,name:record.name,purpose:record.purpose,regionId:"semarang",workspaceId:"semarang-coastal",geometry:record.geometry,boundarySource:record.boundarySource,sourceStatus:record.sourceStatus},
  evidenceCheck:record.lastEvidenceCheck||null,monitorHistory:(record.monitorHistory||[]).slice(0,20),verificationQueue:verificationQueue(record),
  decision:{operationalRanking:"DATA_INSUFFICIENT",rankedAssets:0,reason:"No verified on-asset representative measurements, owner-approved criticality or operational ranking policy."},
  limitations:["Browser-only AOI registration with portable JSON backup; no cloud sync, automated asset monitoring or operator ranking","Scene footprint intersection does not confirm imagery pixel coverage or detected change","No Sentinel-1 interferogram, GNSS asset deformation or structural safety conclusion","DSM and optical layers do not establish flood/rob depth"]};
}