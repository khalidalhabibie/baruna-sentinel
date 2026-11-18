/**
 * BARUNA Semarang example AOIs: coarse and non-surveyed research envelopes.
 * Not official infrastructure boundaries, displacement, hazards or risk ranks.
 */
import {validateAoiPolygon, validateRecord, MAX_AOIS} from "./aoi-registry-model.js";
export const SEED_MARKER="baruna:semarang:infra-seeds-added:v1";
const examples=[
 ["aoi-seed-tanjung-emas","Pelabuhan Tanjung Emas (contoh)","Port / logistics","port-logistics",
  [[110.418,-6.952],[110.431,-6.952],[110.431,-6.940],[110.418,-6.940]],
  "https://journal.esdm.go.id/bomg/article/view/12755"],
 ["aoi-seed-terboyo-industry","Kawasan Industri Terboyo (contoh)","Industrial / warehouse","industrial-coastal",
  [[110.461,-6.949],[110.473,-6.949],[110.473,-6.938],[110.461,-6.938]],
  "https://doi.org/10.3390/w14020201"],
 ["aoi-seed-kaligawe-road","Koridor Jalan Kaligawe (contoh)","Road / logistics access","transport-corridors",
  [[110.454,-6.959],[110.467,-6.959],[110.467,-6.952],[110.454,-6.952]],
  "https://doi.org/10.3390/w14020201"]
];
export const INFRASTRUCTURE_CASES=Object.freeze(examples.map(([id,name,infrastructureType,infraWorkspaceId,ring,researchUrl])=>
 Object.freeze(validateRecord({
  id,name,infrastructureType,infraWorkspaceId,researchUrl,seedCase:true,
  purpose:"deformation_screening",
  geometry:validateAoiPolygon(ring),
  boundarySource:"ILLUSTRATIVE_BOUNDARY_UNVERIFIED",
  createdAt:"2026-11-18T00:00:00.000Z",
  sourceStatus:"USER_DECLARED_UNVERIFIED",
  workspaceId:"semarang-coastal",regionId:"semarang",
  lastEvidenceCheck:null,lastChange:null,monitorHistory:[]
 }))));
/** Idempotently add examples without overwriting any custom AOI. */
export function mergeInfrastructureSeeds(existing){
 if(!Array.isArray(existing))throw new TypeError("AOI records must be an array");
 const result=existing.slice(),ids=new Set(existing.map(r=>r.id));
 for(const seed of INFRASTRUCTURE_CASES){
  if(result.length>=MAX_AOIS)break;
  if(!ids.has(seed.id)){result.push(seed);ids.add(seed.id);}
 }
 return result;
}
/** Metadata catalog coverage ONLY: no scientific or operational risk ranking. */
export function rankAoiEvidenceCoverage(records){
 const entries=records.map(r=>{
  const c=r.lastEvidenceCheck;
  const checked=c?.schema==="baruna-aoi-evidence-check-v1";
  const categories=checked?
   Number(Array.isArray(c.s1Grd)&&c.s1Grd.length>0)+
   Number(Array.isArray(c.s2L2a)&&c.s2L2a.length>0):0;
  return {id:r.id,name:r.name,checked,categories,
   rank:null,operationalRiskRank:null,operationalRiskStatus:"DATA_INSUFFICIENT",
   status:checked?categories+"/2 kategori katalog":"Belum diperiksa"};
 });
 entries.sort((a,b)=>Number(b.checked)-Number(a.checked)||b.categories-a.categories||a.name.localeCompare(b.name,"id"));
 let previous="",lastRank=0;
 return entries.map((item,i)=>{
  if(!item.checked)return {...item,rank:null};
  const key="c"+item.categories;
  if(key!==previous){lastRank=i+1;previous=key;}
  return {...item,rank:lastRank};
 });
}
