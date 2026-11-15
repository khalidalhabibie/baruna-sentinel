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
  assert.equal(await page.locator("#view-decision").getAttribute("aria-pressed"), "true", "Decision mode is default");
  assert.equal(await page.locator(".controls").isVisible(), false, "Decision mode hides technical controls");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains("skip-link")), true,
    "First keyboard tab reaches the skip link");
  assert.equal(await page.locator("#case-journey").isVisible(), true, "Guided 3-step journey shown");
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
  // Default: real reference points only; experiments are hidden until enabled.
  mkdirSync("reports", { recursive: true });
  // Keyboard-focus test is complete; reset focus so screenshot represents an ordinary first visit.
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.screenshot({ path:"reports/sentinel-judge-demo-first-impression.png", fullPage:true });
  const geoMap = await page.locator("#geo-map").innerHTML();
  assert.ok(geoMap.includes("WGS84 POINT CONTEXT"), "Offline geographic map works");
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 3,
    "Competition default shows only genuine station and landmark points");
  assert.equal(await page.locator("#geo-layer-summary").textContent(), "2 / 2 layers visible");
  assert.ok((await page.locator("#geo-distance").textContent()).includes("km"));

  await page.locator("#view-analyst").click();
  assert.equal(await page.locator("#lab-toggle").getAttribute("aria-pressed"), "false");
  assert.equal(await page.locator(".lab-import").isVisible(), false, "Ina-CORS import hidden by default");
  assert.equal(await page.locator("#sample-btn").isVisible(), false, "Synthetic data control hidden by default");
  await page.locator('[data-map-layer="landmarks"]').click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 1, "Landmark layer can be hidden");
  await page.locator('[data-map-layer="landmarks"]').click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 3, "Landmark layer restored");
  await page.locator("#lab-toggle").click();
  assert.equal(await page.locator("#lab-toggle").getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator(".lab-import").isVisible(), true, "Ina-CORS import appears in lab mode");
  assert.equal(await page.locator("#sample-btn").isVisible(), true, "Explicit synthetic mode available only in lab");
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 6, "Lab enables three disclosed fictional scenario points");
  await page.locator('[data-map-layer="fictional"]').click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 3, "Fictional layer is reversible");
  await page.locator('[data-map-layer="fictional"]').click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 6, "Fictional layer restored");
  await page.locator('[data-map-layer="landmarks"]').click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 4, "Real landmark toggle works in lab");
  await page.locator('[data-map-layer="landmarks"]').click();
  assert.equal(await page.locator("#geo-layer-summary").textContent(), "3 / 3 layers visible");
  await page.locator("#view-decision").click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 3,
    "Decision view hides invented markers even after experimental tools are enabled");
  assert.equal(await page.locator('[data-feature="fictionalMapMarkers"]').first().isVisible(), false,
    "Decision view hides fictional layer controls");
  await page.waitForFunction(() => document.querySelectorAll("#historical-sector-list button[data-sector]").length === 6, { timeout:15000 });
  const fieldRows = page.locator("#historical-sector-list button[data-sector]");
  assert.equal(await fieldRows.count(), 6, "Six real research-documented historical infrastructure sectors loaded");
  await page.waitForFunction(() => document.querySelector("#exec-streams")?.textContent?.includes("3 / 3"), {timeout:15000});
  assert.equal(await page.locator("#exec-sectors").textContent(), "6", "Decision desk reports source-backed sectors");
  assert.equal(await page.locator("#exec-current").textContent(), "0", "No current on-asset instrument falsely declared");
  assert.ok((await page.locator("#executive-desk").textContent()).includes("1–6 November 2026"), "Urgency includes dated BMKG historical context");
  assert.ok((await page.locator("#executive-desk").textContent()).includes("That window has passed"), "No active flood alarm falsely asserted");
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

  await page.locator("#step-sector").click();
  await page.getByRole("button", { name: /explore case study/i }).click();
  await page.waitForFunction(() => document.querySelector("#demo-status")?.textContent?.includes("Case ready"), { timeout: 15000 });
  assert.ok((await page.locator("#demo-status").textContent()).includes("Case ready"), "One click reloads both authentic but independent sources");

  await page.locator("#view-analyst").click();
  assert.equal(await page.locator("#view-analyst").getAttribute("aria-pressed"), "true", "Analyst view is selected");
  assert.equal(await page.locator(".controls").isVisible(), true, "Analyst view reveals original GNSS controls");
  assert.equal(await page.locator("#analyst-intro").isVisible(), true, "Analyst view shows instrumentation provenance");
  assert.equal(await page.locator("#gis-audit").isVisible(), true, "GIS spatial audit visible to analysts");
  assert.equal(await page.locator("#geo-audit-rows tr").count(), 4, "GIS table contains CSEM, landmarks and independent BAKO");
  assert.ok((await page.locator("#geo-audit-rows").textContent()).includes("Different station and time"),
    "GIS table flags that BAKO is not a local movement solution");
  await page.screenshot({ path:"reports/sentinel-judge-demo-analyst.png", fullPage:true });

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
  assert.ok(reportText.includes("Selected documented sector:"), "Printable brief identifies the chosen actual research sector");
  assert.ok(reportText.includes("REQUEST UPDATED"), "Executive evidence action is included");
  assert.ok(reportText.includes("To be assigned by operator"), "Responsible owner never fabricated");

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
  assert.equal(json.executiveReadiness.loadedEvidenceStreams,3);
  assert.equal(json.executiveReadiness.currentInstrumentedAssetMeasurementsInDemo,0);
  assert.equal(json.verificationRequest.sectorId,"west-breakwater");
  assert.equal(json.verificationRequest.estimates.roi,null);
  assert.ok(json.publishedFieldEvidence.sectors.every(s=>s.currentRisk==="UNKNOWN"));

  assert.ok(json.geospatialContext.assets.every(a => a.locationType === "FICTIONAL_SCENARIO_POINT"));

  // Plan A: operator supplies a locally processed RINEX QC JSON, never an authenticated BIG claim.
  const operatorQc={
    schema:"baruna-sentinel-real-multignss-qc-v1",
    source:{type:"user_supplied_rinex",station:"CSMG",station_evidence:"operator_declared_unverified",
      archive_url:"https://srgi.big.go.id",filename:"CSMG_sample.26o",sha256_compressed:"a".repeat(64)},
    sample:{first_epoch:"2026-11-14T00:00:00",last_epoch:"2026-11-14T00:19:30",epochs:40},
    constellations_with_actual_pseudorange:{
      GPS:{pseudorange_observation_cells:340},Galileo:{pseudorange_observation_cells:180}
    },
    same_epochs_comparison:{gps_only_mean_satellites_with_measurements:8.5,
      multi_gnss_mean_satellites_with_measurements:13,
      epochs_with_additional_non_gps_observations:40}
  };
  await page.locator("#qc-report-file").setInputFiles({
    name:"operator-declared-csmg.json",
    mimeType:"application/json",
    buffer:Buffer.from(JSON.stringify(operatorQc))
  });
  assert.ok((await page.locator("#rinex-status").textContent()).includes("LOCALLY DECODED"),
    "Plan A user QC is openly marked as user-declared, not BIG verified");
  assert.ok((await page.locator("#rinex-caption").textContent()).includes("operator-declared identity"),
    "Plan A instrument identity remains unverified");
  assert.equal(await page.locator("#exec-streams").textContent(), "2 / 3",
    "User-declared QC is not counted as independently verified data");
  await page.locator("#load-bako").click();
  await page.waitForFunction(() => document.querySelector("#rinex-caption")?.textContent?.includes("IGS BAKO"),{timeout:10000});
  assert.equal(await page.locator("#exec-streams").textContent(), "3 / 3",
    "Plan B returns to already validated IGS BAKO fallback");


  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "reports/sentinel-judge-demo-mobile.png", fullPage: true });
  await page.locator("#view-decision").click();
  assert.equal(await page.locator(".controls").isVisible(), false, "Technical controls stay hidden in mobile Decision mode");
  await page.screenshot({ path: "reports/sentinel-judge-demo-mobile-decision.png", fullPage: true });
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 3);
  assert.equal(overflows, false, "Mobile viewport has no horizontal overflow");

  // Regression: missing real CSEM data must NOT be disguised as a simulated success.
  await page.locator("#view-analyst").click();
  // Turning experiments off must restore trusted default data.
  await page.locator("#lab-toggle").click();
  assert.equal(await page.locator(".lab-import").isVisible(), false);
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 3);
  assert.ok((await page.locator("#rinex-caption").textContent()).includes("IGS BAKO"));
  const preErrorCount=errors.length;
  await page.route("**/data/CSEM_clean_Noff1site.source-derived.rneu", route =>
    route.fulfill({status:503,contentType:"text/plain",body:"source temporarily unavailable"})
  );
  await page.locator("#published-btn").click();
  await page.waitForFunction(() => document.querySelector("#source-badge")?.textContent === "UNAVAILABLE", {timeout:10000});
  assert.equal(await page.locator("#mode-movement").textContent(), "SOURCE UNAVAILABLE");
  assert.ok((await page.locator("#inline-feedback").textContent()).includes("did not switch to synthetic"),
    "CSEM failure announces no synthetic substitution");
  const expectedNetworkErrors=errors.slice(preErrorCount);
  assert.ok(expectedNetworkErrors.every(message => /503|Failed to load resource/i.test(message)),
    "Only the intentionally injected HTTP failure was logged");
  errors.splice(preErrorCount);
  await page.unroute("**/data/CSEM_clean_Noff1site.source-derived.rneu");
  await page.locator("#published-btn").click();
  await page.waitForFunction(() => document.querySelector("#stat-epochs")?.textContent?.includes("3,561"), {timeout:10000});
  assert.deepEqual(errors, [], "No unexpected runtime JS errors");
  console.log(JSON.stringify({ result: "PASS", desktop: true, mobile: true, datasetEpochs: 3561, sourceLinkGate: json.evidenceGate.status, map: true, layeredGIS: true, sourceFallback: true, keyboardSkip: true, views: 2, realResearchSectors: 6, executiveReadiness: "3 streams, no current measurements", printPdf: true, errors: errors.length }, null, 2));
} finally {
  await browser.close();
}
