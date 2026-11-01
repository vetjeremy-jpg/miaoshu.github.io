const {test,expect}=require('@playwright/test');const fs=require('node:fs');
test('journal article links keep native Enter navigation',async({page})=>{
 await page.goto('posts/',{waitUntil:'domcontentloaded'});await expect(page).toHaveURL(/posts\/$/);
 const link=page.locator('#journey-timeline a').first(),href=await link.getAttribute('href');await link.press('Enter');await expect(page).toHaveURL(new RegExp(href.replace(/\/$/,'')+'/?$'));
});
test('journal filters announce state, clear empty details, and survive resize and reload',async({page})=>{
 const source=fs.readFileSync('posts/journeys.js','utf8')+'\nwindow.MIAOSHU_JOURNEYS.push({...window.MIAOSHU_JOURNEYS[0],id:"older-fixture",date:"2025-01-01",region:"桃園"});';await page.route('**/journeys.js*',route=>route.fulfill({contentType:'text/javascript',body:source}));
 await page.goto('posts/',{waitUntil:'domcontentloaded'});await page.locator('[data-year="2025"]').click();await expect(page.locator('[data-year="2025"]')).toHaveAttribute('aria-pressed','true');await page.locator('[data-region="臺北"]').click();await expect(page.locator('#journey-detail')).toContainText('沒有符合');await expect(page.locator('#journey-timeline a')).toHaveCount(0);await expect(page.locator('#journey-nodes button')).toHaveCount(0);
 await page.locator('[data-year="全部"]').click();await expect(page.locator('#journey-timeline a')).toHaveCount(1);const url=page.url();await page.setViewportSize({width:390,height:844});await expect(page).toHaveURL(url);await page.reload();await expect(page.locator('[data-region="臺北"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#journey-detail')).toContainText('把臺北走成一封給自己的信');
});
test('phone constellation offers nearby links, restorable filters and an always reachable home exit',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('works/',{waitUntil:'domcontentloaded'});await page.locator('[data-filter="human"]').click();await expect(page.locator('#theme-results')).toBeVisible();await expect(page.locator('#theme-results')).toContainText('雨停以後');
 await expect(page).toHaveURL(/theme=human/);await page.reload();await expect(page.locator('[data-filter="human"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#theme-results a').first()).toHaveAttribute('href','../books/rain-stops-i-remain/');
 await page.locator('[data-filter="all"]').click();await expect(page.locator('#theme-results')).toBeHidden();await expect(page).not.toHaveURL(/theme=/);await page.locator('.work-node').last().scrollIntoViewIfNeeded();const exit=page.getByRole('navigation',{name:'離開作品星圖'}).getByRole('link',{name:'← 回網站首頁',exact:true});await expect(exit).toBeInViewport();await exit.click();await expect(page.locator('h1')).toContainText('故事');
});
