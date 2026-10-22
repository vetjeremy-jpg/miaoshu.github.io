const {test,expect}=require('@playwright/test');
test('每月十五: complete text, mobile chapter navigation, font, bookmarks and audio controls',async({page})=>{
 test.setTimeout(90000);
 await page.goto('books/meiyue-shiwu/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__moonlitReaderLoaded);
 await expect(page.locator('.chapter')).toHaveCount(48);
 await expect(page.locator('#toc .toc a')).toHaveCount(48);
 await expect(page.locator('.meta')).toHaveText('作者：喵叔');
 await expect(page.locator('#chapter-1')).toContainText('許景衡到的時候，喬喬正在吃飯');
 await expect(page.locator('#chapter-48')).toContainText('（全文完）');
 await expect(page.locator('#text')).not.toContainText('續寫紀錄');
 const body=page.locator('#chapter-1 .chapter-body p').first();
 const before=await body.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
 await page.locator('#font-larger').click();
 await expect.poll(()=>body.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(before);
 await page.locator('#font-reset').click();
 for(const width of [320,375,390,430,1280]){
  await page.setViewportSize({width,height:850});
  await page.locator('#toc .toc a[href="#chapter-48"]').click();
  await expect(page).toHaveURL(/#chapter-48$/);
  await expect(page.locator('#heading-48')).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#chapter-48 .chapter-nav a[href="#toc"]').click();
  await expect(page).toHaveURL(/#toc$/);
 }
 await page.locator('#chapter-search').fill('第四十八章');
 await expect(page.locator('#toc .toc a:visible')).toHaveCount(1);
 await page.locator('#chapter-search').fill('');
 await page.locator('#toc .toc a[href="#chapter-1"]').click();
 await page.locator('#chapter-1 .chapter-nav a[href="#chapter-2"]').click();
 await expect(page).toHaveURL(/#chapter-2$/);
 await page.locator('#chapter-2 .chapter-bookmark').click();
 await expect(page.locator('#chapter-2 .chapter-bookmark')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#audiobook-player, #audiobook-launcher').first()).toBeAttached();
 await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.locator('#chapter-2 .chapter-bookmark')).toHaveAttribute('aria-pressed','true');
 await page.goto('search/?q=每月十五',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#results a[href="../books/meiyue-shiwu/"]')).toBeVisible();
});
