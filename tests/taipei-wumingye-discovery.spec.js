const {test,expect}=require('@playwright/test');
const slug='taipei-wumingye';
const book=`books/${slug}/index.html`;

test('臺北無名夜 can be found from the mobile shelf, collection, search and star map',async({page})=>{
 await page.setViewportSize({width:375,height:850});
 await page.goto('./#book',{waitUntil:'domcontentloaded'});
 await page.locator('#show-all-novels').click();
 const card=page.locator(`[data-book-id="${slug}"]`);
 await expect(card.locator('.book-read')).toBeVisible();
 await card.locator('.book-read').click();
 await expect(page).toHaveURL(new RegExp(`${slug}/index.html#toc$`));
 await expect(page.locator('#toc .toc a')).toHaveCount(60);
 await page.goto('books/',{waitUntil:'domcontentloaded'});
 await expect(page.locator(`a[href="./${slug}/"]`).last()).toBeVisible();
 await page.goto('search/?q=臺北無名夜',{waitUntil:'domcontentloaded'});
 await expect(page.locator(`#results a[href="../books/${slug}/"]`)).toBeVisible();
 await page.locator('#q').fill('臺北無名夜 第六十章');
 await expect(page.locator('#results .result')).toHaveCount(1);
 await page.locator('#results .result').click();
 await expect(page).toHaveURL(/#chapter-60$/);
 await expect(page.locator('#chapter-60')).toContainText('全書完');
 for(const width of [320,375,390,430,1280]){
  await page.setViewportSize({width,height:850});
  await page.goto('works/',{waitUntil:'domcontentloaded'});
  const node=page.locator('[data-id="taipei-night-novel"] a');
  await expect(node).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const bounds=await node.evaluate(el=>{const b=el.getBoundingClientRect(),map=document.querySelector('#star-map').getBoundingClientRect();return {inside:b.left>=map.left&&b.right<=map.right&&b.top>=map.top&&b.bottom<=map.bottom}});
  expect(bounds.inside).toBe(true);
 }
});

test('臺北無名夜 bookmarks, reading position and offline chapters survive a revisit',async({page,context})=>{
 await page.goto('./',{waitUntil:'load'});
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await page.goto(book+'#chapter-37',{waitUntil:'load'});
 await page.locator('#chapter-37 .chapter-bookmark').click();
 await expect(page.locator('#chapter-37 .chapter-bookmark')).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('miaoshu-taipei-wumingye-chapter'))).toBe('chapter-37');
 await expect.poll(()=>page.evaluate(async()=>{const keys=await (await caches.open('moonlit-pages-v3')).keys();return keys.some(k=>new URL(k.url).pathname.endsWith('/taipei-wumingye/index.html'))})).toBe(true);
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#chapter-37 .chapter-bookmark')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#saved-chapters a[href="#chapter-37"]')).toHaveCount(1);
 await page.locator('#chapter-37 .chapter-nav a[href="#chapter-38"]').click();
 await expect(page).toHaveURL(/#chapter-38$/);
 await expect(page.locator('#chapter-38 .chapter-body')).not.toBeEmpty();
 await context.setOffline(false);
});
