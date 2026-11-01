const {test,expect}=require('@playwright/test');
test('search exposes all results, restores URL filters and finds comics',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('search/');
 await expect(page.locator('.result')).toHaveCount(50);await page.getByRole('button',{name:'顯示更多結果 ↓'}).click();await expect(page.locator('.result')).toHaveCount(100);
 await page.locator('#q').fill('聽泉引');await page.locator('#filters').getByRole('button',{name:'漫畫',exact:true}).click();
 await expect(page.locator('.result')).toHaveCount(40);await expect(page).toHaveURL(/type=/);await page.reload();await expect(page.locator('#q')).toHaveValue('聽泉引');await expect(page.locator('#filters').getByRole('button',{name:'漫畫',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'清除搜尋與篩選'}).click();await page.locator('#filters').getByRole('button',{name:'小說',exact:true}).click();await page.locator('#q').fill('台北');const first=await page.locator('#status').textContent();await page.locator('#q').fill('臺北');await expect(page.locator('#status')).toHaveText(first);await expect(page.locator('.result')).toContainText('臺北無名夜');
 await page.locator('#q').fill('不會出現的關鍵字xyz');await expect(page.locator('#results')).toContainText('沒有找到');await expect(page.getByRole('button',{name:'清除搜尋與篩選'})).toBeVisible();
});
test('album catalogue failure has an in-place retry without duplicate albums',async({page})=>{
 let requests=0;await page.route('**/degoo-gallery-albums.json*',route=>++requests===1?route.abort():route.continue());
 await page.goto('gallery/',{waitUntil:'domcontentloaded'});await expect(page.locator('.degoo-album-status')).toContainText('暫時無法載入');await page.getByRole('button',{name:'重新載入相簿',exact:true}).click();await expect(page.locator('#degoo-street-daylight')).toHaveCount(1);await expect(page.locator('.degoo-album-status')).toBeHidden();
});
test('comic catalogue can recover without reloading the page',async({page})=>{
 let requests=0;await page.route('**/comic/pages.json',route=>++requests===1?route.fulfill({status:503,body:'Unavailable'}):route.continue());
 await page.goto('books/jiankangjie-tingquanyin/comic/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'重新載入漫畫目錄',exact:true}).click();await expect(page.locator('#chapters option')).toHaveCount(39);await expect(page.locator('#counter')).toContainText('/ 39');await expect(page.locator('.catalog-retry')).toHaveCount(0);
});
