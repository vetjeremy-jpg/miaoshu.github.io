const { test, expect } = require('@playwright/test');

async function resetMoonlitPwa(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('moonlit-')).map(key => caches.delete(key)));
  });
}

async function waitForControl(page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        setTimeout(resolve, 5000);
      });
    }
    return { scope: registration.scope, controlled: Boolean(navigator.serviceWorker.controller) };
  });
}

test.describe('Moonlit PWA lifecycle', () => {
  test('P0 registers, controls and creates canonical caches @p0', async ({ page }) => {
    await resetMoonlitPwa(page);
    await page.reload({ waitUntil: 'load' });
    const state = await waitForControl(page);
    expect(state.scope).toBe(new URL('./', page.url()).href);
    expect(state.controlled).toBe(true);

    // The page cache is intentionally lazy: exercise one controlled navigation.
    await page.reload({ waitUntil: 'domcontentloaded' });
    const keys = await page.evaluate(() => caches.keys());
    expect(keys.filter(key => key.startsWith('moonlit-shell-'))).toHaveLength(1);
    expect(keys.filter(key => key.startsWith('moonlit-pages-'))).toHaveLength(1);
  });


  test('P0 keeps novel navigation inside the controlled Moonlit scope @p0', async ({ page }) => {
    await resetMoonlitPwa(page);
    await page.reload({ waitUntil: 'load' });
    await waitForControl(page);

    const assertControlled = async label => {
      const state = await page.evaluate(async () => ({
        controlled: Boolean(navigator.serviceWorker.controller),
        scope: (await navigator.serviceWorker.ready).scope
      }));
      expect(state.controlled, label).toBe(true);
      expect(state.scope, label).toBe(new URL('./', page.url()).origin + '/miaoshu.github.io/');
    };

    await page.goto('./#book', { waitUntil: 'domcontentloaded' });
    await assertControlled('homepage book shelf');

    const shelfNovel = page.locator('#book .novel-card[data-book-id="fushengsuiyue"] .book-read');
    await expect(shelfNovel).toBeVisible();
    await shelfNovel.click();
    await expect(page).toHaveURL(/\/books\/fushengsuiyue\/index\.html#toc$/);
    await assertControlled('novel reader');

    await page.locator('#chapter-1 a[href="#chapter-2"]').click();
    await expect(page).toHaveURL(/#chapter-2$/);
    await assertControlled('chapter navigation');

    await page.locator('a[href="../../index.html#book"]').last().click();
    await expect(page).toHaveURL(/\/miaoshu\.github\.io\/(?:index\.html)?#book$/);
    await expect(page.locator('#book')).toBeVisible();
    await assertControlled('return to book shelf');
  });

  test('P0 reloads a warmed novel while offline and keeps chapter navigation usable @p0', async ({ page, context }) => {
    await resetMoonlitPwa(page);
    await page.reload({ waitUntil: 'load' });
    await waitForControl(page);

    const novel='./books/fushengsuiyue/index.html#chapter-1';
    await page.goto(novel, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#chapter-1')).toBeVisible();

    await expect.poll(async () => page.evaluate(async () => {
      const cache=await caches.open('moonlit-pages-v3');
      const keys=await cache.keys();
      return keys.some(req=>new URL(req.url).pathname.endsWith('/books/fushengsuiyue/index.html'));
    }), { timeout: 10000 }).toBe(true);

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('#chapter-1')).toBeVisible();
      await expect(page.locator('#chapter-1 .chapter-body')).not.toBeEmpty();
      await expect(page.evaluate(() => Boolean(navigator.serviceWorker.controller))).resolves.toBe(true);

      await page.locator('#chapter-1 a[href="#chapter-2"]').click();
      await expect(page).toHaveURL(/#chapter-2$/);
      await expect(page.locator('#chapter-2')).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test('P0 restores last-read chapter after reopening a cached novel offline @p0', async ({ page, context }) => {
    await resetMoonlitPwa(page);
    await page.reload({ waitUntil: 'load' });
    await waitForControl(page);

    const novel='./books/fushengsuiyue/index.html';
    await page.goto(novel+'#chapter-2', { waitUntil: 'domcontentloaded' });
    await page.locator('#chapter-2').scrollIntoViewIfNeeded();

    await expect.poll(async () => page.evaluate(() => localStorage.getItem('miaoshu-fushengsuiyue-chapter')), { timeout: 10000 }).toBe('chapter-2');
    await expect.poll(async () => page.evaluate(async () => {
      const cache=await caches.open('moonlit-pages-v3');
      return (await cache.keys()).some(req=>new URL(req.url).pathname.endsWith('/books/fushengsuiyue/index.html'));
    }), { timeout: 10000 }).toBe(true);

    await page.close();
    await context.setOffline(true);
    const reopened=await context.newPage();
    try {
      await reopened.goto(novel, { waitUntil: 'domcontentloaded' });
      await expect(reopened.locator('#continue-reading')).toHaveClass(/is-visible/);
      await expect(reopened.locator('#continue-label')).toContainText('上次讀到');
      await expect(reopened.locator('#continue-link')).toHaveAttribute('href','#chapter-2');
      await reopened.locator('#continue-link').click();
      await expect(reopened).toHaveURL(/#chapter-2$/);
      await expect(reopened.locator('#chapter-2')).toBeVisible();
      await expect(reopened.evaluate(() => Boolean(navigator.serviceWorker.controller))).resolves.toBe(true);
    } finally {
      await context.setOffline(false);
      await reopened.close();
    }
  });

  test('P0 preserves reading, bookmark and audio progress across cache generation cleanup @p0', async ({ page }) => {
    await resetMoonlitPwa(page);
    await page.reload({ waitUntil: 'load' });
    await waitForControl(page);

    const novel='./books/fushengsuiyue/index.html';
    await page.goto(novel+'#chapter-2', { waitUntil: 'domcontentloaded' });
    await page.locator('#chapter-2').scrollIntoViewIfNeeded();

    await page.evaluate(() => {
      localStorage.setItem('miaoshu-fushengsuiyue-chapter','chapter-2');
      localStorage.setItem('miaoshu-fushengsuiyue-bookmarks',JSON.stringify(['chapter-2']));
      localStorage.setItem('moonlit-audio-progress:fushengsuiyue',JSON.stringify({chapter:'chapter-2',pos:3,rate:'1.15',updatedAt:Date.now()}));
    });

    await page.evaluate(async () => {
      await caches.open('moonlit-shell-stale-reader-state');
      await caches.open('moonlit-pages-stale-reader-state');
    });

    await page.evaluate(async () => {
      const registration=await navigator.serviceWorker.getRegistration();
      await registration?.unregister();
    });
    await page.reload({ waitUntil: 'load' });
    await waitForControl(page);

    await expect.poll(async () => page.evaluate(async () => {
      const keys=await caches.keys();
      return keys.filter(key=>key==='moonlit-shell-stale-reader-state'||key==='moonlit-pages-stale-reader-state');
    }), { timeout: 10000 }).toEqual([]);

    const state=await page.evaluate(() => ({
      chapter:localStorage.getItem('miaoshu-fushengsuiyue-chapter'),
      bookmarks:JSON.parse(localStorage.getItem('miaoshu-fushengsuiyue-bookmarks')||'[]'),
      audio:JSON.parse(localStorage.getItem('moonlit-audio-progress:fushengsuiyue')||'null')
    }));
    expect(state.chapter).toBe('chapter-2');
    expect(state.bookmarks).toContain('chapter-2');
    expect(state.audio).toMatchObject({chapter:'chapter-2',pos:3,rate:'1.15'});

    await expect(page.locator('#continue-reading')).toHaveClass(/is-visible/);
    await expect(page.locator('#continue-link')).toHaveAttribute('href','#chapter-2');
    await expect(page.locator('#saved-chapters a[href="#chapter-2"]')).toHaveCount(1);
    await expect(page.locator('#audio-chapter')).toHaveValue('chapter-2');
    await expect(page.locator('#audio-status')).toContainText('上次聽到');
  });

  test('P0 keeps an exact-line moonlight bookmark round-trip durable across reopen and cache cleanup @p0', async ({ page, context }) => {
    await resetMoonlitPwa(page);
    await page.reload({ waitUntil: 'load' });
    await waitForControl(page);

    const novel='./books/fushengsuiyue/index.html';
    await page.goto(novel+'#chapter-1', { waitUntil: 'domcontentloaded' });
    const paragraph=page.locator('#chapter-1 .chapter-body p').first();
    await expect(paragraph.locator('.moonlit-line-save')).toBeVisible();
    const pid=await paragraph.getAttribute('id');
    const quote=(await paragraph.textContent()).replace(/^☾/,'').trim().slice(0,180);

    await paragraph.locator('.moonlit-line-save').click();
    await expect(paragraph).toHaveClass(/moonlit-saved-line/);
    await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('moonlit-bookmark-details')||'[]').length)).toBeGreaterThan(0);

    await page.locator('.moonlit-bookmarks-link').click();
    await expect(page).toHaveURL(/\/bookmarks\/$/);
    await expect(page.locator('.bookmark')).toHaveCount(1);
    await expect(page.locator('.bookmark blockquote')).toContainText(quote.slice(0,40));
    const returnHref=await page.locator('.bookmark .go').getAttribute('href');
    expect(returnHref).toContain('#'+pid);
    await page.locator('.bookmark .go').click();
    await expect(page).toHaveURL(new RegExp('#'+pid+'$'));
    await expect(page.locator('#'+pid)).toHaveClass(/moonlit-saved-line/);

    await page.close();
    const reopened=await context.newPage();
    await reopened.goto('./bookmarks/', { waitUntil: 'domcontentloaded' });
    await expect(reopened.locator('.bookmark')).toHaveCount(1);
    await expect(reopened.locator('.bookmark .go')).toHaveAttribute('href',returnHref);

    await reopened.evaluate(async () => {
      await caches.open('moonlit-shell-stale-bookmark-state');
      await caches.open('moonlit-pages-stale-bookmark-state');
      const registration=await navigator.serviceWorker.getRegistration();
      await registration?.unregister();
    });
    await reopened.goto('./', { waitUntil: 'load' });
    await waitForControl(reopened);
    await expect.poll(async () => reopened.evaluate(async () => {
      const keys=await caches.keys();
      return keys.filter(key=>key==='moonlit-shell-stale-bookmark-state'||key==='moonlit-pages-stale-bookmark-state');
    }), { timeout: 10000 }).toEqual([]);

    await reopened.goto('./bookmarks/', { waitUntil: 'domcontentloaded' });
    await expect(reopened.locator('.bookmark')).toHaveCount(1);
    await expect(reopened.locator('.bookmark blockquote')).toContainText(quote.slice(0,40));
    await expect(reopened.locator('.bookmark .go')).toHaveAttribute('href',returnHref);
    await reopened.close();
  });

  test('P0 fresh activation removes stale Moonlit cache generations @p0', async ({ page }) => {
    await resetMoonlitPwa(page);

    await page.evaluate(async () => {
      await caches.open('moonlit-shell-stale-regression');
      await caches.open('moonlit-pages-stale-regression');
    });

    // A fresh registration guarantees install/activate runs instead of relying on
    // update() with byte-identical worker code, which browsers correctly skip.
    await page.reload({ waitUntil: 'load' });
    await waitForControl(page);

    await expect.poll(async () => page.evaluate(async () => {
      const keys = await caches.keys();
      return keys.filter(key => key === 'moonlit-shell-stale-regression' || key === 'moonlit-pages-stale-regression');
    }), { timeout: 10000 }).toEqual([]);
  });
});
