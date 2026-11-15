import {chromium} from "playwright";
const target=process.env.PRODUCTION_URL||"https://baruna-sentinel.vercel.app";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const issues=[],assets={};
page.on("pageerror",error=>issues.push(error.message.slice(0,260)));
page.on("response",response=>{
  const url=response.url();
  if(/\/src\/(navigation|app|station-qc)\.js/.test(url)){
    const name=new URL(url).pathname;
    assets[name]={status:response.status(),type:response.headers()["content-type"]};
  }
});
try {
  const result=await page.goto(target,{waitUntil:"domcontentloaded",timeout:22000});
  const status=result?.status()||0;
  const nav=page.locator("#view-analyst");
  await nav.waitFor({state:"visible",timeout:9000});
  await nav.click();
  await page.waitForTimeout(450);
  const analyst={
    visible:await page.locator("#station-qc").isVisible(),
    selected:await nav.getAttribute("aria-pressed"),
    mode:await page.locator("body").getAttribute("data-view")
  };
  await page.locator("#view-decision").click();
  await page.waitForTimeout(350);
  const overview={
    visible:await page.locator("#case-workspace").isVisible(),
    selected:await page.locator("#view-decision").getAttribute("aria-pressed"),
    mode:await page.locator("body").getAttribute("data-view")
  };
  const resultData={target,status,analyst,overview,assets,issues};
  console.log("PRODUCTION_BROWSER_DIAGNOSTIC",JSON.stringify(resultData));
  if(!(status===200&&analyst.visible&&analyst.selected==="true"&&analyst.mode==="analyst"&&
      overview.visible&&overview.selected==="true"&&overview.mode==="decision"))
    process.exitCode=1;
}catch(error){
  console.log("PRODUCTION_BROWSER_DIAGNOSTIC_ERROR",String(error.message||error).slice(0,700));
  process.exitCode=1;
}finally{
  await browser.close();
}
