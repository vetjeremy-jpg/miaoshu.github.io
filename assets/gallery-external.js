/* External photographs stay on the provider; no local image fallback. */
(()=>{
 'use strict';
 document.querySelectorAll('.gallery figure img[data-external-photo], .album-photo img[data-external-photo]').forEach(photo=>{
  const figure=photo.closest('figure');
  let message;
  const clear=()=>{photo.hidden=false;message?.remove();message=null;};
  const failed=()=>{
   if(message)return;
   photo.hidden=true;
   message=document.createElement('p');
   message.className='external-photo-error';
   message.setAttribute('role','status');
   message.append('照片暫時無法載入。');
   figure.prepend(message);
  };
  photo.addEventListener('load',clear);
  photo.addEventListener('error',failed);
  if(photo.complete&&photo.naturalWidth===0)failed();
 });
})();
