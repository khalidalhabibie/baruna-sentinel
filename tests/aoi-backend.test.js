import test from 'node:test';
import assert from 'node:assert/strict';
import {authorize,isConfigured,buildServerRecord,upsertAoi,listAois,deleteAoi,getHistory,monitorAoi,AOI_HASH} from '../api/_lib/pilot-service.js';
const env={BARUNA_OPERATOR_TOKEN:'0123456789abcdef0123456789abcdefABCDE',UPSTASH_REDIS_REST_URL:'https://example.upstash.io',UPSTASH_REDIS_REST_TOKEN:'some-long-test-only-token'};
const ring=[[110.401,-6.97],[110.405,-6.97],[110.405,-6.965],[110.401,-6.965],[110.401,-6.97]];
const data={name:'Tanjung Emas pilot',purpose:'evidence_review',boundarySource:'USER_DRAWN_UNVERIFIED',geometry:{type:'Polygon',coordinates:[ring]}};
const fakeRedis=()=>{
 const hashes=new Map(),lists=new Map();
 return async(cmd,key,...args)=>{
  if(cmd==='HGETALL'){const h=hashes.get(key)||new Map();return [...h].flat();}
  if(cmd==='HSET'){const h=hashes.get(key)||new Map();h.set(args[0],args[1]);hashes.set(key,h);return 1;}
  if(cmd==='HDEL'){const h=hashes.get(key)||new Map();return h.delete(args[0])?1:0;}
  if(cmd==='LPUSH'){const l=lists.get(key)||[];l.unshift(args[0]);lists.set(key,l);return l.length;}
  if(cmd==='LTRIM'){lists.set(key,(lists.get(key)||[]).slice(Number(args[0]),Number(args[1])+1));return 'OK';}
  if(cmd==='LRANGE')return (lists.get(key)||[]).slice(Number(args[0]),Number(args[1])+1);
  if(cmd==='DEL'){const had=lists.has(key);lists.delete(key);return had?1:0;}
  throw new Error('Unknown fake Redis command '+cmd);
 };
};
test('backend requires sufficiently strong secret and valid operator bearer',()=>{
 assert.equal(isConfigured({}),false);assert.equal(isConfigured(env),true);
 assert.equal(authorize({headers:{authorization:'Bearer '+env.BARUNA_OPERATOR_TOKEN}},env),true);
 assert.equal(authorize({headers:{authorization:'Bearer wrong'}},env),false);
 assert.equal(authorize({headers:{}},env),false);
 assert.equal(authorize({headers:{authorization:'Bearer '+env.BARUNA_OPERATOR_TOKEN}},{...env,BARUNA_OPERATOR_TOKEN:'short'}),false);
});
test('server sanitizes geometry and refuses operator certification injection',()=>{
 const record=buildServerRecord({...data,sourceStatus:'CERTIFIED',rankingEligibility:'HIGH',lastEvidenceCheck:{capabilities:{assetRanking:true}}});
 assert.match(record.id,/^aoi-/);assert.equal(record.sourceStatus,'USER_DECLARED_UNVERIFIED');
 assert.equal(record.rankingEligibility,'DATA_INSUFFICIENT');assert.equal(record.lastEvidenceCheck,null);
 assert.throws(()=>buildServerRecord({...data,geometry:{type:'Polygon',coordinates:[[[1,1],[2,1],[2,2],[1,1]]]}}),/AOI|cakupan|di luar/i);
});
test('persist, monitor, deduplicate, and delete with bounded source-only history',async()=>{
 const redis=fakeRedis();
 const added=await upsertAoi(redis,data);assert.equal((await listAois(redis)).length,1);
 const catalog={schema:'baruna-real-scene-index-v1',sourceMode:'REAL_CATALOG_METADATA_ONLY_NOT_INSAR',source:'official STAC',
  generatedUtc:'2026-11-17T00:00:00Z',scenes:[[1,'S1_GRD_20261111','2026-11-11',null,ring],[2,'S2_L2A_20261111','2026-11-11',1.5,ring]]};
 const fetcher=async()=>({catalog,readiness:{schema:'baruna-real-evidence-readiness-v1',asOf:'2026-11-17'}});
 const first=await monitorAoi(redis,added.id,'2026-11-17T02:30:00Z',fetcher);
 assert.equal(first.event.isPhysicalChange,false);assert.equal(first.event.isBaseline,true);assert.equal(first.event.s1Count,1);assert.equal(first.event.s2Count,1);
 const second=await monitorAoi(redis,added.id,'2026-11-17T02:31:00Z',fetcher);
 assert.equal(second.skipped,true);assert.equal((await getHistory(redis,added.id)).length,1);
 const next=await upsertAoi(redis,{...data,id:added.id,name:'New name'});assert.equal(next.lastEvidenceCheck.catalogGeneratedUtc,catalog.generatedUtc);
 assert.equal((await listAois(redis)).length,1);
 assert.equal(await deleteAoi(redis,added.id),true);assert.equal((await listAois(redis)).length,0);assert.equal((await getHistory(redis,added.id)).length,0);
});