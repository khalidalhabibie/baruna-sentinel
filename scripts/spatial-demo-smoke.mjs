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
 assert.match(await page.locator(".simulation-ribbon").innerText(),/DEMO SCENARIO/);
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
 assert.match(await page.locator(".dialog-warning").innerText(),/DEMO SCENARIO/);
 assert.match(await page.locator("#brief-body").innerText(),/BUKAN|bukan/);
 const waitDownload=page.waitForEvent("download");
 await page.locator("#download-brief").click();
 const download=await waitDownload;
 assert.match(download.suggestedFilename(),/BARUNA_DEMO_Sektor_A_VERIFICATION_BRIEF\.txt/);
 await page.screenshot({path:"reports/baruna-spatial-desktop-brief.png",fullPage:false});
 await page.keyboard.press("Escape");
 assert.equal(await page.locator("#brief-dialog").isVisible(),false);

 // Ranking and comparison must be synchronized to the exact assessment model.
 await page.locator("#ranking").scrollIntoViewIfNeeded();
 assert.equal(await page.locator("#ranking-rows tr").count(),4);
 assert.deepEqual(await page.locator("#ranking-rows tr .rank-index").allInnerTexts(),["01","02","03","—"]);
 assert.match(await page.locator("#ranking-summary").innerText(),/3 layak diranking · 1 perlu data/);
 assert.equal((await page.locator('#ranking-rows [data-rank-row="sim-port"] .rank-score').innerText()).trim(),"6");
 assert.equal((await page.locator('#ranking-rows [data-rank-row="sim-road"] .rank-score').innerText()).trim(),"4");
 assert.equal((await page.locator('#ranking-rows [data-rank-row="sim-store"] .rank-score').innerText()).trim(),"1");
 assert.equal((await page.locator('#ranking-rows [data-rank-row="sim-incomplete"] .rank-score').innerText()).trim(),"—");
 assert.match(await page.locator("#compare-content").innerText(),/Akses pelabuhan/);
 assert.match(await page.locator("#compare-content").innerText(),/Jalan pesisir/);
 await page.evaluate(()=>window.scrollTo({top:document.querySelector("#ranking").getBoundingClientRect().top+window.scrollY-12,behavior:"instant"}));
 await page.screenshot({path:"reports/baruna-spatial-desktop-ranking.png",fullPage:false});
 await page.locator('[data-compare-preset="blocked"]').click();
 assert.equal(await page.locator('[data-compare-preset="blocked"]').getAttribute("aria-pressed"),"true");
 assert.match(await page.locator("#compare-content").innerText(),/Struktur tepi air/);
 assert.match(await page.locator("#compare-content").innerText(),/Tidak layak diranking/);
 assert.match(await page.locator("#compare-content").innerText(),/−103 mm\/th \(input tidak layak\)/);
 await page.evaluate(()=>window.scrollTo({top:document.querySelector(".compare-header").getBoundingClientRect().top+window.scrollY-12,behavior:"instant"}));
 await page.screenshot({path:"reports/baruna-spatial-desktop-compare-blocked.png",fullPage:false});
 await page.locator('[data-compare-id="sim-store"]').check();
 assert.match(await page.locator("#compare-selection-count").innerText(),/3 dari 3 aset dipilih/);
 await page.locator('[data-compare-id="sim-road"]').click();
 assert.equal(await page.locator('[data-compare-id="sim-road"]').isChecked(),false,"cannot compare more than 3");
 await page.locator('[data-compare-preset="normal"]').click();
 assert.match(await page.locator("#compare-content").innerText(),/Jalan pesisir/);
 await page.locator('[data-focus-asset="sim-road"]').click();
 assert.match(await page.locator("#tier-title").innerText(),/Prioritas sedang/);
 assert.equal(await page.locator('[data-asset-id="sim-road"]').getAttribute("aria-pressed"),"true","ranking updates map/list selected asset");
 await page.locator("#ranking").scrollIntoViewIfNeeded();


 const offline=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 offline.on("pageerror",e=>exceptions.push(e.stack||e.message));
 await offline.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
 const standaloneUrl="file://"+process.cwd()+"/dist/baruna-spatial-demo-standalone.html";
 await offline.goto(standaloneUrl,{waitUntil:"load"});
 await offline.locator("#asset-list .asset-option").first().waitFor({state:"visible",timeout:10000});
 assert.equal(await offline.locator(".asset-option").count(),4,"file:// standalone HTML contains all scenarios");
 assert.equal(await offline.locator(".leaflet-overlay-pane path.leaflet-interactive").count(),4,"offline interactive map still renders");
 await offline.locator('[data-asset-id="sim-road"]').click();
 assert.match(await offline.locator("#tier-title").innerText(),/Prioritas sedang/);
 assert.equal(await offline.locator("#ranking-rows tr").count(),4,"standalone contains eligibility ranking");
 await offline.locator('[data-compare-preset="blocked"]').click();
 assert.match(await offline.locator("#compare-content").innerText(),/Tidak layak diranking/);

 await offline.screenshot({path:"reports/baruna-spatial-offline-standalone.png",fullPage:false});
 await offline.close();

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
 await page.locator("#ranking").scrollIntoViewIfNeeded();
 assert.equal(await page.locator("#ranking-rows tr").count(),4);
 await page.locator('[data-compare-preset="blocked"]').click();
 assert.match(await page.locator("#compare-content").innerText(),/Tidak layak diranking/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),true,"ranking & compare contain their own horizontal scroll");
 await page.evaluate(()=>window.scrollTo({top:document.querySelector("#ranking").getBoundingClientRect().top+window.scrollY-8,behavior:"instant"}));
 await page.screenshot({path:"reports/baruna-spatial-mobile-ranking.png",fullPage:false});

 assert.deepEqual(exceptions,[],"no uncaught JavaScript errors");
 console.log("Spatial Decision video demo: map, 4 cases, brief, accessibility, mobile PASS");
}finally{await browser.close()}
