/** Browser QA for P1: all uploaded data are SYNTHETIC TEST FIXTURES. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {mkdirSync} from "node:fs";
const BASE=process.env.BASE_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true,
 executablePath:process.env.BARUNA_CHROME_PATH||"/usr/bin/google-chrome",args:["--no-sandbox"]});
const errors=[],file=(name,obj)=>({name,mimeType:"application/json",buffer:Buffer.from(JSON.stringify(obj))});
const station={type:"Feature",properties:{stationCode:"CSMG",sourceReference:"TEST-ONLY NOT OFFICIAL"},geometry:{type:"Point",coordinates:[110.4215,-6.9555]}};
const asset={type:"Feature",properties:{assetId:"TEST-ASSET-001",sourceReference:"TEST-ONLY NOT OFFICIAL"},geometry:{type:"Polygon",coordinates:[[[110.420,-6.956],[110.421,-6.956],[110.421,-6.955],[110.420,-6.955],[110.420,-6.956]]]}};
try{
 const page=await browser.newPage({viewport:{width:1380,height:900},acceptDownloads:true});
 page.on("pageerror",e=>errors.push(e.message));
 assert.equal((await page.goto(BASE+"/pilot-data-lab.html",{waitUntil:"domcontentloaded",timeout:30000})).status(),200);
 assert.match(await page.locator("h1").innerText(),/Dari data regional/);
 assert.match(await page.locator(".status-band").innerText(),/DATA INSUFFICIENT/);
 assert.match(await page.locator("#p1-demnas-import-result").innerText(),/Belum ada raster DEMNAS asli/);
 await page.locator("#p1-station-file").setInputFiles(file("station.geojson",station));
 await page.locator("#p1-asset-file").setInputFiles(file("asset.geojson",asset));
 await page.locator("#p1-link-result").getByText(/TEST-ASSET-001/).waitFor();
 assert.match(await page.locator("#p1-link-result").innerText(),/jarak geometris perkiraan/);
 assert.match(await page.locator("#p1-link-result").innerText(),/TIDAK memvalidasi laju gerak aset/);
 const ppp={schema:"baruna-processed-multignss-station-series-v1",station:"CSMG",
 sourceMode:"USER_SUPPLIED_PPP_SOLUTIONS_NOT_SOURCE_VERIFIED",
 processing:{method:"PPP",referenceFrame:"ITRF2020 TEST ONLY",processor:"TEST-ONLY SOLVER",
  rinexArchiveSha256:"a".repeat(64),constellations:["GPS","Galileo"]},
 epochs:[{date:"2026-11-15",upMeters:0,sigmaUpMeters:.005},
         {date:"2026-11-16",upMeters:-.012,sigmaUpMeters:.005}]};
 await page.locator("#p1-position-file").setInputFiles(file("ppp_TEST.json",ppp));
 assert.match(await page.locator("#p1-position-result").innerText(),/Rentang\/kelengkapan belum memadai untuk tren tahunan/);
 const nodata={objectId:0,name:"Pixel",value:"1.13427e+38",location:{x:110.42,y:-6.955,spatialReference:{wkid:4326}},
  properties:{Values:["1.13427e+38","2.2"]}};
 await page.route("https://geoservices.big.go.id/**",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(nodata)}));
 await page.locator("#p1-demnas-check").click();
 await page.locator("#p1-demnas-result").getByText(/TIDAK VALID/).waitFor();
 assert.match(await page.locator("#p1-demnas-result").innerText(),/1.13427e\+38/);
 assert.doesNotMatch(await page.locator("#p1-demnas-result").innerText(),/2,2 m/);
 const grid=Array.from({length:20},()=>Array(20).fill(3.2));
 const demnas={schema:"baruna-demnas-local-raster-preview-v1",
 sourceMode:"USER_SUPPLIED_GEOTIFF_DERIVED_NOT_BIG_AUTHENTICATED",sourceSha256:"b".repeat(64),
 fileName:"TEST_ONLY.tif",crs:"EPSG:4326",bboxWgs84:[110.375,-7.025,110.485,-6.875],
 originVerifiedByBig:false,canCompareTidalDatum:false,grid};
 await page.locator("#p1-demnas-file").setInputFiles(file("synthetic-preview.json",demnas));
 assert.match(await page.locator("#p1-demnas-import-result").innerText(),/400\/400 piksel valid/);
 assert.equal(await page.locator("#p1-demnas-preview").isVisible(),true);
 const pending=page.waitForEvent("download");await page.locator("#p1-export").click();
 const downloaded=await pending;
 const report=JSON.parse(await readFile(await downloaded.path(),"utf8"));
 assert.equal(report.schema,"baruna-p1-evidence-integration-audit-v1");
 assert.equal(report.evidenceGate,"DATA_INSUFFICIENT");
 assert.equal(report.realAssetOperationalRankingAllowed,false);
 assert.equal(report.stationAssetProximity.canTransferStationVelocityToAsset,false);
 assert.equal(report.processedPositionSource.descriptiveSlopeMmYear,null);
 assert.equal(report.demnasIdentify.valueMeters,null);
 assert.ok(!JSON.stringify(report).includes("coordinates"));
 assert.ok(!JSON.stringify(report).includes("epochs\":\["));
 mkdirSync("reports",{recursive:true});
 await page.screenshot({path:"reports/baruna-p1-data-lab-desktop.png",fullPage:false});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 mobile.on("pageerror",e=>errors.push(e.message));
 assert.equal((await mobile.goto(BASE+"/pilot-data-lab.html",{waitUntil:"domcontentloaded",timeout:30000})).status(),200);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),true,"P1 mobile must not overflow page");
 assert.equal(await mobile.locator("#p1-demnas-check").isVisible(),true);
 assert.deepEqual(errors,[]);
 console.log("P1 guarded GNSS/DEMNAS intake, station proximity, no fake priority, export and mobile PASS");
}finally{await browser.close();}
