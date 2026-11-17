import test from 'node:test';
import assert from 'node:assert/strict';
import {historyEvent,appendHistory,choosePublishedCatalog,MAX_AOI_MONITOR_EVENTS} from '../src/aoi-monitor-client.js';
const snapshot={schema:'baruna-aoi-evidence-check-v1',checkedAt:'2026-11-17T02:30:00Z',sourceSnapshotAsOf:'2026-11-16',s1Grd:[{id:'A'}],s2L2a:[],catalogGeneratedUtc:'2026-11-16T00:00:00Z'};
test('history is source-only and deduplicates same published snapshot',()=>{
 const event=historyEvent(snapshot,{isBaseline:true,newTotal:0});
 assert.equal(event.isPhysicalChange,false);
 assert.equal(appendHistory([event],event).length,1);
 assert.throws(()=>appendHistory([],{...event,isPhysicalChange:true}));
});
test('browser-local history is capped and newest first',()=>{
 let events=[];
 for(let i=0;i<50;i++)events=appendHistory(events,{...historyEvent(snapshot,{newTotal:i}),catalogGeneratedUtc:String(i)});
 assert.equal(events.length,MAX_AOI_MONITOR_EVENTS);assert.equal(events[0].catalogGeneratedUtc,'49');
});
test('no fake monitoring when source has NOT_RUN or corrupt scene schema',()=>{
 const legacy={schema:'baruna-real-scene-index-v1',scenes:[[1,'S1','2026-11-11',null,[]]],sourceMode:'REAL_CATALOG_METADATA_ONLY'};
 const readiness={schema:'baruna-real-evidence-readiness-v1',asOf:'2026-11-16'};
 const recent={status:'NOT_RUN',scenes:[],sourceEndpoint:'https://stac.dataspace.copernicus.eu/v1/search'};
 assert.equal(choosePublishedCatalog(recent,legacy,readiness).publication,'BASELINE_STATIC_CATALOG');
 const good={schema:'baruna-real-scene-index-v1',status:'READY',sourceMode:'REAL_CATALOG_METADATA_ONLY_NOT_SATELLITE_PIXELS_NOT_INSAR',
  scenes:legacy.scenes,generatedUtc:'2026-11-17T00:00:00Z',sourceEndpoint:'https://stac.dataspace.copernicus.eu/v1/search',
  aoiEpsg4326:[110.375,-7.025,110.485,-6.875]};
 assert.equal(choosePublishedCatalog(good,legacy,readiness).readiness.asOf,'2026-11-17');
 assert.equal(choosePublishedCatalog({...good,sourceEndpoint:'https://evil.example'},legacy,readiness).publication,'BASELINE_STATIC_CATALOG');
});