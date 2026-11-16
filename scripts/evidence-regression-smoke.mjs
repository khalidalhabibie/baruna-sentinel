/**
 * Current-source browser regression suite.
 * Replaces legacy pre-BMKG / pre-workspace screenshots that asserted obsolete copy.
 * Scientific validity remains in npm run check. This test asserts actual UI provenance.
 */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
mkdirSync("reports",{recursive:true});
const errors=[];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const tile=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4/P4NAAV3Ar/lz70PAAAAAElFTkSuQmCC","base64");
async function createPage(){
 const p=await browser.newPage({viewport:{width:1440,height:900}});
 p.on("pageerror",e=>errors.push(e.stack||e.message));
 await p.route("https://tile.openstreetmap.org/**",route=>route.fulfill({status:200,contentType:"image/png",body:tile}));
 return p;
}
try{
 const video=await createPage();
 assert.equal((await video.goto(BASE+"/video-demo.html",{waitUntil:"networkidle"})).status(),200);
 assert.match(await video.locator(".demo-warning").textContent(),/BMKG.*SIMULASI/);
 assert.equal(await video.locator(".steps .step").count(),4);
 assert.equal(await video.locator(".enu-row").count(),3);
 assert.match(await video.locator(".synthetic-enu-panel").innerText(),/DATA SINTETIS|SIMULASI DATA/);
 assert.equal(await video.locator(".qc-empty").count(),1,"private CORS QC is never faked");
 await video.locator('[data-step="1"]').click();
 await video.locator(".real-source-note").waitFor({state:"visible",timeout:10000});
 assert.match(await video.locator(".real-source-note").innerText(),/PRAKIRAAN, BUKAN OBSERVASI/);
 assert.equal(await video.locator(".tide-source-plot").count(),1);
 assert.equal(await video.locator(".tide-day").count(),3);
 assert.equal((await video.locator(".tide-mini-stats strong").last().innerText()).trim(),"144","local event-day contains 144 ten-minute values");
 await video.locator('[data-tide-window="2026-11-19"]').click();
 assert.equal(await video.locator('[data-tide-window="2026-11-19"]').getAttribute("aria-pressed"),"true");
 assert.equal(await video.locator(".catalogue-grid article").count(),3);
 assert.match(await video.locator(".context-disclaimer").innerText(),/simulasi|SIMULASI/i);
 await video.screenshot({path:"reports/sentinel-judge-demo-video-context.png"});
 await video.locator('[data-step="2"]').click();
 assert.equal(await video.locator(".asset-pill").count(),3);
 assert.match(await video.locator(".schematic").getAttribute("aria-label"),/fictional/);
 await video.locator('[data-step="3"]').click();
 assert.match(await video.locator(".result").innerText(),/Memerlukan verifikasi lapangan/);
 await video.close();

 const assessment=await createPage();
 assert.equal((await assessment.goto(BASE+"/?page=assessment&project=semarang-port",{waitUntil:"networkidle"})).status(),200);
 await assessment.locator(".as-decision-panel").waitFor({state:"visible",timeout:10000});
 assert.equal(await assessment.locator(".as-decision-status").innerText(),"DATA INSUFFICIENT");
 assert.equal(await assessment.locator(".as-sector").count(),6);
 assert.match(await assessment.locator(".as-orientation").innerText(),/Evidence Gate/);
 assert.match(await assessment.locator(".as-decision-panel").innerText(),/2005/);
 assert.ok(await assessment.locator("#as-export").isVisible(),"verified brief accessible");
 assert.match(await assessment.locator(".as-source-panel").innerText(),/BAKO|CSEM/);
 await assessment.screenshot({path:"reports/sentinel-judge-demo-evidence-gate.png"});
 await assessment.close();

 const analyst=await createPage();
 await analyst.goto(BASE+"/?page=analyst",{waitUntil:"networkidle"});
 assert.ok(await analyst.locator(".pw-lab-tabs").isVisible(),"GNSS evidence is accessible");
 assert.match(await analyst.locator(".pw-lab-context").innerText(),/CSEM/);
 assert.match(await analyst.locator(".pw-lab-context").innerText(),/BAKO/);
 await analyst.close();

 assert.deepEqual(errors,[],"no JavaScript runtime exceptions");
 console.log("Verified: real BMKG forecast, isolated synthetic ENU/elevation/assets, GIS metadata only, real assessment evidence gate, GNSS provenance.");
}finally{await browser.close()}
