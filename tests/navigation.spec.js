const { test, expect } = require('@playwright/test');

const EXPECTED = ['首頁','小說','攝影','作品星圖','札記','影片','關於','月光來信','⌕ 搜尋'];
const VIEWPORTS = [
  { name: '320', width: 320, height: 720, mobile: true },
  { name: '375', width: 375, height: 812, mobile: true },
  { name: '390', width: 390, height: 844, mobile: true },
  { name: '430', width: 430, height: 932, mobile: true },
  { name: '768', width: 768, height: 1024, mobile: false },
  { name: '1024', width: 1024, height: 768, mobile: false },
  { name: '1440', width: 1440, height: 900, mobile: false }
];

async function openHome(page, vp) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.topbar .navlinks')).toBeVisible();
}

async function navMetrics(page) {
  return page.locator('.topbar .navlinks').evaluate((nav) => {
    const links = [...nav.querySelectorAll(':scope > a')];
    const nr = nav.getBoundingClientRect();
    return {
      clientWidth: nav.clientWidth,
      scrollWidth: nav.scrollWidth,
      scrollLeft: nav.scrollLeft,
      bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      links: links.map(a => {
        const r = a.getBoundingClientRect();
        const s = getComputedStyle(a);
        return {
          text: a.textContent.trim(),
          left: r.left, right: r.right, width: r.width, height: r.height,
          visible: r.right > nr.left && r.left < nr.right,
          paddingLeft: parseFloat(s.paddingLeft),
          paddingRight: parseFloat(s.paddingRight),
          minHeight: parseFloat(s.minHeight)
        };
      })
    };
  });
}

test.describe('Moonlit 9-entry primary navigation regression', () => {
  test('@p0 has exactly nine entries in the required order, including video', async ({ page }) => {
    await openHome(page, VIEWPORTS[6]);
    const nav = page.locator('.topbar .navlinks');
    const links = nav.locator(':scope > a');
    await expect(links).toHaveCount(9);
    expect(await links.allTextContents()).toEqual(EXPECTED);
    await expect(nav.getByRole('link', { name: '影片', exact: true })).toHaveAttribute('href', 'videos/');
  });

  test('@p0 ARIA contract is intact', async ({ page }) => {
    await openHome(page, VIEWPORTS[6]);
    await expect(page.locator('.topbar .navlinks')).toHaveAttribute('aria-label', '網站導覽');
    await expect(page.locator('.topbar .navlinks a').first()).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.moonlit-search-link')).toHaveAttribute('aria-label', '搜尋小說、章節與創作');
  });

  for (const vp of VIEWPORTS) {
    test(`@p0 ${vp.name}px: layout, visibility and touch geometry`, async ({ page }) => {
      await openHome(page, vp);
      const m = await navMetrics(page);

      expect(m.bodyOverflow, 'page itself must not horizontally overflow').toBeLessThanOrEqual(1);
      for (const link of m.links) {
        expect(link.height, `${link.text} touch height`).toBeGreaterThanOrEqual(43.5);
      }

      if (vp.width <= 430) {
        expect(m.scrollLeft, 'mobile rail starts at the first entry').toBe(0);
        expect(m.scrollWidth, 'mobile rail should remain horizontally scrollable').toBeGreaterThan(m.clientWidth);
        expect(m.links[0].visible, '首頁 visible at rail start').toBeTruthy();
        expect(m.links[1].visible, '小說 visible at rail start').toBeTruthy();
      } else {
        expect(m.links.every(x => x.visible), 'all entries visible on tablet/desktop').toBeTruthy();
      }
    });
  }

  for (const vp of VIEWPORTS.filter(v => v.width <= 430)) {
    test(`@p0 ${vp.name}px: horizontal rail reaches final entries without moving body`, async ({ page }) => {
      await openHome(page, vp);
      const nav = page.locator('.topbar .navlinks');
      const before = await navMetrics(page);

      await nav.evaluate(el => { el.scrollLeft = el.scrollWidth; });
      await page.waitForTimeout(100);

      const after = await navMetrics(page);
      // At 430px the full nine-entry rail may fit; require scrolling only when overflow actually exists.
      if (before.scrollWidth > before.clientWidth + 1) {
        expect(after.scrollLeft).toBeGreaterThan(before.scrollLeft);
      } else {
        expect(after.links.every(x => x.visible), 'all nav entries visible when rail fits without scrolling').toBeTruthy();
      }
      expect(after.links.at(-1).visible, '搜尋 visible at rail end').toBeTruthy();
      expect(after.links.at(-2).visible, '月光來信 visible at rail end').toBeTruthy();
      expect(after.bodyOverflow).toBeLessThanOrEqual(1);
    });
  }

  test('@p1 keyboard Tab follows visual order and every focused entry is visible', async ({ page }) => {
    await openHome(page, VIEWPORTS[1]);
    const nav = page.locator('.topbar .navlinks');

    await page.locator('body').focus();
    const visited = [];
    for (let guard = 0; guard < 30 && visited.length < 9; guard++) {
      await page.keyboard.press('Tab');
      const state = await page.evaluate(() => {
        const a = document.activeElement;
        const nav = document.querySelector('.topbar .navlinks');
        if (!a || !nav || !nav.contains(a) || a.tagName !== 'A') return null;
        const ar = a.getBoundingClientRect(), nr = nav.getBoundingClientRect();
        const s = getComputedStyle(a);
        return {
          text: a.textContent.trim(),
          visible: ar.right > nr.left && ar.left < nr.right,
          outlineStyle: s.outlineStyle,
          outlineWidth: parseFloat(s.outlineWidth)
        };
      });
      if (state && !visited.includes(state.text)) {
        visited.push(state.text);
        expect(state.visible, `${state.text} focused link should be scrolled into view`).toBeTruthy();
        expect(state.outlineStyle).not.toBe('none');
        expect(state.outlineWidth).toBeGreaterThanOrEqual(2);
      }
    }
    expect(visited).toEqual(EXPECTED);
  });

  test('@p1 Shift+Tab reverses through navigation', async ({ page }) => {
    await openHome(page, VIEWPORTS[6]);
    const links = page.locator('.topbar .navlinks > a');
    await links.last().focus();
    await expect(links.last()).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(links.nth(7)).toBeFocused();
  });

  test('@p0 mobile-safety.css does not override homepage compact padding at 320px', async ({ page }) => {
    await openHome(page, VIEWPORTS[0]);
    const metrics = await navMetrics(page);
    for (const link of metrics.links) {
      expect(link.paddingLeft, `${link.text} left padding must be homepage 320px rule`).toBeCloseTo(7, 0);
      expect(link.paddingRight, `${link.text} right padding must be homepage 320px rule`).toBeCloseTo(7, 0);
      expect(link.minHeight).toBeGreaterThanOrEqual(44);
    }

    const sourceContract = await page.evaluate(() => {
      const body = document.body;
      return {
        isBook: body.hasAttribute('data-book-id'),
        touch: getComputedStyle(body).getPropertyValue('--moonlit-touch').trim()
      };
    });
    expect(sourceContract.isBook).toBeFalsy();
    expect(sourceContract.touch).toBe('44px');
  });

  test('@p0 mobile navigation computed CSS keeps the intended rail contract', async ({ page }) => {
    await openHome(page, VIEWPORTS[2]);
    const css = await page.locator('.topbar .navlinks').evaluate(nav => {
      const s = getComputedStyle(nav);
      const a = getComputedStyle(nav.querySelector('a'));
      return {
        display: s.display,
        wrap: s.flexWrap,
        overflowX: s.overflowX,
        whiteSpace: a.whiteSpace,
        flexGrow: a.flexGrow,
        flexShrink: a.flexShrink
      };
    });
    expect(css.display).toBe('flex');
    expect(css.wrap).toBe('nowrap');
    expect(['auto','scroll']).toContain(css.overflowX);
    expect(css.whiteSpace).toBe('nowrap');
    expect(css.flexGrow).toBe('0');
    expect(css.flexShrink).toBe('0');
  });
});


test('@p0 skip link moves keyboard focus to the main reading content', async ({ page }) => {
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await page.keyboard.press('Tab');
  const skip=page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('#main')).toHaveAttribute('tabindex','-1');
});

test('@p0 reduced motion removes meaningful homepage transition durations', async ({ browser }) => {
  const context=await browser.newContext({ reducedMotion:'reduce', viewport:{width:390,height:844} });
  const page=await context.newPage();
  await page.goto('./', { waitUntil:'domcontentloaded' });
  const motion=await page.locator('.hero-primary').evaluate(el=>{
    const s=getComputedStyle(el);
    return {transition:s.transitionDuration,animation:s.animationDuration,scroll:getComputedStyle(document.documentElement).scrollBehavior};
  });
  expect(motion.scroll).toBe('auto');
  expect(motion.transition.split(',').every(v=>parseFloat(v)<=0.001)).toBeTruthy();
  expect(motion.animation.split(',').every(v=>parseFloat(v)<=0.001)).toBeTruthy();
  await context.close();
});
