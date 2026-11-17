/** Four-stage source-backed RGPD demo regression smoke for Chrome and mobile. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const BASE=process.env.BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,executablePath:process.env.BARUNA_CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));
 assert.equal((await page.goto(BASE+'/proposal-demo.html',{waitUntil:'networkidle',timeout:30000})).status(),200);
 await page.locator('.station-card').first().waitFor({state:'visible',timeout:12000});
 assert.equal(await page.locator('.station-card').count(),2);
 // Onsite judge clarity: a static, source-truthful status map and bounded pilot.
 assert.equal(await page.locator("#pilot-readiness").isVisible(),true);
 assert.equal(await page.locator("#pilot-readiness .pilot-status-card").count(),3);
 const readiness=await page.locator("#pilot-readiness").innerText();
 assert.match(readiness,/SUDAH TERSEDIA/);
 assert.match(readiness,/FITUR PROTOTIPE BERJALAN/);
 assert.match(readiness,/BELUM TERSEDIA/);
 assert.match(readiness,/BAKO 2025 di Cibinong, bukan Semarang/);
 assert.match(readiness,/DATA INSUFFICIENT/);
 assert.match(readiness,/0 aset nyata/);
 assert.match(readiness,/10 hari kerja/);
 assert.match(readiness,/Hipotesis durasi/);
 assert.match(readiness,/Belum ada kerja sama/);
 assert.equal(await page.locator("#pilot-readiness .pilot-plan-grid>div").count(),3);
 assert.equal(await page.locator("#pilot-readiness .pilot-conversation li").count(),3);
 assert.equal(await page.locator(".pilot-hero-link").getAttribute("href"),"#pilot-readiness");
 const home=await browser.newPage({viewport:{width:1280,height:760}});
 try{
   assert.equal((await home.goto(BASE+"/",{waitUntil:"networkidle",timeout:30000})).status(),200);
   assert.equal(await home.locator('.rgpd-more-tools a[href="./proposal-demo.html#pilot-readiness"]').count(),1);
 }finally{await home.close()}

 assert.match(await page.locator('#demo-stations').innerText(),/94,03/);
 assert.match(await page.locator('#demo-stations').innerText(),/4,92/);
 assert.match(await page.locator('#demo-stations').innerText(),/3,23/);
 assert.equal(await page.locator('.rank-row').count(),4);
 assert.equal(await page.locator('.gate-item').count(),5);
 assert.match(await page.locator('.print-brief').innerText(),/DATA INSUFFICIENT/);
 assert.equal(await page.locator('#demo-sector option').count(),6);
 assert.equal(await page.locator('#demo-sector').inputValue(),'coaster-street','Coaster Road is the guided default');
 assert.equal(await page.locator('#demo-bako-qc .qc-metrics>div').count(),3);
 assert.match(await page.locator('#demo-bako-qc').innerText(),/CIBINONG/);
 assert.match(await page.locator('#demo-bako-qc').innerText(),/41/);
 assert.match(await page.locator('#demo-bako-qc').innerText(),/44,63/);
 assert.match(await page.locator('#demo-bako-qc').innerText(),/8,95/);
 assert.equal(await page.locator('#demo-verification-actions .verification-action').count(),4);
 assert.match(await page.locator('#demo-verification-actions').innerText(),/725/);
 
 // Additional published survey table is visible but fails the geodetic source QA.
 await page.locator('.public-reference summary').click();
 assert.match(await page.locator('#demo-public-reference').innerText(),/TB 1–TB 2/);
 assert.match(await page.locator('#demo-public-reference').innerText(),/0,001 m/);
 assert.equal(await page.locator('#demo-public-reference tbody tr').count(),6);
 await page.locator('#demo-sector').selectOption('coaster-street');
 assert.match(await page.locator('#demo-coaster-evidence').innerText(),/725/);
 assert.match(await page.locator('#demo-coaster-evidence').innerText(),/Universitas Trisakti/);
 assert.match(await page.locator('#demo-real-outcome').innerText(),/DATA INSUFFICIENT/);
 
 await page.locator('#demo-sector').selectOption('container-wharf');
 assert.match(await page.locator('.print-brief').innerText(),/Container wharf/i);
 const downloadPromise=page.waitForEvent('download');await page.locator('#demo-download').click();
 const download=await downloadPromise;
 const payload=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.equal(payload.decision.rankedRealAssets,0);assert.equal(payload.stationPublication.stations.length,2);
 assert.equal(payload.syntheticAnnex.records.length,4);
 assert.equal(payload.syntheticAnnex.records[3].score,null);
 assert.equal(payload.independentRinexQc.station,'BAKO00IDN');
 assert.equal(payload.independentRinexQc.supportsSemarangMotion,false);
 assert.equal(payload.verificationBacklog.rankingAllowed,false);
 assert.equal(payload.verificationBacklog.actions.length,4);
 
 assert.equal(payload.publishedSecondaryContext.historicalBenchmarkReference.rankAllowed,false);
 assert.equal(payload.publishedSecondaryContext.linkedCoasterRoadContext,null);
 
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});mobile.on('pageerror',e=>errors.push(e.message));
 assert.equal((await mobile.goto(BASE+'/proposal-demo.html',{waitUntil:'networkidle',timeout:30000})).status(),200);
 await mobile.locator('.station-card').first().waitFor({state:'visible'});
 const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 if(overflow){
  const offenders=await mobile.evaluate(()=>[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName.toLowerCase(),cls:String(e.className||'').slice(0,80),id:e.id,x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right,w:e.getBoundingClientRect().width})).filter(x=>x.right>innerWidth+2||x.x<-2).slice(0,18));
  console.log('MOBILE_OVERFLOW_DEBUG',JSON.stringify({scrollWidth:await mobile.evaluate(()=>document.documentElement.scrollWidth),offenders}));
 }

 assert.equal(overflow,false,'guided demo should not horizontally overflow mobile screen');
 await mobile.locator("#pilot-readiness").scrollIntoViewIfNeeded();
 assert.equal(await mobile.locator("#pilot-readiness").isVisible(),true);
 assert.equal(await mobile.locator("#pilot-readiness .pilot-status-card").count(),3);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,"pilot-readiness must not cause horizontal overflow");

 assert.deepEqual(errors,[]);
 console.log('BARUNA four-step demo: source-backed CORS, six historic sectors, synthetic ranking, export, mobile PASS');
}finally{await browser.close();}