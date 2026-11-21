/* External photography albums use the same caption layout as the main gallery. */
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
  const approved = album => album &&
    typeof album.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(album.id) &&
    Array.isArray(album.photos) && album.photos.length > 0 &&
    album.photos.every(photo => photo &&
      isHttps(photo.imageUrl) && isHttps(photo.thumbnailUrl) &&
      Number.isInteger(photo.width) && photo.width > 0 &&
      Number.isInteger(photo.height) && photo.height > 0 &&
      photo.alt && photo.title && photo.metadata && photo.description);
  const element = (tag, cls, text) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const photoNodes = new WeakMap();
  const nearbyImages = new Map();
  const imageRequest = (url, priority) => {
    const existing = nearbyImages.get(url);
    if (existing && (!existing.complete || existing.naturalWidth > 0)) {
      if (priority === 'high') existing.fetchPriority = priority;
      return existing;
    }
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = priority;
    image.referrerPolicy = 'no-referrer';
    nearbyImages.set(url, image);
    image.src = url;
    return image;
  };
  const keepNearby = () => {
    const photos = activeAlbum.photos;
    const allowed = new Set([-1, 0, 1].map(offset =>
      photos[(currentIndex + offset + photos.length) % photos.length].imageUrl).filter(Boolean));
    for (const [url, image] of nearbyImages) {
      if (allowed.has(url)) continue;
      image.onload = null;
      image.onerror = null;
      image.src = '';
      nearbyImages.delete(url);
    }
  };
  const warmNeighbors = () => {
    if (navigator.connection && navigator.connection.saveData) return;
    const photos = activeAlbum.photos;
    imageRequest(photos[(currentIndex + 1) % photos.length].imageUrl, 'low');
  };

  let viewer;
  let activeAlbum, currentIndex = 0, returnFocus, prevOverflow = '', touchStart, serial = 0, pending, loadTimer;
  const setupViewer = () => {
    if (viewer || !window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;
    viewer = element('dialog', 'photo-viewer gallery-photo-viewer');
    viewer.setAttribute('aria-label', '攝影作品放大瀏覽');
    viewer.innerHTML = '<div class="photo-viewer-shell"><header class="photo-viewer-bar"><span class="photo-viewer-count" role="status" aria-live="polite"></span><button type="button" class="photo-viewer-close" aria-label="關閉">關閉 ×</button></header><div class="photo-viewer-stage"><button type="button" class="photo-viewer-prev" aria-label="上一張">‹</button><img class="photo-viewer-image" alt=""><p class="photo-viewer-loading" role="status" aria-live="polite">照片載入中…</p><button type="button" class="photo-viewer-retry" hidden>重新載入照片</button><button type="button" class="photo-viewer-next" aria-label="下一張">›</button></div><footer class="photo-viewer-caption"><h2 class="gallery-photo-title"></h2><p class="photo-meta"></p><p class="gallery-photo-description photo-story"></p><span class="photo-viewer-hint">左右滑動或使用方向鍵切換 · Esc 關閉</span></footer></div>';
    doc.body.append(viewer);
    viewer.querySelector('.photo-viewer-close').addEventListener('click', () => viewer.close());
    viewer.querySelector('.photo-viewer-retry').addEventListener('click', () => { nearbyImages.delete(activeAlbum.photos[currentIndex].imageUrl); show(currentIndex); });
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
      clearTimeout(loadTimer);
      if (pending) { pending.onload = null; pending.onerror = null; pending = null; }
      for (const image of nearbyImages.values()) { image.onload = null; image.onerror = null; image.src = ''; }
      nearbyImages.clear();
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
    clearTimeout(loadTimer);
    viewer.querySelector('.photo-viewer-retry').hidden = true;
    currentIndex = (index + activeAlbum.photos.length) % activeAlbum.photos.length;
    const p = activeAlbum.photos[currentIndex];
    const img = viewer.querySelector('.photo-viewer-image');
    const status = viewer.querySelector('.photo-viewer-loading');
    const request = ++serial;
    if (pending) { pending.onload = null; pending.onerror = null; pending = null; }
    keepNearby();
    const thumbnail = photoNodes.get(p);
    let previewReady = thumbnail && thumbnail.complete && thumbnail.naturalWidth > 0;
    img.hidden = !previewReady;
    if (previewReady) img.src = thumbnail.currentSrc || thumbnail.src;
    else img.removeAttribute('src');
    img.alt = p.alt;
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      if (request !== serial || !viewer.open) return;
      clearTimeout(loadTimer);
      viewer.querySelector('.photo-viewer-retry').hidden = false;
      img.hidden = true;
      status.hidden = false;
      status.textContent = '照片暫時無法載入。';
    };
    status.textContent = '照片載入中…';
    status.hidden = !!previewReady;
    viewer.querySelector('.photo-viewer-count').textContent =
      activeAlbum.title + ' · ' + String(currentIndex + 1).padStart(2,'0') + ' ／ ' + String(activeAlbum.photos.length).padStart(2, '0');
    viewer.querySelector('.gallery-photo-title').textContent = p.title;
    viewer.querySelector('.photo-meta').textContent = p.metadata;
    viewer.querySelector('.gallery-photo-description').textContent = p.description;
    let fullReady = false;
    if (!previewReady) {
      const preview = new Image();
      preview.decoding = 'async';
      preview.referrerPolicy = 'no-referrer';
      preview.onload = () => {
        if (request !== serial || !viewer.open || fullReady) return;
        previewReady = true;
        img.src = preview.src;
        img.hidden = false;
        status.hidden = true;
      };
      preview.src = previewUrl(p.thumbnailUrl);
    }
    const preload = imageRequest(p.imageUrl, 'high');
    pending = preload;
    const ready = () => {
      if (request !== serial || !viewer.open) return;
      clearTimeout(loadTimer);
      viewer.querySelector('.photo-viewer-retry').hidden = true;
      pending = null;
      fullReady = true;
      img.src = p.imageUrl;
      img.hidden = false;
      status.hidden = true;
      warmNeighbors();
    };
    const failed = () => {
      if (request !== serial || !viewer.open) return;
      clearTimeout(loadTimer);
      viewer.querySelector('.photo-viewer-retry').hidden = false;
      pending = null;
      status.hidden = false;
      status.textContent = previewReady ?
        '目前顯示預覽。' :
        '照片暫時無法載入。';
      nearbyImages.delete(p.imageUrl);
    };
    loadTimer = setTimeout(() => {
      if (request !== serial || !viewer.open) return;
      status.hidden = false;status.textContent = previewReady ? '完整照片載入較慢，目前顯示預覽。可重試或繼續看下一張。' : '照片載入較慢，可重試或繼續看下一張。';
      viewer.querySelector('.photo-viewer-retry').hidden = false;
    }, 8000);
    preload.onload = ready;
    preload.onerror = failed;
    if (preload.complete) {
      if (preload.naturalWidth > 0) ready();
      else failed();
    }
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

  // Reuse the same lighter preview for the cover, album and viewer.
  const previewUrl = source => source.replace(
    /^(https:\/\/lh3\.googleusercontent\.com\/[^=]+)=w(\d+)-h(\d+)(-rw-sm-pa-nu-v0)$/,
    (url, base, width, height, suffix) => {
      const scale = Math.min(1, 760 / width, 1120 / height);
      return scale === 1 ? url :
        base + '=w' + Math.round(width * scale) + '-h' + Math.round(height * scale) + suffix;
    }
  );
  const loadPreview = (image, photo, onFailure) => {
    const preview = previewUrl(photo.thumbnailUrl);
    image.addEventListener('error', () => {
      if (image.getAttribute('src') === preview && preview !== photo.thumbnailUrl) {
        image.src = photo.thumbnailUrl;
      } else onFailure();
    });
    image.src = preview;
  };

  const renderAlbum = album => {
    const id = 'album-' + album.id;
    const cover = album.photos[0];
    const card = element('a', 'series-card');
    card.href = '#' + id;
    const coverImage = element('img');
    coverImage.alt = cover.alt;
    coverImage.width = cover.width;
    coverImage.height = cover.height;
    coverImage.loading = 'lazy';
    coverImage.decoding = 'async';
    coverImage.referrerPolicy = 'no-referrer';
    coverImage.sizes = '(max-width: 650px) calc(100vw - 32px), (max-width: 1100px) calc(50vw - 36px), 520px';
    loadPreview(coverImage, cover, () => {
      coverImage.hidden = true;
      card.classList.add('gallery-cover-unavailable');
    });
    const words = element('span');
    words.append(element('small', null, String(album.photos.length).padStart(2, '0') + ' PHOTOGRAPHS'),
      element('strong', null, album.title),
      element('span', null, album.coverDescription || album.description));
    card.append(coverImage, words);
    cards.append(card);
    const navLink = element('a', null, album.title + ' · ' + album.photos.length + ' 幅');
    navLink.href = '#' + id;
    nav.append(navLink);

    const intro = element('div', 'collection-heading');
    intro.id = id;
    intro.append(element('small', null, '攝影系列 · ' + album.photos.length + ' 幅' + (album.edition ? ' · ' + album.edition : '')),
      element('h2', null, album.title), element('p', null, album.description));

    const gallery = element('section', 'gallery gallery-album-grid');
    gallery.append(intro);
    gallery.setAttribute('aria-label', album.title + '攝影系列');
    gallery.addEventListener('gallery:open-album', () => {
      const figures = doc.createDocumentFragment();
      album.photos.forEach((p, index) => {
        const figure = element('figure');
        const link = element('a');
        link.href = p.imageUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', '放大觀看：' + p.alt);
        const img = element('img');
        photoNodes.set(p, img);
        img.alt = p.alt;
        img.width = p.width;
        img.height = p.height;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.sizes = '(max-width: 650px) calc(100vw - 36px), (max-width: 1100px) calc(50vw - 36px), 550px';
        loadPreview(img, p, () => {
          img.hidden = true;
          const err = element('p', 'gallery-thumbnail-error', '照片暫時無法載入。');
          link.append(err);
        });
        link.append(img);
        link.addEventListener('click', event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const trigger = doc.activeElement?.matches('.gallery-start') ? doc.activeElement : link;
          if (openPhoto(album, index, trigger)) event.preventDefault();
        });
        const caption = element('figcaption');
        caption.append(element('strong', null, p.title));
        caption.append(element('p', 'photo-meta', p.metadata));
        caption.append(element('p', 'photo-story', p.description || ''));
        figure.append(link, caption);
        figures.append(figure);
      });
      gallery.append(figures);
    }, {once:true});
    main.append(gallery);
  };

  const notice = element('div', 'gallery-album-status');
  const message = element('p');message.setAttribute('role','status');
  const retry = element('button', null, '重新載入相簿');retry.type='button';retry.hidden=true;
  notice.append(message,retry);cards.after(notice);
  const mounted = new Set();let loading=false;
  const loadAlbums = async (refresh = false) => {
    if(loading)return;loading=true;notice.hidden=false;retry.hidden=true;message.textContent='正在載入雲端相簿…';notice.setAttribute('aria-busy','true');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch('../data/gallery-albums.json?v=20261121-captions',{cache:refresh?'reload':'default',signal:controller.signal});
      if(!response.ok)throw Error('Album configuration unavailable');
      const data=await response.json();if(data.schemaVersion!==1||!Array.isArray(data.albums))throw Error('Invalid album configuration');
      let unavailable = false;
      for (const album of data.albums) {
        if (mounted.has(album?.id)) continue;
        if (approved(album)) renderAlbum(album);
        else { unavailable = true; continue; }
        mounted.add(album.id);
      }
      notice.hidden = !unavailable;
      if (unavailable) {
        message.textContent = '部分雲端相簿暫時無法顯示，其他攝影作品仍可正常欣賞。';
        retry.hidden = false;
      }
      doc.dispatchEvent(new Event('gallery:albums-ready'));
    }catch{notice.hidden=false;message.textContent='雲端相簿目錄暫時無法載入，其他攝影作品仍可正常欣賞。';retry.hidden=false}
    finally{clearTimeout(timer);loading=false;notice.removeAttribute('aria-busy')}
  };
  retry.addEventListener('click',()=>loadAlbums(true));loadAlbums();
})();
