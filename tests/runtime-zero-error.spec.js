const { test, expect } = require('@playwright/test');

const ROUTES = [
  './',
  './book.html',
  './gallery/',
  './posts/',
  './videos/',
  './about/',
  './works/'
];

function sameOrigin(url, base) {
  try { return new URL(url).origin === new URL(base).origin; }
  catch { return false; }
}

for (const route of ROUTES) {
  test(`runtime zero-error: ${route}`, async ({ page, baseURL }) => {
    const errors = [];

    page.on('pageerror', error => {
      errors.push(`pageerror: ${error.message}`);
    });

    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      // Browser/network diagnostics for third-party embeds are intentionally
      // outside this contract; same-origin failures are captured below.
      const urls = msg.args().length ? [] : (text.match(/https?:\/\/[^\s)]+/g) || []);
      if (urls.length && urls.every(url => !sameOrigin(url, baseURL))) return;
      errors.push(`console.error: ${text}`);
    });

    page.on('requestfailed', request => {
      if (!sameOrigin(request.url(), baseURL)) return;
      errors.push(`requestfailed: ${request.method()} ${request.url()} — ${request.failure()?.errorText || 'unknown'}`);
    });

    page.on('response', response => {
      if (!sameOrigin(response.url(), baseURL)) return;
      if (response.status() >= 400) {
        errors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `${route} must return a document response`).not.toBeNull();
    expect(response.status(), `${route} document status`).toBeLessThan(400);
    await page.waitForLoadState('load');
    await page.waitForTimeout(750);

    expect([...new Set(errors)], `Unexpected runtime errors on ${route}`).toEqual([]);
  });
}
