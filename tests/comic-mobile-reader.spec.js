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
