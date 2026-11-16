/** Browser smoke for real source-backed Semarang Coastal MVP. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {readFileSync,mkdirSync} from "node:fs";

const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true,
  executablePath:process.env.BARUNA_CHROME_PATH||"/usr/bin/google-chrome",
  args:["--no-sandbox"]});
const tile=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3nE4wAAAAASUVORK5CYII=","base64");
const errors=[];
mkdirSync("reports",{recursive:true});

try{
  const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
  page.on("pageerror",err=>errors.push(err.stack||err.message));
  await page.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
  const response=await page.goto(BASE+"/real-workspace.html",{waitUntil:"networkidle",timeout:30000});
  assert.equal(response?.status(),200);
  await page.locator('body[data-evidence-state="ready"]').waitFor({timeout:15000});
  assert.match(await page.locator("#stat-dsm").innerText(),/Available/);
  assert.match(await page.locator("#stat-s2").innerText(),/16 scenes/);
  assert.match(await page.locator("#stat-s1").innerText(),/11 scenes/);
  assert.equal(await page.locator("#gate-grid .gate-card").count(),6);
  assert.equal(await page.locator("#gate-grid .gate-card.available").count(),2);
  assert.equal(await page.locator("#gate-grid .gate-card.blocked").count(),4);
  assert.equal(await page.locator("#scene option").count(),16);
  assert.ok(await page.locator("#real-map .leaflet-image-layer").count()>0,"real DSM raster overlay mounted");
  assert.match(await page.locator("#scene-details").innerText(),/Source metadata only/);
  await page.screenshot({path:"reports/baruna-real-workspace-desktop.png",fullPage:false});
  await page.locator("#sensor").selectOption("1");
  assert.equal(await page.locator("#scene option").count(),11);
  assert.match(await page.locator("#scene-details").innerText(),/Sentinel-1 GRD/);
  await page.locator("#sensor").selectOption("2");
  assert.equal(await page.locator("#scene option").count(),16);
  await page.locator("#toggle-dsm").uncheck();
  assert.equal(await page.locator("#real-map .leaflet-image-layer").count(),0,"toggle hides DSM");
  await page.locator("#toggle-dsm").check();
  assert.ok(await page.locator("#real-map .leaflet-image-layer").count()>0,"toggle shows DSM");
  await page.locator("#real-map").click({position:{x:375,y:225}});
  assert.match(await page.locator("#elevation-readout").innerText(),/Copernicus DSM display grid/);
  await page.locator("#focus-scene").click();
  assert.match(await page.locator("#scene-details").innerText(),/Sentinel-2/);
  assert.equal(await page.locator("#export-evidence").isDisabled(),true,"AOI required before exporting");
  await page.locator("#full-aoi").click();
  assert.match(await page.locator("#area-analysis-status").innerText(),/Area dianalisis/);
  assert.match(await page.locator("#area-profile-content").innerText(),/Piksel valid/);
  assert.match(await page.locator("#area-profile-content").innerText(),/Median/);
  assert.equal(await page.locator("#tide-day").isDisabled(),false,"BMKG source was validated");
  await page.locator("#tide-day").selectOption("2026-11-19");
  assert.match(await page.locator("#tide-result").innerText(),/BMKG MSL/);
  assert.equal(await page.locator("#tide-chart svg polyline").count(),1);
  assert.equal(await page.locator("#export-evidence").isEnabled(),true);
  const wait=page.waitForEvent("download");
  await page.locator("#export-evidence").click();
  const download=await wait;
  assert.equal(download.suggestedFilename(),"BARUNA_Semarang_Real_Evidence_Brief.json");
  const report=JSON.parse(readFileSync(await download.path(),"utf8"));
  assert.equal(report.schema,"baruna-coastal-evidence-brief-v1");
  assert.equal(report.satelliteCatalogue.totalScenes,27);
  assert.ok(report.areaScreening.validPixels>=4);
  assert.equal(report.areaScreening.includesSeaAndStructures,true);
  assert.equal(report.bmkgForecastContext.dateWib,"2026-11-19");
  assert.equal(report.crossDatumComparisonAllowed,false);
  assert.equal(report.evidenceGates.realInsar,false);
  assert.equal(report.evidenceGates.assetLevelInspectionPriority,false);
  assert.equal(report.satelliteCatalogue.selectedScene.sourceKind,
    "CATALOGUE_METADATA_NOT_IMAGE_PIXELS");
  // Real workspace is the primary destination and the simulation is separate.
  await page.goto(BASE+"/workspaces.html",{waitUntil:"domcontentloaded"});
  assert.equal(await page.locator(".workspace-card.real-primary").count(),1);
  assert.match(await page.locator(".workspace-card.real-primary").innerText(),/Source-backed MVP/);
  assert.equal(await page.locator('.workspace-card.real-primary a.card-action').getAttribute("href"),
    "./real-workspace.html");
  assert.match(await page.locator(".workspace-card .state.demo").innerText(),/simulated/);
  await page.setViewportSize({width:390,height:844});
  await page.goto(BASE+"/real-workspace.html",{waitUntil:"networkidle"});
  await page.locator('body[data-evidence-state="ready"]').waitFor({timeout:10000});
  const widths=await page.evaluate(()=>({
    viewport:innerWidth,document:document.documentElement.scrollWidth,
    map:document.querySelector("#real-map").getBoundingClientRect().width
  }));
  assert.ok(widths.document<=widths.viewport+4,"no horizontal overflow on mobile "+JSON.stringify(widths));
  assert.ok(widths.map>=280,"real map usable on mobile");
  await page.screenshot({path:"reports/baruna-real-workspace-mobile.png",fullPage:false});
  assert.deepEqual(errors,[],"no uncaught JS errors");
  console.log("BARUNA REAL COASTAL MVP browser smoke PASSED");
} finally {
 await browser.close();
}
