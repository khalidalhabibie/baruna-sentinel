/**
 * Browser-level smoke for the new spatial-video demo.
 * Tests real Leaflet polygon interaction, case-specific evidence, report
 * download and responsive layout. Polygon coordinates remain fictional.
 */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
mkdirSync("reports",{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.BARUNA_CHROME_PATH||"/usr/bin/google-chrome",args:["--no-sandbox"]});
const tile=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3nE4wAAAAASUVORK5CYII=","base64");
const exceptions=[];
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,acceptDownloads:true});
page.on("pageerror",e=>exceptions.push(e.stack||e.message));
await page.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
try{
 const response=await page.goto(BASE+"/spatial-demo.html",{waitUntil:"networkidle",timeout:30000});
 assert.equal(response?.status(),200);
 await page.locator("#asset-list .asset-option").first().waitFor({state:"visible",timeout:10000});
 assert.match(await page.locator(".simulation-ribbon").innerText(),/SIMULASI VIDEO/);
 assert.match(await page.locator(".workbench-footer").innerText(),/SIMULATION MODE/);
 assert.equal(await page.locator(".asset-option").count(),4);
 assert.equal(await page.locator(".spatial-map .leaflet-interactive").count()>=4,true,"4 synthetic polygons rendered in Leaflet");
 assert.equal(await page.locator(".map-zone-label").count(),4,"four illustrative zone symbols");
 assert.match(await page.locator("#tier-title").innerText(),/Prioritas tinggi/);
 assert.match(await page.locator("#rate-value").innerText(),/92/);
 assert.equal(await page.locator("#movement-chart svg").count(),1);
 assert.ok(await page.locator(".brand-link img").evaluate(img=>img.complete&&img.naturalWidth>0),"official Ourdo wordmark displays");
 const actionBounds=await page.locator("#open-brief").boundingBox();
 const paneBounds=await page.locator(".decision-pane").boundingBox();
 assert.ok(actionBounds&&paneBounds&&actionBounds.y>=paneBounds.y&&actionBounds.y+actionBounds.height<=paneBounds.y+paneBounds.height+3,
  "Verification Brief button visible in fixed decision action area without initial scroll");
 await page.screenshot({path:"reports/baruna-spatial-desktop-high.png",fullPage:false});
 await page.locator('[data-asset-id="sim-road"]').click();
 assert.match(await page.locator("#tier-title").innerText(),/Prioritas sedang/);
 assert.match(await page.locator("#rate-value").innerText(),/44/);
 assert.equal(await page.locator('[data-asset-id="sim-road"]').getAttribute("aria-pressed"),"true");
 await page.locator('[data-asset-id="sim-store"]').click();
 assert.match(await page.locator("#tier-title").innerText(),/Pantau berkala/);
 assert.match(await page.locator("#rate-value").innerText(),/9/);
 await page.locator('[data-asset-id="sim-incomplete"]').click();
 assert.match(await page.locator("#tier-title").innerText(),/Bukti belum cukup/);
 assert.match(await page.locator("#rate-value").innerText(),/tidak valid/i);
 assert.equal(await page.locator("#movement-chart svg").count(),0,"blocked case never plots fake qualified trend");
 assert.match(await page.locator("#reason-list").innerText(),/Geometri aset belum diverifikasi/);
 await page.screenshot({path:"reports/baruna-spatial-desktop-insufficient.png",fullPage:false});

 // Demonstrate map-to-detail connection: each polygon can select its asset.
 await page.locator(".leaflet-overlay-pane path.leaflet-interactive").first().dispatchEvent("click");
 assert.notEqual(await page.locator('[data-asset-id="sim-incomplete"]').getAttribute("aria-pressed"),"true","clicking a different polygon changes the active asset");

 await page.locator('[data-asset-id="sim-port"]').click();
 await page.locator("#open-brief").click();
 assert.equal(await page.locator("#brief-dialog").isVisible(),true);
 assert.match(await page.locator("#brief-body").innerText(),/Akses pelabuhan/);
 assert.match(await page.locator(".dialog-warning").innerText(),/SIMULASI/);
 assert.match(await page.locator("#brief-body").innerText(),/BUKAN|bukan/);
 const waitDownload=page.waitForEvent("download");
 await page.locator("#download-brief").click();
 const download=await waitDownload;
 assert.match(download.suggestedFilename(),/BARUNA_SIMULASI_Sektor_A_VERIFICATION_BRIEF\.txt/);
 await page.screenshot({path:"reports/baruna-spatial-desktop-brief.png",fullPage:false});
 await page.keyboard.press("Escape");
 assert.equal(await page.locator("#brief-dialog").isVisible(),false);

 await page.setViewportSize({width:390,height:844});
 await page.goto(BASE+"/spatial-demo.html",{waitUntil:"networkidle"});
 await page.locator("#asset-list .asset-option").first().waitFor({state:"visible"});
 const mobile=await page.evaluate(()=>{
  const nav=document.querySelector("#asset-list");
  const map=document.querySelector(".map-pane");
  const panel=document.querySelector(".decision-pane");
  return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
   rowDirection:getComputedStyle(nav).flexDirection,mapHeight:map.getBoundingClientRect().height,
   panelHeight:panel.getBoundingClientRect().height,zoneCount:document.querySelectorAll(".leaflet-overlay-pane path.leaflet-interactive").length};
 });
 assert.ok(mobile.scrollWidth<=mobile.viewport+3,"no horizontal overflow");
 assert.equal(mobile.rowDirection,"row","mobile asset list is swipeable");
 assert.ok(mobile.mapHeight>=280,"interactive map remains substantial on mobile");
 assert.equal(mobile.zoneCount,4,"mobile retains real interactive polygons");
 await page.screenshot({path:"reports/baruna-spatial-mobile-high.png",fullPage:false});
 await page.locator('[data-asset-id="sim-incomplete"]').click();
 assert.match(await page.locator("#tier-title").innerText(),/Bukti belum cukup/);
 await page.screenshot({path:"reports/baruna-spatial-mobile-insufficient.png",fullPage:false});
 assert.deepEqual(exceptions,[],"no uncaught JavaScript errors");
 console.log("Spatial Decision video demo: map, 4 cases, brief, accessibility, mobile PASS");
}finally{await browser.close()}
