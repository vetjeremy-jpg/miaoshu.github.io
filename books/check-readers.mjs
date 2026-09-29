#!/usr/bin/env node
// Prevent a new book from silently losing the shared reader experience.
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const entries = await readdir(root, { withFileTypes: true });
const homepage = await readFile(join(root, '..', 'index.html'), 'utf8');
const library = homepage.match(/<!-- BOOKS:START -->([\s\S]*?)<!-- BOOKS:END -->/)?.[1];
let checked = 0, errors = 0;
if (!library || !homepage.includes('id="book"')) { console.error('首頁缺少小說書房或列表標記'); errors++; }
for (const entry of entries.filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))) {
  let html;
  try { html = await readFile(join(root, entry.name, 'index.html'), 'utf8'); }
  catch { console.error(`${entry.name} 缺少獨立閱讀頁 index.html`); errors++; continue; }
  checked++;
  if (library && (!library.includes(`data-book-id="${entry.name}"`) || !library.includes(`books/${entry.name}/index.html#toc`))) {
    console.error(`${entry.name} 未加入首頁小說書房`); errors++;
  }
  if (!/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']\.\.\/reader\.css(?:\?[^"']*)?["']/i.test(html)) { console.error(`${entry.name} 缺少共用樣式 reader.css`); errors++; }
  const requirements = [
    ['共用功能', 'src="../reader.js'],
    ['專屬書籍 ID', `data-book-id="${entry.name}"`], ['書籍標題', 'data-book-title='],
    ['章節目錄', 'id="toc"'], ['閱讀進度', 'id="progress"'],
    ['繼續閱讀', 'id="continue-reading"'], ['書籤', 'id="saved-chapters"'],
    ['字級調整', 'id="font-larger"'], ['章節搜尋', 'id="chapter-search"'],
    ['章節正文', 'class="chapter-body"'], ['讀後交流', 'class="reader-end"'],
  ];
  for (const [name, marker] of requirements) if (!html.includes(marker)) { console.error(`${entry.name} 缺少${name}：${marker}`); errors++; }
  const chapters = [...html.matchAll(/<section class="chapter" id="chapter-(\d+)"/g)].map(m => +m[1]);
  const toc = [...html.matchAll(/<a href="#chapter-(\d+)"><span>/g)].map(m => +m[1]);
  if (!chapters.length || chapters.some((n, i) => n !== i + 1) || JSON.stringify(chapters) !== JSON.stringify(toc)) {
    console.error(`${entry.name} 的章節與目錄編號不一致`); errors++;
  }
}
console.log(`已檢查 ${checked} 本小說；${errors} 項問題。`);
if (!checked || errors) process.exit(1);

