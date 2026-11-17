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
 // Real source-backed GIS layer is separate from the four synthetic assets.
 await page.locator("#real-source-state[data-state=ok]").waitFor({timeout:10000});
 assert.match(await page.locator("#real-dsm-state").innerText(),/Tersedia/);
 // Real source-backed True Color basemap; pixel image integrity is checked before enabling.
 await page.locator('#basemap-satellite[aria-pressed="true"]').waitFor({timeout:10000});
 assert.equal(await page.locator('#basemap-satellite').isDisabled(),false);
 assert.match(await page.locator('#satellite-source-note').innerText(),/Sentinel-2 L2A · 14 Okt 2026/);
 assert.equal(await page.locator('.baruna-true-color-overlay').count(),0,"pane is dedicated, not a CSS fake map");
 assert.equal(await page.locator('.leaflet-image-layer').count()>=1,true,"real optical image is visible");
 await page.locator('#basemap-street').click();
 assert.equal(await page.locator('#basemap-street').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#satellite-opacity-control').isVisible(),false);
 await page.locator('#basemap-satellite').click();
 assert.equal(await page.locator('#basemap-satellite').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#satellite-opacity-control').isVisible(),true);
 await page.locator('#satellite-opacity').evaluate(input=>{
  input.value='65';input.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.equal(await page.locator('#satellite-opacity-value').innerText(),'65%');
 
 assert.match(await page.locator("#real-s2-count").innerText(),/16 scene/);
 assert.match(await page.locator("#real-s1-count").innerText(),/11 scene/);
 assert.equal(await page.locator("#real-scene option").count(),16);
 assert.equal(await page.locator(".leaflet-image-layer").count()>=1,true,"actual DSM preview overlay mounted");
 await page.locator("#real-sensor").selectOption("1");
 assert.equal(await page.locator("#real-scene option").count(),11);
 assert.match(await page.locator("#real-scene-details").innerText(),/Katalog GRD bukan data InSAR atau displacement/);
 await page.locator("#real-sensor").selectOption("2");
 assert.equal(await page.locator("#real-scene option").count(),16);
 await page.locator("#real-evidence").scrollIntoViewIfNeeded();
 await page.screenshot({path:"reports/baruna-spatial-real-source-evidence.png",fullPage:false});
 assert.match(await page.locator(".simulation-ribbon").innerText(),/DEMO SCENARIO/);
 assert.match(await page.locator(".simulation-ribbon").innerText(),/4 aset ilustratif, berbeda dari 6 sektor/);
 assert.match(await page.locator(".header-actions").innerText(),/Bukti Riset · 6 sektor/);
 assert.match(await page.locator(".chart-head").innerText(),/Perpindahan vertikal relatif/);
 assert.match(await page.locator(".chart-head").innerText(),/Dari awal periode/);
 assert.match(await page.locator("#rate-value").innerText(),/mm\/tahun/);
 assert.equal(await page.locator(".map-ranking-cta").getAttribute("href"),"#ranking");
 assert.equal(await page.locator(".ranking-back-link").getAttribute("href"),"#asset-map");
 assert.match(await page.locator(".workbench-footer").innerText(),/DEMO SCENARIO/);
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
 await page.locator(".map-ranking-cta").click();
 assert.equal(new URL(page.url()).hash,"#ranking");
 assert.equal(await page.locator("#ranking").isVisible(),true);
 await page.locator(".ranking-back-link").click();
 assert.equal(new URL(page.url()).hash,"#asset-map");
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
 assert.match(await page.locator("#compare-content").innerText(),/−103 mm\/tahun \(input tidak layak\)/);
 assert.match(await page.locator("#compare-content").innerText(),/Geometri aset belum diverifikasi/);
 assert.doesNotMatch(await page.locator("#compare-content").innerText(),/GEOMETRY, REPRESENTATIVENESS/);
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
 assert.match(await offline.locator(".simulation-ribbon").innerText(),/6 sektor penelitian historis/);
 assert.equal(await offline.locator(".map-ranking-cta").count(),1);
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
 assert.equal(await page.locator(".map-ranking-cta").isVisible(),true);
 assert.equal(await page.locator(".header-actions .header-link.secondary").isVisible(),true);
 await page.locator(".map-ranking-cta").click();
 assert.equal(new URL(page.url()).hash,"#ranking");
 await page.locator(".ranking-back-link").click();
 assert.equal(new URL(page.url()).hash,"#asset-map");
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

 // The research Workspace is intentionally separate from the four-asset scenario.
 const research=await browser.newPage({viewport:{width:1440,height:900}});
 research.on("pageerror",e=>exceptions.push(e.stack||e.message));
 await research.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
 await research.goto(BASE+"/?page=assessment",{waitUntil:"networkidle"});
 await research.locator("#pw-page-assessment").waitFor({state:"visible",timeout:12000});
 assert.match(await research.locator(".spatial-demo-entry").innerText(),/Decision Lab/);
 assert.equal(await research.locator(".workspaces-entry").getAttribute("href"),"./workspaces.html");
 await research.locator(".spatial-demo-entry").click();
 assert.match(research.url(),/spatial-demo\.html/);
 await research.locator(".asset-option").first().waitFor({state:"visible"});
 assert.equal(await research.locator(".asset-option").count(),4);
 await research.locator(".header-actions a.secondary").click();
 assert.match(research.url(),/page=assessment/);
 await research.locator("#pw-page-assessment").waitFor({state:"visible"});
 await research.close();
 // Validate the portfolio is a real navigation surface, not dead project placeholders.
 const portfolio=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 portfolio.on("pageerror",e=>exceptions.push(e.stack||e.message));
 const portfolioResponse=await portfolio.goto(BASE+"/workspaces.html",{waitUntil:"networkidle"});
 assert.equal(portfolioResponse.status(),200,"project portfolio is published in dist");
 assert.match(await portfolio.locator("h1").innerText(),/Data nyata untuk keputusan/);
 assert.equal(await portfolio.locator(".workspace-card").count(),4);
 assert.match(await portfolio.locator(".workspace-grid").innerText(),/Semarang Coastal/);
 assert.equal(await portfolio.locator(".workspace-card.real-primary").count(),1);
 assert.match(await portfolio.locator(".workspace-grid").innerText(),/Tanjung Emas/);
 assert.match(await portfolio.locator(".workspace-grid").innerText(),/Spatial Decision Lab/);
 assert.match(await portfolio.locator(".workspace-grid").innerText(),/GNSS Evidence Lab/);
 assert.match(await portfolio.locator(".workspace-grid").innerText(),/Data ilustratif/);
 assert.equal(await portfolio.locator('.workspace-card [href="./?page=assessment"]').count(),1);
 assert.equal(await portfolio.locator('.workspace-card [href="./spatial-demo.html"]').count(),1);
 assert.equal(await portfolio.locator('.workspace-card [href="./?page=analyst"]').count(),1);
 await portfolio.screenshot({path:"reports/baruna-commercial-workspaces-desktop.png",fullPage:false});
 await portfolio.setViewportSize({width:390,height:844});
 assert.equal(await portfolio.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+3),true,"portfolio has no horizontal page overflow on mobile");
 await portfolio.screenshot({path:"reports/baruna-commercial-workspaces-mobile.png",fullPage:false});
 await portfolio.locator('.workspace-card .card-action[href="./spatial-demo.html"]').click();
 assert.match(portfolio.url(),/spatial-demo\.html/);
 await portfolio.locator(".asset-option").first().waitFor({state:"visible"});
 assert.equal(await portfolio.locator(".asset-option").count(),4);
 await portfolio.locator('.header-actions a[href="./workspaces.html"]').click();
 assert.match(portfolio.url(),/workspaces\.html/);
 await portfolio.locator('.workspace-card .card-action[href="./?page=assessment"]').click();
 assert.match(portfolio.url(),/page=assessment/);
 await portfolio.locator("#pw-page-assessment").waitFor({state:"visible"});
 await portfolio.close();
 assert.deepEqual(exceptions,[],"no uncaught JavaScript errors");
 console.log("Spatial Decision video demo: map, 4 cases, brief, accessibility, mobile PASS");
}finally{await browser.close()}
