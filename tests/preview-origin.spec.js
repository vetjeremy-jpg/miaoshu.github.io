const { test, expect } = require('@playwright/test');

test('PR checks run against the checked-out preview, never production', async ({ page, baseURL }) => {
  const target = new URL(baseURL);
  expect(['127.0.0.1', 'localhost'], 'CI must use loopback preview').toContain(target.hostname);
  expect(target.pathname, 'preview must preserve GitHub Pages project scope').toBe('/miaoshu.github.io/');
  const response = await page.goto('./', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).origin).toBe(target.origin);
  await expect(page.locator('html')).toHaveAttribute('lang', /zh/i);
});
