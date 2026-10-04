const { test, expect } = require('@playwright/test');

const books = [
  { name: '浮生歲月', path: 'books/fushengsuiyue/index.html' },
  { name: '兩種天空', path: 'books/liangzhongtiankong/index.html' }
];

for (const book of books) {
  test(`@reader ${book.name} keeps the core reading journey operable`, async ({ page }) => {
    await page.addInitScript(() => {
      class FakeUtterance {
        constructor(text) { this.text = text; this.lang = ''; this.rate = 1; }
      }
      const synth = {
        speaking: false, pending: false, paused: false,
        speak(u) { this.speaking = true; setTimeout(() => { this.speaking = false; u.onend?.(); }, 20); },
        cancel() { this.speaking = false; this.pending = false; this.paused = false; },
        pause() { this.paused = true; },
        resume() { this.paused = false; }
      };
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: FakeUtterance });
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth });
    });

    await page.goto(book.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#chapter-1')).toBeVisible();
    await expect(page.locator('#chapter-2')).toHaveCount(1);

    await page.locator('#chapter-1 a[href="#chapter-2"]').click();
    await expect(page).toHaveURL(/#chapter-2$/);
    await page.locator('#chapter-2 a[href="#chapter-1"]').click();
    await expect(page).toHaveURL(/#chapter-1$/);

    await page.locator('.audiobook-launch-button').click();
    await expect(page.locator('#audio-play')).toBeVisible();
    await expect(page.locator('#audio-prev')).toBeVisible();
    await expect(page.locator('#audio-next')).toBeVisible();

    await page.locator('#audio-chapter').selectOption('chapter-1');
    await page.locator('#audio-play').click();
    await expect(page.locator('#audio-status')).not.toHaveText('選擇章節，按「開始朗讀」。');

    await page.locator('#audio-chapter').selectOption('chapter-2');
    await page.locator('#audio-prev').click();
    await expect(page.locator('#audio-chapter')).toHaveValue('chapter-1');
    await expect(page).toHaveURL(/#chapter-1$/);

    await page.locator('#audio-next').click();
    await expect(page.locator('#audio-chapter')).toHaveValue('chapter-2');
    await expect(page).toHaveURL(/#chapter-2$/);

    const back = page.locator('a[href="../../index.html#book"]').last();
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(/\/#book$/);
    await expect(page.locator('#book')).toBeVisible();
  });
}
