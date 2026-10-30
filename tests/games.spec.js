const { test, expect } = require('@playwright/test');

test('photography pairs complete, lock mismatches, pause and retain best record', async ({ page }) => {
  await page.clock.install();
  await page.goto('games/');
  await page.locator('#memory-start').click();
  const cards = page.locator('.memory-card');
  await expect(cards).toHaveCount(12);
  const deck = await cards.evaluateAll(els => els.map(el => el.dataset.photo));
  const wrong = deck.findIndex(p => p !== deck[0]);
  await cards.nth(0).click(); await cards.nth(wrong).click();
  await cards.nth(deck.findIndex((p, i) => i !== 0 && i !== wrong)).click();
  await expect(page.locator('#memory-moves')).toHaveText('1');
  await page.locator('#memory-pause').click();
  const time = await page.locator('#memory-time').innerText();
  await page.clock.runFor(1200);
  await expect(page.locator('#memory-time')).toHaveText(time);
  await page.locator('#memory-pause').click(); await page.clock.runFor(1000);
  await expect(cards.nth(0)).toHaveAccessibleName('第 1 張，尚未翻開');
  for (let p = 0; p < 6; p++) {
    const pair = cards.filter({ has: page.locator(`img[src$="${['photo-03.webp','photo-05.webp','photo-06.webp','photo-15.webp','photo-16.webp','photo-18.webp'][p]}"]`) });
    await pair.nth(0).click(); await pair.nth(1).click();
  }
  await expect(page.locator('#memory-message')).toContainText('全部找到了');
  await expect(page.locator('#memory-moves')).toHaveText('7');
  await page.reload(); await expect(page.locator('#memory-best')).toContainText('7 次翻牌');
});

test('all four story endings, progress restoration and collection persist', async ({ page }) => {
  await page.goto('games/');
  const choose = async text => page.locator('#story-choices').getByRole('button', { name: text }).click();
  await choose('蹲下來，看看小貓守著什麼');
  await expect(page.locator('#scene-title')).toBeInViewport();
  await page.reload(); await expect(page.locator('#scene-title')).toHaveText('小貓帶路');
  await choose('帶著信，請站長打開候車室');
  await choose('帶著信和收據，去河邊照相館');
  await choose('陪他把信讀完，讓道別留在這裡');
  await expect(page.locator('#scene-title')).toContainText('結局一');
  await page.locator('#story-restart').click();
  await choose('先去問問站長，這封信的來歷');
  await choose('到河邊，找那位等信的人');
  await choose('問他願不願意帶著合照，回車站看最後一班車');
  await expect(page.locator('#scene-title')).toContainText('結局二');
  await page.locator('#story-restart').click();
  await choose('蹲下來，看看小貓守著什麼');
  await choose('時間不多了，先帶信登上列車');
  await choose('把信交給列車長，請他轉交阿遠，自己往終點走');
  await expect(page.locator('#scene-title')).toContainText('結局三');
  await page.locator('#story-restart').click();
  await choose('請站長明早送信，今晚留下來照顧小貓');
  await expect(page.locator('#scene-title')).toContainText('結局四');
  await page.reload(); await expect(page.locator('#story-record')).toContainText('4 / 4');
});

test('star scoring, pause, sixty-second finish and local best', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .5; });
  await page.clock.install(); await page.goto('games/');
  await page.locator('#stars-start').click();
  await page.clock.runFor(4000);
  await expect(page.locator('#stars-score')).not.toHaveText('0');
  await page.locator('#stars-pause').click();
  const time = await page.locator('#stars-time').innerText();
  await page.clock.runFor(2000); await expect(page.locator('#stars-time')).toHaveText(time);
  await page.locator('#stars-pause').click(); await page.clock.runFor(56500);
  await expect(page.locator('#stars-message')).toContainText('時間到');
  await expect(page.locator('#stars-time')).toHaveText('0 秒');
  const score = await page.locator('#stars-score').innerText();
  await page.reload(); await expect(page.locator('#stars-best')).toContainText(`${score} 分`);
});

test('clouds remove hearts and end a round; restart resets state', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .1; });
  await page.clock.install(); await page.goto('games/');
  await page.locator('#stars-start').click();
  await page.locator('#stars-position').fill('14');
  await page.clock.runFor(5500);
  await expect(page.locator('#stars-message')).toContainText('愛心用完了');
  await expect(page.locator('#stars-score')).toHaveText('0');
  await page.locator('#stars-start').click();
  await expect(page.locator('#stars-lives')).toHaveAccessibleName('剩餘 3 顆愛心');
  await expect(page.locator('#stars-time')).toHaveText('60 秒');
});

for (const width of [320, 375, 390, 430, 1280]) {
  test(`game controls and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('games/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#stars-start').click();
    await page.locator('#stars-right').click();
    expect(Number(await page.locator('#stars-position').inputValue())).toBeGreaterThan(50);
    await page.locator('#memory-start').click();
    await expect(page.locator('#stars-pause')).toHaveText('繼續');
    await page.locator('#stars-start').click();
    await expect(page.locator('#memory-pause')).toHaveText('繼續');
    expect(errors).toEqual([]);
  });
}

test('storage denied still allows all three games', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage denied'); };
    Storage.prototype.setItem = () => { throw new Error('Storage denied'); };
  });
  await page.goto('games/');
  await expect(page.locator('#storage-note')).toContainText('無法儲存');
  await page.locator('#memory-start').click(); await expect(page.locator('.memory-card').first()).toBeEnabled();
  await page.locator('#story-choices button').last().click(); await expect(page.locator('#scene-title')).toContainText('結局四');
  await page.locator('#stars-start').click(); await expect(page.locator('#stars-pause')).toBeEnabled();
});

test('homepage exposes games and video player follows catalogue order', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('navigation', { name: '網站導覽' }).getByRole('link', { name: '遊戲館', exact: true })).toHaveAttribute('href', 'games/');
  await page.goto('videos/');
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ body: '<html><body>Video test</body></html>', contentType: 'text/html' }));
  const buttons = page.locator('.video-pick');
  const ids = await buttons.evaluateAll(els => els.map(e => e.dataset.video));
  await expect(page.locator('#youtube-link')).toHaveAttribute('href', 'https://www.youtube.com/shorts/' + ids[0]);
  for (let i = 0; i < ids.length; i++) {
    await buttons.nth(i).click();
    await expect(page.locator('#screen iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/' + ids[i] + '?autoplay=1');
    await expect(buttons.nth(i)).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('#youtube-link')).toHaveAttribute('href', 'https://www.youtube.com/shorts/' + ids[i]);
  }
});
