/* Moonlit — Degoo external albums. Nothing is displayed until verified. No media files are stored here. */
(() => {
  'use strict';
  const doc = document;
  const main = doc.querySelector('.gallery-page main');
  const cards = doc.querySelector('.gallery-page .series-grid');
  const nav = doc.querySelector('.gallery-page .collection-nav');
  if (!main || !cards || !nav) return;

  const isHttps = value => {
    if (typeof value !== 'string' || !value) return false;
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
  };
  const approved = album => {
    if (!album || album.verified !== true ||
        !['tiger-spirit', 'emergence'].includes(album.id) ||
        !isHttps(album.shareUrl) ||
        new URL(album.shareUrl).hostname !== 'app.degoo.com' ||
        !Array.isArray(album.photos) || album.photos.length !== 6) return false;
    const images = new Set();
    for (const p of album.photos) {
      if (!p || !isHttps(p.imageUrl) || !isHttps(p.thumbnailUrl) ||
          (p.pageUrl && !isHttps(p.pageUrl)) ||
          !Number.isInteger(p.width) || p.width < 1 ||
          !Number.isInteger(p.height) || p.height < 1 ||
          !p.alt || !p.title || images.has(p.imageUrl)) return false;
      images.add(p.imageUrl);
    }
    return true;
  };
  const element = (tag, cls, text) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  let viewer;
  let activeAlbum, currentIndex = 0, returnFocus, prevOverflow = '', touchStart, serial = 0, pending;
  const setupViewer = () => {
    if (viewer || !window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;
    viewer = element('dialog', 'photo-viewer degoo-photo-viewer');
    viewer.setAttribute('aria-label', 'Degoo 攝影作品放大瀏覽');
    viewer.innerHTML = '<div class="photo-viewer-shell"><header class="photo-viewer-bar"><span class="photo-viewer-count" role="status" aria-live="polite"></span><button type="button" class="photo-viewer-close" aria-label="關閉">關閉 ×</button></header><div class="photo-viewer-stage"><button type="button" class="photo-viewer-prev" aria-label="上一張">‹</button><img class="photo-viewer-image" alt=""><p class="photo-viewer-loading" role="status" aria-live="polite">照片載入中…</p><button type="button" class="photo-viewer-next" aria-label="下一張">›</button></div><footer class="photo-viewer-caption"><h2 class="degoo-photo-title"></h2><p class="degoo-photo-description"></p><a class="photo-viewer-source" target="_blank" rel="noopener noreferrer">在 Degoo 開啟相簿 ↗</a><span class="photo-viewer-hint">左右滑動或使用方向鍵切換 · Esc 關閉</span></footer></div>';
    doc.body.append(viewer);
    viewer.querySelector('.photo-viewer-close').addEventListener('click', () => viewer.close());
    viewer.querySelector('.photo-viewer-prev').addEventListener('click', () => show(currentIndex - 1));
    viewer.querySelector('.photo-viewer-next').addEventListener('click', () => show(currentIndex + 1));
    viewer.addEventListener('keydown', event => {
      if (event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(currentIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(currentIndex + 1); }
    });
    viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
    viewer.addEventListener('close', () => {
      serial++;
      if (pending) { pending.onload = null; pending.onerror = null; pending.src = ''; pending = null; }
      doc.body.style.overflow = prevOverflow;
      if (returnFocus) returnFocus.focus({preventScroll:true});
    });
    const stage = viewer.querySelector('.photo-viewer-stage');
    stage.addEventListener('touchstart', event => {
      touchStart = event.touches.length === 1 ?
        {x:event.touches[0].clientX, y:event.touches[0].clientY} : null;
    }, {passive:true});
    stage.addEventListener('touchcancel', () => { touchStart = null; }, {passive:true});
    stage.addEventListener('touchend', event => {
      if (!touchStart || event.touches.length !== 0) { touchStart = null; return; }
      const point = event.changedTouches[0];
      const dx = point.clientX - touchStart.x;
      const dy = point.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 65 && Math.abs(dx) > 1.5 * Math.abs(dy)) show(currentIndex + (dx < 0 ? 1 : -1));
    }, {passive:true});
  };

  const show = index => {
    if (!viewer || !activeAlbum) return;
    currentIndex = (index + activeAlbum.photos.length) % activeAlbum.photos.length;
    const p = activeAlbum.photos[currentIndex];
    const img = viewer.querySelector('.photo-viewer-image');
    const status = viewer.querySelector('.photo-viewer-loading');
    const request = ++serial;
    if (pending) { pending.onload = null; pending.onerror = null; pending.src = ''; pending = null; }
    img.hidden = true;
    img.removeAttribute('src');
    img.alt = p.alt;
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      if (request !== serial || !viewer.open) return;
      img.hidden = true;
      status.hidden = false;
      status.textContent = '照片暫時無法載入，可使用下方連結前往 Degoo。';
    };
    status.textContent = '照片載入中…';
    status.hidden = false;
    viewer.querySelector('.photo-viewer-count').textContent =
      activeAlbum.title + ' · ' + String(currentIndex + 1).padStart(2,'0') + ' ／ 06';
    viewer.querySelector('.degoo-photo-title').textContent = p.title;
    viewer.querySelector('.degoo-photo-description').textContent = p.description || '';
    viewer.querySelector('.photo-viewer-source').href = p.pageUrl || activeAlbum.shareUrl;
    const preload = new Image();
    pending = preload;
    preload.decoding = 'async';
    preload.referrerPolicy = 'no-referrer';
    preload.onload = () => {
      if (request !== serial || !viewer.open) return;
      pending = null;
      img.src = p.imageUrl;
      img.hidden = false;
      status.hidden = true;
    };
    preload.onerror = () => {
      if (request !== serial || !viewer.open) return;
      pending = null;
      status.textContent = '照片暫時無法載入，可使用下方連結前往 Degoo。';
    };
    preload.src = p.imageUrl;
  };
  const openPhoto = (album, index, trigger) => {
    setupViewer();
    if (!viewer) return false;
    activeAlbum = album;
    returnFocus = trigger;
    prevOverflow = doc.body.style.overflow;
    doc.body.style.overflow = 'hidden';
    viewer.showModal();
    show(index);
    viewer.querySelector('.photo-viewer-close').focus();
    return true;
  };

  const renderAlbum = album => {
    const id = 'degoo-' + album.id;
    const cover = album.photos[0];
    const card = element('a', 'series-card');
    card.href = '#' + id;
    const coverImage = element('img');
    coverImage.src = cover.thumbnailUrl;
    coverImage.alt = cover.alt;
    coverImage.width = cover.width;
    coverImage.height = cover.height;
    coverImage.loading = 'lazy';
    coverImage.decoding = 'async';
    coverImage.referrerPolicy = 'no-referrer';
    coverImage.sizes = '(max-width: 650px) calc(100vw - 32px), (max-width: 1100px) calc(50vw - 36px), 520px';
    coverImage.addEventListener('error', () => {
      coverImage.hidden = true;
      card.classList.add('degoo-cover-unavailable');
    }, {once:true});
    const words = element('span');
    words.append(element('small', null, '06 PHOTOGRAPHS'),
      element('strong', null, album.title),
      element('span', null, album.description));
    card.append(coverImage, words);
    cards.append(card);
    const navLink = element('a', null, album.title + ' · 6 幅');
    navLink.href = '#' + id;
    nav.append(navLink);

    const intro = element('section', 'collection-intro');
    intro.id = id;
    intro.append(element('small', null, album.title + ' · 6 幅 · Degoo 外部攝影系列'),
      element('h2', null, album.title), element('p', null, album.description));
    const sourceParagraph = element('p');
    const sourceLink = element('a', null, '在 Degoo 開啟原始相簿 ↗');
    sourceLink.href = album.shareUrl;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceParagraph.append(sourceLink);
    intro.append(sourceParagraph);

    const gallery = element('section', 'gallery degoo-album-grid');
    gallery.setAttribute('aria-label', album.title + '攝影系列');
    album.photos.forEach((p, index) => {
      const figure = element('figure');
      const link = element('a');
      link.href = p.pageUrl || album.shareUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', '放大觀看：' + p.alt);
      const img = element('img');
      img.src = p.thumbnailUrl;
      img.alt = p.alt;
      img.width = p.width;
      img.height = p.height;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.sizes = '(max-width: 650px) calc(100vw - 36px), (max-width: 1100px) calc(50vw - 36px), 550px';
      img.addEventListener('error', () => {
        img.hidden = true;
        const err = element('p', 'degoo-thumbnail-error', '照片暫時無法載入，請在 Degoo 開啟相簿。');
        link.append(err);
      }, {once:true});
      link.append(img);
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (openPhoto(album, index, link)) event.preventDefault();
      });
      const caption = element('figcaption');
      caption.append(element('strong', null, p.title),
        element('p', 'photo-story', p.description || ''));
      figure.append(link, caption);
      gallery.append(figure);
    });
    main.append(intro, gallery);
  };

  fetch('../data/degoo-gallery-albums.json?v=20261025-1', {cache:'no-store'})
    .then(response => {
      if (!response.ok) throw new Error('Album configuration unavailable');
      return response.json();
    })
    .then(data => {
      if (data.schemaVersion !== 1 || !Array.isArray(data.albums)) return;
      const seen = new Set();
      data.albums.forEach(album => {
        if (!approved(album) || seen.has(album.id)) return;
        seen.add(album.id);
        renderAlbum(album);
      });
    })
    .catch(() => { /* Keep all existing galleries fully functional. */ });
})();
