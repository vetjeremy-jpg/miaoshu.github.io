/* Moonlit — Degoo external albums: link-only until image URLs are verified. No media binaries. */
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
  // A Degoo share is a web page, not a direct image. Do not pass it to <img>.
  const hasPublicShare = album => {
    if (!album || !['tiger-spirit', 'emergence', 'city-night-portraits', 'chun-li-street'].includes(album.id) ||
        !isHttps(album.shareUrl) || !Array.isArray(album.photos) ||
        album.photos.length !== (album.id === 'chun-li-street' ? 39 : album.id === 'city-night-portraits' ? 31 : 6)) return false;
    const url = new URL(album.shareUrl);
    const slug = url.pathname.startsWith('/share/') ? url.pathname.slice(7) : '';
    return url.hostname === 'app.degoo.com' &&
      /^[A-Za-z0-9_-]+$/.test(slug) && !url.search && !url.hash;
  };
  const linkOnly = album => hasPublicShare(album) && album.linkOnly === true && album.verified !== true;
  const approved = album => {
    if (!album || album.verified !== true ||
        !['tiger-spirit', 'emergence', 'city-night-portraits', 'chun-li-street'].includes(album.id) ||
        !hasPublicShare(album)) return false;
    const images = new Set();
    for (const p of album.photos) {
      if (album.id === 'chun-li-street' && p && p.unavailable === true && isHttps(p.pageUrl) && p.title && p.alt) continue;
      if (!p || !isHttps(p.imageUrl) || !isHttps(p.thumbnailUrl) ||
          (p.pageUrl && !isHttps(p.pageUrl)) ||
          !Number.isInteger(p.width) || p.width < 1 ||
          !Number.isInteger(p.height) || p.height < 1 ||
          !p.alt || !p.title || (album.id !== 'chun-li-street' && images.has(p.imageUrl))) return false;
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
      activeAlbum.title + ' · ' + String(currentIndex + 1).padStart(2,'0') + ' ／ ' + String(activeAlbum.photos.length).padStart(2, '0');
    viewer.querySelector('.degoo-photo-title').textContent = p.title;
    viewer.querySelector('.degoo-photo-description').textContent = p.description || '';
    viewer.querySelector('.photo-viewer-source').href = p.pageUrl || activeAlbum.shareUrl;
    if (p.unavailable) {
      status.textContent = '照片暫時無法載入，可使用下方連結前往 Degoo。';
      return;
    }
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

  const renderCloudLink = album => {
    const id = 'degoo-' + album.id;
    const card = element('a', 'series-card degoo-cloud-card');
    card.href = '#' + id;
    const artwork = element('div', 'degoo-cloud-art');
    artwork.setAttribute('aria-hidden', 'true');
    artwork.append(element('span', 'degoo-cloud-number', '06'),
      element('span', 'degoo-cloud-art-label', 'MOONLIT · DEGOO'));
    const words = element('span', 'degoo-cloud-words');
    words.append(element('small', null, '06 PHOTOGRAPHS · DEGOO'),
      element('strong', null, album.title),
      element('span', null, album.description));
    card.append(artwork, words);
    cards.append(card);

    const navLink = element('a', null, album.title + ' · ' + album.photos.length + ' 幅');
    navLink.href = '#' + id;
    nav.append(navLink);

    const intro = element('section', 'collection-intro degoo-cloud-intro');
    intro.id = id;
    intro.append(element('small', null, album.title + ' · 六幅攝影作品 · Degoo 雲端相簿'),
      element('h2', null, album.title),
      element('p', null, album.description));
    intro.append(element('p', 'degoo-cloud-explainer',
      '六幅作品存放於 Degoo 雲端。點選下方連結，即可前往欣賞完整相簿；照片不儲存在本站。'));
    const sourceLink = element('a', 'degoo-cloud-open', '前往 Degoo 欣賞六幅作品 ↗');
    sourceLink.href = album.shareUrl;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.referrerPolicy = 'no-referrer';
    intro.append(sourceLink);
    main.append(intro);
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
    words.append(element('small', null, String(album.photos.length).padStart(2, '0') + ' PHOTOGRAPHS'),
      element('strong', null, album.title),
      element('span', null, album.description));
    card.append(coverImage, words);
    cards.append(card);
    const navLink = element('a', null, album.title + ' · ' + album.photos.length + ' 幅');
    navLink.href = '#' + id;
    nav.append(navLink);

    const intro = element('section', 'collection-intro');
    intro.id = id;
    intro.append(element('small', null, album.title + ' · ' + album.photos.length + ' 幅 · Degoo 外部攝影系列'),
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
      if (!p.unavailable) img.src = p.thumbnailUrl;
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
      if (p.unavailable) {
        link.append(element('p', 'degoo-thumbnail-error', '照片暫時無法載入，前往 Degoo 查看 ↗'));
      } else { link.append(img); }
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (openPhoto(album, index, link)) event.preventDefault();
      });
      const caption = element('figcaption');
      caption.append(element('strong', null, p.title));
      if (p.metadata) caption.append(element('p', null, p.metadata));
      caption.append(element('p', 'photo-story', p.description || ''));
      figure.append(link, caption);
      gallery.append(figure);
    });
    // Keep new albums before the long existing galleries so lazy layout does not shift their anchors.
    const firstCollection = main.querySelector('#xiakexing');
    if (firstCollection) firstCollection.before(intro, gallery);
    else main.append(intro, gallery);
  };

  fetch('../data/degoo-gallery-albums.json?v=20261029-chunli1', {cache:'no-store'})
    .then(response => {
      if (!response.ok) throw new Error('Album configuration unavailable');
      return response.json();
    })
    .then(data => {
      if (data.schemaVersion !== 1 || !Array.isArray(data.albums)) return;
      const seen = new Set();
      data.albums.forEach(album => {
        if (seen.has(album.id)) return;
        if (approved(album)) {
          seen.add(album.id);
          renderAlbum(album);
        } else if (linkOnly(album)) {
          seen.add(album.id);
          renderCloudLink(album);
        }
      });
    })
    .catch(() => { /* Keep all existing galleries fully functional. */ });
})();
