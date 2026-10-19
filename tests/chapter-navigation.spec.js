const {test,expect}=require('@playwright/test');
// Keep action traces and failure screenshots without serializing the full book
// DOM for every action in the chapter/viewport matrix.
test.use({trace:{mode:'retain-on-failure',snapshots:false,screenshots:false}});
for(const slug of ['the-bus-runs-tomorrow','xia-ke-xing','taipei-wumingye']){
 test(`${slug}: every directory link lands at its chapter heading`,async({page})=>{
  const chapterCount=slug==='taipei-wumingye'?59:slug==='the-bus-runs-tomorrow'?12:16;
  test.setTimeout(slug==='taipei-wumingye'?240000:90000);
  await page.route('https://**/*',r=>r.abort());
  await page.goto(`books/${slug}/index.html`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__moonlitReaderLoaded);
  for(const width of [1280,320,375,390,430]){
   await page.setViewportSize({width,height:850});
   for(let i=chapterCount;i>=1;i--){
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
  const deepChapter=slug==='the-bus-runs-tomorrow'?12:14;
  await page.goto(`books/${slug}/index.html#chapter-${deepChapter}`);
  await expect.poll(()=>page.locator(`#chapter-${deepChapter}`).evaluate(el=>Math.abs(el.getBoundingClientRect().top-document.querySelector('.topbar').getBoundingClientRect().height-16))).toBeLessThan(3);
  await page.locator(`#chapter-${deepChapter} a[href="#toc"]`).click();
  await page.locator('#chapter-search').fill(slug==='xia-ke-xing'?'第十三回':slug==='taipei-wumingye'?'第五十九章':'先走過去');
  await expect(page.locator('#toc .toc a:visible')).toHaveCount(1);
  await page.locator('#toc .toc a:visible').click();
  await page.goBack();
  await expect(page).toHaveURL(/#toc$/);
 });
}
