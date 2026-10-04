const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name:'320', width:320, height:720 },
  { name:'375', width:375, height:812 },
  { name:'390', width:390, height:844 },
  { name:'430', width:430, height:932 },
  { name:'700', width:700, height:900 },
  { name:'701', width:701, height:900 },
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

  test('430/431 phone-to-continuity handoff stays stable', async ({ page }) => {
    const states=[];
    for (const width of [430,431]) {
      await page.setViewportSize({ width, height:932 });
      await page.goto('./', { waitUntil:'domcontentloaded' });
      states.push(await page.evaluate(() => {
        const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}};
        const nav=document.querySelector('.topbar .navlinks');
        return {
          width:innerWidth,
          overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          tonight:rect('#tonight'),
          featured:rect('#featured'),
          book:rect('#book'),
          navScrollable:nav.scrollWidth>nav.clientWidth,
          firstVisible:(()=>{const a=nav.querySelector('a'),r=a.getBoundingClientRect(),n=nav.getBoundingClientRect();return r.right>n.left&&r.left<n.right})()
        };
      }));
    }
    for (const state of states) {
      expect(state.overflow, state.width+'px page overflow').toBeLessThanOrEqual(1);
      expect(state.firstVisible, state.width+'px first navigation entry').toBeTruthy();
      expect(state.tonight.width).toBeGreaterThan(0);
      expect(state.featured.width).toBeGreaterThan(0);
      expect(state.book.width).toBeGreaterThan(0);
    }
    expect(states[0].navScrollable, '430px keeps compact navigation rail').toBeTruthy();
    expect(states[1].navScrollable, '431px remains safely scrollable until the 700px rail handoff').toBeTruthy();
    for (const section of ['tonight','featured','book']) {
      expect(Math.abs(states[0][section].left-states[1][section].left), section+' left edge at 430/431').toBeLessThanOrEqual(12);
      expect(Math.abs(states[0][section].right-states[1][section].right), section+' right edge at 430/431').toBeLessThanOrEqual(12);
    }
  });

  test('700/701 breakpoint handoff stays geometrically continuous', async ({ page }) => {
    const states=[];
    for (const width of [700,701]) {
      await page.setViewportSize({ width, height:900 });
      await page.goto('./', { waitUntil:'domcontentloaded' });
      states.push(await page.evaluate(() => {
        const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {width:r.width,left:r.left,right:r.right}};
        const nav=document.querySelector('.topbar .navlinks');
        return {
          width:innerWidth,
          overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          tonight:rect('#tonight'),
          featured:rect('#featured'),
          book:rect('#book'),
          navOverflow:nav.scrollWidth-nav.clientWidth,
          navLinks:[...nav.querySelectorAll(':scope>a')].every(a=>{const r=a.getBoundingClientRect(),n=nav.getBoundingClientRect();return r.right>n.left&&r.left<n.right})
        };
      }));
    }
    for (const state of states) {
      expect(state.overflow, state.width+'px page overflow').toBeLessThanOrEqual(1);
      expect(state.navOverflow, state.width+'px nav overflow').toBeLessThanOrEqual(1);
      expect(state.navLinks, state.width+'px navigation visibility').toBeTruthy();
      expect(state.tonight.width).toBeGreaterThan(0);
      expect(state.featured.width).toBeGreaterThan(0);
      expect(state.book.width).toBeGreaterThan(0);
    }
    for (const section of ['tonight','featured','book']) {
      expect(Math.abs(states[0][section].left-states[1][section].left), section+' left edge handoff').toBeLessThanOrEqual(12);
      expect(Math.abs(states[0][section].right-states[1][section].right), section+' right edge handoff').toBeLessThanOrEqual(12);
    }
  });

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


test('homepage image priority and intrinsic geometry stay stable', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('./', { waitUntil:'domcontentloaded' });
  const contract=await page.evaluate(() => {
    const logo=document.querySelector('.topbar .brand img');
    const featured=document.querySelector('#featured .featured-visual img');
    const album=[...document.querySelectorAll('#miaoshu-album img')];
    return {
      logo:{width:logo?.getAttribute('width'),height:logo?.getAttribute('height'),priority:logo?.getAttribute('fetchpriority'),ratio:getComputedStyle(logo).aspectRatio},
      featured:{width:featured?.getAttribute('width'),height:featured?.getAttribute('height'),loading:featured?.getAttribute('loading'),priority:featured?.getAttribute('fetchpriority')},
      album:album.map(img=>({width:img.getAttribute('width'),height:img.getAttribute('height'),loading:img.getAttribute('loading'),priority:img.getAttribute('fetchpriority')})),
      high:[...document.querySelectorAll('img[fetchpriority="high"]')].length
    };
  });
  expect(contract.logo.width).toBe('512');
  expect(contract.logo.height).toBe('512');
  expect(contract.logo.priority).toBe('auto');
  expect(contract.logo.ratio).toBe('1 / 1');
  expect(contract.high).toBe(0);
  expect(contract.featured).toEqual({width:'1086',height:'1448',loading:'lazy',priority:'low'});
  expect(contract.album).toHaveLength(2);
  expect(contract.album.every(x=>x.width==='1086'&&x.height==='1448'&&x.loading==='lazy'&&x.priority==='low')).toBeTruthy();
});


test('heavy homepage enhancements are proximity driven, not early-idle forced', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(2600);
  await expect(page.locator('script[src*="photo-viewer.js"]')).toHaveCount(0);
  await expect(page.locator('script[src*="moonlit-experience.js"]')).toHaveCount(0);
  await page.locator('#featured').scrollIntoViewIfNeeded();
  await expect.poll(async()=>page.locator('script[src*="photo-viewer.js"]').count()).toBe(1);
  await expect.poll(async()=>page.locator('script[src*="moonlit-experience.js"]').count()).toBe(1);
});

test('support likes stay outside the initial network path', async ({ page }) => {
  const likeRequests=[];
  page.on('request',req=>{if(req.url().includes('/api/likes'))likeRequests.push(req.url())});
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(1800);
  expect(likeRequests).toHaveLength(0);
});


test('service worker shell versions match current homepage assets', async ({ request }) => {
  const sw=await (await request.get('sw.js')).text();
  const html=await (await request.get('./')).text();
  expect(html).toContain('assets/homepage-inline.css?v=20261004-a11y11');
  expect(html).toContain('assets/moonlit-home-loader.js?v=20261004-mainthread9');
  expect(sw).toContain("const CACHE='moonlit-shell-v55'");
  expect(sw).toContain('assets/homepage-inline.css?v=20261004-a11y11');
  expect(sw).toContain('assets/moonlit-home-loader.js?v=20261004-mainthread9');
  expect(sw).toContain('assets/moonlit-home-idle.js?v=20261004-mainthread9');
});
