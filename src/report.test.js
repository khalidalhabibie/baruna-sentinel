import test from "node:test";
import assert from "node:assert/strict";
import {DEMO_RNEU,parseRneu,analyzeSeries,rankAssets,evidenceBundle} from "./engine.js";
import {buildEvidenceReportMarkup} from "./report.js";
import {geoContextSummary} from "./geo.js";

test("dossier displays provenance, non-linkage and fictional tiers",()=>{
  const movement=analyzeSeries(parseRneu(DEMO_RNEU,{station:"CSEM"}));
  const qc={marker:"BAKO00IDN",epochCount:41,verifiedRun:"https://github.com/example/run",linkedToCsemMovement:false,status:"MULTI_GNSS_RECORDS_SEEN",averageGpsPseudorangeSatellitesPerEpoch:8.951,averageAllPseudorangeSatellitesPerEpoch:44.634};
  const meta={mode:"synthetic",name:"FICTIONAL TEST",rinexSource:{mode:"real-qc",name:"BAKO archive"}};
  const bundle={...evidenceBundle(meta,movement,qc,rankAssets(movement)),geospatialContext:geoContextSummary()};
  const doc=buildEvidenceReportMarkup(bundle);
  assert.ok(doc.includes("FICTIONAL TEST"));
  assert.ok(doc.includes("SYNTHETIC DEMONSTRATION"));
  assert.ok(doc.includes("BAKO00IDN"));
  assert.ok(doc.includes("44.63"));
  assert.ok(doc.includes("INDEPENDENT SOURCES NOT LINKED"));
  assert.ok(doc.includes("ILLUSTRATIVE FIRST LOOK"));
  assert.ok(doc.includes("Asset-level operational decision allowed:</b> NO"));
  assert.ok(doc.includes("No DEMNAS"));
});
test("dossier refuses absent evidence",()=>{
  assert.throws(()=>buildEvidenceReportMarkup({}),/requires a parsed movement/);
});
