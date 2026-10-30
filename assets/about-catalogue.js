/* 關於頁的作品資訊以小說全集為唯一來源，新增作品時不另維護介紹副本。 */
(async () => {
  const target = document.getElementById('novel-catalogue-summary');
  if (!target) return;
  try {
    const url = new URL('../books/', document.baseURI);
    const response = await fetch(url, {cache: 'no-cache'});
    if (!response.ok) throw new Error('Catalogue unavailable');
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    const books = [...doc.querySelectorAll('article.book')];
    if (!books.length) throw new Error('Empty catalogue');
    const fragment = document.createDocumentFragment();
    const count = document.createElement('p');
    count.textContent = `目前收錄 ${books.length} 部小說作品。以下題材導讀與作品介紹隨小說全集同步更新。`;
    fragment.append(count);
    const guide = doc.querySelector('.guide');
    // 僅重建文字及站內連結，不把來源頁的 HTML、腳本或樣式插入頁面。
    function copyText(source, destination) {
      for (const node of source.childNodes) {
        if (node.nodeType === 3) destination.append(document.createTextNode(node.textContent));
        else if (node.nodeName === 'A') {
          const href = new URL(node.getAttribute('href'), url);
          if (href.origin !== location.origin) continue;
          const a = document.createElement('a'); a.href = href.href; a.textContent = node.textContent; destination.append(a);
        } else copyText(node, destination);
      }
    }
    if (guide) {
      for (const heading of guide.querySelectorAll('h3')) {
        const h = document.createElement('h3'); h.textContent = heading.textContent; fragment.append(h);
        const description = heading.nextElementSibling;
        if (description?.tagName === 'P') { const p = document.createElement('p'); copyText(description, p); fragment.append(p); }
      }
    }
    const details = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = `查看全部 ${books.length} 部作品簡介`; details.append(summary);
    for (const book of books) {
      const sourceLink = book.querySelector('a[href]');
      if (!sourceLink) continue;
      const href = new URL(sourceLink.getAttribute('href'), url);
      if (href.origin !== location.origin) continue;
      const p = document.createElement('p'), a = document.createElement('a');
      a.href = href.href; a.textContent = book.querySelector('h2')?.textContent || sourceLink.textContent;
      p.append(a, document.createTextNode('：' + (book.querySelector('p')?.textContent || ''))); details.append(p);
    }
    fragment.append(details);
    const p = document.createElement('p'), a = document.createElement('a'); a.href = url.href;
    a.textContent = `前往喵叔小說全集，查看全部 ${books.length} 部作品 →`; p.append(a); fragment.append(p);
    target.replaceChildren(fragment);
  } catch {
    // 保留可用的全集入口，不顯示可能過時的數量或書名。
  }
})();
