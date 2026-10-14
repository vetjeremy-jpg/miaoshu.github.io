const {test,expect}=require('@playwright/test');
for(const slug of ['the-bus-runs-tomorrow','xia-ke-xing']){
 test(`${slug}: every directory link lands at its chapter heading`,async({page})=>{
  test.setTimeout(90000);
  await page.route('https://**/*',r=>r.abort());
  await page.goto(`books/${slug}/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__moonlitReaderLoaded);
  for(const width of [1280,320,375,390,430]){
   await page.setViewportSize({width,height:850});
   for(let i=16;i>=1;i--){
    const link=page.locator(`#toc .toc a[href="#chapter-${i}"]`);
    await link.evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#chapter-${i}$`));
    await expect.poll(()=>page.locator(`#chapter-${i}`).evaluate(el=>Math.abs(el.getBoundingClientRect().top-document.querySelector('.topbar').getBoundingClientRect().height-16))).toBeLessThan(3);
    await expect(page.locator(`#chapter-${i} h2`)).toBeFocused();
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   }
  }
  await page.goto('about:blank');
  await page.goto(`books/${slug}/index.html#chapter-14`);
  await expect.poll(()=>page.locator('#chapter-14').evaluate(el=>Math.abs(el.getBoundingClientRect().top-document.querySelector('.topbar').getBoundingClientRect().height-16))).toBeLessThan(3);
  await page.locator('#chapter-14 a[href="#toc"]').click();
  await page.locator('#chapter-search').fill(slug==='xia-ke-xing'?'第十三回':'明天照常發車');
  await expect(page.locator('#toc .toc a:visible')).toHaveCount(1);
  await page.locator('#toc .toc a:visible').click();
  await page.goBack();
  await expect(page).toHaveURL(/#toc$/);
 });
}
