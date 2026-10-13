const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fixture = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="30"><rect width="20" height="30" fill="gold"/></svg>';

async function setup(page) {
 const pending=new Map();
 await page.route('**/preview-*.svg',route=>route.fulfill({contentType:'image/svg+xml',body:fixture}));
 await page.route('**/original-*.svg',async route=>{
  const name=new URL(route.request().url()).pathname;
  await new Promise(resolve=>pending.set(name,async fail=>{
   if(fail)await route.abort();else await route.fulfill({contentType:'image/svg+xml',body:fixture});
   resolve();
  }));
 });
 await page.goto('./', {waitUntil:'domcontentloaded'});
 await page.setContent(`<section class="gallery">${['a','b'].map(id=>`<figure><a href="/original-${id}.svg"><img src="/preview-${id}.svg" data-full-src="/original-${id}.svg" alt="作品 ${id}"></a><figcaption><strong>作品 ${id}</strong></figcaption></figure>`).join('')}</section>`);
 await expect.poll(()=>page.locator('.gallery img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
 await page.addScriptTag({path:path.resolve('photo-viewer.js')});
 return pending;
}

test('shows existing preview while original is pending, then upgrades', async ({page})=>{
 const pending=await setup(page);
 await page.locator('.gallery a').first().click();
 const image=page.locator('.photo-viewer-image');
 await expect(image).toBeVisible();
 await expect(image).toHaveAttribute('src',/preview-a/);
 await expect.poll(()=>pending.has('/original-a.svg')).toBe(true);
 await pending.get('/original-a.svg')();
 await expect(image).toHaveAttribute('src','/original-a.svg');
});

test('failed original keeps preview available and reports fallback', async ({page})=>{
 const pending=await setup(page);
 await page.locator('.gallery a').first().click();
 await expect.poll(()=>pending.has('/original-a.svg')).toBe(true);
 await pending.get('/original-a.svg')(true);
 await expect(page.locator('.photo-viewer-image')).toBeVisible();
 await expect(page.locator('.photo-viewer-image')).toHaveAttribute('src',/preview-a/);
 await expect(page.locator('.photo-viewer-loading')).toContainText('目前顯示預覽');
});

test('late original from previous photo cannot replace current photo', async ({page})=>{
 const pending=await setup(page);
 await page.locator('.gallery a').first().click();
 await expect.poll(()=>pending.has('/original-a.svg')).toBe(true);
 await page.locator('.photo-viewer-next').click();
 await expect.poll(()=>pending.has('/original-b.svg')).toBe(true);
 await pending.get('/original-b.svg')();
 await expect(page.locator('.photo-viewer-image')).toHaveAttribute('src','/original-b.svg');
 await pending.get('/original-a.svg')();
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await expect(page.locator('.photo-viewer-image')).toHaveAttribute('src','/original-b.svg');
 await page.locator('.photo-viewer-close').click();
 await expect(page.locator('.photo-viewer')).not.toBeVisible();
 await expect(page.locator('.gallery a').first()).toBeFocused();
});
