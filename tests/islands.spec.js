const {test,expect}=require('@playwright/test');
const city='games/moonlight-island/',mist='games/mist-island/';
const travel=async(page,id)=>page.locator(`#sites [data-place="${id}"]`).click();

test('island campaign: build, upgrade, advance, event decision, save and confirmed restart',async({page})=>{
 await page.goto(city);await travel(page,'west');await page.locator('[data-build="forest"]').click();
 await expect(page.locator('#detail-title')).toHaveText('永續林場');await expect(page.locator('#turn-bar')).toContainText('剩 2 次行動');
 await page.locator('[data-action="upgrade"]').click();await expect(page.locator('#detail')).toContainText('Lv. 2');
 await page.reload();await travel(page,'west');await expect(page.locator('#detail')).toContainText('Lv. 2');
 await page.locator('#next-week').click();await page.locator('#next-week').click();
 await expect(page.locator('#event')).toContainText('海風音樂夜');await expect(page.locator('#next-week')).toBeDisabled();
 await page.locator('[data-event="1"]').click();await expect(page.locator('#next-week')).toBeEnabled();
 await page.locator('#restart').click();await page.locator('#cancel-restart').click();await expect(page.locator('#resource-bar')).toContainText('3 / 12');
 await page.locator('#restart').click();await page.locator('#confirm-restart').click();await expect(page.locator('#resource-bar')).toContainText('1 / 12');
});

test('city can finish all twelve weeks and best score survives restart',async({page})=>{
 await page.goto(city);
 for(let week=1;week<=12;week++){
  if(await page.locator('#event').isVisible())await page.locator('[data-event="1"]').click();
  await page.locator('#next-week').click();
 }
 await expect(page.locator('#ending')).toContainText('十二週');
 await expect(page.locator('#next-week')).toBeDisabled();
 await page.reload();await expect(page.locator('#ending')).toBeVisible();
 await page.locator('#restart').click();await page.locator('#confirm-restart').click();
 await expect(page.locator('#below')).toContainText('本機最佳島嶼：');
});

async function solveAdventure(page,ending){
 await travel(page,'dock');await page.locator('#inspect-site').click();
 await travel(page,'village');await page.locator('#code-answer').fill('0000');await page.locator('#solve-puzzle').click();await expect(page.locator('#message')).toContainText('沒有回應');
 await page.locator('#code-answer').fill('2714');await page.locator('#solve-puzzle').click();
 await travel(page,'garden');await page.locator('#path-W').click();await expect(page.locator('#message')).toContainText('回到起點');
 for(const dir of ['N','N','E','E','N','E'])await page.locator('#path-'+dir).click();await page.locator('#solve-puzzle').click();
 await travel(page,'workshop');await page.locator('#ring-0').click();
 await page.reload();await expect(page.locator('#ring-0')).toContainText('1');
 for(const i of [1,1,1,2,2])await page.locator('#ring-'+i).click();await page.locator('#solve-puzzle').click();
 await travel(page,'library');for(const w of ['潮','林','星','月'])await page.locator('[data-word="'+w+'"]').click();await page.locator('#solve-puzzle').click();
 await travel(page,'observatory');for(const i of [0,4,8])await page.locator('#light-'+i).click();await page.locator('#solve-puzzle').click();
 await travel(page,'lighthouse');for(const w of ['月','潮','星'])await page.locator('[data-word="'+w+'"]').click();await page.locator('#solve-puzzle').click();
 await page.locator('[data-ending="'+ending+'"]').click();await expect(page.locator('#ending')).toBeVisible();
}
test('full adventure: six puzzles, persistent drafts, both endings and collection',async({page})=>{
 test.setTimeout(90000);await page.goto(mist);
 await travel(page,'lighthouse');await expect(page.locator('#detail')).toContainText('還需要');
 await solveAdventure(page,'home');await expect(page.locator('#ending')).toContainText('留燈之人');
 await page.locator('#restart').click();await page.locator('#confirm-restart').click();
 await solveAdventure(page,'voyage');await expect(page.locator('#ending')).toContainText('遠航之光');
 await expect(page.locator('#ending')).toContainText('2 / 2');
});

for(const width of [320,375,390,430,1280])for(const [route,mode] of [[city,'city'],[mist,'adventure']]){
 test(`${mode} map and controls fit ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(route);
  await expect(page.locator('#sites button')).toHaveCount(mode==='city'?12:7);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#zoom-in').click();await expect(page.locator('#island-map')).toHaveAttribute('data-zoom','1.20');
  await page.locator('#zoom-reset').click();await expect(page.locator('#island-map')).toHaveAttribute('data-zoom','1.00');
  if(mode==='city'){await page.locator('[data-site="west"]').press('Enter');await expect(page.locator('#detail')).toContainText('在這裡種下生活');}
  else{await page.locator('#inspect-site').click();await travel(page,'village');await expect(page.locator('#code-answer')).toBeVisible();}
  expect(errors).toEqual([]);
 });
}

test('map pointer selection, panning and reset work',async({page})=>{
 await page.setViewportSize({width:1280,height:1000});
 await page.goto(city);await page.locator('[data-site="west"]').click();await expect(page.locator('#detail')).toContainText('西岸空地');
 const map=page.locator('#island-map');await map.scrollIntoViewIfNeeded();const box=await map.boundingBox();const before=await page.locator('#map-world').getAttribute('transform');
 await page.mouse.move(box.x+box.width*.3,box.y+box.height*.8);await page.mouse.down();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.7,{steps:6});await page.mouse.up();
 expect(await page.locator('#map-world').getAttribute('transform')).not.toBe(before);await page.locator('#zoom-reset').click();await expect(page.locator('#map-world')).toHaveAttribute('transform',before);
});

test('storage denied still permits construction and investigation',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('denied')};Storage.prototype.setItem=()=>{throw Error('denied')}});
 await page.goto(city);await expect(page.locator('#save-note')).toContainText('無法儲存');await travel(page,'west');await page.locator('[data-build="forest"]').click();await expect(page.locator('#detail-title')).toHaveText('永續林場');
 await page.goto(mist);await page.locator('#inspect-site').click();await expect(page.locator('#below')).toContainText('渡船票');
});
