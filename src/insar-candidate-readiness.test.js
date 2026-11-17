import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateInsarCandidateReview,insarSnapshotForExport} from "./insar-candidate-readiness.js";

const file=JSON.parse(readFileSync(new URL("../data/semarang-s1-insar-candidate-review.json",import.meta.url),"utf8"));
const alter=(func)=>{const d=structuredClone(file);func(d);return d;};

test("uploaded discovery candidate snapshot has source-labelled counts and sample coverage",()=>{
 const d=validateInsarCandidateReview(file);
 assert.equal(d.matchingScenes,19);
 assert.equal(d.candidatePairs,48);
 assert.equal(d.samplePairs.length,5);
 assert.ok(d.samplePairs.every(p=>p.pairStatus==="CANDIDATE_ONLY_BURST_BASELINE_UNVERIFIED"));
 assert.match(d.source,/IW SLC/);
 assert.deepEqual(d.aoiEpsg4326,[110.375,-7.025,110.485,-6.875]);
});

test("report includes only discovery metadata with no displacement claims",()=>{
 const outcome=insarSnapshotForExport(file);
 assert.equal(outcome.status,"SLC_METADATA_CANDIDATES_ONLY");
 assert.equal(outcome.insarDisplacementProduced,false);
 assert.equal(outcome.annualSubsidenceMeasured,false);
 assert.equal(outcome.operationalAssetRankingAllowed,false);
 assert.equal(outcome.burstAndBaselineVerified,false);
 assert.ok(!JSON.stringify(file).includes("receiverCoordinates"));
 assert.ok(!JSON.stringify(file).includes("big_demnas_geotiff"));
});

test("reject true displacement, fabricated scientific readiness and impossible pairs",()=>{
 assert.throws(()=>validateInsarCandidateReview(alter(d=>d.scientificGates.insarDisplacementProduced=true)),/scientific gates/);
 assert.throws(()=>validateInsarCandidateReview(alter(d=>d.verifiedProcessing.coherence=true)),/scientific gates/);
 assert.throws(()=>validateInsarCandidateReview(alter(d=>d.samplePairs[0].daysApart=300)),/pair metadata/);
 assert.throws(()=>validateInsarCandidateReview(alter(d=>d.samplePairs[0].pairStatus="VALIDATED_INSAR")),/pair metadata/);
 assert.throws(()=>validateInsarCandidateReview(alter(d=>d.samplePairs[0].secondaryScene=d.samplePairs[0].referenceScene)),/pair metadata/);
 assert.throws(()=>validateInsarCandidateReview(alter(d=>d.samplePairCount=48)),/candidate counts/);
 assert.throws(()=>validateInsarCandidateReview(alter(d=>d.aoiEpsg4326=[0,0,1,1])),/identity/);
});

test("unavailable discovery stays unavailable in exported report",()=>{
 assert.deepEqual(insarSnapshotForExport(null),{status:"UNAVAILABLE",insarDisplacementProduced:false});
});
