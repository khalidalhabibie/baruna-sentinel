/**
 * BARUNA multi-scope research ranking.
 * Workspaces here are *Semarang infrastructure sub-workspaces*, not
 * cross-city scientific comparisons. Do not infer asset displacement/risk.
 */
export const INFRA_WORKSPACES=Object.freeze([
 Object.freeze({id:"port-logistics",name:"Port & Logistics",description:"Pelabuhan dan fasilitas logistik"}),
 Object.freeze({id:"industrial-coastal",name:"Coastal Industry",description:"Kawasan industri dan pergudangan"}),
 Object.freeze({id:"transport-corridors",name:"Transport Corridors",description:"Jalan akses dan konektivitas"}),
 Object.freeze({id:"semarang-general",name:"Other Semarang AOIs",description:"Area kajian lain di Semarang"})
]);
export const DEFAULT_INFRA_WORKSPACE="semarang-general";
const known=new Set(INFRA_WORKSPACES.map(x=>x.id));
export function groupForAoi(record){
 return known.has(record?.infraWorkspaceId)?record.infraWorkspaceId:DEFAULT_INFRA_WORKSPACE;
}
export function validateGroup(value){
 if(!known.has(value))throw new RangeError("Workspace infrastruktur tidak dikenal.");
 return value;
}
export function groupName(id){return INFRA_WORKSPACES.find(x=>x.id===id)?.name||"Other Semarang AOIs";}
export function catalogCategories(record){
 const c=record?.lastEvidenceCheck;
 if(c?.schema!=="baruna-aoi-evidence-check-v1")return {checked:false,count:0,s1:false,s2:false};
 const s1=Array.isArray(c.s1Grd)&&c.s1Grd.length>0;
 const s2=Array.isArray(c.s2L2a)&&c.s2L2a.length>0;
 return {checked:true,count:Number(s1)+Number(s2),s1,s2};
}
function orderedRanks(entries){
 const result=[...entries].sort((a,b)=>b.coverage-a.coverage||b.checkedCount-a.checkedCount||a.name.localeCompare(b.name,"id"));
 let rank=0,previousKey=null;
 return result.map((row,i)=>{
  const eligible=row.coverage>0;
  const key=String(row.coverage);
  if(eligible&&key!==previousKey){rank=i+1;previousKey=key;}
  return {...row,rank:eligible?rank:null,rankingType:"CATALOG_COVERAGE_NOT_ASSET_RISK",riskRank:null};
 });
}
/** Across sub-workspaces: fraction of catalog categories present per AOI. */
export function rankInfrastructureWorkspaces(records){
 if(!Array.isArray(records))throw new TypeError("AOI registry must be an array");
 const groups=INFRA_WORKSPACES.map(w=>{
  const subset=records.filter(r=>groupForAoi(r)===w.id);
  const scans=subset.map(catalogCategories);
  const checks=scans.filter(x=>x.checked).length;
  const count=scans.reduce((sum,x)=>sum+x.count,0);
  return {id:w.id,name:w.name,description:w.description,areaCount:subset.length,
   checkedCount:checks,sourceCategoriesFound:count,
   sourceCategoriesPossible:subset.length*2,
   coverage:subset.length?count/(subset.length*2):0,
   geodeticStatus:"NO_SITE_SPECIFIC_MOTION_ESTIMATE",
   riskRankingEligible:false};
 });
 return orderedRanks(groups.filter(r=>r.areaCount>0));
}
/** Inside one workspace, or across all Semarang AOIs: only catalog presence. */
export function rankInfrastructureAois(records,group="all"){
 if(!Array.isArray(records))throw new TypeError("AOI registry must be an array");
 if(group!=="all")validateGroup(group);
 const subset=group==="all"?records:records.filter(x=>groupForAoi(x)===group);
 const entries=subset.map(x=>{
  const c=catalogCategories(x);
  return {id:x.id,name:x.name,workspaceId:groupForAoi(x),
   areaKm2:x.geometry?.areaKm2??null,
   checked:c.checked,checkedCount:Number(c.checked),sourceCategoriesFound:c.count,
   coverage:c.count/2,explanation:c.checked?c.count+"/2 sumber metadata katalog":"Belum check evidence",
   geodeticStatus:"STATION_CONTEXT_ONLY_NOT_ASSET_VELOCITY",riskRankingEligible:false};
 });
 return orderedRanks(entries);
}
function fail(message){throw new TypeError("GNSS publication data invalid: "+message);}
export function parsePublishedStations(doc){
 if(doc?.type!=="FeatureCollection"||
    doc.metadata?.source_doi!=="10.1038/s41597-023-02274-0"||
    doc.metadata?.dataset_doi!=="10.5281/zenodo.7775016"||
    doc.metadata?.source_table!=="Table 2"||
    doc.metadata?.validity!=="HISTORICAL_PUBLISHED_2010_2021"||
    !Array.isArray(doc.features)||doc.features.length!==20)
  fail("source and publication provenance");
 const seen=new Set(),rankSet=new Set();
 const out=doc.features.map(feature=>{
  const p=feature.properties,coords=feature.geometry?.coordinates;
  if(feature.geometry?.type!=="Point"||!Array.isArray(coords)||coords.length!==2||
   coords.some(n=>typeof n!=="number"||!Number.isFinite(n))||
   coords[0]<95||coords[0]>145||coords[1]< -11||coords[1]>7)fail("station coordinates");
  if(!/^[A-Z]{4}$/.test(p?.station||"")||seen.has(p.station))fail("station ID");
  seen.add(p.station);
  if(!Number.isFinite(p.vertical_velocity_mm_year)||
   Math.abs(p.vertical_velocity_mm_year)>1000||
   !Number.isFinite(p.published_uncertainty_mm_year)||
   p.published_uncertainty_mm_year<0||p.published_uncertainty_mm_year>100||
   p.observation_period!=="2010-2021"||
   p.source_doi!=="10.1038/s41597-023-02274-0"||
   !Number.isInteger(p.rank_by_descending_rate)||
   p.rank_by_descending_rate<1||p.rank_by_descending_rate>20||
   rankSet.has(p.rank_by_descending_rate))fail("published station attributes");
  rankSet.add(p.rank_by_descending_rate);
  return Object.freeze({
   id:p.station,rank:p.rank_by_descending_rate,
   verticalMmYear:p.vertical_velocity_mm_year,
   publishedUncertaintyMmYear:p.published_uncertainty_mm_year,
   longitude:coords[0],latitude:coords[1],
   period:"2010–2021",sourceDoi:p.source_doi,
   historical:true,siteSpecificAssetMeasurement:false
  });
 });
 out.sort((a,b)=>a.verticalMmYear-b.verticalMmYear||a.id.localeCompare(b.id));
 for(let i=0;i<out.length;i++)if(out[i].rank!==i+1)fail("rank order inconsistent with published values");
 return out;
}
function haversineKm(lat1,lon1,lat2,lon2){
 const rad=Math.PI/180;
 const a=Math.sin((lat2-lat1)*rad/2)**2+
  Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin((lon2-lon1)*rad/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
/** A proximity lookup, NOT a model of deformational representativeness. */
export function nearestPublishedStation(aoi,stations){
 const bbox=aoi?.geometry?.bbox;
 if(!Array.isArray(bbox)||bbox.length!==4||
   bbox.some(x=>typeof x!=="number"||!Number.isFinite(x))||
   !Array.isArray(stations)||!stations.length)return null;
 const lat=(bbox[1]+bbox[3])/2,lon=(bbox[0]+bbox[2])/2;
 const nearest=stations.map(s=>({...s,distanceKm:haversineKm(lat,lon,s.latitude,s.longitude)}))
  .sort((a,b)=>a.distanceKm-b.distanceKm)[0];
 return {...nearest,referencePoint:"AOI bounding-box center",proximityOnly:true,
  usableAsAssetDisplacement:false,usableAsRiskRank:false};
}
export function aoiResearchDetail(aoi,stations){
 if(!aoi)return null;
 return {
  name:aoi.name,workspace:groupName(groupForAoi(aoi)),
  boundary:"UNVERIFIED_USER_OR_ILLUSTRATIVE",
  catalog:catalogCategories(aoi),nearestStation:nearestPublishedStation(aoi,stations),
  hasSiteSpecificValidatedInSar:false,hasOnAssetGnssSolution:false,
  operationalDeformationRank:null,operationalRiskRank:null,
  needs:[
   "InSAR multitemporal tergeoreferensi yang valid pada AOI",
   "Referensi GNSS/levelling sebanding beserta periode dan ketidakpastian",
   "Batas aset dan data paparan tervalidasi untuk ranking risiko"
  ]
 };
}
