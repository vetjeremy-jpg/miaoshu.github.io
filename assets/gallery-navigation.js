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
  alignAlbum();
})();
