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

    await page.locator('a[href="books/fushengsuiyue/index.html#toc"]').first().click();
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
