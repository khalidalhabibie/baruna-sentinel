import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_RNEU, DEMO_RINEX, parseRneu, analyzeSeries, inspectRinex,
  rankAssets, evidenceBundle, ASSETS
} from "./engine.js";

test("synthetic .rneu parses and descriptive downward trend is reproducible", () => {
  const parsed = parseRneu(DEMO_RNEU, { station: "CSEM", unit: "meters" });
  const analysis = analyzeSeries(parsed);
  assert.equal(parsed.station, "CSEM");
  assert.equal(analysis.epochCount, 12);
  assert.equal(analysis.quality, "SCREENING_READY");
  assert.equal(analysis.direction, "DOWNWARD_DESCRIPTIVE");
  assert.ok(analysis.verticalSlopeMmYr < -50);
  assert.ok(analysis.verticalSlopeMmYr > -110);
});

test("duplicate epochs and invalid sigma are rejected", () => {
  const input = DEMO_RNEU + "\n20240101 2024.000 0 0 0 0.002 0.002 0.004";
  assert.throws(() => parseRneu(input), /Duplicate/);
  assert.throws(() => parseRneu("20240101 2024.0 0 0 0 -1 0 0\n20240102 2024.0 0 0 0 0 0 0"), /Negative sigma/);
});

test("limited series is not interpreted as zero movement or low risk", () => {
  const points = DEMO_RNEU.split("\n").filter(line => /^\d{8}/.test(line)).slice(0, 3).join("\n");
  const m = analyzeSeries(parseRneu(points, {station: "CPKL"}));
  assert.equal(m.quality, "LIMITED_EVIDENCE");
  assert.ok(rankAssets(m).every(a => a.priority === "DATA_INSUFFICIENT"));
});

test("illustrative RINEX has two observed GNSS systems, but fixture stays synthetic", () => {
  const result = inspectRinex(DEMO_RINEX);
  assert.equal(result.status, "MULTI_GNSS_RECORDS_SEEN");
  assert.equal(result.epochCount, 1);
  assert.deepEqual(result.observedSystems.map(s => s.name).sort(), ["GLONASS", "GPS"]);
});

test("RINEX with header only cannot pass observation proof", () => {
  const noRows = DEMO_RINEX.split("\n").slice(0, 5).join("\n");
  const result = inspectRinex(noRows);
  assert.equal(result.status, "MULTI_GNSS_HEADER_ONLY");
  assert.equal(result.epochCount, 0);
});

test("review engine never permits operational decisions from regional station", () => {
  const movement = analyzeSeries(parseRneu(DEMO_RNEU, {station: "CSEM"}));
  const ranked = rankAssets(movement, ASSETS);
  assert.equal(ranked[0].priority, "REVIEW_SOON");
  assert.equal(ranked[1].priority, "ROUTINE_REVIEW");
  assert.ok(ranked.every(asset => asset.operationalDecisionAllowed === false));
  assert.ok(ranked.every(asset => asset.reasons.includes("REGIONAL_REFERENCE_NOT_ASSET_INSTRUMENT")));
  const bundle = evidenceBundle({ mode: "synthetic" }, movement, inspectRinex(DEMO_RINEX), ranked);
  assert.equal(bundle.source.mode, "synthetic");
  assert.ok(bundle.scientificLimitations.some(x => x.includes("NOT silently linked")));
});

test("published CSEM series has authenticated historic rows and does not escalate a weak endpoint difference", () => {
  const text = readFileSync(new URL("../data/CSEM_clean_Noff1site.source-derived.rneu", import.meta.url), "utf8");
  const analysis = analyzeSeries(parseRneu(text, {station: "CSEM", unit: "meters", referenceFrame: "IGb14"}));
  assert.equal(analysis.epochCount, 3561);
  assert.equal(analysis.start, "2010-01-13");
  assert.equal(analysis.end, "2021-12-31");
  assert.equal(analysis.quality, "SCREENING_READY");
  assert.ok(analysis.verticalSlopeMmYr < 0);
  assert.ok(analysis.verticalSlopeMmYr > -2);
  assert.ok(analysis.endpointPrecisionRatio < 3);
  assert.ok(rankAssets(analysis).every(x => x.priority === "ROUTINE_REVIEW"));
});
