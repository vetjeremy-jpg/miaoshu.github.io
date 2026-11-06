const {test,expect,devices}=require('@playwright/test');
const readers=['books/xia-ke-xing/comic/','books/jiankangjie-tingquanyin/comic/'];
for(const path of readers){
 test.describe(path,()=>{
  test('iPhone portrait swipe turns exactly one page',async({browser})=>{
   const context=await browser.newContext({...devices['iPhone 13']});const page=await context.newPage();await page.goto(path);await expect(page.locator('#counter')).not.toContainText('—');
   const before=await page.locator('#counter').textContent();const box=await page.locator('#book').boundingBox();await page.touchscreen.tap(box.x+box.width*.8,box.y+box.height*.5);
   await page.dispatchEvent('#book','touchstart',{touches:[{identifier:1,clientX:box.x+box.width*.8,clientY:box.y+box.height*.5}]});
   await page.dispatchEvent('#book','touchmove',{touches:[{identifier:1,clientX:box.x+box.width*.35,clientY:box.y+box.height*.5}]});
   await page.dispatchEvent('#book','touchend',{changedTouches:[{identifier:1,clientX:box.x+box.width*.25,clientY:box.y+box.height*.5}]});
   await expect(page.locator('#counter')).not.toHaveText(before);await context.close();
  });
  test('mobile landscape stays inside viewport and keeps controls reachable',async({page})=>{
   await page.setViewportSize({width:844,height:390});await page.goto(path);await expect(page.locator('#book')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await expect(page.locator('#prev')).toBeVisible();await expect(page.locator('#next')).toBeVisible();await expect(page.locator('.reader-exits')).toBeVisible();
  });
  test('viewport fullscreen remains usable without native Fullscreen API',async({page})=>{
   await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>Object.defineProperty(document.documentElement,'requestFullscreen',{value:undefined,configurable:true}));
   await page.goto(path);await expect(page.locator('#expand')).toBeEnabled();await page.locator('#expand').click();await expect(page.locator('body')).toHaveClass(/immersive/);
   await expect(page.locator('#collapse')).toBeVisible();await expect(page.locator('#next')).toBeVisible();await page.locator('#collapse').click();await expect(page.locator('body')).not.toHaveClass(/immersive/);
  });
 });
}

for(const path of readers){
 test.describe('iPhone safe areas '+path,()=>{
  for(const viewport of [{name:'portrait',width:390,height:844},{name:'landscape',width:844,height:390}]){
   test(viewport.name+' rotation keeps notch and home-indicator controls reachable',async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});await page.goto(path);await expect(page.locator('#counter')).not.toContainText('—');
    const visible=async selector=>page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&r.width>=44&&r.height>=44});
    expect(await visible('.reader-exits a:first-child')).toBe(true);expect(await visible('.reader-exits a:last-child')).toBe(true);
    await page.locator('#expand').click();await expect(page.locator('body')).toHaveClass(/immersive/);
    expect(await visible('#collapse')).toBe(true);expect(await visible('#prev')).toBe(true);expect(await visible('#next')).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const rotated=viewport.width>viewport.height?{width:390,height:844}:{width:844,height:390};await page.setViewportSize(rotated);await page.evaluate(()=>window.dispatchEvent(new Event('orientationchange')));await page.waitForTimeout(180);
    expect(await visible('#collapse')).toBe(true);expect(await visible('#next')).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   });
  }
 });
}

const IPHONE_REACHABILITY=[
 {name:'iPhone SE portrait',width:375,height:667,insets:{top:0,right:0,bottom:0,left:0}},
 {name:'iPhone 13 mini portrait',width:375,height:812,insets:{top:47,right:0,bottom:34,left:0}},
 {name:'iPhone 14 Pro portrait',width:393,height:852,insets:{top:59,right:0,bottom:34,left:0}},
 {name:'iPhone 15 Pro Max portrait',width:430,height:932,insets:{top:59,right:0,bottom:34,left:0}},
 {name:'iPhone 13 landscape',width:844,height:390,insets:{top:0,right:47,bottom:21,left:47}},
 {name:'iPhone 15 Pro Max landscape',width:932,height:430,insets:{top:0,right:59,bottom:21,left:59}}
];
for(const path of readers)test.describe('44px touch reachability '+path,()=>{
 for(const device of IPHONE_REACHABILITY)test(device.name,async({page})=>{
  await page.setViewportSize({width:device.width,height:device.height});
  await page.goto(path);await expect(page.locator('#counter')).not.toContainText('—');
  const assertTarget=async(selector,insets=device.insets)=>{
   const box=await page.locator(selector).boundingBox();expect(box,selector+' bounding box').toBeTruthy();
   expect(box.width,selector+' width').toBeGreaterThanOrEqual(44);expect(box.height,selector+' height').toBeGreaterThanOrEqual(44);
   expect(box.x,selector+' left safe area').toBeGreaterThanOrEqual(insets.left);
   expect(box.y,selector+' top safe area').toBeGreaterThanOrEqual(insets.top);
   expect(box.x+box.width,selector+' right safe area').toBeLessThanOrEqual(device.width-insets.right+1);
   expect(box.y+box.height,selector+' bottom safe area').toBeLessThanOrEqual(device.height-insets.bottom+1);
  };
  await assertTarget('.reader-exits a:first-child');
  await page.locator('#expand').click();await expect(page.locator('body')).toHaveClass(/immersive/);
  await assertTarget('#collapse');await assertTarget('#prev');await assertTarget('#next');
 });
});

for(const path of readers)test('image loading policy '+path,async({page})=>{
 await page.goto(path);await expect(page.locator('#counter')).not.toContainText('—');
 const first=page.locator('#book img').first();await expect(first).toHaveAttribute('loading','eager');await expect(first).toHaveAttribute('fetchpriority','high');
 await page.locator('#next').click();const current=page.locator('#book img').first();await expect(current).toHaveAttribute('loading','eager');await expect(current).toHaveAttribute('fetchpriority','high');
 const urls=await page.locator('#book img').evaluateAll(imgs=>imgs.map(i=>i.src));expect(urls.every(u=>!u.startsWith(location.origin))).toBe(true);
});

for(const path of readers)test.describe('comic image cache and slow network '+path,()=>{
 test('next then previous does not duplicate the same external image request',async({page})=>{
  const requests=[];page.on('request',r=>{if(r.resourceType()==='image')requests.push(r.url())});
  await page.goto(path);await expect(page.locator('#counter')).not.toContainText('—');const first=await page.locator('#book img').first().getAttribute('src');
  await page.locator('#next').click();await expect(page.locator('#counter')).not.toContainText('1 /');
  await page.locator('#prev').click();await expect(page.locator('#book img').first()).toHaveAttribute('src',first);
  expect(requests.filter(u=>u===first).length).toBeLessThanOrEqual(1);
 });
 test('slow network keeps first page prioritized and avoids eager page flood',async({page,context})=>{
  const client=await context.newCDPSession(page);await client.send('Network.enable');await client.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:75000});
  const requests=[];page.on('request',r=>{if(r.resourceType()==='image')requests.push(r.url())});await page.goto(path,{waitUntil:'domcontentloaded'});await expect(page.locator('#counter')).not.toContainText('—');
  const first=page.locator('#book img').first();await expect(first).toHaveAttribute('loading','eager');await expect(first).toHaveAttribute('fetchpriority','high');
  await page.waitForTimeout(250);expect(new Set(requests).size).toBeLessThanOrEqual(2);
 });
});

test('comic repository contract keeps page images external',async({request})=>{
 for(const path of readers){
  const html=await (await request.get(path)).text();
  expect(html).not.toMatch(/(?:src|href)=["'][^"']*\.(?:jpe?g|png|webp|avif)(?:[?#][^"']*)?["']/i);
 }
});
test('comic page assets never resolve to deployment origin',async({page})=>{
 for(const path of readers){
  await page.goto(path);await expect(page.locator('#counter')).not.toContainText('—');
  const urls=await page.locator('#book img').evaluateAll(imgs=>imgs.map(img=>new URL(img.currentSrc||img.src)));
  expect(urls.length).toBeGreaterThan(0);
  for(const url of urls){expect(url.origin).not.toBe(location.origin);expect(url.protocol).toBe('https:');}
 }
});

test('comic source and browser requests stay HTTPS cross-origin with no same-origin comic image assets',async({page,request})=>{
 const imageExt=/\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i;
 for(const path of readers){
  const source=await (await request.get(path)).text();
  const sourceImageRefs=[...source.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map(m=>m[1]).filter(u=>imageExt.test(u));
  expect(sourceImageRefs,'source must not embed local comic image files').toEqual([]);
  const imageRequests=[];
  page.on('request',r=>{if(r.resourceType()==='image')imageRequests.push(r.url())});
  await page.goto(path);await expect(page.locator('#counter')).not.toContainText('—');
  await page.locator('#next').click();await page.waitForTimeout(150);
  const origin=new URL(page.url()).origin;
  const comicUrls=await page.locator('#book img').evaluateAll(imgs=>imgs.map(i=>i.currentSrc||i.src));
  expect(comicUrls.length).toBeGreaterThan(0);
  for(const raw of comicUrls){const u=new URL(raw);expect(u.protocol).toBe('https:');expect(u.origin).not.toBe(origin);}
  for(const raw of imageRequests.filter(u=>comicUrls.includes(u))){const u=new URL(raw);expect(u.protocol).toBe('https:');expect(u.origin).not.toBe(origin);}
 }
});


for(const path of readers)test.describe('loading and failure states '+path,()=>{
 test('first screen exposes a clear loading status without a blank reader',async({page})=>{
  await page.route('**/pages.json',async route=>{await new Promise(r=>setTimeout(r,350));await route.continue()});
  await page.goto(path,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#status')).toContainText('正在載入漫畫目錄');
  await expect(page.locator('#book')).toHaveAttribute('aria-busy','true');
  await expect(page.locator('#counter')).not.toContainText('—');
 });
 test('failed comic image shows actionable error and retry control',async({page})=>{
  let failed=false;
  await page.route(/https:\/\/.+\.(?:jpg|jpeg|png|webp|avif)(?:\?.*)?$/i,async route=>{if(!failed){failed=true;await route.abort('failed')}else await route.continue()});
  await page.goto(path,{waitUntil:'domcontentloaded'});await expect(page.locator('#counter')).not.toContainText('—');
  await expect(page.locator('#book .error')).toContainText('圖片載入失敗');
  await expect(page.getByRole('button',{name:'重新載入這一頁'})).toBeVisible();
 });
 test('slow first image keeps a visible per-page loading message',async({page})=>{
  await page.route(/https:\/\/.+\.(?:jpg|jpeg|png|webp|avif)(?:\?.*)?$/i,async route=>{await new Promise(r=>setTimeout(r,500));await route.continue()});
  await page.goto(path,{waitUntil:'domcontentloaded'});await expect(page.locator('#counter')).not.toContainText('—');
  await expect(page.locator('#book [role="status"]')).toContainText('網路較慢時請稍候');
 });
});


for(const path of readers)test.describe('Safari slow-network recovery '+path,()=>{
 test('cached image cannot leave a stale loading overlay',async({page})=>{
  await page.goto(path);await expect(page.locator('#counter')).not.toContainText('—');
  const img=page.locator('#book img').first();await expect(img).toHaveClass(/loaded/);
  await page.locator('#next').click();await page.locator('#prev').click();
  await expect(page.locator('#book .placeholder')).toBeHidden();
  await expect(page.locator('#book .page-button')).toHaveAttribute('aria-busy','false');
 });
 test('retry disables itself while recovering and restores the page',async({page})=>{
  let failures=1;
  await page.route(/https:\/\/.+\.(?:jpg|jpeg|png|webp|avif)(?:\?.*)?$/i,async route=>{if(failures-- > 0)await route.abort('failed');else await route.continue()});
  await page.goto(path,{waitUntil:'domcontentloaded'});await expect(page.locator('#counter')).not.toContainText('—');
  const retry=page.getByRole('button',{name:'重新載入這一頁'});await expect(retry).toBeVisible();await retry.click();
  await expect(page.locator('#book img')).toHaveClass(/loaded/);
  await expect(page.locator('#book .error')).toHaveCount(0);
  await expect(page.locator('#book .placeholder')).toBeHidden();
 });
});
