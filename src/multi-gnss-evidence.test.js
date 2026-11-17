import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildMultiGnssReview} from "./multi-gnss-evidence.js";
const csem=readFileSync(new URL("../data/CSEM_clean_Noff1site.source-derived.rneu",import.meta.url),"utf8");
const bako=JSON.parse(readFileSync(new URL("../data/BAKO_IGS_2025-001_20min_qc_summary.json",import.meta.url),"utf8"));
test("Multi-GNSS priorities follow evidence, not operational asset risk",()=>{
 const d=buildMultiGnssReview(csem,bako);
 assert.equal(d.csem.epochs,3561);
 assert.equal(d.csem.last,"2021-12-31");
 assert.equal(d.bako.epochs,41);
 assert.equal(d.bako.constellations.length,6);
 assert.equal(d.bako.semarangMovementValidated,false);
 assert.equal(d.bako.improvedPositionAccuracyClaimed,false);
 assert.equal(d.csmg.stationDaysPubliclyImported,false);
 assert.equal(d.operationalAssetRiskRankingAvailable,false);
 assert.equal(d.reviewPriority.length,4);
 assert.deepEqual(d.reviewPriority.map(p=>p.order),[1,2,3,4]);
 assert.ok(d.reviewPriority.every(x=>x.riskRanking===false));
});
test("multi-GNSS rejects forged station identity and movement claim",()=>{
 const bad=structuredClone(bako);bad.relationshipToSemarang.linkedToCsemMovement=true;
 assert.throws(()=>buildMultiGnssReview(csem,bad),/GNSS source validation/);
 bad.relationshipToSemarang.linkedToCsemMovement=false;
 bad.audit.epochs=2500;
 assert.throws(()=>buildMultiGnssReview(csem,bad),/GNSS source validation/);
 assert.throws(()=>buildMultiGnssReview(csem.replace("Station CSEM","Station BAKO"),bako),/source provenance/);
});
