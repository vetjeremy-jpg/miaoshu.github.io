const { test, expect } = require('@playwright/test');

// Browser-level installability contract. Real OS installation must also be
// verified manually on Windows, Android and iOS.
test.describe('Moonlit install surface', () => {
  test('manifest declares a stable, same-origin standalone app', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    const data = await page.evaluate(async () => {
      const link = document.querySelector('link[rel="manifest"]');
      const response = await fetch(link.href, { cache: 'no-store' });
      if (!response.ok) throw new Error('Manifest unavailable: ' + response.status);
      const manifest = await response.json();
      const root = new URL('/miaoshu.github.io/', location.origin);
      return {
        manifest,
        link: link.href,
        root: root.href,
        start: new URL(manifest.start_url, location.origin).href,
        scope: new URL(manifest.scope, location.origin).href,
        icons: manifest.icons.map(icon => ({
          url: new URL(icon.src, location.origin).href,
          sizes: icon.sizes,
          purpose: icon.purpose
        }))
      };
    });
    expect(data.manifest.name).toBe('喵叔 Moonlit Stories');
    expect(data.manifest.display).toBe('standalone');
    expect(data.manifest.id).toBe('/miaoshu.github.io/');
    expect(data.start).toBe(data.root);
    expect(data.scope).toBe(data.root);
    expect(data.link).toBe(data.root + 'site.webmanifest');
    expect(data.icons.map(icon => icon.sizes)).toEqual(['192x192', '512x512']);
    for (const icon of data.icons) {
      expect(icon.url.startsWith(data.root)).toBe(true);
      expect(icon.purpose).toContain('any');
    }
  });

  test('iOS Home Screen metadata and icon are present', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', /喵叔/);
    const icon = page.locator('link[rel="apple-touch-icon"]');
    await expect(icon).toHaveAttribute('href', '/miaoshu.github.io/apple-touch-icon.png');
    const status = await page.evaluate(async () => {
      const res = await fetch(document.querySelector('link[rel="apple-touch-icon"]').href);
      return { ok: res.ok, type: res.headers.get('content-type') };
    });
    expect(status.ok).toBe(true);
    expect(status.type).toMatch(/image\/png/);
  });

  test('all manifest shortcuts remain within app scope', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(async () => {
      const manifest = await fetch(document.querySelector('link[rel="manifest"]').href).then(r => r.json());
      const scope = new URL(manifest.scope, location.origin);
      return (manifest.shortcuts || []).map(shortcut => {
        const url = new URL(shortcut.url, location.origin);
        return { name: shortcut.name, inScope: url.origin === scope.origin && url.pathname.startsWith(scope.pathname) };
      });
    });
    expect(result.length).toBeGreaterThan(0);
    for (const shortcut of result) {
      expect(shortcut.name).toBeTruthy();
      expect(shortcut.inScope).toBe(true);
    }
  });
});
