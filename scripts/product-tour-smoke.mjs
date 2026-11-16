/**
 * Browser visual QA — the map-first BARUNA workspace and dedicated guide.
 * No fake georeferenced sector markers or modal onboarding.
 */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
mkdirSync("reports",{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.BARUNA_CHROME_PATH||"/usr/bin/google-chrome",args:["--no-sandbox"]});
const errors=[];
const tile=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4/P4NAAV3Ar/lz70PAAAAAElFTkSuQmCC","base64");
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.on("pageerror",err=>errors.push(err.stack||err.message));
await page.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
try{
 assert.equal((await page.goto(BASE,{waitUntil:"networkidle",timeout:30000})).status(),200);
 await page.locator(".bf-workspace").waitFor({state:"visible",timeout:12000});
 assert.equal(await page.locator(".bf-sector").count(),6);
 assert.match(await page.locator("#bf-sector-detail").innerText(),/West breakwater/);
 assert.match(await page.locator("#bf-sector-detail").innerText(),/74–140/);
 assert.match(await page.locator("#bf-sector-detail").innerText(),/Bukti belum cukup/);
 assert.equal(await page.locator(".leaflet-container").count(),1);
 assert.equal(await page.locator(".bf-map-pane .leaflet-marker-icon").count(),0,"no fictional surveyed sector markers");
 assert.equal(await page.locator("#baruna-guide-panel").count(),0,"no first-visit popup");
 const logo=page.locator(".ourdo-official-wordmark");
 assert.equal(await logo.count(),1,"genuine official wordmark embedded");
 assert.equal(await logo.evaluate(e=>e.complete&&e.naturalWidth>0),true,"official local SVG renders");
 assert.equal(await page.locator(".ourdo-country-label").isVisible(),true);
 const desktopArt=await page.evaluate(()=>{
  const w=document.querySelector(".bf-workspace"),r=document.querySelector(".bf-result-pane"),m=document.querySelector(".bf-map-pane");
  return {workspaceBorder:getComputedStyle(w).borderTopWidth,decisionPosition:getComputedStyle(r).position,mapRadius:getComputedStyle(m).borderTopLeftRadius};
 });
 assert.equal(desktopArt.workspaceBorder,"0px","no enclosing card border around workspace");
 assert.equal(desktopArt.decisionPosition,"absolute","only one floating reading surface on map");
 assert.ok(parseFloat(desktopArt.mapRadius)>=18,"map uses softened corners");
 await page.screenshot({path:"reports/baruna-focus-home-desktop.png",fullPage:false});
 await page.locator('[data-bf-sector="container-wharf"]').click();
 assert.match(await page.locator("#bf-sector-detail").innerText(),/Container wharf/);
 assert.match(await page.locator("#bf-sector-detail").innerText(),/62–94/);
 await page.locator("#bf-open-review").click();
 assert.equal(await page.locator("#pw-page-assessment").isVisible(),true);
 await page.locator(".as-decision-panel").waitFor({state:"visible"});
 assert.match(await page.locator(".as-decision-panel").innerText(),/Container wharf/);
 assert.match(await page.locator(".as-decision-panel").innerText(),/DATA INSUFFICIENT/);
 await page.screenshot({path:"reports/baruna-focus-assessment-desktop.png",fullPage:false});
 await page.locator('.pw-primary-nav>[data-pw-page="guide"]').click();
 assert.equal(await page.locator("#pw-page-guide").isVisible(),true);
 assert.equal(await page.locator("#pw-page-guide [data-bg-step]").count(),4);
 assert.equal(await page.locator(".bg-guide-stage").count(),1);
 await page.locator('[data-bg-step="1"]').click();
 assert.match(await page.locator(".bg-guide-visual").innerText(),/74–140/);
 await page.locator('[data-bg-step="2"]').click();
 assert.match(await page.locator(".bg-guide-visual").innerText(),/Survei terbaru/);
 await page.locator('[data-bg-step="3"]').click();
 assert.match(await page.locator(".bg-guide-visual").innerText(),/DATA INSUFFICIENT/);
 assert.equal(await page.locator(".bg-guide-stage").evaluate(el=>getComputedStyle(el).borderTopWidth),"0px","guide no longer nests a frame of cards");
 assert.equal(await page.locator(".bg-guide-visual>div").evaluate(el=>getComputedStyle(el).borderTopWidth),"0px","illustration is not another bordered card");
 await page.screenshot({path:"reports/baruna-focus-guide-desktop.png",fullPage:false});
 await page.locator('.pw-primary-nav>[data-pw-page="why"]').click();
 assert.equal(await page.locator(".bf-workspace").isVisible(),true);
 await page.setViewportSize({width:390,height:844});
 await page.reload({waitUntil:"networkidle"});
 await page.locator(".bf-workspace").waitFor({state:"visible"});
 const sizes=await page.evaluate(()=>{
  const n=document.querySelector(".pw-primary-nav");
  const items=[...n.querySelectorAll(":scope > button, :scope > .baruna-nav-more > button")];
  return {width:innerWidth,document:document.documentElement.scrollWidth,rects:items.map(i=>i.getBoundingClientRect().toJSON())};
 });
 assert.ok(sizes.document<=sizes.width+3,"no page-wide horizontal scrolling");
 const sectorMetrics=await page.evaluate(()=>{
  const el=document.querySelector(".bf-sector-list");
  const rows=[...document.querySelectorAll(".bf-sector")].map(n=>n.getBoundingClientRect().toJSON());
  return {flexDirection:getComputedStyle(el).flexDirection,viewHeight:el.getBoundingClientRect().height,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,rows};
 });
 assert.equal(sectorMetrics.flexDirection,"row","sector list is horizontal on phones");
 assert.ok(sectorMetrics.viewHeight<115,"sector navigation does not swallow the viewport");
 assert.ok(sectorMetrics.rows.every(x=>x.height<110),"all case rows remain compact");
 assert.ok(sectorMetrics.scrollWidth>sectorMetrics.clientWidth,"six sectors can be reached by swiping");
 console.log("NAV_DEBUG",JSON.stringify(sizes));
 await page.screenshot({path:"reports/baruna-focus-home-mobile.png",fullPage:false});
 assert.ok(sizes.rects.every((r,i)=>r.width>=45&&(i===0||r.left>=sizes.rects[i-1].right-1)),"nav items nonoverlap");
 assert.ok(sizes.rects.at(-1).right<=sizes.width+3,"advanced navigation visible");
 await page.screenshot({path:"reports/baruna-focus-home-mobile.png",fullPage:false});
 await page.locator('.pw-primary-nav>[data-pw-page="guide"]').click();
 assert.equal(await page.locator("#pw-page-guide").isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),true);
 await page.screenshot({path:"reports/baruna-focus-guide-mobile.png",fullPage:false});
 assert.deepEqual(errors,[],"no runtime errors");
 console.log("MAP-FIRST WORKSPACE & FULL-PAGE GUIDE: browser QA passed");
}finally{await browser.close()}
