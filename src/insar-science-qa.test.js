import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateInsarScienceQa,insarQaForExport} from "./insar-science-qa.js";
const d=JSON.parse(readFileSync(new URL("../data/semarang-insar-science-qa.json",import.meta.url),"utf8"));
const mutate=fn=>{const x=structuredClone(d);fn(x);return x;};
test("real HyP3 2026 QA is evidence of processed raster, not asset subsidence",()=>{
 const valid=validateInsarScienceQa(d);
 assert.equal(valid.source.intervalDays,12);
 assert.equal(valid.bigPortReference.unwrappedPhase,"NODATA");
 assert.ok(valid.bigPortReference.coherence<valid.quality.coherenceThreshold);
 assert.equal(valid.quality.qualifiedMainComponentPixels,15105);
 assert.equal(insarQaForExport(valid).validatedSubsidence,false);
 assert.equal(insarQaForExport(valid).scientificGates.publishedMapRasterIncluded,false);
});
test("an archive cannot silently become a verified mm/year or risk layer",()=>{
 assert.throws(()=>validateInsarScienceQa(mutate(x=>x.scientificGates.annualVerticalSubsidenceValidated=true)),/scientific guardrail/);
 assert.throws(()=>validateInsarScienceQa(mutate(x=>x.scientificGates.publishedMapRasterIncluded=true)),/scientific guardrail/);
 assert.throws(()=>validateInsarScienceQa(mutate(x=>x.bigPortReference.unwrappedPhase=0)),/port locator/);
 assert.throws(()=>validateInsarScienceQa(mutate(x=>x.bigPortReference.coherence=0.9)),/port locator/);
 assert.throws(()=>validateInsarScienceQa(mutate(x=>x.quality.qualifiedMainComponentPixels=31464)),/quality/);
 assert.throws(()=>validateInsarScienceQa(mutate(x=>x.provenance="FULLY_VALIDATED_VERTICAL_MM_YEAR")),/identity/);
});
test("missing QA fails closed in public export",()=>{
 assert.deepEqual(insarQaForExport(null),{status:"UNAVAILABLE",validatedSubsidence:false,operationalRiskRankingAllowed:false});
});
