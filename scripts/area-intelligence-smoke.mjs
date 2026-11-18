import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";

const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
mkdirSync("reports",{recursive:true});
const errors=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.BARUNA_CHROME_PATH||"/usr/bin/google-chrome",args:["--no-sandbox"]});
const tile=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3nE4wAAAAASUVORK5CYII=","base64");
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:width===1440?900:844}});
  page.on("pageerror",e=>errors.push(e.stack||e.message));
  await page.route("https://tile.openstreetmap.org/**",r=>r.fulfill({status:200,contentType:"image/png",body:tile}));
  const res=await page.goto(BASE+"/area-tanjung-emas.html?intel=ranking#intelligence",{waitUntil:"networkidle",timeout:40000});
  assert.equal(res?.status(),200);
  assert.equal(await page.locator("#panel-intelligence").isVisible(),true);
  assert.equal(await page.locator("#intel-ranking").isVisible(),true);
  assert.equal(await page.locator("#intel-findings").isVisible(),false);
  assert.equal(await page.locator('#intelligence').count(),1,"intelligence deep link should have a real element");
  await page.locator("#intel-ranking-rows tr").first().waitFor({timeout:16000});
  assert.equal(await page.locator("#intel-ranking-rows tr").count(),6);
  assert.equal(await page.locator("#intel-ranking-rows .saas-chip-warn").count(),6);
  assert.match(await page.locator("#intel-ranking").innerText(),/NOT AVAILABLE/i);
  assert.match(await page.locator(".intel-ranking-scoreboard").innerText(),/ASET LAYAK DIRANKING/);
  assert.match(await page.locator(".intel-ranking-nogo").innerText(),/Belum cukup bukti/);
  const rankingBox=await page.locator(".intel-ranking-header").boundingBox();
  const disclosureBox=await page.locator(".intel-gnss-disclosure").boundingBox();
  assert.ok(rankingBox&&disclosureBox&&rankingBox.y<disclosureBox.y,
     "ranking contents must precede GNSS technical queue");
  assert.equal(await page.locator(".intel-gnss-disclosure").getAttribute("open"),null,
     "tech queue should not bury table by default");
  assert.ok(await page.evaluate(()=>scrollY>0),"deep-link should scroll into the intelligence panel");

  await page.locator(".intel-gnss-disclosure summary").click();
  await page.locator(".gnss-priority-row").first().waitFor({timeout:16000});
  assert.equal(await page.locator(".gnss-priority-row").count(),4);
  assert.match(await page.locator("#intel-gnss-review").innerText(),/CSEM \/ CSMG/);
  assert.equal(await page.locator(".intel-gnss-disclosure").getAttribute("open"),"");
  assert.equal(await page.locator('#intel-ranking a[href="./spatial-demo.html#ranking"]').count(),1);
  await page.locator(".intel-gnss-disclosure summary").click();
  assert.equal(await page.locator(".intel-gnss-disclosure").getAttribute("open"),null);

  const viewport=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(viewport.document<=viewport.viewport+4,"no area horizontal overflow: "+JSON.stringify(viewport));
  await page.screenshot({path:"reports/baruna-area-ranking-"+(width===1440?"desktop":"mobile")+".png",fullPage:false});
  await page.close();
 }
 assert.deepEqual(errors,[],"no browser runtime errors");
 console.log("Tanjung Emas source-backed ranking first, stable deep-link, GNSS disclosure, and desktop/mobile PASS");
}finally{await browser.close();}
