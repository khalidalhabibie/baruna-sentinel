/** Explicit, portable JSON backup for the *local* AOI pilot. No network or credentials. */
import {validateRecord,MAX_AOIS} from './aoi-registry-model.js';
export const LOCAL_BACKUP_SCHEMA='baruna-local-aoi-backup-v1';
export const BACKUP_MAX_BYTES=1048576;
function cleaned(r){
 const a=validateRecord(r);
 return {id:a.id,name:a.name,purpose:a.purpose,createdAt:a.createdAt,
  geometry:a.geometry,boundarySource:a.boundarySource,sourceStatus:'USER_DECLARED_UNVERIFIED',
  regionId:'semarang',workspaceId:'semarang-coastal',
  lastEvidenceCheck:a.lastEvidenceCheck||null,lastChange:a.lastChange||null,
  monitorHistory:Array.isArray(a.monitorHistory)?a.monitorHistory.slice(0,20):[]};
}
function validatedRecords(records){
 if(!Array.isArray(records)||records.length>MAX_AOIS)throw new RangeError('AOI maksimal 20 per browser.');
 const seen=new Set();return records.map(r=>{
  const x=cleaned(r);if(seen.has(x.id))throw new Error('Duplikat ID AOI dalam backup.');seen.add(x.id);return x;
 });
}
export function makeLocalBackup(records,createdAt=new Date().toISOString()){
 if(!Number.isFinite(Date.parse(createdAt)))throw new TypeError('Tanggal backup tidak valid.');
 return {schema:LOCAL_BACKUP_SCHEMA,createdAt,workspaceId:'semarang-coastal',mode:'USER_DECLARED_LOCAL_ONLY',
  containsOperationalRanking:false,records:validatedRecords(records),
  note:'Polygon belum diverifikasi. Perubahan katalog bukan deformasi aset. Tidak ada akses cloud.'};
}
export function parseLocalBackup(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>BACKUP_MAX_BYTES)throw new RangeError('Backup JSON maksimal 1 MB.');
 const parsed=JSON.parse(text);
 if(parsed?.schema!==LOCAL_BACKUP_SCHEMA||parsed.workspaceId!=='semarang-coastal'||parsed.mode!=='USER_DECLARED_LOCAL_ONLY'||parsed.containsOperationalRanking!==false)
  throw new Error('File bukan backup AOI lokal Semarang BARUNA yang sah.');
 return validatedRecords(parsed.records);
}
export function mergeLocalBackup(existing,imported){
 const local=validatedRecords(existing),incoming=validatedRecords(imported);
 const merged=[...local],ids=new Map(local.map(r=>[r.id,r]));
 let added=0,skipped=0,conflicts=0,capacitySkipped=0;
 for(const r of incoming){
  const present=ids.get(r.id);
  if(present){
   if(JSON.stringify(present.geometry.coordinates)===JSON.stringify(r.geometry.coordinates))skipped++;
   else conflicts++;
   continue;
  }
  if(merged.length>=MAX_AOIS){capacitySkipped++;continue;}
  merged.push(r);ids.set(r.id,r);added++;
 }
 return {records:merged,added,skipped,conflicts,capacitySkipped};
}