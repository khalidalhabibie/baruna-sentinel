/**
 * Browser product QA: decision-first BARUNA experience, proposal alignment,
 * first-use guided tour, source-backed assessment, responsive shell.
 * Run after npm run build + npm install playwright + npx playwright install chromium.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdirSync} from "node:fs";
const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
mkdirSync("reports",{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.BARUNA_CHROME_PATH||"/usr/bin/google-chrome",args:["--no-sandbox"]});
const errors=[];
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.on("pageerror",e=>errors.push(e.message));
page.on("console",msg=>{if(msg.type()==="error"&&!msg.text().includes("openstreetmap"))errors.push(msg.text())});
const tile=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4/P4NAAV3Ar/lz70PAAAAAElFTkSuQmCC","base64");
await page.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
try{
 const res=await page.goto(BASE,{waitUntil:"networkidle",timeout:30000});
 assert.equal(res?.status(),200);
 await page.locator(".bs-mission").waitFor({state:"visible"});
 assert.equal(await page.locator(".pw-primary-nav>button:visible").count(),4);
 assert.match(await page.locator(".bs-mission").innerText(),/West Breakwater|Tanjung Emas/);
 assert.match(await page.locator(".bs-mission").innerText(),/74–140 cm/);
 assert.match(await page.locator(".bs-mission").innerText(),/2005/);
 const guide=page.locator("#baruna-guide-panel");
 await guide.waitFor({state:"visible",timeout:8000});
 assert.match(await guide.innerText(),/Kenali misinya/);
 await page.screenshot({path:"reports/baruna-home-first-visit.png",fullPage:false});
 for(let i=1;i<=4;i++){
  await guide.locator(".baruna-guide-primary").click();
  await page.waitForTimeout(250);
  assert.match(await guide.innerText(),new RegExp("LANGKAH "+(i+1)+" DARI 5"));
 }
 assert.equal(await page.locator("#pw-page-assessment").isVisible(),true);
 assert.match(await page.locator(".as-decision-panel").innerText(),/DATA INSUFFICIENT/);
 await page.screenshot({path:"reports/baruna-evidence-gate.png",fullPage:false});
 await guide.locator(".baruna-guide-primary").click();
 assert.equal(await guide.isVisible(),false);
 await page.reload({waitUntil:"networkidle"});
 assert.equal(await guide.isVisible(),false,"tour completion persists on reload");
 await page.locator("#baruna-start-tour").click();
 assert.equal(await guide.isVisible(),true,"tour is replayable");
 await page.keyboard.press("Escape");
 assert.equal(await guide.isVisible(),false,"Escape closes tour");
 await page.locator(".baruna-more-trigger").click();
 assert.equal(await page.locator(".baruna-more-trigger").getAttribute("aria-expanded"),"true");
 assert.equal(await page.locator(".baruna-more-menu").isVisible(),true);
 await page.locator('.baruna-more-menu [data-pw-page="compare"]').click();
 assert.equal(await page.locator("#pw-page-compare").isVisible(),true,"advanced pages remain reachable");
 await page.locator('.pw-primary-nav>[data-pw-page="assessment"]').click();
 await page.locator(".as-decision-panel").waitFor({state:"visible"});
 assert.ok((await page.locator(".as-orientation").innerText()).includes("Evidence Gate"));
 assert.ok((await page.locator(".as-decision-panel #as-export").isVisible()),"print brief is accessible");
 await page.screenshot({path:"reports/baruna-assessment-desktop.png",fullPage:false});
 await page.setViewportSize({width:390,height:844});
 await page.goto(BASE,{waitUntil:"networkidle"});
 await page.locator(".bs-mission").waitFor({state:"visible"});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+3),true,"no horizontal overflow on mobile homepage");
 await page.screenshot({path:"reports/baruna-home-mobile.png",fullPage:false});
 assert.deepEqual(errors,[],"no browser JavaScript errors");
 console.log("BARUNA decision-first product browser QA PASS; screenshots in reports/");
}finally{await browser.close()}
