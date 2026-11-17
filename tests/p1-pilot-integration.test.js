import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseAssetFeature,parseStationFeature,assessStationAssetProximity,
  demnasIdentifyRequest,validateDemnasIdentify,validateDemnasLocalPreview,
  inspectLocalCorsSummary,inspectProcessedPositionSeries,DEMNAS_SERVICE} from "../src/p1-pilot-integration.js";
// ALL POSITIONS and QC in this test are SYNTHETIC FIXTURES; no site claim.
const asset=()=>({type:"Feature",properties:{assetId:"TEST_ROAD_001",sourceReference:"TEST-ONLY contractor polygon"},
 geometry:{type:"Polygon",coordinates:[[[110.420,-6.956],[110.421,-6.956],[110.421,-6.955],[110.420,-6.955],[110.420,-6.956]]]}});
const station=()=>({type:"Feature",properties:{stationCode:"CSMG",sourceReference:"TEST-ONLY station coordinates"},
 geometry:{type:"Point",coordinates:[110.4215,-6.9555]}});
test("station/asset proximity is numeric, source-constrained and never establishes correlated ground movement",()=>{
 const a=parseAssetFeature(asset()),s=parseStationFeature(station());
 const d=assessStationAssetProximity(a,s);
 assert.ok(d.geometricProximityMeters>40&&d.geometricProximityMeters<70);
 assert.equal(d.result,"GEOMETRIC_PROXIMITY_ONLY");
 assert.equal(d.authoritativeAssetLink,false);
 assert.equal(d.canTransferStationVelocityToAsset,false);
 assert.equal(d.canIssueOperationalRanking,false);
 assert.equal(d.requiredProof.length,3);
 const inside=station();inside.geometry.coordinates=[110.4205,-6.9555];
 assert.equal(assessStationAssetProximity(a,parseStationFeature(inside)).geometricProximityMeters,0);
});
test("asset polygons reject invalid CRS, missing ID, unclosed geometry, self-intersection, wrong location",()=>{
 const noRef=asset();delete noRef.properties.sourceReference;
 assert.throws(()=>parseAssetFeature(noRef),/sourceReference/);
 const other=asset();other.crs={type:"name",properties:{name:"EPSG:3857"}};
 assert.throws(()=>parseAssetFeature(other),/WGS84/);
 const broken=asset();broken.geometry.coordinates[0][4]=[110.422,-6.956];
 assert.throws(()=>parseAssetFeature(broken),/tertutup/);
 const crossed=asset();crossed.geometry.coordinates=[[ [110.420,-6.956],[110.421,-6.955],[110.421,-6.956],[110.420,-6.955],[110.420,-6.956] ]];
 assert.throws(()=>parseAssetFeature(crossed),/self-intersection|Luas/);
 const far=asset();far.geometry.coordinates[0][1]=[120,-6.956];
 assert.throws(()=>parseAssetFeature(far),/cakupan Semarang/);
 const wrongStation=station();wrongStation.properties.stationCode="BAKO";
 assert.throws(()=>parseStationFeature(wrongStation),/CSEM\/CSMG/);
});
test("BIG DEMNAS official point identify rejects NoData 1.13427e38, never uses fallback Values array",()=>{
 const api=demnasIdentifyRequest(110.42,-6.955);assert.ok(api.startsWith(DEMNAS_SERVICE));
 assert.throws(()=>demnasIdentifyRequest(105,-6.955),/Semarang/);
 const response={value:"1.13427e+38",properties:{Values:["1.13427e+38","2.5"]},location:{x:110.42,y:-6.955,spatialReference:{wkid:4326}}};
 const res=validateDemnasIdentify(response,[110.42,-6.955]);
 assert.equal(res.status,"NODATA_OR_INVALID_RASTER_VALUE");
 assert.equal(res.valueMeters,null);
 assert.equal(res.canRankAsset,false);
 const yes={...response,value:"2.51"};
 const ok=validateDemnasIdentify(yes,[110.42,-6.955]);
 assert.equal(ok.valueMeters,2.51);
 assert.equal(ok.canCompareWithTidalDatum,false);
 assert.throws(()=>validateDemnasIdentify(yes,[110.43,-6.955]),/Koordinat/);
 assert.throws(()=>validateDemnasIdentify({...response,error:{code:500}}),/BIG ImageServer/);
});
test("user-supplied DEMNAS raster preview is accepted only with grounded SHA, bounded pixels, and explicit non-authenticity",()=>{
 const grid=Array.from({length:20},()=>Array(20).fill(null));
 for(let i=0;i<20;i++)grid[2][i]=1.25+i*.2;
 const x={schema:"baruna-demnas-local-raster-preview-v1",sourceMode:"USER_SUPPLIED_GEOTIFF_DERIVED_NOT_BIG_AUTHENTICATED",
  sourceSha256:"a".repeat(64),fileName:"TEST_FICTIONAL.tif",crs:"EPSG:4326",bboxWgs84:[110.375,-7.025,110.485,-6.875],
  originVerifiedByBig:false,canCompareTidalDatum:false,grid};
 const result=validateDemnasLocalPreview(x);
 assert.equal(result.validPixels,20);assert.equal(result.originVerifiedByBig,false);
 assert.equal(result.canMeasureSubsidence,false);assert.equal(result.canRankRealAsset,false);
 const injected=structuredClone(x);injected.grid[2][0]=1.13427e38;
 assert.throws(()=>validateDemnasLocalPreview(injected),/tidak valid/);
 const spoof=structuredClone(x);spoof.originVerifiedByBig=true;
 assert.throws(()=>validateDemnasLocalPreview(spoof),/tidak valid/);
 const empty=structuredClone(x);empty.grid=Array.from({length:20},()=>Array(20).fill(null));
 assert.throws(()=>validateDemnasLocalPreview(empty),/10 piksel/);
});
test("local CSEM/CSMG RINEX-derived QC cannot become a station position solution",()=>{
 const sample={method:"RINEX test fixture only",records:[{
  station:"csem",date:"2026-11-10",doy:314,epochs:2880,expected_full_day_30s_epochs:2880,
  long_gaps_gt30s:0,largest_gap_min:0,first_epoch_gps:"2026-11-10 00:00:00",last_epoch_gps:"2026-11-10 23:59:30",
  epochs_with_C1_by_constellation:{G:2880,R:2880,E:2880,S:0,"G+R+E":2880}
 }]};
 const x=inspectLocalCorsSummary(sample);
 assert.equal(x.totalEpochs,2880);
 assert.equal(x.hasPositionSolution,false);
 assert.equal(x.canEstimateCurrentVelocity,false);
 assert.equal(x.canLinkToAssets,false);
});
test("user-supplied two-day PPP output does NOT imply annual subsidence even if multiple GNSS declared",()=>{
 const sample={schema:"baruna-processed-multignss-station-series-v1",station:"CSEM",
  sourceMode:"USER_SUPPLIED_PPP_SOLUTIONS_NOT_SOURCE_VERIFIED",
  processing:{method:"PPP",referenceFrame:"ITRF2020 (test only)",processor:"External geodesist test",
   rinexArchiveSha256:"b".repeat(64),constellations:["GPS","Galileo"]},
  epochs:[{date:"2026-11-15",upMeters:0,sigmaUpMeters:.005},{date:"2026-11-16",upMeters:-.01,sigmaUpMeters:.005}]
 };
 const r=inspectProcessedPositionSeries(sample);
 assert.equal(r.status,"INSUFFICIENT_SPAN_OR_CONTINUITY");
 assert.equal(r.descriptiveSlopeMmYear,null);
 assert.equal(r.currentOperationalVelocityValidated,false);
 assert.equal(r.isOnAssetMeasurement,false);
 assert.equal(r.canIssueRealAssetRanking,false);
 const noMulti=structuredClone(sample);noMulti.processing.constellations=["GPS"];
 assert.throws(()=>inspectProcessedPositionSeries(noMulti),/multi-GNSS/);
 const duplicate=structuredClone(sample);duplicate.epochs[1].date=duplicate.epochs[0].date;
 assert.throws(()=>inspectProcessedPositionSeries(duplicate),/duplikat/);
});
test("pilot integration UI is a separate, source-honest static route rather than fabricated output",()=>{
 const html=readFileSync(new URL("../pilot-data-lab.html",import.meta.url),"utf8");
 const build=readFileSync(new URL("../scripts/build-static.mjs",import.meta.url),"utf8");
 for(const id of ["p1-qc-file","p1-position-file","p1-demnas-check","p1-demnas-file","p1-station-file","p1-asset-file","p1-export"])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/DATA INSUFFICIENT/);
 assert.match(html,/geometri/i);
 assert.match(build,/"pilot-data-lab.html"/);
 assert.match(build,/"src\/p1-pilot-integration.js"/);
 assert.match(build,/"src\/p1-pilot-ui.js"/);
});
