/** Static-browser source gate: SLC candidate metadata must never enable InSAR claims. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
const reference=JSON.parse(readFileSync(new URL("../data/semarang-s1-insar-candidate-review.json",import.meta.url),"utf8"));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
const tile=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4/P4NAAV3Ar/lz70PAAAAAElFTkSuQmCC","base64");
async function page(){
 const p=await browser.newPage({viewport:{width:1360,height:850}});
 p.on("pageerror",e=>errors.push(e.message));
 await p.route("https://tile.openstreetmap.org/**",route=>route.fulfill({
  status:200,contentType:"image/png",body:tile}));
 return p;
}
try {
 const live=await page();
 assert.equal((await live.goto(BASE+"/real-workspace.html",{waitUntil:"domcontentloaded"})).status(),200);
 await live.waitForFunction(()=>document.getElementById("insar-review-status")?.textContent?.includes("Kandidat riset"),{timeout:20000});
 assert.match(await live.locator("#insar-review-summary").innerText(),/19 Sentinel-1 IW SLC scene/);
 assert.match(await live.locator("#insar-review-summary").innerText(),/48 kandidat pasangan/);
 assert.equal(await live.locator("#insar-review-pairs li").count(),5);
 assert.match(await live.locator("#insar-review-limits").innerText(),/Belum ada interferogram/);
 assert.ok(!(await live.locator("#insar-research").evaluate(x=>x.open)),"nonintrusive panel collapsed by default");
 assert.match(await live.locator("#gate-grid").innerText(),/InSAR displacement/);
 await live.close();

 const blocked=await page();
 await blocked.route("**/data/semarang-s1-insar-candidate-review.json",route=>{
  const tampered=structuredClone(reference);
  tampered.scientificGates.insarDisplacementProduced=true;
  return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(tampered)});
 });
 assert.equal((await blocked.goto(BASE+"/real-workspace.html",{waitUntil:"domcontentloaded"})).status(),200);
 await blocked.waitForFunction(()=>document.getElementById("insar-review-status")?.textContent?.includes("Belum tersedia"),{timeout:20000});
 assert.equal(await blocked.locator("#insar-review-pairs li").count(),0);
 assert.match(await blocked.locator("#insar-review-summary").innerText(),/Kandidat InSAR belum bisa diverifikasi/);
 await blocked.close();
 assert.deepEqual(errors,[]);
 console.log("Insar research UI PASS: candidate-only metadata, 5 sampled pairs, blocked scientific conclusions.");
} finally {
 await browser.close();
}
