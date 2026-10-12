/* Photographs are hosted externally; retain a link when loading fails. */
(()=>{document.querySelectorAll('img[data-expo-photo]').forEach(photo=>{
 let message;
 const failed=()=>{if(message)return;photo.hidden=true;message=document.createElement('span');message.className='external-photo-error';message.setAttribute('role','status');message.textContent='照片暫時無法載入，點此開啟照片 ↗';photo.after(message);};
 const loaded=()=>{photo.hidden=false;message?.remove();message=null;};
 photo.addEventListener('error',failed);photo.addEventListener('load',loaded);
 if(photo.complete&&!photo.naturalWidth)failed();
});})();
