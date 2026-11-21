/* External photographs stay on the provider; no local image fallback.
   Keep gallery navigation available without intrusive image-error text. */
(()=>{
 'use strict';
 document.querySelectorAll('.gallery figure img[data-external-photo], .album-photo img[data-external-photo], img[data-preview-fallback]').forEach(photo=>{
  const clear=()=>{photo.hidden=false;};
  const failed=()=>{
   const fallback=photo.dataset.previewFallback;
   if(fallback&&photo.getAttribute('src')!==fallback){photo.src=fallback;return;}
   if(photo.matches('.series-card img'))return;
   photo.hidden=true;
  };
  photo.addEventListener('load',clear);
  photo.addEventListener('error',failed);
  if(photo.complete&&photo.naturalWidth===0)failed();
 });
})();
