/**
 * BARUNA SaaS navigation and evidence integrity browser smoke.
 * Requires dist served at BASE and Playwright with Chrome installed.
 */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true,executablePath:process.env.BARUNA_CHROME_PATH||"/usr/bin/google-chrome",args:["--no-sandbox"]});
const tile=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3nE4wAAAAASUVORK5CYII=","base64");
const errors=[];
mkdirSync("reports",{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on("pageerror",error=>errors.push(error.stack||error.message));
 await page.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
 let response=await page.goto(BASE+"/",{waitUntil:"networkidle",timeout:30000});
 assert.equal(response?.status(),200);
 assert.equal(await page.locator(".saas-sidebar").count(),1);
 assert.match(await page.locator(".portfolio-intro h1").innerText(),/Your spatial portfolio/);
 assert.equal(await page.locator(".workspace-tile").count(),3);
 assert.equal(await page.locator('a[href="./workspaces.html"]').count()>0,true);
 assert.equal(await page.locator('a[href="./workspace-semarang.html"]').count()>0,true);
 await page.screenshot({path:"reports/baruna-saas-portfolio-desktop.png",fullPage:false});

 await page.locator(".saas-nav a").filter({hasText:"Workspaces"}).click();
 assert.match(page.url(),/workspaces\.html/);
 assert.equal(await page.locator("tbody tr").count(),3);
 assert.match(await page.locator("tbody tr").nth(1).innerText(),/Demo/);
 await page.locator('tbody tr a[href="./workspace-demo.html?city=jakarta"]').first().click();
 assert.match(page.url(),/workspace-demo.html\?city=jakarta/);
 assert.match(await page.locator(".saas-empty").innerText(),/No areas or datasets yet/);
 assert.equal(await page.locator("#area-map").count(),0,"demo must not fake a map");

 await page.goto(BASE+"/workspace-semarang.html",{waitUntil:"networkidle"});
 assert.match(await page.locator("h1").first().innerText(),/Semarang Coastal/);
 assert.match(await page.locator(".saas-recent-row").first().innerText(),/Tanjung Emas/);
 await page.locator(".saas-recent-row").first().click();
 assert.match(page.url(),/area-tanjung-emas.html/);
 await page.locator("#area-map.leaflet-container").waitFor({timeout:15000});
 await page.locator("body[data-saas-evidence=ready]").waitFor({timeout:15000});
 assert.equal(await page.locator('.area-tabs a[aria-current="page"]').getAttribute("href"),"#explorer");
 assert.match(await page.locator("#satellite-source-note").innerText(),/Sentinel-2|Peta jalan|True Color/);
 const status=await page.locator("#int-qa-share").innerText();
 assert.match(status,/91,31% qualified/);
 assert.match(await page.locator("#int-port-explanation").innerText(),/Phase is NoData/);
 await page.screenshot({path:"reports/baruna-saas-area-explorer-desktop.png",fullPage:false});

 await page.locator("#tab-intelligence").click();
 assert.equal(await page.locator("#panel-intelligence").isVisible(),true);
 assert.equal(await page.locator("#panel-explorer").isVisible(),false);
 assert.match(await page.locator("#panel-intelligence").innerText(),/Not validated/);
 assert.match(await page.locator("#panel-intelligence").innerText(),/Data insufficient/);
 assert.equal(await page.locator("#panel-intelligence .area-chart-placeholder").count(),1,
  "No invented annual displacement time series chart");
 await page.screenshot({path:"reports/baruna-saas-intelligence-desktop.png",fullPage:false});
 await page.locator("#tab-timeline").click();
 assert.match(await page.locator("#panel-timeline").innerText(),/2005/);
 assert.match(await page.locator("#panel-timeline").innerText(),/14 OCTOBER 2026/);
 await page.locator("#tab-data").click();
 assert.equal(await page.locator("#panel-data .dataset-card").count(),6);
 await page.locator("#tab-reports").click();
 assert.equal(await page.locator("#panel-reports .report-action").count(),4);
 await page.goto(BASE+"/areas.html",{waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("tbody tr").count(),1);
 await page.goto(BASE+"/data-catalog.html",{waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("tbody tr").count(),7);
 await page.goto(BASE+"/evidence-lab.html?page=analyst",{waitUntil:"domcontentloaded"});
 assert.equal(await page.locator(".ourdo-official-wordmark").count(),1,
  "existing evidence lab preserved at its new route");

 await page.goto(BASE+"/",{waitUntil:"domcontentloaded"});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.locator("#saas-menu-toggle").isVisible(),true);
 await page.locator("#saas-menu-toggle").click();
 assert.equal(await page.locator("#saas-menu-toggle").getAttribute("aria-expanded"),"true");
 await page.locator("#saas-nav-backdrop").click({position:{x:370,y:250}});
 assert.equal(await page.locator("#saas-menu-toggle").getAttribute("aria-expanded"),"false");
 const widths=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(widths.document<=widths.viewport+4,"no mobile horizontal overflow "+JSON.stringify(widths));
 await page.screenshot({path:"reports/baruna-saas-portfolio-mobile.png",fullPage:false});

 await page.goto(BASE+"/area-tanjung-emas.html#intelligence",{waitUntil:"networkidle"});
 await page.locator("body[data-saas-evidence=ready]").waitFor({timeout:15000});
 assert.equal(await page.locator("#panel-intelligence").isVisible(),true);
 const sizes=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(sizes.document<=sizes.viewport+4,"area mobile overflow "+JSON.stringify(sizes));
 await page.screenshot({path:"reports/baruna-saas-intelligence-mobile.png",fullPage:false});
 assert.deepEqual(errors,[],"no uncaught client-side errors");
 console.log("BARUNA enterprise SaaS navigation / science gate smoke PASSED");
}finally{
 await browser.close();
}
