/** Visual/browser integration check for the AOI pilot on the static production bundle. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
mkdirSync("reports",{recursive:true});
const errors=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.BARUNA_CHROME_PATH||"/usr/bin/google-chrome",args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:1430,height:900},deviceScaleFactor:1,acceptDownloads:true});
const tile=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4/P4NAAV3Ar/lz70PAAAAAElFTkSuQmCC","base64");
page.on("pageerror",e=>errors.push(e.stack||e.message));
await page.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
try{
 assert.equal((await page.goto(BASE+"/aoi-registry.html",{waitUntil:"networkidle",timeout:30000})).status(),200);
 await page.locator(".leaflet-container").waitFor({state:"visible",timeout:15000});
 assert.equal(await page.locator("#stat-areas").innerText(),"0");
 assert.equal(await page.locator("#check-evidence").isDisabled(),true);
 await page.screenshot({path:"reports/baruna-aoi-registry-empty.png",fullPage:false});
 const testGeoJSON={type:"FeatureCollection",features:[{type:"Feature",properties:{},geometry:{type:"Polygon",coordinates:[[
  [110.430,-6.960],[110.447,-6.960],[110.447,-6.943],[110.430,-6.943],[110.430,-6.960]
 ]]}}]};
 await page.locator("#upload-geojson").setInputFiles({name:"semarang-aoi.geojson",mimeType:"application/geo+json",buffer:Buffer.from(JSON.stringify(testGeoJSON))});
 assert.match(await page.locator("#map-hint").innerText(),/berhasil diimpor/);
 await page.locator("#aoi-name").fill("Tanjung Emas · AOI Pilot");
 await page.locator("#save-aoi").click();
 assert.equal(await page.locator("#stat-areas").innerText(),"1");
 assert.equal(await page.locator(".area-item").count(),1);
 assert.equal(await page.locator("#check-evidence").isDisabled(),false);
 assert.match(await page.locator("#queue-content").innerText(),/DATA INSUFFICIENT/);
 assert.equal(await page.locator(".queue-item").count(),5);
 await page.locator("#check-evidence").click();
 await page.locator("#evidence-content .scene-summary").waitFor({state:"visible",timeout:16000});
 assert.match(await page.locator("#evidence-content").innerText(),/Scene dihitung dari irisan polygon AOI dengan footprint katalog/);
 assert.match(await page.locator("#evidence-content").innerText(),/GRD/);
 assert.equal(await page.locator("#evidence-content .monitor-event").count(),1);
 assert.match(await page.locator("#evidence-content .monitor-history").innerText(),/METADATA|RIWAYAT PEMERIKSAAN/);
 assert.match(await page.locator("#cloud-state").innerText(),/Cloud belum dikonfigurasi|Backend tidak tersedia/);
 await page.screenshot({path:"reports/baruna-aoi-registry-checked.png",fullPage:false});
 const dl=page.waitForEvent("download");
 await page.locator("#export-brief").click();
 const download=await dl;assert.match(download.suggestedFilename(),/verification-brief\.json$/);
 await page.reload({waitUntil:"networkidle"});
 await page.locator(".area-item").waitFor({state:"visible"});
 assert.equal(await page.locator("#stat-areas").innerText(),"1");
 await page.locator(".area-item").click();
 assert.equal(await page.locator("#evidence-content .scene-summary").count(),1);
 assert.match(await page.locator("#queue-content").innerText(),/DATA INSUFFICIENT/);
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 mobile.on("pageerror",e=>errors.push(e.message));
 await mobile.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
 assert.equal((await mobile.goto(BASE+"/aoi-registry.html",{waitUntil:"networkidle",timeout:30000})).status(),200);
 assert.equal(await mobile.locator("#aoi-map").isVisible(),true);
 const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
 assert.equal(overflow,false,"mobile should not overflow width");
 await mobile.screenshot({path:"reports/baruna-aoi-registry-mobile.png",fullPage:true});
 assert.deepEqual(errors,[],"no JavaScript runtime errors");
 console.log("AOI registry: browser, import, save, manual evidence watch, queue, export, reload, mobile PASS");
}finally{await browser.close();}