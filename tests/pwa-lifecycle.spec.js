const { test, expect } = require('@playwright/test');

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
    await page.goto('./', { waitUntil: 'load' });
    const state = await waitForControl(page);
    expect(state.scope).toBe(new URL('./', page.url()).href);
    expect(state.controlled).toBe(true);

    // The page cache is intentionally lazy: exercise one controlled navigation.
    await page.reload({ waitUntil: 'domcontentloaded' });
    const keys = await page.evaluate(() => caches.keys());
    expect(keys.filter(key => key.startsWith('moonlit-shell-'))).toHaveLength(1);
    expect(keys.filter(key => key.startsWith('moonlit-pages-'))).toHaveLength(1);
  });

  test('P0 fresh activation removes stale Moonlit cache generations @p0', async ({ page }) => {
    await page.goto('./', { waitUntil: 'load' });
    await waitForControl(page);

    await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
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
