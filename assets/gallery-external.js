/* External photographs stay on the provider; no local image fallback. */
(()=>{
 'use strict';
 const coastalAlbum='https://app.degoo.com/share/TzMXWs5_IfllpaK4YUz3Ew';
 const snowAlbum='https://app.degoo.com/share/hZYKu2-zGCehoYFY1AkrqA';
 document.querySelectorAll('.gallery figure img[data-external-photo]').forEach(photo=>{
  const figure=photo.closest('figure');
  const album=figure.querySelector('a').href.includes('hZYKu2-')?snowAlbum:coastalAlbum;
  let message;
  const clear=()=>{photo.hidden=false;message?.remove();message=null;};
  const failed=()=>{
   if(message)return;
   photo.hidden=true;
   message=document.createElement('p');
   message.className='external-photo-error';
   message.setAttribute('role','status');
   message.append('照片暫時無法載入。');
   const link=document.createElement('a');
   link.href=album;link.target='_blank';link.rel='noopener noreferrer';
   link.textContent='在 Degoo 欣賞相簿 ↗';
   message.append(link);figure.prepend(message);
  };
  photo.addEventListener('load',clear);
  photo.addEventListener('error',failed);
  if(photo.complete&&photo.naturalWidth===0)failed();
 });
})();
