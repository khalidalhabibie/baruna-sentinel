import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateSourcedAoiReadiness,renderInsarNetwork} from "./insar-network-readiness.js";

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),"utf8"));
const baseline=read("../data/semarang-asf-15-baseline-candidates-20261118.json");
const pixel=read("../data/semarang-hyp3-aoi-pixel-screening-20261118.json");
const preflight=read("../data/semarang-asf-burst-network-20261118.json");
const oldQa=read("../data/semarang-real-hyp3-insar-qa.json");

test("all 15 real ASF source baselines and three actual AOI quality screens are provenance gated",()=>{
 const s=validateSourcedAoiReadiness(baseline,pixel);
 assert.equal(s.observed.size,15);
 assert.equal(s.aois.length,3);
 const by=Object.fromEntries(s.aois.map(x=>[x.aoiId,x]));
 assert.deepEqual([by["aoi-seed-tanjung-emas"].qualityPixels,by["aoi-seed-terboyo-industry"].qualityPixels,
  by["aoi-seed-kaligawe-road"].qualityPixels],[74,99,173]);
 assert.deepEqual([by["aoi-seed-tanjung-emas"].landPixels,by["aoi-seed-terboyo-industry"].landPixels,
  by["aoi-seed-kaligawe-road"].landPixels],[149,190,178]);
 assert.equal(baseline.minimumPilot.minimumAdditionalJobsIfApproved,2);
 assert.equal(baseline.minimumPilot.costEstimateCredits,null);
 assert.equal(pixel.scientificGates.annualVerticalSubsidenceAvailable,false);
 assert.equal(pixel.scientificGates.infrastructureRiskRankingAllowed,false);
});

test("invalid source baseline, additional risk claims and inflated pixel percentages fail closed",()=>{
 const altered=fn=>{const b=structuredClone(baseline),p=structuredClone(pixel);fn(b,p);return [b,p];};
 for(const mutate of [
  (b,p)=>{b.adjacentEdges[0].asfPerpendicularBaselineMeters=null;},
  (b,p)=>{b.adjacentEdges[0].sourceStatus="VALIDATED_DISPLACEMENT";},
  (b,p)=>{b.twoStepRedundantEdges[0].temporalDays=12;},
  (b,p)=>{b.scientificGates.phaseClosureMeasured=true;},
  (b,p)=>{b.scientificGates.operationalRiskRankAllowed=true;},
  (b,p)=>{b.minimumPilot.costEstimateCredits=0;},
  (b,p)=>{p.scientificGates.multitemporalLOSTimeSeries=true;},
  (b,p)=>{p.aoiResults[0].qualityPixels=149;},
  (b,p)=>{p.aoiResults[0].qualityShareOfLandPct=95;},
  (b,p)=>{p.portLocator.unwrappedPhaseValid=true;},
 ]){const [b,p]=altered(mutate);assert.throws(()=>validateSourcedAoiReadiness(b,p),/ASF burst readiness rejected/);}
});

test("Ranking Center displays current source QA and never invents observed subsidence",()=>{
 const nodes=new Map();
 const node=()=>({textContent:"",children:[],append(...xs){this.children.push(...xs);},
  replaceChildren(){this.children=[];}});
 for(const id of ["rk-insar-status","rk-insar-count","rk-insar-edge-count","rk-insar-qa-count",
    "rk-insar-coverage","rk-insar-port","rk-insar-science","rk-insar-timeline",
    "rk-insar-aoi-quality","rk-insar-aoi-note"])nodes.set(id,node());
 const doc={getElementById:id=>nodes.get(id),createElement:node};
 renderInsarNetwork(preflight,oldQa,doc,baseline,pixel);
 assert.match(nodes.get("rk-insar-status").textContent,/SOURCE VERIFIED/);
 assert.match(nodes.get("rk-insar-science").textContent,/ZIP asli lolos/);
 assert.equal(nodes.get("rk-insar-timeline").children.length,8);
 assert.equal(nodes.get("rk-insar-aoi-quality").children.length,3);
 assert.match(nodes.get("rk-insar-aoi-quality").children[2].children[1].textContent,/173\/178/);
 assert.match(nodes.get("rk-insar-aoi-note").textContent,/BUKAN penurunan tanah/);
});
