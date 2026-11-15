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
  // Keep third-party OSM tile infrastructure out of deterministic CI while
  // checking the *real* Leaflet UI, marker wiring and licensed attribution.
  const tilePixel=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4/P4NAAV3Ar/lz70PAAAAAElFTkSuQmCC","base64");
  await page.route("https://tile.openstreetmap.org/**", route =>
    route.fulfill({status:200,contentType:"image/png",body:tilePixel}));
  const initial=await page.goto(BASE+"/?page=projects", {waitUntil:"networkidle",timeout:30000});
  // Separate product-introduction journey: default route, node navigation,
  // economic assumption exercise, assessment deep-link and mobile usability.
  const storyPage=await browser.newPage({viewport:{width:1440,height:900}});
  const storyErrors=[];
  storyPage.on("pageerror",error=>storyErrors.push(error.message));
  await storyPage.goto(BASE,{waitUntil:"networkidle",timeout:30000});
  assert.equal(await storyPage.locator("#pw-page-why").isVisible(),true,
    "Default entry shows concise Why Sentinel story rather than a dense dashboard");
  assert.equal(await storyPage.locator("#ws-node-track [role='tab']").count(),5,
    "Five connected, accessible evidence-to-decision nodes exist");
  assert.ok((await storyPage.locator(".ws-headline h1").textContent()).includes("Mana yang perlu diperiksa"),"A novice sees a concrete operational question");
  assert.equal((await storyPage.locator(".ourdo-wordmark strong").textContent()).trim(),"OURDO");
  assert.equal((await storyPage.locator(".ourdo-wordmark small").textContent()).trim(),"INDONESIA");
  assert.equal(await storyPage.locator(".brand-mark").count(),0,"BARUNA symbol no longer masquerades as the company logo");
  assert.equal(await storyPage.locator(".pw-primary-nav button:visible").count(),4,"First-time visitor sees only four primary actions");
  assert.ok((await storyPage.locator(".ws-fact-strip").textContent()).includes("Keluaran"),"Hero explains what the product produces");
  assert.ok((await storyPage.locator(".ws-evidence-detail").textContent()).includes("100–120 mm/tahun"),"Regional InSAR evidence stays in its contextual step rather than the hero");
  await storyPage.screenshot({path:"reports/sentinel-judge-demo-why-sentinel-desktop.png",fullPage:true});
  await storyPage.locator('[data-ws-index="1"]').click();
  assert.ok((await storyPage.locator("#ws-step-detail h3").textContent()).includes("biaya operasi"),
    "Clicking the second node reveals economic implications");
  assert.equal(await storyPage.locator("#ws-econ-result").textContent(),"Masukkan dua asumsi",
    "Unknown operator costs start blank, not with fabricated default rupiah estimates");
  await storyPage.locator("#ws-hours").fill("6");
  await storyPage.locator("#ws-hourly").fill("1000000");
  assert.equal(await storyPage.locator("#ws-econ-result").textContent(),"Rp6.000.000",
    "Economic calculator changes only on user-defined hypothetical inputs");
  assert.ok((await storyPage.locator(".ws-econ-model").textContent()).includes("bukan kerugian aktual"),
    "Economic scenario never masquerades as verified port loss");
  await storyPage.locator('[data-ws-index="2"]').click();
  assert.ok((await storyPage.locator(".ws-dataset-lines").textContent()).includes("BAKO"),
    "Evidence node labels independent CSEM and BAKO datasets");
  await storyPage.locator('[data-ws-index="2"]').press("ArrowRight");
  assert.equal(await storyPage.locator('[data-ws-index="3"]').getAttribute("aria-selected"),"true",
    "Node navigation supports keyboard arrow keys");
  await storyPage.locator('[data-ws-index="4"]').click();
  assert.ok((await storyPage.locator(".ws-case-status").textContent()).includes("bukti belum cukup"),"Concrete historic case blocks unsupported operational ranking");
  assert.ok((await storyPage.locator(".ws-outcome").textContent()).includes("74–140 cm"),"Concrete West breakwater historical record is visible");
  await storyPage.locator(".ws-stage-actions [data-pw-page='assessment']").click();
  assert.equal(await storyPage.locator("#pw-page-assessment").isVisible(),true,
    "Final node opens a functioning Inspection Assessment");
  await storyPage.goto(BASE,{waitUntil:"networkidle",timeout:30000});
  await storyPage.setViewportSize({width:390,height:844});
  assert.equal(await storyPage.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+3),true,
    "Why Sentinel introduction has no horizontal mobile overflow");
  await storyPage.screenshot({path:"reports/sentinel-judge-demo-why-sentinel-mobile.png",fullPage:true});
  assert.deepEqual(storyErrors,[],"Interactive story has no JavaScript runtime errors");
  await storyPage.close();
  assert.equal(initial.status(),200);
  assert.equal(await page.locator("[data-pw-screen='projects']").isVisible(),true,
    "Projects index is the new default entry");
  assert.equal(await page.locator(".pw-list-item").count(),1,
    "Infrastructure project registry does not mislabel GNSS reference data as projects");
  assert.equal(await page.locator(".pw-reference-links button").count(),2,
    "CSEM and BAKO appear in a separate source library");
  assert.ok((await page.locator(".pw-index-foot").textContent()).includes("not customer projects"),
    "Independent GNSS references are not presented as customer deployments");
  mkdirSync("reports",{recursive:true});
  await page.screenshot({path:"reports/sentinel-judge-demo-projects.png",fullPage:true});

  // Proposal-conformant vertical slice: a real, source-constrained assessment
  // and a strictly separated synthetic rule demonstration.
  const assessmentPage=await browser.newPage({viewport:{width:1440,height:900}});
  const assessmentErrors=[];
  assessmentPage.on("pageerror",error=>assessmentErrors.push(error.message));
  await assessmentPage.goto(BASE+"/?page=assessment&project=semarang-port",{waitUntil:"networkidle",timeout:30000});
  await assessmentPage.locator(".as-sector").first().waitFor({state:"visible",timeout:15000});
  await assessmentPage.waitForFunction(()=>document.querySelector(".as-source-panel")?.textContent?.includes("OLS"),{timeout:15000});
  assert.ok((await assessmentPage.locator(".as-source-panel").textContent()).includes("3,561 positions"),
    "Assessment computes real CSEM historical station positions, not a decorative claim");
  assert.ok((await assessmentPage.locator(".as-source-panel").textContent()).includes("41 epochs"),
    "Assessment reports verified BAKO observation QC, explicitly independently sourced");
  assert.equal(await assessmentPage.locator(".as-sector").count(),6,
    "Six real published sectors are assessed through evidence sufficiency gates");
  assert.equal(await assessmentPage.locator(".as-decision-status").textContent(),"DATA INSUFFICIENT",
    "No unsupported real asset-risk ranking is produced");
  assert.ok((await assessmentPage.locator(".as-workflow").textContent()).includes("station-to-asset link absent"),
    "Assessment shows the disconnected GNSS and asset evidence chain");
  await assessmentPage.locator('[data-as-sector="north-breakwater"]').click();
  assert.ok((await assessmentPage.locator(".as-decision-top").textContent()).includes("64–79"),
    "Published cumulative measurements follow the selected sector");
  await assessmentPage.screenshot({path:"reports/sentinel-judge-demo-assessment.png",fullPage:true});
  await assessmentPage.locator("#as-demo-mode").click();
  assert.equal(await assessmentPage.locator(".as-simulation-table tbody tr").count(),4,
    "Synthetic policy demo contains four transparent decision outcomes");
  assert.ok((await assessmentPage.locator(".as-simulation-table").textContent()).includes("HIGH"));
  assert.ok((await assessmentPage.locator(".as-simulation-table").textContent()).includes("MEDIUM"));
  assert.ok((await assessmentPage.locator(".as-simulation-table").textContent()).includes("MONITOR"));
  assert.ok((await assessmentPage.locator(".as-simulation-table").textContent()).includes("BLOCKED"));
  await assessmentPage.evaluate(()=>{
    window.__assessmentPrintInvoked=false;
    window.print=()=>{window.__assessmentPrintInvoked=true;};
  });
  await assessmentPage.locator("#as-export").click();
  assert.equal(await assessmentPage.evaluate(()=>window.__assessmentPrintInvoked),true,
    "Assessment delivers a real printable evidence report");
  assert.ok((await assessmentPage.locator("#print-report").textContent()).includes("fictional"),
    "Printed simulation remains explicitly separated from source-backed observations");
  await assessmentPage.locator("#as-real-mode").click();
  await assessmentPage.setViewportSize({width:390,height:844});
  await assessmentPage.evaluate(()=>{
    document.activeElement?.blur?.();
    window.scrollTo({top:0,left:0,behavior:"instant"});
  });
  const assessmentOverflow=await assessmentPage.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
  assert.equal(assessmentOverflow,false,"Assessment fits a narrow mobile viewport");
  await assessmentPage.screenshot({path:"reports/sentinel-judge-demo-assessment-mobile.png",fullPage:true});
  assert.deepEqual(assessmentErrors,[],"No unexpected runtime errors on Assessment");
  await assessmentPage.close();

  await page.locator(".pw-list-item").first().locator("button.pw-project-name").click();
  assert.equal(await page.locator("#pw-page-overview").isVisible(),true,"Opening a workspace displays its overview");
  assert.ok((await page.locator("#pw-page-overview").textContent()).includes("Six historical cumulative-settlement ranges"),
    "Semarang overview shows the research source, not fake real-time risk");
  await page.screenshot({path:"reports/sentinel-judge-demo-project-overview.png",fullPage:true});
  await page.locator("[data-pw-screen='overview'] [data-pw-page='compare']").click();
  assert.equal(await page.locator("#pw-page-compare").isVisible(),true,"Compare is a separate working page");
  assert.equal(await page.locator(".pw-comparison tbody tr").count(),10,"Evidence comparison has explicit fields");
  assert.ok((await page.locator("#pw-page-compare").textContent()).includes("not ground movement"),
    "Comparison does not rank unrelated station movement or asset safety");
  await page.screenshot({path:"reports/sentinel-judge-demo-compare.png",fullPage:true});
  await page.locator("[data-pw-compare='bako-observations']").check();
  assert.equal(await page.locator(".pw-comparison thead th").count(),4,
    "Compare can show three independently sourced workspaces side by side");
  await page.locator("[data-pw-page='projects']").first().click();
  await page.locator("#pw-new-project-btn").click();
  assert.equal(await page.locator("#pw-new-project-dialog").isVisible(),true);
  await page.locator("#pw-draft-name").fill("Regional bridge study");
  await page.locator("#pw-draft-area").fill("Semarang, Central Java");
  await page.locator("#pw-new-project-form button[type='submit']").click();
  assert.equal(await page.locator("#pw-page-overview").isVisible(),true);
  assert.ok((await page.locator("#pw-page-overview").textContent()).includes("No evidence imported"),
    "User-created workspace does not fabricate an assessment");
  await page.locator("#pw-project-switch").selectOption("csem-history");
  assert.ok((await page.locator("#pw-page-overview").textContent()).includes("3,561"),
    "Project selector opens the correct CSEM source overview");
  await page.locator("#pw-page-overview .pw-heading-actions [data-pw-page='detail']").click();
  assert.equal(await page.locator(".case-workspace").isVisible(),false,
    "CSEM technical study does not inherit unrelated Semarang field sectors");
  await page.locator("#pw-project-switch").selectOption("semarang-port");
  await page.locator("#pw-page-overview .pw-heading-actions [data-pw-page='detail']").click();
  assert.equal(await page.locator("#pw-page-detail").isVisible(),true);
  assert.equal(await page.locator(".case-workspace").isVisible(),true);
  const response=await page.goto(BASE+"/?page=detail",{waitUntil:"networkidle",timeout:30000});
  assert.equal(response.status(),200,"Deep-linked project detail serves 200");
  assert.equal(await page.locator("#pw-page-detail").isVisible(),true,"Direct detail URL resolves");
  assert.equal(await page.locator("#view-decision").getAttribute("aria-pressed"), "true", "Decision mode is default");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains("skip-link")), true,
    "First keyboard tab reaches the skip link");
  assert.equal(await page.locator("#station-qc").isVisible(),false,
    "Full GNSS QC screen is not stacked into the buyer Overview");
  assert.equal(await page.locator(".decision-data-bridge").isVisible(),false,
    "Duplicate GNSS CTA is removed from the buyer's view");
  assert.equal(await page.locator(".evidence-strip").isVisible(),true,
    "Compact source chain stays next to the main decision");
  assert.equal(await page.locator(".evidence-logic-card").count(),3,
    "Overview explains what is known, unknown, and what to verify next");
  assert.ok((await page.locator(".evidence-logic").textContent()).includes("We cannot claim"),
    "Buyer-facing decision explicitly states scientific limitations");
  const detailHeading=await page.locator("#pw-page-detail").boundingBox();
  const geoBox=await page.locator("#case-workspace").boundingBox();
  assert.ok(detailHeading && geoBox && geoBox.y>detailHeading.y,
    "Project title and navigation appear before the selected sector");
  assert.equal(await page.locator("#map-disclosure").getAttribute("open"),null,
    "Map stays collapsed until explicitly requested");
  await page.locator("#view-analyst").click();
  assert.equal(await page.locator(".analyst-proof-card:visible").count(),2,
    "Analyst starts with two independently sourced GNSS records");
  assert.equal(await page.locator("#station-qc").isVisible(),false,
    "Position history is the default focused GNSS Lab view");
  assert.equal(await page.locator('[data-pw-lab="movement"]').getAttribute("aria-selected"),"true");
  await page.locator('[data-pw-lab="qc"]').click();
  assert.equal(await page.locator("#station-qc").isVisible(),true,
    "Observation QC tab opens the separate authentic QC workstation");
  assert.equal(await page.locator(".controls").isVisible(),true,
    "Analyst provides the technical GNSS data tools");
  assert.equal(await page.locator(".decision-data-bridge").isVisible(),false,
    "Overview-specific upsell is hidden in Analyst");
  assert.ok(page.url().includes("page=analyst"),"GNSS Lab has a shareable URL");
  await page.locator("#view-decision").click();
  assert.equal(await page.locator("#station-qc").isVisible(),false,"Overview hides technical QC workbench");
  assert.equal(await page.locator(".evidence-strip").isVisible(),true,"Overview restores the source chain");
  assert.equal(await page.locator("#view-decision").getAttribute("aria-pressed"),"true");
  // Fail-safe contract: the two mode switches must continue to work
  // even if app.js has a production loading or runtime import error.
  const navOnly=await browser.newPage({viewport:{width:1280,height:800}});
  await navOnly.route("**/src/app.js",route=>route.abort());
  await navOnly.goto(BASE+"/?view=analyst",{waitUntil:"domcontentloaded",timeout:30000});
  await navOnly.waitForFunction(()=>document.body.dataset.view==="analyst",{timeout:10000});
  await navOnly.locator('[data-pw-lab="qc"]').click();
  assert.equal(await navOnly.locator("#station-qc").isVisible(),true,
    "GNSS Lab tabs work even if the analysis JavaScript module is unavailable");
  await navOnly.locator("#view-decision").click();
  assert.equal(await navOnly.locator("#case-workspace").isVisible(),true,
    "Overview navigation survives missing GIS analysis module");
  await navOnly.close();

  assert.equal(await page.locator(".controls").isVisible(), false, "Decision mode hides technical controls");
  assert.equal(await page.locator("#case-journey").isVisible(), false,
    "Redundant three-step section stays hidden");
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
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo({top:0,left:0,behavior:"instant"});
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path:"reports/sentinel-judge-demo-first-impression.png", fullPage:true });
  await page.locator("#case-workspace").screenshot({path:"reports/sentinel-judge-evidence-workspace.png"});
  // Private CORS daily QC import is explicit, local-only and never in the public build.
  assert.equal(await page.locator("#cors-qc-result .cors-qc-empty").count(),1,
    "Public demo has no redistributed private SRGI data");
  const fakeDay=(station,date,doy,epochs)=>({
    station,date,doy,epochs,expected_full_day_30s_epochs:2880,
    long_gaps_gt30s:0,largest_gap_min:0,
    first_epoch_gps:date+" 00:00:00",last_epoch_gps:date+" 23:59:30",
    epochs_with_C1_by_constellation:{G:epochs,R:epochs,E:epochs,S:0,"G+R+E":epochs}
  });
  const qcFixture={
    method:"SYNTHETIC BROWSER TEST - RINEX epoch counts",
    disposition:"Fictional data for automated smoke test; not real SRGI observations",
    records:[
      fakeDay("csem","2026-11-10",314,2880),
      fakeDay("csmg","2026-11-10",314,2880),
      fakeDay("csem","2026-11-11",315,2880),
    ]
  };
  await page.locator("#cors-qc-file").setInputFiles({
    name:"synthetic-browser-test-qc.json",
    mimeType:"application/json",buffer:Buffer.from(JSON.stringify(qcFixture))
  });
  await page.waitForFunction(()=>document.querySelectorAll("#cors-qc-result .cors-day-row").length===2,{timeout:10000});
  assert.equal(await page.locator("#cors-qc-result .cors-day-row").count(),2,
    "Station-day comparison renders the two test dates");
  assert.ok((await page.locator("#cors-qc-result").textContent()).includes("No file"),
    "Missing CSMG date is made explicit instead of treated as zero data");
  assert.ok((await page.locator("#cors-qc-notice").textContent()).includes("3 station-day files"),
    "Locally imported QC reports its exact record count");
  await page.locator("#view-analyst").click();
  await page.locator("#station-qc").screenshot({
    path:"reports/sentinel-judge-demo-cors-qc-synthetic.png"
  });
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.activeElement?.blur?.());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3),false,
    "Local QC comparison has no mobile horizontal overflow");
  await page.locator("#station-qc").screenshot({
    path:"reports/sentinel-judge-demo-cors-qc-mobile-synthetic.png"
  });
  await page.setViewportSize({width:1440,height:1000});

  await page.locator("#cors-qc-reset").click();
  await page.locator("#view-decision").click();
  assert.equal(await page.locator("#cors-qc-result .cors-qc-empty").count(),1,
    "Local QC can be purged from application memory");

  assert.equal(await page.locator("#geo-osm-embed").isVisible(),false,
    "Geographic context starts collapsed");
  await page.locator("#map-disclosure > summary").click();
  await page.waitForTimeout(350);
  assert.equal(await page.locator("#geo-osm-embed").isVisible(),true,
    "Expanding location context reveals the interactive map");
  assert.equal(await page.locator("#street-map .leaflet-container").count(),0,
    "Map div is the Leaflet container itself");
  assert.ok(await page.locator("#street-map .leaflet-tile-pane").count()===1,
    "Leaflet initializes a true slippy tile-map pane");
  assert.equal(await page.locator("#street-map .leaflet-interactive").count(),3,
    "Three actual public reference markers overlay the live street map");
  await page.locator("#street-map .leaflet-interactive").first().click();
  assert.equal(await page.locator("#geo-selected-title").textContent(),"CSEM (Ina-CORS)",
    "A real Leaflet marker selects the source-inspector record");
  await page.locator('[data-geo-point="port-terminal"]').click();
  assert.equal(await page.locator("#geo-selected-title").textContent(),"Tanjung Emas terminal",
    "A reference card can change the active street map marker");
  assert.ok((await page.locator("#geo-osm-embed").textContent()).includes("OpenStreetMap contributors"),
    "OpenStreetMap attribution is visible");
  await page.locator("#osm-toggle").click();
  assert.equal(await page.locator("#geo-map").isVisible(),true,
    "Explicit offline toggle displays the WGS84 plot");
  const geoMap = await page.locator("#geo-map").innerHTML();
  assert.ok(geoMap.includes("WGS84 POINT CONTEXT"), "Offline geographic map works");
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 3,
    "Competition default shows only genuine station and landmark points");
  assert.equal(await page.locator("#geo-layer-summary").textContent(), "2 / 2 layers visible");
  assert.ok((await page.locator("#geo-distance").textContent()).includes("km"));
  assert.equal(await page.locator("#geo-selected-title").textContent(),"Tanjung Emas terminal");
  await page.locator('[data-geo-view="port"]').click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(),2);
  await page.locator('[data-geo-point="csem"]').click();
  assert.equal(await page.locator("#geo-selected-title").textContent(),"CSEM (Ina-CORS)");
  assert.equal(await page.locator('[data-geo-view="station"]').getAttribute("aria-pressed"),"true");
  await page.locator('[data-geo-view="all"]').click();
  await page.locator('#geo-map [data-point-id="port-terminal"]').click();
  assert.equal(await page.locator("#geo-selected-title").textContent(),"Tanjung Emas terminal");
  await page.locator("#geo-context").screenshot({path:"reports/sentinel-judge-interactive-gis-map.png"});

  await page.locator("#view-analyst").click();
  assert.equal(await page.locator("#lab-toggle").getAttribute("aria-pressed"), "false");
  assert.equal(await page.locator(".lab-import").isVisible(), false, "Ina-CORS import hidden by default");
  assert.equal(await page.locator("#sample-btn").isVisible(), false, "Synthetic data control hidden by default");
  await page.locator('[data-pw-lab="gis"]').click();
  assert.equal(await page.locator("#geo-context").isVisible(),true,
    "GIS is a deliberate technical subview, not forced beneath the chart");
  await page.locator('[data-map-layer="landmarks"]').click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 1, "Landmark layer can be hidden");
  await page.locator('[data-map-layer="landmarks"]').click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 3, "Landmark layer restored");
  await page.locator('[data-pw-lab="movement"]').click();
  await page.locator("#lab-toggle").click();
  assert.equal(await page.locator("#lab-toggle").getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator(".lab-import").isVisible(), true, "Ina-CORS import appears in lab mode");
  assert.equal(await page.locator("#sample-btn").isVisible(), true, "Explicit synthetic mode available only in lab");
  assert.equal(await page.locator('[data-pw-lab="sandbox"]').isVisible(),true,
    "Experimental tab only becomes available by explicit opt-in");
  await page.locator('[data-pw-lab="sandbox"]').click();
  assert.equal(await page.locator(".assets-panel").isVisible(),true,"Synthetic scheduling stays isolated");
  await page.locator('[data-pw-lab="gis"]').click();
  assert.equal(await page.locator("#geo-map .geo-marker").count(), 6, "Lab enables disclosed fictional GIS points");
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
  assert.equal(await page.locator("#case-outcome-name").isVisible(),true,
    "Selected sector and its next step are visible without using the map");
  assert.ok((await page.locator("#case-outcome-name").textContent()).length>3);
  assert.ok((await page.locator("#case-outcome-history").textContent()).includes("cm"),
    "Selected historic sector measurement is visible beside GIS reference workflow");
  assert.ok((await page.locator("#executive-desk").textContent()).includes("1–6 November 2026"), "Urgency includes dated BMKG historical context");
  assert.ok((await page.locator("#executive-desk").textContent()).includes("That window has passed"), "No active flood alarm falsely asserted");
  assert.ok((await page.locator("#historical-sector-detail").textContent()).includes("not a 2026 displacement rate"), "Historical measurement explicitly not current");
  await page.locator('#historical-filters button[data-filter="coastal"]').click();
  assert.equal(await fieldRows.count(), 3, "Historical coastal-sector filter works");
  await page.locator('#historical-filters button[data-filter="all"]').click();
  await page.locator('#historical-sector-list button[data-sector="west-breakwater"]').click();
  assert.ok((await page.locator("#historical-sector-detail").textContent()).includes("74–140 cm"), "Source-derived west breakwater result is presented");
  assert.equal(await page.locator("#case-outcome-name").textContent(),"West breakwater");
  assert.equal(await page.locator("#case-outcome-history").textContent(),"74–140 cm");
  assert.equal(await page.locator("#case-workspace-brief").isVisible(),true,
    "Selected sector has a real report action in the evidence workspace");
  assert.equal(await page.locator("#sector-detail-wrap").getAttribute("open"),null,
    "Sector detail stays collapsed until the user requests it");
  await page.evaluate(() => {
    window.__briefPrintCalled=false;
    window.print=()=>{window.__briefPrintCalled=true;};
  });
  await page.locator("#case-workspace-brief").click();
  const briefText=await page.locator("#print-report").textContent();
  assert.ok(briefText.includes("FIELD VERIFICATION BRIEF"),"Buyer receives a short field brief");
  assert.ok(briefText.includes("West breakwater"),"Brief follows the selected historical sector");
  assert.ok(briefText.includes("What we cannot conclude"),"Brief lists unsupported conclusions");
  assert.ok(briefText.includes("What to verify next"),"Brief contains actionable follow-up");
  assert.equal(await page.evaluate(()=>window.__briefPrintCalled),true,
    "Buyer-facing brief invokes Print/Save as PDF");


  // Live and offline map controls must be reversible without losing selection.
  await page.locator("#osm-toggle").click();
  assert.equal(await page.locator("#geo-osm-embed").isVisible(),true,
    "The primary map is a real Leaflet basemap");
  assert.ok((await page.locator("#street-map .leaflet-control-attribution").textContent())
    .includes("OpenStreetMap"),"Basemap credits OSM contributors");
  await page.locator("#osm-close").click();
  assert.equal(await page.locator("#geo-map").isVisible(),true,
    "Offline coordinate view remains available when tile access is unavailable");

  mkdirSync("reports", { recursive: true });
  await page.screenshot({ path: "reports/sentinel-judge-demo-desktop.png", fullPage: true });

  assert.equal(await page.locator("#pw-page-detail").isVisible(),true,
    "Full historical sector evidence remains accessible from the project detail page");

  await page.locator("#view-analyst").click();
  assert.equal(await page.locator("#view-analyst").getAttribute("aria-pressed"), "true", "Analyst view is selected");
  assert.equal(await page.locator(".pw-lab-context").isVisible(), true, "GNSS Lab has its own technical page heading");
  await page.locator('[data-pw-lab="gis"]').click();
  assert.equal(await page.locator(".controls").isVisible(), false, "Dedicated GIS tab does not stack GNSS import tools");
  assert.equal(await page.locator("#gis-audit").isVisible(), true, "Expanded GIS tab preserves the technical spatial provenance audit");
  assert.equal(await page.locator("#geo-audit-rows tr").count(), 4, "GIS table contains CSEM, landmarks and independent BAKO");
  assert.ok((await page.locator("#geo-audit-rows").textContent()).includes("Different station and time"),
    "GIS table flags that BAKO is not a local movement solution");
  await page.locator('[data-pw-lab="movement"]').click();
  assert.equal(await page.locator(".controls").isVisible(),true, "Position history exposes actual GNSS data controls");
  assert.equal(await page.locator(".chart-panel").isVisible(),true,
    "Historical CSEM position chart is visible without stacking QC and GIS");
  assert.equal(await page.locator("#station-qc").isVisible(),false,
    "Dedicated Position history tab does not stack the QC import section");
  assert.equal(await page.locator("#geo-context").isVisible(),false,
    "Map and geographic provenance remain available under GIS context");
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
  await page.waitForFunction(() => document.querySelector("#rinex-status")?.textContent?.includes("LOCALLY DECODED"),{timeout:10000});
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
  await page.evaluate(() => {
    document.querySelector("#map-disclosure").open=false;
    document.activeElement?.blur?.();
    window.scrollTo({top:0,behavior:"instant"});
  });
  const mobileDecisionBox=await page.locator("#case-workspace-outcome").boundingBox();
  const mobileListBox=await page.locator(".case-sites-column").boundingBox();
  assert.ok(mobileDecisionBox && mobileListBox && mobileDecisionBox.y<mobileListBox.y,
    "Mobile first impression shows the useful verification outcome before the list");
  assert.equal(await page.locator(".change-sector-link").isVisible(),true,
    "Mobile users can change the initially selected example");
  assert.equal(await page.locator("#map-disclosure").getAttribute("open"),null,
    "Mobile map starts collapsed");
  await page.screenshot({ path: "reports/sentinel-judge-demo-mobile-first-look.png", fullPage: true });
  await page.screenshot({ path: "reports/sentinel-judge-demo-mobile-decision.png", fullPage: true });
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 3);
  assert.equal(overflows, false, "Mobile viewport has no horizontal overflow");
  assert.equal(await page.locator("#case-workspace").isVisible(),true,
    "Spacious case workspace stays usable at 390px");
  assert.equal(await page.locator("#case-outcome-history").textContent(),"74–140 cm");

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
