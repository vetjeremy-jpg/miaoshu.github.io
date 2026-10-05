const { test, expect } = require('@playwright/test');

const ROUTES = ['./','./book.html','./gallery/','./posts/','./videos/','./about/','./works/'];

for (const route of ROUTES) {
  test(`critical accessibility contract: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const issues = await page.evaluate(() => {
      const problems = [];
      const visible = el => {
        const s = getComputedStyle(el), r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
      };
      const name = el => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim();

      if (!document.documentElement.lang.trim()) problems.push('html element must declare lang');
      if (!document.querySelector('main,[role="main"]')) problems.push('page must expose a main landmark');

      document.querySelectorAll('[id]').forEach(el => {
        if (document.querySelectorAll(`[id="${CSS.escape(el.id)}"]`).length > 1)
          problems.push(`duplicate id: ${el.id}`);
      });

      document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('alt')) problems.push(`image missing alt: ${img.src}`);
      });

      document.querySelectorAll('button').forEach(el => {
        if (visible(el) && !name(el)) problems.push('visible button missing accessible name');
      });

      document.querySelectorAll('a[href]').forEach(el => {
        if (visible(el) && !name(el) && !el.querySelector('img[alt]:not([alt=""])'))
          problems.push(`visible link missing accessible name: ${el.getAttribute('href')}`);
      });

      document.querySelectorAll('input:not([type="hidden"]),select,textarea').forEach(el => {
        if (!visible(el)) return;
        const id = el.id;
        const labelled = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') ||
          (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.closest('label');
        if (!labelled) problems.push(`form control missing label: ${el.tagName.toLowerCase()}#${id || '(no-id)'}`);
      });

      document.querySelectorAll('iframe').forEach(el => {
        if (visible(el) && !(el.getAttribute('title') || '').trim())
          problems.push(`iframe missing title: ${el.src || '(no-src)'}`);
      });

      return [...new Set(problems)];
    });

    expect(issues, `Critical accessibility issues on ${route}`).toEqual([]);
  });
}
