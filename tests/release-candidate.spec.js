const { test, expect } = require('@playwright/test');

const PAGES = [
  { name:'home', path:'./', nav:'.topbar .navlinks' },
  { name:'gallery', path:'gallery/', nav:'.top nav' },
  { name:'about', path:'about/', nav:'.top nav' },
  { name:'fusheng', path:'books/fushengsuiyue/', nav:'.topbar .navlinks' },
  { name:'two-skies', path:'books/liangzhongtiankong/', nav:'.topbar .navlinks' }
];
const MOBILE=[320,375,390,430];

for (const item of PAGES) {
  for (const width of MOBILE) {
    test(`@p0 RC ${item.name} has no page overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({width,height:844});
      await page.goto(item.path,{waitUntil:'domcontentloaded'});
      await expect(page.locator(item.nav)).toBeVisible();
      const state=await page.evaluate(()=>({
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        manifest:document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
        viewport:document.querySelector('meta[name="viewport"]')?.getAttribute('content')
      }));
      expect(state.overflow).toBeLessThanOrEqual(1);
      expect(state.manifest).toBeTruthy();
      expect(state.viewport).toContain('width=device-width');
    });
  }
}

test('@p0 RC gallery logo uses stable square geometry without high priority', async ({ page }) => {
  await page.goto('gallery/',{waitUntil:'domcontentloaded'});
  const logo=page.locator('.top .brand img');
  await expect(logo).toHaveAttribute('width','512');
  await expect(logo).toHaveAttribute('height','512');
  await expect(logo).toHaveAttribute('fetchpriority','auto');
});

for (const path of ['books/fushengsuiyue/','books/liangzhongtiankong/']) {
  test(`@p0 RC reader keeps audio and chapter navigation: ${path}`, async ({ page }) => {
    await page.goto(path,{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('link',{name:/開啟朗讀功能/})).toBeVisible();
    await expect(page.locator('.chapter-nav').first()).toBeVisible();
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  });
}


// Keep the mobile constellation itself visible; a fallback list alone is not a star map.
for (const width of MOBILE) {
  test(`@p0 RC works constellation renders and links on ${width}px mobile`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('works/', { waitUntil: 'domcontentloaded' });
    const map = page.locator('#star-map');
    await expect(map).toBeVisible();
    await expect(map.locator('.theme-node')).toHaveCount(6);
    expect(await map.locator('.work-node').count()).toBeGreaterThanOrEqual(19);
    expect(await map.locator('#star-lines line').count()).toBeGreaterThan(0);
    const novel = map.locator('.work-node[data-id="rain-stops-i-remain"] a');
    await expect(novel).toBeVisible();
    await expect(novel).toHaveAttribute('href', '../books/rain-stops-i-remain/');
    const geometry = await novel.evaluate(link => {
      const item = link.getBoundingClientRect();
      const outer = document.getElementById('star-map').getBoundingClientRect();
      return { within: item.left >= outer.left - 1 && item.right <= outer.right + 1,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(geometry.within, 'work star is not clipped horizontally').toBeTruthy();
    expect(geometry.overflow, 'no horizontal page scroll').toBeLessThanOrEqual(1);
    await page.locator('#star-filters button[data-filter="human"]').click();
    await expect(map.locator('.work-node[data-id="rain-stops-i-remain"]')).toHaveClass(/is-related/);
    await expect(map.locator('#star-lines line[data-theme="human"][data-work="rain-stops-i-remain"]')).toHaveClass(/is-related/);
    await expect(page.locator('.mobile-reading-index')).not.toHaveAttribute('open', '');
  });
}

test('@p0 RC desktop works constellation remains visible', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('works/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#star-map')).toBeVisible();
  await expect(page.locator('.work-node[data-id="rain-stops-i-remain"] a')).toBeVisible();
});
