/** Server-only BARUNA single-operator pilot: fail closed without operator auth + Redis. */
import {createHash,timingSafeEqual,randomUUID} from 'node:crypto';
import {validateRecord,MAX_AOIS,evaluateEvidenceSnapshot,diffEvidenceSnapshots} from '../../src/aoi-registry-model.js';

export const AOI_HASH='baruna:pilot:semarang:aois:v1';
const MAX_BODY=170000;
const sha=s=>createHash('sha256').update(s).digest();
export function isConfigured(env=process.env){
 return typeof env.BARUNA_OPERATOR_TOKEN==='string'&&env.BARUNA_OPERATOR_TOKEN.length>=32&&
  typeof env.UPSTASH_REDIS_REST_URL==='string'&&/^https:\/\//.test(env.UPSTASH_REDIS_REST_URL)&&
  typeof env.UPSTASH_REDIS_REST_TOKEN==='string'&&env.UPSTASH_REDIS_REST_TOKEN.length>16;
}
export function authorize(req,env=process.env,forCron=false){
 const secret=forCron?env.CRON_SECRET:env.BARUNA_OPERATOR_TOKEN;
 if(!isConfigured(env)||typeof secret!=='string'||secret.length<32)return false;
 const bearer=req.headers?.authorization;
 if(typeof bearer!=='string'||!bearer.startsWith('Bearer '))return false;
 const submitted=bearer.slice(7);
 return submitted.length>=32&&submitted.length<=300&&timingSafeEqual(sha(submitted),sha(secret));
}
export function response(res,status,payload,headers={}){
 res.statusCode=status;
 for(const [k,v] of Object.entries({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers}))res.setHeader(k,v);
 res.end(JSON.stringify(payload));
}
export function fail(res,error){
 const code=error?.status||500;
 const clientMessage=code<500?error.message:'Penyimpanan atau pemeriksaan sumber gagal. Coba lagi nanti.';
 response(res,code,{ok:false,error:clientMessage});
}
export async function readBody(req){
 if(req.body!==undefined){
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>MAX_BODY)throw Object.assign(new Error('Payload AOI tidak valid atau terlalu besar'),{status:400});
  return body;
 }
 let total=0;const chunks=[];
 for await(const chunk of req){total+=chunk.length;if(total>MAX_BODY)throw Object.assign(new Error('Payload AOI terlalu besar'),{status:413});chunks.push(chunk);}
 try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();return body;}
 catch{throw Object.assign(new Error('Body harus JSON object'),{status:400});}
}
export function redisFromEnv(env=process.env,fetcher=fetch){
 if(!isConfigured(env))throw Object.assign(new Error('Backend belum dikonfigurasi'),{status:503});
 const base=env.UPSTASH_REDIS_REST_URL.replace(/\/+$/,'');
 const u=new URL(base);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw new Error('Redis endpoint invalid');
 return async (...parts)=>{
  const ac=new AbortController();const timer=setTimeout(()=>ac.abort(),9000);
  try{
   const result=await fetcher(base,{method:'POST',headers:{Authorization:'Bearer '+env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(parts),signal:ac.signal});
   if(!result.ok)throw new Error('Redis transport error '+result.status);
   const json=await result.json();if('error' in json)throw new Error('Redis command failed');
   return json.result;
  }finally{clearTimeout(timer);}
 };
}
export async function listAois(redis){
 const values=await redis('HGETALL',AOI_HASH);
 if(values===null)return [];
 if(!Array.isArray(values)||values.length%2!==0)throw Error('Invalid registry response');
 const out=[];
 for(let i=0;i<values.length;i+=2){
  const parsed=JSON.parse(values[i+1]);const item=validateRecord(parsed);
  if(item.id!==values[i])throw Error('Registry identifier mismatch');
  out.push(item);
 }
 return out.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export function buildServerRecord(input,existing=null,now=new Date().toISOString()){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Object.assign(new Error('Data AOI invalid'),{status:400});
 const id=existing?.id||'aoi-'+randomUUID();
 const changed=!existing||JSON.stringify(existing.geometry.coordinates)!==JSON.stringify(input.geometry?.coordinates);
 const candidate={id,name:input.name,purpose:input.purpose,geometry:input.geometry,
  createdAt:existing?.createdAt||now,boundarySource:input.boundarySource,
  sourceStatus:'USER_DECLARED_UNVERIFIED',lastEvidenceCheck:changed?null:(existing.lastEvidenceCheck||null),
  lastChange:changed?null:(existing.lastChange||null)};
 try{return validateRecord(candidate);}catch(e){throw Object.assign(new Error(e.message),{status:400});}
}
export async function upsertAoi(redis,input){
 const all=await listAois(redis);
 let existing=null;
 if(input.id){existing=all.find(x=>x.id===input.id);if(!existing)throw Object.assign(new Error('AOI tidak ditemukan'),{status:404});}
 if(!existing&&all.length>=MAX_AOIS)throw Object.assign(new Error('Maksimal 20 AOI backend pilot'),{status:409});
 const item=buildServerRecord(input,existing);
 await redis('HSET',AOI_HASH,item.id,JSON.stringify(item));
 return item;
}
export async function deleteAoi(redis,id){
 if(typeof id!=='string'||!/^aoi-[a-zA-Z0-9-]{6,60}$/.test(id))throw Object.assign(new Error('ID AOI tidak valid'),{status:400});
 const removed=await redis('HDEL',AOI_HASH,id);
 await redis('DEL','baruna:pilot:semarang:history:'+id);
 return removed>0;
}
export async function getHistory(redis,id){
 if(typeof id!=='string'||!/^aoi-[a-zA-Z0-9-]{6,60}$/.test(id))throw Object.assign(new Error('ID AOI tidak valid'),{status:400});
 const stored=await redis('LRANGE','baruna:pilot:semarang:history:'+id,'0','19');
 return Array.isArray(stored)?stored.map(JSON.parse):[];
}
export async function fetchPublicCatalog(fetcher=fetch){
 const base='https://sentinel.ourdo.id/data/';
 const get=async file=>{
  const ac=new AbortController();const timer=setTimeout(()=>ac.abort(),9500);
  try{const r=await fetcher(base+file,{headers:{Accept:'application/json'},signal:ac.signal,cache:'no-store'});if(!r.ok)throw Error('Public catalogue HTTP '+r.status);return await r.json();}
  finally{clearTimeout(timer);}
 };
 const ready=await get('semarang-real-readiness.json');
 let catalog;
 try{const recent=await get('semarang-monitoring-catalog.json');
  if(recent.status==='READY'&&Array.isArray(recent.scenes)&&recent.scenes.length>0&&typeof recent.generatedUtc==='string')catalog=recent;
 }catch{/* scheduled feed unavailable; fallback retains historical metadata */}
 catalog??=await get('semarang-sentinel-scenes.json');
 return {catalog,readiness:{...ready,asOf:catalog.generatedUtc?.slice(0,10)||ready.asOf}};
}
export async function monitorAoi(redis,id,now=new Date().toISOString(),fetchCatalog=fetchPublicCatalog){
 const all=await listAois(redis);const item=all.find(r=>r.id===id);
 if(!item)throw Object.assign(new Error('AOI tidak ditemukan'),{status:404});
 const {catalog,readiness}=await fetchCatalog();
 const previous=item.lastEvidenceCheck;
 // No duplicate monitoring history for the same published source snapshot, unless this is first run.
 if(previous&&catalog.generatedUtc&&previous.catalogGeneratedUtc===catalog.generatedUtc)
  return {item,change:item.lastChange||null,skipped:true,reason:'SAME_PUBLISHED_CATALOG_SNAPSHOT'};
 const evidence=evaluateEvidenceSnapshot(item.geometry,catalog,readiness,now);
 evidence.catalogGeneratedUtc=catalog.generatedUtc||null;
 const change=diffEvidenceSnapshots(previous,evidence);
 const updated=validateRecord({...item,lastEvidenceCheck:evidence,lastChange:change});
 await redis('HSET',AOI_HASH,id,JSON.stringify(updated));
 const event={schema:'baruna-aoi-monitor-run-v1',aoiId:id,checkedAt:now,sourceAsOf:evidence.sourceSnapshotAsOf,
  catalogGeneratedUtc:evidence.catalogGeneratedUtc,s1Count:evidence.s1Grd.length,s2Count:evidence.s2L2a.length,
  newSceneCount:change.newTotal,isBaseline:change.isBaseline,mode:'CATALOG_METADATA_ONLY',isPhysicalChange:false};
 const key='baruna:pilot:semarang:history:'+id;
 await redis('LPUSH',key,JSON.stringify(event));
 await redis('LTRIM',key,'0','19');
 return {item:updated,event,change,skipped:false};
}