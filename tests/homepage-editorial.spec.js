const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name:'320', width:320, height:720 },
  { name:'375', width:375, height:812 },
  { name:'390', width:390, height:844 },
  { name:'430', width:430, height:932 },
  { name:'768', width:768, height:1024 },
  { name:'1024', width:1024, height:768 },
  { name:'1440', width:1440, height:900 }
];

async function open(page, vp) {
  await page.setViewportSize({ width:vp.width, height:vp.height });
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('故事');
}

test.describe('Moonlit homepage editorial rhythm', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name}px keeps editorial hierarchy and safe geometry`, async ({ page }) => {
      await open(page, vp);
      const m = await page.evaluate(() => {
        const box = sel => {
          const el=document.querySelector(sel); if(!el) return null;
          const r=el.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,width:r.width,height:r.height};
        };
        const nav=[...document.querySelectorAll('.topbar .navlinks>a')];
        return {
          bodyOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          hero:box('.hero'), tonight:box('#tonight'), featured:box('#featured'), book:box('#book'),
          transitions:[...document.querySelectorAll('.editorial-transition')].map(x=>box('.editorial-transition:nth-of-type('+( [...x.parentElement.children].filter(y=>y.classList?.contains('editorial-transition')).indexOf(x)+1 )+')')),
          navCount:nav.length,
          heroText:document.querySelector('.hero-lede')?.textContent.trim(),
          tonightTitle:document.querySelector('#tonight-title')?.textContent.trim(),
          closing:document.querySelector('#moonlit-closing-title')?.textContent.trim(),
          cards:[...document.querySelectorAll('#tonight .tonight-grid article')].map(x=>getComputedStyle(x).borderRadius),
          directory:[...document.querySelectorAll('#featured .moonlit-entry')].map(x=>getComputedStyle(x).gridTemplateColumns)
        };
      });
      expect(m.bodyOverflow).toBeLessThanOrEqual(1);
      expect(m.navCount).toBe(9);
      expect(m.heroText).toContain('讀原創小說');
      expect(m.heroText).toContain('攝影與影像');
      expect(m.tonightTitle).toBe('今夜三選');
      expect(m.closing).toBe('今晚讀到這裡。');
      expect(m.hero.bottom).toBeLessThan(m.tonight.top);
      expect(m.tonight.bottom).toBeLessThan(m.featured.top);
      expect(m.featured.bottom).toBeLessThan(m.book.top);
      expect(m.cards.every(v => parseFloat(v) <= 1)).toBeTruthy();
      expect(m.directory.length).toBe(3);
    });
  }

  test('375/390 mobile rhythm deliberately differs from uniform section spacing', async ({ page }) => {
    for (const width of [375,390]) {
      await page.setViewportSize({ width, height:844 });
      await page.goto('./', { waitUntil:'domcontentloaded' });
      const gaps=await page.evaluate(() => {
        const r=s=>document.querySelector(s).getBoundingClientRect();
        const hero=r('.hero'), t1=r('main>.editorial-transition:first-child'), tonight=r('#tonight');
        const t2=r('#tonight + .editorial-transition'), featured=r('#featured');
        return [t1.top-hero.bottom, tonight.top-t1.bottom, t2.top-tonight.bottom, featured.top-t2.bottom];
      });
      const rounded=gaps.map(v=>Math.round(v));
      expect(new Set(rounded).size, `${width}px should not collapse to one repeated gap`).toBeGreaterThan(1);
    }
  });

  test('editorial CSS remains before mobile-safety in source order', async ({ page }) => {
    await open(page, VIEWPORTS[2]);
    const hrefs=await page.locator('link[rel="stylesheet"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')||''));
    expect(hrefs.findIndex(x=>x.includes('homepage-editorial.css'))).toBeLessThan(hrefs.findIndex(x=>x.includes('mobile-safety.css')));
  });
});

test('homepage has one explicit emotional closing and a quieter support strip', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await expect(page.locator('#support .section-title')).toBeHidden();
  await expect(page.locator('.moonlit-closing h2')).toHaveCount(1);
  await expect(page.locator('.moonlit-breathing-quote')).toBeVisible();
  await expect(page.locator('#newsletter')).toBeVisible();
  const order=await page.evaluate(()=>['#community','#support','.moonlit-breathing-quote','.moonlit-closing','#newsletter'].map(s=>document.querySelector(s).getBoundingClientRect().top+scrollY));
  expect(order).toEqual([...order].sort((a,b)=>a-b));
});


test('editorial stylesheet stays within the current technical-debt budget', async ({ request }) => {
  const response=await request.get('assets/homepage-editorial.css');
  expect(response.ok()).toBeTruthy();
  const css=await response.text();
  const important=(css.match(/!important/g)||[]).length;
  const media=(css.match(/@media/g)||[]).length;
  expect(important, 'do not grow the editorial !important budget').toBeLessThanOrEqual(195);
  expect(media, 'consolidate breakpoints instead of adding new media blocks').toBeLessThanOrEqual(15);
  expect(css.length, 'keep the editorial layer from growing unchecked').toBeLessThanOrEqual(19200);
});


test('third-party embeds stay inert until they approach the viewport', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('./', { waitUntil:'domcontentloaded' });
  const frames=page.locator('iframe[data-lazy-src]');
  await expect(frames).toHaveCount(3);
  const initial=await frames.evaluateAll(xs=>xs.map(x=>({src:x.getAttribute('src'),lazy:x.dataset.lazySrc})));
  expect(initial.every(x=>x.src==='about:blank' && /^https:/.test(x.lazy))).toBeTruthy();
  await page.locator('#featured-short').scrollIntoViewIfNeeded();
  await expect.poll(async()=>page.locator('.moonlit-video-primary iframe').getAttribute('data-lazy-src')).toBeNull();
  await expect(page.locator('.moonlit-video-primary iframe')).toHaveAttribute('src',/youtube-nocookie\.com/);
  await expect(page.locator('#community iframe')).toHaveAttribute('data-lazy-src',/chatgpt\.site/);
});
