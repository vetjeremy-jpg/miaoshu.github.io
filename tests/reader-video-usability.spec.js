const {test,expect}=require('@playwright/test');
test('home refreshes resumed chapter and removed bookmarks when restored',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('miaoshu-jiankangjie-tingquanyin-chapter','chapter-1');localStorage.setItem('miaoshu-jiankangjie-tingquanyin-last-read-at',String(Date.now()+100000));localStorage.setItem('miaoshu-jiankangjie-tingquanyin-bookmarks','["chapter-1"]')});
 await page.goto('./',{waitUntil:'domcontentloaded'});await page.locator('#book').scrollIntoViewIfNeeded();await expect(page.locator('#continue-link')).toHaveAttribute('href',/chapter-1$/);await expect(page.locator('#reading-list')).toBeVisible();
 await page.evaluate(()=>{localStorage.setItem('miaoshu-jiankangjie-tingquanyin-chapter','chapter-2');localStorage.setItem('miaoshu-jiankangjie-tingquanyin-bookmarks','[]');dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await expect(page.locator('#continue-link')).toHaveAttribute('href',/chapter-2$/);await expect(page.locator('#reading-list')).toBeHidden();
 await page.evaluate(()=>{localStorage.setItem('miaoshu-jiankangjie-tingquanyin-bookmarks','["chapter-3"]');dispatchEvent(new StorageEvent('storage',{key:'miaoshu-jiankangjie-tingquanyin-bookmarks'}))});await expect(page.locator('#saved-chapters a')).toHaveAttribute('href',/chapter-3$/);
});
test('chapter share cancellation and failure show feedback and restore control',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:()=>Promise.reject(new DOMException('test',window.testShareError||'AbortError'))})});
 await page.goto('books/jiankangjie-tingquanyin/',{waitUntil:'domcontentloaded'});const share=page.locator('#chapter-1 .chapter-tools button').first();await share.click();await expect(page.locator('#chapter-1 .chapter-share-feedback')).toContainText('已取消分享');await expect(share).toBeEnabled();
 await page.evaluate(()=>window.testShareError='NotAllowedError');await share.click();await expect(page.locator('#chapter-1 .chapter-share-feedback')).toContainText('分享未完成');await expect(share).toBeEnabled();
});
test('video supports stop, reload and a selected-video URL without loading on entry',async({page})=>{
 await page.route('**/www.youtube-nocookie.com/embed/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><p>Player fixture</p>'}));
 await page.goto('videos/',{waitUntil:'domcontentloaded'});await expect(page.locator('#screen iframe')).toHaveCount(0);await expect(page.getByRole('button',{name:'■ 停止播放',exact:true})).toBeHidden();
 const pick=page.locator('.video-pick').nth(1),id=await pick.getAttribute('data-video');await pick.click();await expect(page).toHaveURL(new RegExp('video='+id));await expect(page.locator('#screen iframe')).toHaveAttribute('src',new RegExp(id));
 await page.getByRole('button',{name:'重新載入影片',exact:true}).click();await expect(page.locator('#screen iframe')).toHaveCount(1);await page.getByRole('button',{name:'■ 停止播放',exact:true}).click();await expect(page.locator('#screen iframe')).toHaveCount(0);
 await page.reload();await expect(page.locator('.video-pick[aria-current]')).toHaveAttribute('data-video',id);await expect(page.locator('#screen iframe')).toHaveCount(0);await page.locator('#play-video').click();await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await expect(page.locator('#screen iframe')).toHaveCount(0);
});
