import { chromium } from "playwright";
import assert from "node:assert/strict";
import { createWriteStream, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push("console: " + message.text());
  });
  const response = await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  assert.equal(response.status(), 200, "Site root serves 200");
  await page.waitForFunction(() => document.querySelector("#stat-epochs")?.textContent.includes("3,561"), { timeout: 15000 });
  const epochCount = await page.locator("#stat-epochs").textContent();
  assert.ok(epochCount.includes("3,561"), "CSEM authentic historic positions load");
  const title = await page.locator("#rinex-status").textContent();
  assert.ok(title.includes("REAL ARCHIVE, VERIFIED VIA GEORINEX"), "Real BAKO QC loads");
  const evidence = await page.locator("#evidence-gate-title").textContent();
  assert.ok(evidence.includes("Independent observations"), "Provenance guard visible");
  const asset = await page.locator("#asset-rows").textContent();
  assert.ok(asset.includes("ILLUSTRATIVE FIRST LOOK"), "Synthetic scenario label visible");
  assert.ok(!asset.includes("REVIEW SOON"), "No unvalidated asset risk escalation");
  const geoMap = await page.locator("#geo-map").innerHTML();
  assert.ok(geoMap.includes("WGS84 POINT CONTEXT"), "Coordinate map rendered without network");
  assert.ok(geoMap.includes("fictional scenario location"), "Fictional markers disclosed");
  assert.ok((await page.locator("#geo-distance").textContent()).includes("km"), "Landmark distance shown");
  mkdirSync("reports", { recursive: true });
  await page.screenshot({ path: "reports/sentinel-judge-demo-desktop.png", fullPage: true });

  await page.getByRole("button", { name: /run semarang case study/i }).click();
  assert.ok((await page.locator("#demo-status").textContent()).includes("Case ready"), "One click reloads both authentic but independent sources");

  await page.evaluate(() => {
    window.__reportPrintCalled = false;
    window.print = () => { window.__reportPrintCalled = true; };
  });
  await page.getByRole("button", { name: /print evidence dossier/i }).click();
  const reportText = await page.locator("#print-report").textContent();
  assert.ok(reportText.includes("REAL GPS-DERIVED HISTORICAL SERIES"), "Report distinguishes published historical data");
  assert.ok(reportText.includes("INDEPENDENT SOURCES NOT LINKED"), "Report includes scientific provenance gate");
  assert.ok(reportText.includes("BAKO"), "Report includes genuine multi-GNSS QC");
  assert.ok(reportText.includes("NO — fictional input only"), "Report prohibits false asset recommendation");
  assert.equal(await page.evaluate(() => window.__reportPrintCalled), true, "Print action invoked");
  await page.pdf({ path: "reports/sentinel-judge-evidence-dossier.pdf", format: "A4", printBackground: true });

  await page.getByRole("button", { name: /switch to illustrative scenario/i }).click();
  const synthetic = await page.locator("#mode-movement").textContent();
  assert.equal(synthetic, "ILLUSTRATIVE MODE", "Illustrative case explicitly labelled");

  await page.getByRole("button", { name: /analyze published csem data/i }).click();
  await page.waitForFunction(() => document.querySelector("#stat-epochs")?.textContent.includes("3,561"), { timeout: 15000 });

  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: /download evidence json/i }).click();
  const dl = await promise;
  const stream = await dl.createReadStream();
  let payload = "";
  for await (const chunk of stream) payload += chunk.toString();
  const json = JSON.parse(payload);
  assert.equal(json.source.mode, "published");
  assert.equal(json.movement.epochCount, 3561);
  assert.equal(json.evidenceGate.status, "INDEPENDENT_SOURCES_NOT_LINKED");
  assert.equal(json.evidenceGate.multiGnssDisplacementClaimAllowed, false);
  assert.ok(json.illustrativeAssetReview.every(a => !a.operationalDecisionAllowed));
  assert.equal(json.geospatialContext.observationLinkedToMovement, false, "Geo evidence remains independent");
  assert.ok(json.geospatialContext.assets.every(a => a.locationType === "FICTIONAL_SCENARIO_POINT"));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "reports/sentinel-judge-demo-mobile.png", fullPage: true });
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 3);
  assert.equal(overflows, false, "Mobile viewport has no horizontal overflow");
  assert.deepEqual(errors, [], "No runtime JS errors");
  console.log(JSON.stringify({ result: "PASS", desktop: true, mobile: true, datasetEpochs: 3561, sourceLinkGate: json.evidenceGate.status, map: true, printPdf: true, errors: errors.length }, null, 2));
} finally {
  await browser.close();
}
