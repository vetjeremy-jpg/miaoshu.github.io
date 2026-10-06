const { test, expect } = require('@playwright/test');

const ROUTES=['./','./gallery/','./videos/'];
const THIRD_PARTY=/instagram\.com|cdninstagram\.com|fbcdn\.net|facebook\.com|youtube\.com|youtu\.be|ytimg\.com|googlevideo\.com/i;

for(const route of ROUTES){
 test('third-party outage does not break '+route,async({page,baseURL})=>{
  const localErrors=[];
  page.on('pageerror',e=>localErrors.push('pageerror: '+e.message));
  page.on('console',msg=>{
   if(msg.type()!=='error') return;
   const value=msg.text();
   if(THIRD_PARTY.test(value)) return;
   localErrors.push('console.error: '+value);
  });
  page.on('requestfailed',req=>{
   const url=req.url();
   if(THIRD_PARTY.test(url)) return;
   try{if(new URL(url).origin===new URL(baseURL).origin)localErrors.push('local request failed: '+url)}catch{}
  });
  await page.route('**/*',async routeHandler=>{
   const url=routeHandler.request().url();
   if(THIRD_PARTY.test(url)) return routeHandler.abort('failed');
   return routeHandler.continue();
  });
  const response=await page.goto(route,{waitUntil:'domcontentloaded'});
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
  await expect(page.locator('body')).toBeVisible();
  const bodyText=(await page.locator('body').innerText()).trim();
  expect(bodyText.length,route+' keeps meaningful first-party content').toBeGreaterThan(80);
  expect([...new Set(localErrors)],route+' remains healthy when embeds are unavailable').toEqual([]);
 });
}
