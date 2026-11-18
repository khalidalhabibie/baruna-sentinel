import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateInsarNetwork,insarReadinessSummary,renderInsarNetwork} from "./insar-network-readiness.js";

const snapshot=JSON.parse(readFileSync(new URL("../data/semarang-asf-burst-network-20261118.json",import.meta.url),"utf8"));
const priorQA=JSON.parse(readFileSync(new URL("../data/semarang-real-hyp3-insar-qa.json",import.meta.url),"utf8"));
const change=fn=>{const copy=structuredClone(snapshot);fn(copy);return copy;};

test("public ASF live snapshot has source-labelled nine bursts and connected temporal candidates, not deformation",()=>{
 const doc=validateInsarNetwork(snapshot);
 const summary=insarReadinessSummary(doc,priorQA);
 assert.equal(summary.status,"METADATA_NETWORK_ONLY");
 assert.equal(summary.acquisitions,9);
 assert.equal(summary.adjacentCandidatePairs,8);
 assert.equal(summary.aoiCenterFootprintCount,3);
 assert.equal(summary.priorSinglePairQaSummaries,1);
 assert.equal(summary.portQualifiedWithin500m,0);
 assert.equal(summary.portPixelsWithin500m,122);
 assert.equal(summary.originalZipReverified,false);
 assert.equal(summary.multiTemporalLosValidated,false);
 assert.equal(summary.annualSubsidenceMmYear,null);
 assert.equal(summary.infrastructureRiskRank,null);
 assert.deepEqual(summary.candidateEdges.map(x=>x.gap),[12,12,12,12,12,12,12,24]);
});

test("fail closed on false orbit identity and unsupported risk/deformation claims",()=>{
 for(const mutate of [
  d=>{d.sourceQuery="https://unknown.example/api";},
  d=>{d.sourceResponseHttpStatus=404;},
  d=>{d.source="SYNTHETIC";},
  d=>{d.retrievedOn="2026-11-19";},
  d=>{d.targetFullBurstID="127_272740_IW1";},
  d=>{d.platform="SENTINEL-1C";},
  d=>{d.scenes[0].sceneName="FAKE_SCENE";},
  d=>{d.scenes[0].date="2026-07-23";},
  d=>{d.scenes[0].fullBurstID="127_272740_IW1";},
  d=>{d.scenes[1].sceneName=d.scenes[0].sceneName;},
  d=>{d.adjacentCandidatePairs[0].daysApart=100;},
  d=>{d.adjacentCandidatePairs[0].baselineValidated=true;},
  d=>{d.adjacentCandidatePairs[0].processedInterferogram=true;},
  d=>{d.network.geodeticProcessingNetworkVerified=true;},
  d=>{d.footprintAssessment.centers[0].footprintsContainingCenter=0;},
  d=>{d.footprintAssessment.centers[0].aoiId="fake";},
  d=>{d.scienceGates.perpendicularBaselineValidated=true;},
  d=>{d.scienceGates.timeSeriesProcessed=true;},
  d=>{d.scienceGates.displacementValidated=true;},
  d=>{d.scienceGates.annualVerticalRateAvailable=true;},
  d=>{d.scienceGates.assetRiskRankingAllowed=true;},
  d=>{d.existingProcessedPair.status="ZIP_VERIFIED";},
 ]){
  assert.throws(()=>validateInsarNetwork(change(mutate)),/ASF burst readiness rejected/);
 }
});

test("metadata network and previous HyP3 QA must use the exact same dates and job",()=>{
 const bad=structuredClone(priorQA);
 bad.source.jobId="not-the-real-job";
 assert.throws(()=>insarReadinessSummary(snapshot,bad),/Real HyP3 QA evidence rejected|ASF burst readiness rejected/);
 const wrong=change(d=>d.existingProcessedPair.referenceDate="2026-09-20");
 assert.throws(()=>insarReadinessSummary(wrong,priorQA),/ASF burst readiness rejected/);
});

test("DOM renderer displays honest staged evidence and eight edges, without numeric hazard",()=>{
 const nodes=new Map();
 const mk=()=>({textContent:"",children:[],replaceChildren(){this.children=[];},append(...els){this.children.push(...els);}});
 for(const id of ["rk-insar-status","rk-insar-count","rk-insar-edge-count","rk-insar-qa-count",
  "rk-insar-coverage","rk-insar-port","rk-insar-science","rk-insar-timeline"])nodes.set(id,mk());
 const dom={getElementById:id=>nodes.get(id),createElement:mk};
 const result=renderInsarNetwork(snapshot,priorQA,dom);
 assert.equal(result.acquisitions,9);
 assert.equal(nodes.get("rk-insar-count").textContent,"9");
 assert.equal(nodes.get("rk-insar-edge-count").textContent,"8");
 assert.equal(nodes.get("rk-insar-qa-count").textContent,"1");
 assert.match(nodes.get("rk-insar-status").textContent,/METADATA READY/);
 assert.match(nodes.get("rk-insar-port").textContent,/0\/122/);
 assert.match(nodes.get("rk-insar-science").textContent,/Belum ada time-series/);
 assert.equal(nodes.get("rk-insar-timeline").children.length,8);
 assert.ok(!JSON.stringify(result).includes("annualSubsidenceMmYear\":0"));
});
