import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLocalBackup,parseLocalBackup,mergeLocalBackup,BACKUP_MAX_BYTES,LOCAL_BACKUP_SCHEMA} from '../src/aoi-local-backup.js';
function rec(i='aoi-abcdefg',a=110.42){return {id:i,name:'Tanjung Emas Pilot',purpose:'evidence_review',createdAt:'2026-11-17T02:00:00.000Z',geometry:{type:'Polygon',coordinates:[[[a,-6.97],[a+0.01,-6.97],[a+0.01,-6.96],[a,-6.96],[a,-6.97]]]},boundarySource:'USER_DRAWN_UNVERIFIED',sourceStatus:'USER_DECLARED_UNVERIFIED',regionId:'semarang',workspaceId:'semarang-coastal',monitorHistory:[]};}
test('backup roundtrip is local-only, no risk claim, no secrets',()=>{
 const b=makeLocalBackup([rec()],'2026-11-17T10:00:00.000Z');
 assert.equal(b.schema,LOCAL_BACKUP_SCHEMA);assert.equal(b.containsOperationalRanking,false);
 assert.equal(b.records.length,1);assert.equal(b.records[0].rankingEligibility,undefined);
 assert.equal(parseLocalBackup(JSON.stringify(b))[0].id,'aoi-abcdefg');
});
test('backup merge preserves user geometry and does not overwrite IDs',()=>{
 const local=[rec()],incoming=[rec('aoi-abcdefg',110.43),rec('aoi-hijklmn',110.45)];
 const out=mergeLocalBackup(local,incoming);
 assert.equal(out.conflicts,1);assert.equal(out.added,1);assert.equal(out.records.length,2);
 assert.equal(out.records[0].geometry.coordinates[0][0][0],110.42);
});
test('bad schema, duplicate ids, excessively large backup and invalid geometry fail closed',()=>{
 const b=makeLocalBackup([rec()]);
 assert.throws(()=>parseLocalBackup(JSON.stringify({...b,schema:'external-admin-backup'})),/bukan backup/);
 assert.throws(()=>parseLocalBackup(JSON.stringify({...b,records:[rec(),rec()]})),/Duplikat/);
 assert.throws(()=>parseLocalBackup(' '.repeat(BACKUP_MAX_BYTES+1)),/maksimal/);
 assert.throws(()=>makeLocalBackup([rec('aoi-hijklmn',110.7)]),/luar|Semarang|cakupan/i);
});