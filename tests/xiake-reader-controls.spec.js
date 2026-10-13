const {test,expect}=require('@playwright/test');
for(const width of [320,375,390,430]){
 test(`Xiake chapter links and shared font controls at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:812});
  await page.addInitScript(()=>localStorage.setItem('miaoshu-xia-ke-xing-focus-mode','1'));
  await page.goto('books/xia-ke-xing/',{waitUntil:'domcontentloaded'});
  const links=page.locator('#toc .toc a');
  await expect(links).toHaveCount(8);
  for(let i=0;i<8;i++){
   await expect(links.nth(i)).toBeVisible();
   await links.nth(i).click();
   await expect(page).toHaveURL(new RegExp(`#chapter-${i+1}$`));
  }
  await expect(page.locator('.moonlit-reader-dock')).toBeVisible();
  await page.evaluate(()=>{
   document.getElementById('font-reset').click();
   document.querySelector('[data-act="larger"]').click();
   document.getElementById('font-larger').click();
  });
  await expect(page.locator('#chapter-1 .chapter-body')).toHaveCSS('--reader-size','20px');
  await page.locator('[data-act="smaller"]').click();
  await expect(page.locator('#chapter-1 .chapter-body')).toHaveCSS('--reader-size','19px');
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('miaoshu-xia-ke-xing-font-size'))).toBe('19');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#chapter-1 .chapter-body')).toHaveCSS('--reader-size','19px');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
