const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const versions=[{name:'candidate',url:process.env.BASE_URL}];
if(process.env.BENCHMARK_BASE_URL)versions.unshift({name:'baseline',url:process.env.BENCHMARK_BASE_URL});
const pages=[
 {name:'home',path:'',readable:'h1'},
 {name:'gallery',path:'gallery/',readable:'h1'},
 {name:'journal',path:'posts/taipei-grand-trail-20260928/',readable:'h1'},
 {name:'long-novel',path:'books/jiankangjie-tingquanyin/',readable:'h1'}
];
const networks=[{name:'normal',latency:0,download:0,upload:0},{name:'slow',latency:150,download:200000,upload:100000}];

for(const width of [390,1280])for(const network of networks)for(const item of pages){
 test(`cross-page ${item.name} ${width}px ${network.name}`,async({browser},testInfo)=>{
  test.setTimeout(90000);
  const rows=[];
  for(const version of versions){
   expect(version.url,'benchmark must explicitly select the branch preview').toBeTruthy();
   const target=new URL(version.url);expect(['127.0.0.1','localhost']).toContain(target.hostname);
   const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
   const page=await context.newPage();
   const session=await context.newCDPSession(page);
   await session.send('Network.enable');
   // Isolate first-party costs; external providers are tested by the resilience suite.
   await session.send('Network.setBlockedURLs',{urls:['*googleusercontent.com/*','*instagram.com/*','*youtube.com/*','*youtube-nocookie.com/*','*chatgpt.site/*','*degoo.com/*']});
   if(network.name==='slow')await session.send('Network.emulateNetworkConditions',{offline:false,latency:network.latency,downloadThroughput:network.download,uploadThroughput:network.upload});
   await page.addInitScript(()=>{
    window.__pageBench={lcp:0,cls:0,longTasks:0};
    new PerformanceObserver(list=>{const es=list.getEntries();if(es.length)window.__pageBench.lcp=es[es.length-1].startTime}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__pageBench.cls+=e.value}).observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(list=>{window.__pageBench.longTasks+=list.getEntries().reduce((sum,e)=>sum+e.duration,0)}).observe({type:'longtask',buffered:true});
   });
   for(const visit of ['cold','revisit']){
    if(visit==='revisit')await page.goto('about:blank');
    await page.goto(new URL(item.path,version.url).href,{waitUntil:'domcontentloaded'});
    await expect(page.locator(item.readable).first()).toBeVisible();
    const readableMs=await page.evaluate(()=>performance.now());
    await page.waitForTimeout(400);
    if(item.name==='long-novel'){
     await page.locator('.chapter').last().scrollIntoViewIfNeeded();
     await expect(page.locator('.chapter').last()).toBeVisible();
     await page.evaluate(()=>scrollTo(0,0));
    }
    const metrics=await page.evaluate(()=>{
     const nav=performance.getEntriesByType('navigation')[0];
     const local=performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin===location.origin);
     return {...window.__pageBench,ttfbMs:nav.responseStart,domReadyMs:nav.domContentLoadedEventEnd,documentKB:nav.encodedBodySize/1024,transferKB:(nav.transferSize+local.reduce((sum,r)=>sum+r.transferSize,0))/1024,requests:local.length,overflow:document.documentElement.scrollWidth-innerWidth};
    });
    const row={version:version.name,page:item.name,width,network:network.name,visit,readableMs,...metrics};
    rows.push(row);console.log('PAGE_PERF '+JSON.stringify(row));
    expect(readableMs,'first heading should remain readable under the lab network').toBeLessThan(15000);
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.lcp).toBeGreaterThan(0);
   }
   await context.close();
  }
  const output=testInfo.outputPath('page-metrics.json');fs.writeFileSync(output,JSON.stringify(rows,null,2));
  await testInfo.attach('page-metrics',{path:output,contentType:'application/json'});
 });
}
