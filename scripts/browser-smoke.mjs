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
  await page.waitForFunction(() => document.querySelectorAll("#historical-sector-list button[data-sector]").length === 6, { timeout:15000 });
  const fieldRows = page.locator("#historical-sector-list button[data-sector]");
  assert.equal(await fieldRows.count(), 6, "Six real research-documented historical infrastructure sectors loaded");
  assert.ok((await page.locator("#historical-sector-detail").textContent()).includes("not a 2026 displacement rate"), "Historical measurement explicitly not current");
  await page.locator('#historical-filters button[data-filter="coastal"]').click();
  assert.equal(await fieldRows.count(), 3, "Historical coastal-sector filter works");
  await page.locator('#historical-filters button[data-filter="all"]').click();
  await page.locator('#historical-sector-list button[data-sector="west-breakwater"]').click();
  assert.ok((await page.locator("#historical-sector-detail").textContent()).includes("74–140 cm"), "Source-derived west breakwater result is presented");

  // Intercept third-party tiles during CI. A user explicitly enables the map,
  // while default/offline mode never requires an external tile server.
  await page.route("https://www.openstreetmap.org/**", async route => route.fulfill({
    status:200, contentType:"text/html", body:"<html><body>OSM context placeholder for CI</body></html>"
  }));
  await page.getByRole("button", { name: /show live street map/i }).click();
  assert.equal(await page.locator("#geo-osm-embed").isVisible(),true, "Interactive third-party OSM iframe is opt-in");
  assert.ok((await page.locator("#osm-iframe").getAttribute("src")).includes("openstreetmap.org/export/embed.html"), "Official OSM embed URL used");
  await page.getByRole("button", { name: /back to offline coordinate plot/i }).click();
  assert.equal(await page.locator("#geo-map").isVisible(),true, "Offline coordinate view remains available");

  mkdirSync("reports", { recursive: true });
  await page.screenshot({ path: "reports/sentinel-judge-demo-desktop.png", fullPage: true });

  await page.getByRole("button", { name: /run semarang case study/i }).click();
  await page.waitForFunction(() => document.querySelector("#demo-status")?.textContent?.includes("Case ready"), { timeout: 15000 });
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
  assert.ok(reportText.includes("West breakwater"), "Real research sector appears in A4 evidence dossier");
  assert.ok(reportText.includes("HISTORICAL SETTLEMENT"), "Published measurements are labeled historic, not risk");

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
  assert.equal(json.publishedFieldEvidence.sectorCount,6,"Published sector register exported with provenance");
  assert.equal(json.publishedFieldEvidence.operationalInspectionPriorityAvailable,false);
  assert.ok(json.publishedFieldEvidence.sectors.every(s=>s.currentRisk==="UNKNOWN"));

  assert.ok(json.geospatialContext.assets.every(a => a.locationType === "FICTIONAL_SCENARIO_POINT"));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "reports/sentinel-judge-demo-mobile.png", fullPage: true });
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 3);
  assert.equal(overflows, false, "Mobile viewport has no horizontal overflow");
  assert.deepEqual(errors, [], "No runtime JS errors");
  console.log(JSON.stringify({ result: "PASS", desktop: true, mobile: true, datasetEpochs: 3561, sourceLinkGate: json.evidenceGate.status, map: true, realResearchSectors: 6, printPdf: true, errors: errors.length }, null, 2));
} finally {
  await browser.close();
}
