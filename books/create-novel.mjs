#!/usr/bin/env node
// Create the same standalone reading page used by every Moonlit Stories novel.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';

const source = process.argv[2];
if (!source) { console.error('用法：node books/create-novel.mjs books/小說資料.json'); process.exit(1); }
const data = JSON.parse(await readFile(resolve(source), 'utf8'));
const { id, title, description, chapters } = data;
if (!/^[a-z0-9-]+$/.test(id || '') || !title?.trim() || !description?.trim() || !Array.isArray(chapters) || !chapters.length || chapters.some(c => !c.title?.trim() || !Array.isArray(c.paragraphs) || !c.paragraphs.length || c.paragraphs.some(p => typeof p !== 'string' || !p.trim()))) {
  throw new Error('請提供英文小寫 id、書名、簡介，以及每章的標題與非空 paragraphs 陣列。');
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHtml;
const name = `《${title}》`;
const url = `https://vetjeremy-jpg.github.io/miaoshu.github.io/books/${id}/`;
const start = chapters[0].title;
const count = `${chapters.length} 個章節`;
const toc = chapters.map((c, i) => `<a href="#chapter-${i+1}"><span>${String(i+1).padStart(2,'0')}</span>${e(c.title)}</a>`).join('\n');
const text = chapters.map((c, i) => `<section class="chapter" id="chapter-${i+1}" aria-labelledby="heading-${i+1}">
 <div class="chapter-kicker">CHAPTER ${String(i+1).padStart(2,'0')}</div>
 <h2 id="heading-${i+1}">${e(c.title)}</h2>
 <div class="chapter-body">${c.paragraphs.map(p => `<p>${e(p)}</p>`).join('\n')}</div>
 <nav class="chapter-nav" aria-label="章節導覽"><a href="${i ? `#chapter-${i}` : '#top'}">${i ? '← 上一章' : '↑ 回到書首'}</a><a href="${i+1 < chapters.length ? `#chapter-${i+2}` : '#toc'}">${i+1 < chapters.length ? '下一章 →' : '↑ 回到章節目錄'}</a></nav>
</section>`).join('\n');
const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${e(description)}">
<meta name="theme-color" content="#070f1c">
<title>${e(name)}｜喵叔小說全文閱讀</title>
<link rel="stylesheet" href="../reader.css">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="book">
<meta property="og:locale" content="zh_TW">
<meta property="og:site_name" content="喵叔 Moonlit Stories">
<meta property="og:title" content="${e(name)}｜喵叔小說全文閱讀">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Book',name:title,author:{'@type':'Person',name:'喵叔'},inLanguage:'zh-Hant',url,description}).replace(/</g,'\\u003c')}</script>
</head>
<body id="top" data-book-id="${id}" data-book-title="${e(name)}">
<a class="skip-link" href="#toc">跳到章節目錄</a>
<div class="progress" id="progress" aria-hidden="true"></div>
<header class="topbar"><a class="brand" href="../../index.html"><img src="../../logo.PNG" alt="喵叔 Logo"><span>喵叔 Moonlit Stories</span></a><nav class="navlinks" aria-label="網站導覽"><a href="#toc">章節目錄</a><a href="../../index.html#book">其他小說</a><a href="../../index.html#photography">攝影</a><a href="../../index.html#community">留言</a><a href="../../index.html">首頁</a></nav></header>
<header class="hero"><div class="hero-inner"><div><span class="kicker">THE COMPLETE NOVEL · 全文閱讀</span><h1>${e(name)}</h1><p class="meta">作者：喵叔 · ${count}</p><a class="cta" href="#chapter-1">從${e(start)}開始 →</a></div><img class="hero-logo" src="../../logo.PNG" alt="喵叔金色貓咪 Logo"></div></header>
<main class="wrap">
<div class="continue-box" id="continue-reading" aria-live="polite"><p id="continue-label"></p><a id="continue-link" href="#toc">接續閱讀 →</a></div>
<section class="panel reader-shelf" id="reading-list" aria-labelledby="reading-list-title"><div class="shelf-heading"><div><span class="chapter-kicker">MY SHELF · 我的書籤</span><h2 id="reading-list-title">留著喜歡的章節，下次接著讀。</h2></div><a href="#toc">瀏覽章節 →</a></div><p class="shelf-note">收藏與閱讀進度保存在這台裝置，無須登入。</p><ul id="saved-chapters" class="saved-chapters" aria-live="polite"><li class="empty-shelf">還沒有收藏章節。閱讀時點選「收藏本章」即可加入。</li></ul></section>
<section class="panel book-directory" id="toc" aria-labelledby="toc-title"><div class="directory-head"><div><span class="chapter-kicker">THE COMPLETE NOVEL · 全文閱讀</span><h2 class="section-title" id="toc-title">${e(name)}</h2><p class="notice">${count}。點選章節直接閱讀；本站會在此裝置記住你的閱讀位置。</p></div><a class="directory-link" href="#chapter-1">從${e(start)}開始 ↗</a></div>
<div class="reader-controls" aria-label="閱讀字體大小"><span>閱讀字級</span><button type="button" id="font-smaller" aria-label="縮小內文字級">A−</button><button type="button" id="font-larger" aria-label="放大內文字級">A＋</button><button type="button" id="font-reset">還原</button></div>
<div class="chapter-search"><label for="chapter-search">搜尋章節</label><input id="chapter-search" type="search" placeholder="輸入章節名稱或關鍵字" autocomplete="off" aria-describedby="chapter-search-status"><span id="chapter-search-status" role="status" aria-live="polite"></span></div><div class="toc">${toc}</div></section>
<div id="text">${text}</div>
<p class="reader-end"><a href="#toc">↑ 回到章節目錄</a>　<a href="../../index.html#community">與喵叔聊聊讀後感 ↗</a></p>
</main><footer>© 喵叔 Moonlit Stories · <a href="../../index.html">回到首頁</a></footer>
<script src="../reader.js" defer></script>
</body></html>
`;
const destination = join(dirname(new URL(import.meta.url).pathname), id, 'index.html');
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, html);
console.log(`已產生 ${destination}；請在首頁加入小說連結。`);
