import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDemoData,buildDemoDecision} from '../src/proposal-demo-model.js';
import {validateHistoricalFieldEvidence} from '../src/historical.js';
const data=JSON.parse(readFileSync(new URL('../data/semarang-proposal-demo.json',import.meta.url),'utf8'));
const historical=validateHistoricalFieldEvidence(JSON.parse(readFileSync(new URL('../data/tanjung-emas-historical-field-evidence.json',import.meta.url),'utf8')));
test('published station amounts match code and proposal, uncertainties separate from asset ranking',()=>{
 const source=validateDemoData(data);
 assert.equal(source.cors.stations.find(x=>x.id==='CSMG').verticalMmYr,-94.03);
 assert.equal(source.cors.stations.find(x=>x.id==='CSMG').uncertaintyMmYr,4.92);
 assert.equal(source.cors.stations.find(x=>x.id==='CSEM').verticalMmYr,3.23);
 assert.equal(source.cors.stations.find(x=>x.id==='CSEM').uncertaintyMmYr,1.76);
 assert.throws(()=>validateDemoData({...data,cors:{...data.cors,stations:[{...data.cors.stations[0],verticalMmYr:9},data.cors.stations[1]]}}),/tidak sesuai/);
});
test('six real historic sectors are never ranked; fictional four assets remain isolated',()=>{
 const result=buildDemoDecision({data,field:historical,sectorId:'west-breakwater',generatedAt:'2026-11-17T11:00:00.000Z'});
 assert.equal(result.decision.operationalRanking,'DATA_INSUFFICIENT');
 assert.equal(result.decision.rankedRealAssets,0);
 assert.deepEqual(result.historicalSector.cumulativeSettlementCm,[74,140]);
 assert.equal(result.syntheticAnnex.records.length,4);
 assert.equal(result.syntheticAnnex.records[0].score,6);
 assert.equal(result.syntheticAnnex.records[3].score,null);
 assert.equal(result.syntheticAnnex.policyCalibratedForRealAssets,false);
 assert.equal(result.stationPublication.isOnAssetMeasurement,false);
 assert.equal(result.stationPublication.sourceMode,'PUBLISHED_STATION_RESULT_NOT_BARUNA_MEASUREMENT');
});
test('user AOI stays indicative; no station observation is promoted to an asset measurement',()=>{
 const result=buildDemoDecision({data,field:historical,sectorId:'container-wharf',aoi:{id:'aoi-abcdefg',name:'AOI Test',workspaceId:'semarang-coastal',sourceStatus:'USER_DECLARED_UNVERIFIED',geometry:{type:'Polygon',coordinates:[]},boundarySource:'USER_DRAWN_UNVERIFIED'}});
 assert.equal(result.aoi.sourceMode,'USER_DECLARED_UNVERIFIED');
 assert.equal(result.historicalSector.operationalPriority,'DATA_INSUFFICIENT');
 assert.match(result.limitations.join(' '),/not direct measurements/);
});