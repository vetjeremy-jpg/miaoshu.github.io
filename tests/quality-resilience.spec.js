const {test,expect}=require('@playwright/test');
test.beforeEach(async({page,baseURL})=>{await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL).origin?route.continue():route.abort())});
test('speech errors retry the same passage and preserve position',async({page})=>{
 await page.addInitScript(()=>{
  window.__spoken=[];window.SpeechSynthesisUtterance=class {constructor(text){this.text=text}};
  Object.defineProperty(window,'speechSynthesis',{value:{paused:false,speaking:false,pending:false,cancel(){},resume(){},pause(){},speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onerror?.({error:'synthesis-failed'}),10)}}});
 });
 await page.goto('books/liangzhongtiankong/');await page.locator('#audio-play').click();
 await expect(page.locator('#audio-status')).toContainText('已保留位置');
 const spoken=await page.evaluate(()=>window.__spoken);expect(spoken).toHaveLength(3);expect(new Set(spoken).size).toBe(1);
 await page.locator('#audio-play').click();await expect.poll(()=>page.evaluate(()=>window.__spoken.length)).toBeGreaterThan(3);
 expect(await page.evaluate(()=>window.__spoken[3])).toBe(spoken[0]);
});
test('homepage external photo failure keeps a usable album link',async({page})=>{
 await page.route('**/lh3.googleusercontent.com/**',route=>route.abort());
 await page.goto('./');const photo=page.locator('.album-photo').first();await photo.scrollIntoViewIfNeeded();
 await expect(photo.locator('.external-photo-error')).toContainText('照片暫時無法載入');
 await expect(photo.locator('.external-photo-error a')).toHaveAttribute('href','https://app.degoo.com/share/hZYKu2-zGCehoYFY1AkrqA');
});
for(const width of [320,375,390,430])test('reader keeps its layout at '+width,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('books/liangzhongtiankong/');
 await expect(page.locator('#audio-play')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('visited reader remains usable offline after worker control',async({page,context})=>{
 await page.goto('./');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
 await page.goto('books/liangzhongtiankong/');
 await expect.poll(()=>page.evaluate(async()=>{const cache=await caches.open('moonlit-runtime-v1');return (await cache.keys()).some(req=>new URL(req.url).pathname.endsWith('/books/reader.js'))})).toBe(true);
 await context.setOffline(true);await page.reload();
 await expect(page.locator('#audio-play')).toBeVisible();await expect(page.locator('.chapter').first()).toBeVisible();
 expect(await page.evaluate(()=>getComputedStyle(document.querySelector('.chapter')).fontSize)).not.toBe('');
 await context.setOffline(false);
});
