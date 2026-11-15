import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAssetGeoJSON,assessImportedAssets,makeAssetIntakePrint,
  EXAMPLE_ASSETS,ASSET_TEMPLATE,MAX_ASSET_FEATURES
} from "./asset-evidence.js";
import {PUBLISHED_CORS_CONTRAST,publishedCorsComparison} from "./published-cors.js";
const feature=(id,coords=[110.4243,-6.94776],extras={})=>({
  type:"Feature",
  properties:{asset_id:id,asset_name:"Port example "+id,...extras},
  geometry:{type:"Point",coordinates:coords}
});
const collection=features=>({type:"FeatureCollection",features});
test("published 2021–2023 CSMG/CSEM PPP contrast is station-only and not the 2010–2021 OLS input",()=>{
 const result=publishedCorsComparison();
 assert.equal(result.period,"2021–2023");
 assert.equal(result.csmg.verticalMmYr,-94.03);
 assert.equal(result.csem.verticalMmYr,3.23);
 assert.equal(result.stationRateContrastMmYr,97.26);
 assert.equal(result.assetDisplacementInferred,false);
 assert.equal(result.comparableToCsem2010To2021Ols,false);
 assert.equal(result.comparableToBako2025Qc,false);
 assert.throws(()=>publishedCorsComparison({...PUBLISHED_CORS_CONTRAST,period:"2026"}),TypeError);
});
test("a real user-declared GeoJSON polygon is mapped but never treated as an asset displacement measurement",()=>{
 const doc=collection([{
  type:"Feature",
  properties:{asset_id:"asset_1",asset_name:"Authorized coastal asset",criticality:"high",
    exposure:"high",geometry_source:"User survey file",survey_date:"2025-08-03"},
  geometry:{type:"Polygon",coordinates:[[
    [110.42,-6.95],[110.425,-6.95],[110.425,-6.947],[110.42,-6.947],[110.42,-6.95]
  ]]}
 }]);
 const parsed=parseAssetGeoJSON(JSON.stringify(doc));
 assert.equal(parsed.featureCount,1);
 assert.equal(parsed.features[0].geometryType,"Polygon");
 assert.equal(parsed.features[0].criticality,"high");
 const assessed=assessImportedAssets(parsed);
 assert.equal(assessed.importedAssetCount,1);
 assert.equal(assessed.operationallyRankableAssets,0);
 assert.equal(assessed.spatialLinkageEstablished,0);
 assert.equal(assessed.records[0].canIssueOperationalOrder,false);
 assert.equal(assessed.records[0].decision,"DATA_INSUFFICIENT");
 assert.ok(assessed.records[0].proximityKm>0);
 assert.match(assessed.records[0].distanceMethod,/envelope centre/);
 assert.ok(assessed.records[0].gaps.some(x=>x.includes("on-asset")||x.includes("representative")));
 assert.ok(assessed.records[0].gaps.some(x=>x.includes("criticality")));
 assert.ok(assessed.records[0].gaps.some(x=>x.includes("exposure")));
});
test("source fields and names do not bypass quality gates or execute in HTML print",()=>{
 const parsed=parseAssetGeoJSON(collection([feature("malicious",[110.42,-6.9],{
  asset_name:"<script>alert(1)</script>",criticality:"high",
  exposure:"high",data_owner:"an operator"
 })]));
 const assessed=assessImportedAssets(parsed);
 assert.equal(assessed.operationallyRankableAssets,0);
 const print=makeAssetIntakePrint(assessed);
 assert.match(print,/&lt;script&gt;/);
 assert.doesNotMatch(print,/<script>/);
 assert.match(print,/No operational ranking permitted/);
});
test("synthetic examples are always distinctly labelled and blocked",()=>{
 const parsed=parseAssetGeoJSON(EXAMPLE_ASSETS,{synthetic:true});
 assert.equal(parsed.mode,"SYNTHETIC_GEOJSON_EXERCISE");
 assert.equal(parsed.featureCount,3);
 assert.ok(parsed.features.every(x=>x.sourceStatus==="SYNTHETIC_EXAMPLE"));
 assert.ok(assessImportedAssets(parsed).records.every(x=>!x.canIssueOperationalOrder));
 assert.equal(ASSET_TEMPLATE.features.length,0);
});
test("reject invalid CRS, geometry, duplicate identifiers and malformed coordinates",()=>{
 const good=collection([feature("aa")]);
 assert.equal(parseAssetGeoJSON(good).features[0].id,"aa");
 assert.throws(()=>parseAssetGeoJSON({...good,crs:{type:"name",properties:{name:"EPSG:3857"}}}),/WGS84/);
 assert.throws(()=>parseAssetGeoJSON(collection([feature("aa"),feature("aa")])),/unique/);
 assert.throws(()=>parseAssetGeoJSON(collection([feature("aa",[NaN,-6.9])])),/Invalid WGS84/);
 assert.throws(()=>parseAssetGeoJSON(collection([feature("aa",[110.4,91])])),/Invalid WGS84/);
 assert.throws(()=>parseAssetGeoJSON(collection([{
  ...feature("aa"),geometry:{type:"LineString",coordinates:[[110.4,-6.9],[110.5,-6.8]]}
 }])),/Supported asset types/);
 assert.throws(()=>parseAssetGeoJSON(collection([{
  ...feature("aa"),geometry:{type:"Polygon",coordinates:[[
    [110.4,-6.9],[110.5,-6.9],[110.5,-6.8],[110.4,-6.8]
  ]]}
 }])),/closed/);
 assert.throws(()=>parseAssetGeoJSON(collection([])),/1–50/);
 assert.throws(()=>parseAssetGeoJSON(collection(Array.from({length:MAX_ASSET_FEATURES+1},(_,i)=>feature("id"+i)))),/1–50/);
 assert.throws(()=>parseAssetGeoJSON("{not json"),/Invalid GeoJSON syntax/);
 assert.throws(()=>parseAssetGeoJSON(collection([feature("x")])),/unique asset_id/);
});
