const { test, expect } = require('@playwright/test');

const ROUTES = ['./','./gallery/','./posts/','./videos/','./about/','./works/','./books/fushengsuiyue/index.html','./books/liangzhongtiankong/index.html'];

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

      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible);
      if (!headings.some(el => el.tagName === 'H1')) problems.push('page must expose a visible h1');
      for (let i = 1; i < headings.length; i++) {
        const previous = Number(headings[i - 1].tagName.slice(1));
        const current = Number(headings[i].tagName.slice(1));
        if (current > previous + 1)
          problems.push(`heading level skips from h${previous} to h${current}: ${name(headings[i]) || '(unnamed)'}`);
      }

      const idRefs = ['aria-labelledby','aria-describedby','aria-controls','aria-owns','aria-details','aria-errormessage'];
      document.querySelectorAll(idRefs.map(attr => `[${attr}]`).join(',')).forEach(el => {
        for (const attr of idRefs) {
          const value = el.getAttribute(attr);
          if (!value) continue;
          for (const id of value.trim().split(/\\s+/)) {
            if (!document.getElementById(id))
              problems.push(`${attr} references missing id: ${id}`);
          }
        }
      });

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

    const focusableCount = await page.locator('a[href],button,input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])').evaluateAll(elements =>
      elements.filter(el => {
        const s = getComputedStyle(el), r = el.getBoundingClientRect();
        return !el.disabled && s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
      }).length
    );
    if (focusableCount > 0) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement && document.activeElement !== document.body && document.activeElement !== document.documentElement);
      expect(focused, `Keyboard Tab must reach an interactive element on ${route}`).toBeTruthy();
    }
  });
}
