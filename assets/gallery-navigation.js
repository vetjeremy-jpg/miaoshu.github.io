/* Resolve static and asynchronously inserted album anchors using real layout. */
(() => {
  if (!document.body.classList.contains('gallery-page')) return;
  const alignAlbum = () => {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = id && document.getElementById(id);
    if (!target || !target.matches('.collection-intro,.collection-heading')) return;
    const header = document.querySelector('.top');
    const offset = Math.max(0, header?.getBoundingClientRect().bottom || 0) + 16;
    window.scrollTo({top: Math.max(0, scrollY + target.getBoundingClientRect().top - offset), behavior: 'instant'});
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(url.hash.slice(1));
    if (!target?.matches('.collection-intro,.collection-heading')) return;
    event.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    alignAlbum();
  });
  addEventListener('hashchange', alignAlbum);
  document.addEventListener('gallery:albums-ready', alignAlbum);
  const mountPhotoButtons = () => {
    for (const gallery of document.querySelectorAll('main .gallery')) {
      let photos = [];
      const albums = [photos];
      for (const item of gallery.children) {
        if (item.matches('.collection-heading') && item.id !== 'snow-sword') {
          photos = [];
          albums.push(photos);
        }
        if (item.matches('figure') && item.querySelector(':scope > a')) photos.push(item);
      }
      for (const album of albums) {
        album.forEach((figure, index) => {
          if (figure.querySelector(':scope > .gallery-photo-step')) return;
          figure.classList.add('gallery-photo-steps');
          for (const step of [-1, 1]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'gallery-photo-step ' + (step < 0 ? 'gallery-photo-prev' : 'gallery-photo-next');
            button.textContent = step < 0 ? '‹' : '›';
            button.setAttribute('aria-label', step < 0 ? '上一張照片' : '下一張照片');
            const target = album[index + step];
            button.disabled = !target;
            button.addEventListener('click', () => {
              const destination = target.querySelector(':scope > a');
              destination.focus({preventScroll: true});
              destination.scrollIntoView({block: 'start', inline: 'nearest'});
            });
            figure.append(button);
          }
        });
      }
    }
  };
  document.addEventListener('gallery:albums-ready', mountPhotoButtons);
  mountPhotoButtons();
  alignAlbum();
})();
