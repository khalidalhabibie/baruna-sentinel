import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {INFRASTRUCTURE_CASES} from "./aoi-infrastructure-cases.js";
import {
 INFRA_WORKSPACES,groupForAoi,validateGroup,rankInfrastructureWorkspaces,
 rankInfrastructureAois,parsePublishedStations,nearestPublishedStation,aoiResearchDetail
} from "./workspace-ranking-model.js";
import {makeLocalBackup,parseLocalBackup} from "./aoi-local-backup.js";

const source=JSON.parse(readFileSync(new URL("../data/gnss-published-2023-stations.geojson",import.meta.url),"utf8"));
const stations=parsePublishedStations(source);
const evidence=(s1,s2)=>({schema:"baruna-aoi-evidence-check-v1",
 s1Grd:s1?[{id:"sentinel-1"}]:[],s2L2a:s2?[{id:"sentinel-2"}]:[]});
test("published scientific GNSS record has 20 unique historical source-traced stations",()=>{
 assert.equal(stations.length,20);
 assert.equal(stations[0].id,"CPKL");assert.equal(stations[0].verticalMmYear,-107);
 assert.equal(stations.find(x=>x.id==="CSEM").verticalMmYear,-0.8);
 assert.equal(stations.at(-1).id,"CTBN");
 assert.ok(stations.every(x=>x.historical&&!x.siteSpecificAssetMeasurement));
 assert.equal(new Set(stations.map(x=>x.id)).size,20);
});
test("GNSS source rejects provenance tampering, wrong period, duplicate stations, bad coordinates and false ranks",()=>{
 assert.throws(()=>parsePublishedStations({...source,metadata:{...source.metadata,source_doi:"fake"}}),/invalid/);
 assert.throws(()=>parsePublishedStations({...source,features:source.features.slice(0,19)}),/invalid/);
 const bad=structuredClone(source);bad.features[1].properties.station=bad.features[0].properties.station;
 assert.throws(()=>parsePublishedStations(bad),/invalid/);
 const corrupt=structuredClone(source);corrupt.features[0].geometry.coordinates=[0,0];
 assert.throws(()=>parsePublishedStations(corrupt),/invalid/);
 const rank=structuredClone(source);rank.features[0].properties.rank_by_descending_rate=20;
 assert.throws(()=>parsePublishedStations(rank),/invalid/);
});
test("Semarang infrastructure examples belong to distinct sub-workspaces",()=>{
 assert.equal(INFRA_WORKSPACES.length,4);
 assert.deepEqual(INFRASTRUCTURE_CASES.map(groupForAoi),["port-logistics","industrial-coastal","transport-corridors"]);
 assert.equal(groupForAoi({...INFRASTRUCTURE_CASES[0],infraWorkspaceId:undefined}),"semarang-general");
 assert.throws(()=>validateGroup("jakarta-coastal"),/dikenal/);
});
test("workspace ranking only compares catalog coverage, ignores regional GNSS velocities",()=>{
 const items=[
  {...INFRASTRUCTURE_CASES[0],lastEvidenceCheck:evidence(true,true)},
  {...INFRASTRUCTURE_CASES[1],lastEvidenceCheck:evidence(true,false)},
  {...INFRASTRUCTURE_CASES[2],lastEvidenceCheck:null}
 ];
 const workspace=rankInfrastructureWorkspaces(items);
 assert.deepEqual(workspace.map(x=>x.id),["port-logistics","industrial-coastal","transport-corridors"]);
 assert.deepEqual(workspace.map(x=>x.rank),[1,2,null]);
 assert.deepEqual(workspace.map(x=>x.coverage),[1,.5,0]);
 assert.ok(workspace.every(x=>x.riskRank===null&&x.riskRankingEligible===false));
 const areas=rankInfrastructureAois(items);
 assert.deepEqual(areas.map(x=>x.rank),[1,2,null]);
 assert.equal(rankInfrastructureAois(items,"port-logistics").length,1);
 assert.throws(()=>rankInfrastructureAois(items,"fake-workspace"),/dikenal/);
});
test("equal catalog coverage ties, missing checks never receive a fake rank",()=>{
 const items=[
  {...INFRASTRUCTURE_CASES[0],lastEvidenceCheck:evidence(true,false)},
  {...INFRASTRUCTURE_CASES[1],lastEvidenceCheck:evidence(false,true)},
  {...INFRASTRUCTURE_CASES[2],lastEvidenceCheck:null}
 ];
 const rows=rankInfrastructureAois(items);
 assert.deepEqual(rows.map(x=>x.rank),[1,1,null]);
 assert.ok(rows.every(x=>x.riskRank===null));
});
test("nearest station is distance-only and never becomes infrastructure velocity",()=>{
 const aoi=INFRASTRUCTURE_CASES[0];
 const nearest=nearestPublishedStation(aoi,stations);
 assert.equal(nearest.id,"CSEM");
 assert.ok(nearest.distanceKm>1&&nearest.distanceKm<15);
 assert.equal(nearest.usableAsAssetDisplacement,false);
 const d=aoiResearchDetail(aoi,stations);
 assert.equal(d.hasSiteSpecificValidatedInSar,false);
 assert.equal(d.operationalRiskRank,null);
 assert.equal(d.operationalDeformationRank,null);
 assert.equal(d.nearestStation.id,"CSEM");
});
test("AOI workspace membership survives local JSON backup/restore",()=>{
 const b=makeLocalBackup(INFRASTRUCTURE_CASES);
 const data=parseLocalBackup(JSON.stringify(b));
 assert.deepEqual(data.map(groupForAoi),["port-logistics","industrial-coastal","transport-corridors"]);
 assert.ok(data.every(x=>x.boundarySource==="ILLUSTRATIVE_BOUNDARY_UNVERIFIED"));
});
