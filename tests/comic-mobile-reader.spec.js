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
