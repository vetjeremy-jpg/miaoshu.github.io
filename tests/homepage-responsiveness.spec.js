const {test,expect}=require('@playwright/test');
test('new collection, shelf and mood actions are ready on first click',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('./',{waitUntil:'domcontentloaded'});
 await expect(page.locator('.hero-index')).toContainText('15 本小說');
 await expect(page.locator('.hero-index')).toContainText('137 張外部相片');
 const shelf=await page.evaluate(()=>{const b=document.getElementById('show-all-novels'),t=performance.now();b.click();return {ms:performance.now()-t,expanded:b.getAttribute('aria-expanded')}});
 expect(shelf.ms).toBeLessThan(100);expect(shelf.expanded).toBe('true');
 await page.locator('#moonlit-discovery>summary').click();await page.locator('.moonlit-mood-selector>summary').click();
 const mood=await page.evaluate(()=>{const b=document.querySelector('[data-mood="read"]'),t=performance.now();b.click();return {ms:performance.now()-t,text:document.querySelector('.moonlit-result strong').textContent}});
 expect(mood.ms).toBeLessThan(100);expect(mood.text.length).toBeGreaterThan(0);
});
test('stalled support service gets immediate feedback and restores the button',async({page})=>{
 await page.route('**/api/likes*',route=>route.request().method()==='GET'?route.abort():new Promise(()=>{}));
 await page.goto('./',{waitUntil:'domcontentloaded'});const button=page.locator('#like-site');await button.scrollIntoViewIfNeeded();await expect(button).toBeEnabled();
 const state=await page.evaluate(()=>{const b=document.getElementById('like-site'),t=performance.now();b.click();return {ms:performance.now()-t,text:b.textContent,busy:b.getAttribute('aria-busy')}});
 expect(state.ms).toBeLessThan(100);expect(state.busy).toBe('true');expect(state.text).toContain('正在儲存');
 await expect(button).toBeEnabled({timeout:5500});await expect(page.locator('#support-feedback')).toContainText('連線逾時');
});
test('chapter likes remain usable after initial service failure',async({page})=>{
 await page.route('**/api/likes*',route=>route.abort());await page.goto('books/jiankangjie-tingquanyin/',{waitUntil:'domcontentloaded'});
 const button=page.locator('.chapter-like').first();await expect(button).toBeEnabled();await button.click();await expect(button).toBeEnabled();await expect(button).toContainText('重試');
});
