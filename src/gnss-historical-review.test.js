import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 HISTORICAL_GNSS_REVIEW_SOURCE,
 validateHistoricalGnssReview,
 renderHistoricalGnssReview
} from "./gnss-historical-review.js";

const doc=JSON.parse(readFileSync(new URL("../data/gnss-historical-csem-cpkl-review.json",import.meta.url),"utf8"));
const clone=()=>structuredClone(doc);

test("historical CSEM and CPKL are verified research evidence with separately labeled secondary fits",()=>{
 const result=validateHistoricalGnssReview(doc);
 assert.equal(HISTORICAL_GNSS_REVIEW_SOURCE,"./data/gnss-historical-csem-cpkl-review.json");
 assert.equal(result.stations.length,2);
 assert.equal(result.period,"2010–2021");
 assert.equal(result.stations[0].id,"CSEM");
 assert.equal(result.stations[0].observedEpochs,3561);
 assert.equal(result.stations[0].reproducedSeasonalOlsVerticalMmYr,-0.728);
 assert.equal(result.stations[0].publishedVerticalMmYr,-0.8);
 assert.equal(result.stations[1].id,"CPKL");
 assert.equal(result.stations[1].observedEpochs,3989);
 assert.equal(result.stations[1].reproducedSeasonalOlsVerticalMmYr,-115.938);
 assert.equal(result.stations[1].publishedVerticalMmYr,-107);
 assert.equal(result.stations[1].benchmarkGapMmYr,-8.938);
 assert.equal(result.scientificValidated,false);
 assert.equal(result.currentYearMotionAvailable,false);
 assert.equal(result.assetRiskRankingAvailable,false);
});

test("render includes separate study/OLS labels, provenance links and unresolved CPKL caveat",()=>{
 const html=renderHistoricalGnssReview(validateHistoricalGnssReview(doc));
 assert.match(html,/CSEM/);
 assert.match(html,/CPKL/);
 assert.match(html,/−0,728/);
 assert.match(html,/−115,938/);
 assert.match(html,/Selisih belum terselesaikan/);
 assert.match(html,/Publikasi/);
 assert.match(html,/OLS BARUNA/);
 assert.match(html,/2010–2021/);
 assert.match(html,/bukan deformasi tahun 2026/);
 assert.match(html,/dataset Zenodo/i);
 assert.match(html,/github\.com\/khalidalhabibie\/sentinel-helpes/);
 assert.doesNotMatch(html,/current ground movement confirmed/i);
});

test("fail closed if any station/source identity, time period or science gates are modified",()=>{
 for(const mutation of [
  d=>{d.scientificValidated=true;},
  d=>{d.independentlyValidated2026Velocity=true;},
  d=>{d.operationalAssetRiskRankingAvailable=true;},
  d=>{d.evidenceType="LIVE_REALTIME_GNSS";},
  d=>{d.historicalPeriod="2026";},
  d=>{d.source.paperDoi="forged";},
  d=>{d.source.uncertaintiesComparable=true;},
  d=>{d.stations[0].id="CSMG";},
  d=>{d.stations[0].observedEpochs=3600;},
  d=>{d.stations[0].sourceMd5="bad";},
  d=>{d.stations[1].publishedVerticalMmYr=-115.938;},
  d=>{d.stations[1].reproducedSeasonalOlsVerticalMmYr=-107;},
  d=>{d.stations[1].comparisonStatus="MATCHED";},
  d=>{d.stations.pop();},
  d=>{d.stations[1].benchmarkGapMmYr=0;}
 ]){
  const changed=clone();mutation(changed);
  assert.throws(()=>validateHistoricalGnssReview(changed),/GNSS historical research provenance rejected/);
 }
});

test("render escapes untrusted text, and cannot be called with a validated-current-motion flag",()=>{
 const result=validateHistoricalGnssReview(doc);
 const station=Object.freeze({...result.stations[0],stationName:'<img src=x onerror=alert(1)>'});
 const html=renderHistoricalGnssReview({...result,stations:[station,result.stations[1]]});
 assert.doesNotMatch(html,/<img/);
 assert.match(html,/&lt;img/);
 assert.throws(()=>renderHistoricalGnssReview({...result,scientificValidated:true}),/provenance rejected/);
});
