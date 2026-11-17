/** Browser-local AOI monitoring history + verified public catalogue preference. */
export const MAX_AOI_MONITOR_EVENTS=20;
export function historyEvent(snapshot,change,origin='BROWSER_MANUAL'){
 if(snapshot?.schema!=='baruna-aoi-evidence-check-v1'||!Array.isArray(snapshot.s1Grd)||!Array.isArray(snapshot.s2L2a))
  throw new TypeError('Expected validated AOI evidence check');
 return {schema:'baruna-aoi-monitor-run-v1',checkedAt:snapshot.checkedAt,
  sourceAsOf:snapshot.sourceSnapshotAsOf,catalogGeneratedUtc:snapshot.catalogGeneratedUtc||null,
  s1Count:snapshot.s1Grd.length,s2Count:snapshot.s2L2a.length,
  newSceneCount:change?.newTotal||0,isBaseline:change?.isBaseline===true,
  mode:'CATALOG_METADATA_ONLY',origin,isPhysicalChange:false};
}
export function appendHistory(history,event){
 if(!Array.isArray(history))history=[];
 if(event?.schema!=='baruna-aoi-monitor-run-v1'||event.isPhysicalChange!==false)
  throw new TypeError('Only source-catalogue monitoring events allowed');
 if(event.catalogGeneratedUtc&&history[0]?.catalogGeneratedUtc===event.catalogGeneratedUtc)
  return history.slice(0,MAX_AOI_MONITOR_EVENTS);
 return [event,...history].slice(0,MAX_AOI_MONITOR_EVENTS);
}
export function choosePublishedCatalog(recent,legacy,readiness){
 if(!legacy||legacy.schema!=='baruna-real-scene-index-v1'||!Array.isArray(legacy.scenes)||!legacy.scenes.length)
  throw new Error('Snapshot historis sumber tidak valid');
 if(!readiness||!readiness.asOf)throw new Error('Metadata readiness sumber invalid');
 const ready=recent?.status==='READY'&&recent?.schema==='baruna-real-scene-index-v1'&&
  Array.isArray(recent.scenes)&&recent.scenes.length>0&&typeof recent.generatedUtc==='string'&&
  Number.isFinite(Date.parse(recent.generatedUtc))&&recent.sourceEndpoint==='https://stac.dataspace.copernicus.eu/v1/search'&&
  JSON.stringify(recent.aoiEpsg4326)==='[110.375,-7.025,110.485,-6.875]'&&
  String(recent.sourceMode).includes('REAL_CATALOG_METADATA_ONLY')&&recent.scenes.length<=1000;
 if(ready)return {catalog:recent,readiness:{...readiness,asOf:recent.generatedUtc.slice(0,10)},
  publication:'SCHEDULED_CDSE_STAC_SNAPSHOT',generatedUtc:recent.generatedUtc};
 return {catalog:legacy,readiness,publication:'BASELINE_STATIC_CATALOG',generatedUtc:null};
}