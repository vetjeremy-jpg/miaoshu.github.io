const { test, expect } = require('@playwright/test');

test.describe('Moonlit PWA lifecycle', () => {
  test('P0 registers and controls the app with the canonical caches @p0', async ({ page, context }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });

    const state = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator) || !('caches' in window)) {
        return { supported: false };
      }
      const registration = await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve => {
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
          setTimeout(resolve, 5000);
        });
      }
      const keys = await caches.keys();
      return {
        supported: true,
        scope: registration.scope,
        controlled: Boolean(navigator.serviceWorker.controller),
        keys
      };
    });

    expect(state.supported).toBe(true);
    expect(state.scope).toBe(new URL('./', page.url()).href);
    expect(state.controlled).toBe(true);
    expect(state.keys.filter(key => key.startsWith('moonlit-shell-'))).toHaveLength(1);
    expect(state.keys.filter(key => key.startsWith('moonlit-pages-'))).toHaveLength(1);
  });

  test('P0 activation removes stale Moonlit cache generations @p0', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      await caches.open('moonlit-shell-stale-regression');
      await caches.open('moonlit-pages-stale-regression');
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const stale = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys.filter(key => key === 'moonlit-shell-stale-regression' || key === 'moonlit-pages-stale-regression');
    });
    expect(stale).toEqual([]);
  });
});
