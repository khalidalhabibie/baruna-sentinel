/** Browser guardrail: published subsidence periods are separate and interactive. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {readFileSync,mkdirSync} from "node:fs";

const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true,
 executablePath:process.env.BARUNA_CHROME_PATH||"/usr/bin/google-chrome",
 args:["--no-sandbox"]});
const errors=[];
mkdirSync("reports",{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
 page.on("pageerror",err=>errors.push(err.stack||err.message));
 const response=await page.goto(BASE+"/subsidence-evidence.html",{waitUntil:"networkidle",timeout:30000});
 assert.equal(response?.status(),200);
 await page.locator('body[data-source-state="ready"]').waitFor({timeout:15000});
 assert.match(await page.locator("#historical-count").innerText(),/6 sektor/);
 assert.match(await page.locator("#regional-rate").innerText(),/100–120 mm\/tahun/);
 assert.match(await page.locator("#radar-coverage").innerText(),/91,31%/);
 assert.equal(await page.locator(".hist-row").count(),6);
 assert.match(await page.locator("#selected-evidence").innerText(),/Bukan laju tahunan/);
 assert.match(await page.locator(".radar-port").innerText(),/NoData/);
 assert.equal(await page.locator("#export-evidence").isEnabled(),true);
 await page.screenshot({path:"reports/baruna-subsidence-evidence-desktop.png",fullPage:true});
 await page.locator('button[data-filter="coastal"]').click();
 assert.equal(await page.locator(".hist-row").count(),3);
 await page.locator('button[data-filter="road"]').click();
 assert.equal(await page.locator(".hist-row").count(),1);
 assert.match(await page.locator("#selected-name").innerText(),/Coaster Street/);
 await page.locator('button[data-filter="all"]').click();
 await page.locator('button[data-sector="west-breakwater"]').click();
 assert.match(await page.locator("#selected-range").innerText(),/74–140 cm/);
 const pending=page.waitForEvent("download");
 await page.locator("#export-evidence").click();
 const download=await pending;
 const doc=JSON.parse(readFileSync(await download.path(),"utf8"));
 assert.equal(doc.historical.sectors.length,6);
 assert.equal(doc.historical.sectors[3].maximumCm,140);
 assert.equal(doc.regional.portSpecific,false);
 assert.equal(doc.regional.velocityRasterInApplication,false);
 assert.equal(doc.scientificGates.measured2026PortSubsidence,false);
 assert.equal(doc.scientificGates.verifiedVerticalMmPerYear,false);
 assert.equal(doc.scientificGates.portOperationalRiskRanking,false);
 assert.equal(doc.radar.portPhaseNoData,true);
 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:"networkidle"});
 await page.locator('body[data-source-state="ready"]').waitFor({timeout:12000});
 const widths=await page.evaluate(()=>({
  viewport:innerWidth,document:document.documentElement.scrollWidth
 }));
 assert.ok(widths.document<=widths.viewport+4,"no horizontal overflow on mobile "+JSON.stringify(widths));
 await page.screenshot({path:"reports/baruna-subsidence-evidence-mobile.png",fullPage:true});
 assert.deepEqual(errors,[],"no uncaught JS errors");
 console.log("BARUNA subsidence atlas browser smoke PASSED");
}finally{await browser.close();}
