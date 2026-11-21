/* Show the album directory or the selected album, with shareable URLs. */
(() => {
  if (!document.body.classList.contains('gallery-page')) return;
  const main = document.querySelector('main');
  const directory = main.querySelector('.intro');
  const controls = main.querySelector('.gallery-album-controls');
  const back = controls.querySelector('button');
  const cards = directory.querySelector('.series-grid');
  let activeAlbum;
  let directoryScroll = 0;
  let returnLink;

  const normalizeAlbumHash = () => {
    const hash = location.hash;
    if (!hash.startsWith('#degoo-')) return;
    const target = hash === '#degoo-album' ? '#snow-sword' : '#album-' + hash.slice(7);
    history.replaceState(history.state, '', target);
  };
  const show = ({focus = false, restore = true} = {}) => {
    normalizeAlbumHash();
    const heading = document.getElementById(location.hash.slice(1));
    const album = heading?.matches('.collection-heading') ? heading.parentElement : null;
    const previousAlbum = activeAlbum;
    if (album && !previousAlbum) directoryScroll = scrollY;
    activeAlbum = album;
    directory.hidden = !!album;
    controls.hidden = !album;
    for (const section of main.querySelectorAll(':scope > .gallery')) {
      section.hidden = section !== album;
    }
    if (previousAlbum === album) return;
    if (album) {
      album.dispatchEvent(new Event('gallery:open-album'));
      const firstPhoto = album.querySelector('figure > a');
      const firstImage = firstPhoto?.querySelector('img');
      if (firstImage) {
        firstImage.fetchPriority = 'high';
        firstImage.loading = 'eager';
      }
      if (firstPhoto && !heading.querySelector('.gallery-start')) {
        const start = document.createElement('button');
        start.className = 'gallery-start';
        start.type = 'button';
        start.textContent = '從第一張開始';
        start.addEventListener('click', () => {
          start.focus({preventScroll: true});
          firstPhoto.click();
        });
        heading.append(start);
      }
      const header = document.querySelector('.top');
      const offset = Math.max(0, header?.getBoundingClientRect().bottom || 0) + 12;
      window.scrollTo({top: Math.max(0, scrollY + heading.getBoundingClientRect().top - offset), behavior: 'instant'});
      const title = heading.querySelector('h2');
      if (title) {
        title.tabIndex = -1;
        if (focus) title.focus({preventScroll: true});
      }
    } else if (previousAlbum) {
      window.scrollTo({top: restore ? directoryScroll : 0, behavior: 'instant'});
      const cover = returnLink && cards.contains(returnLink) ? returnLink :
        [...cards.querySelectorAll('a')].find(link => link.hash.slice(1) === previousAlbum.querySelector('.collection-heading')?.id);
      if (focus) ((restore && cover) || directory.querySelector('h1'))?.focus({preventScroll: true});
    }
  };

  directory.querySelector('h1').tabIndex = -1;
  document.body.classList.add('gallery-directory-enabled');
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !directory.contains(link) || link.target || event.defaultPrevented ||
        event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    if (!document.getElementById(url.hash.slice(1))?.matches('.collection-heading')) return;
    event.preventDefault();
    returnLink = link;
    history.pushState({galleryDirectory: true}, '', url.hash);
    show({focus: true});
  });
  back.addEventListener('click', () => {
    if (history.state?.galleryDirectory) {
      history.back();
      return;
    }
    history.replaceState(history.state, '', location.pathname + location.search);
    show({focus: true, restore: false});
  });
  addEventListener('hashchange', () => show({focus: true}));
  document.addEventListener('gallery:albums-ready', () => show());
  show();
})();
