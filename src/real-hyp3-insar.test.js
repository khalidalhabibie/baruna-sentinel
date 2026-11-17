import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateRealInsarQa,insarQaSnapshotForExport} from "./real-hyp3-insar.js";

const original=JSON.parse(readFileSync(new URL("../data/semarang-real-hyp3-insar-qa.json",import.meta.url),"utf8"));
const changed=modifier=>{
 const doc=structuredClone(original);
 modifier(doc);
 return doc;
};

test("authentic HyP3 evidence is represented without annual subsidence claims",()=>{
 const doc=validateRealInsarQa(original);
 assert.equal(doc.source.jobId,"a96410b0-1418-4e8b-a191-ab6f40e3e615");
 assert.equal(doc.source.spatialResolutionMeters,80);
 assert.equal(doc.studyArea.totalPixels,31464);
 assert.equal(doc.studyArea.candidatePixelsCoherenceAtLeast07,15105);
 assert.equal(doc.studyArea.landWithValidUnwrappedPhaseAndCoherence,16542);
 assert.equal(doc.portLocator.qualified500m,0);
 assert.equal(doc.portLocator.unwrappedPhaseRadians,null);
 assert.equal(doc.scientificGates.verifiedVerticalSubsidence,false);
 assert.equal(doc.scientificGates.assetRiskRankingAllowed,false);
});

test("export explicitly blocks final LOS displacement, annual mm/year and risk",()=>{
 const exportDoc=insarQaSnapshotForExport(original);
 assert.equal(exportDoc.status,"REAL_HYP3_PROCESSED_RESEARCH_SCREENING_ONLY");
 assert.equal(exportDoc.annualVerticalSubsidenceRate,null);
 assert.equal(exportDoc.validatedPortLOSDisplacement,null);
 assert.equal(exportDoc.assetRiskRankingAllowed,false);
 assert.equal(exportDoc.candidatePctOfValidLandPhase,91.31);
 assert.equal(exportDoc.portUnwrappedPhaseRadians,null);
 assert.equal(insarQaSnapshotForExport(null).annualVerticalSubsidenceRate,null);
});

test("impossible source identity and fictional scientific claims fail closed",()=>{
 for(const makeChange of [
  d=>{d.source.jobId="MOCK_JOB";},
  d=>{d.source.usesBIGDEMNAS=true;},
  d=>{d.studyArea.bboxEPSG4326=[0,0,1,1];},
  d=>{d.studyArea.candidateShareOfValidLandPct=99.99;},
  d=>{d.studyArea.candidatePixelsCoherenceAtLeast07=32000;},
  d=>{d.portLocator.unwrappedPhaseRadians=1.1;},
  d=>{d.portLocator.waterMask=1;},
  d=>{d.portLocator.isSurveyedAsset=true;},
  d=>{d.scientificGates.annualRateAvailable=true;},
  d=>{d.scientificGates.assetRiskRankingAllowed=true;},
  d=>{d.scientificGates.GNSSCrossValidation=true;},
 ]){
  assert.throws(()=>validateRealInsarQa(changed(makeChange)),/evidence rejected/i);
 }
});
