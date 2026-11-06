/* Accessible photo exhibition for homepage and gallery. */
(()=>{
 if(!window.HTMLDialogElement||!HTMLDialogElement.prototype.showModal)return;
 const links=[...document.querySelectorAll('.gallery figure>a:has(img),#miaoshu-album .album-photo>a:has(img)')];
 if(!links.length)return;
 const dialog=document.createElement('dialog');
 dialog.className='photo-viewer';
 dialog.setAttribute('aria-labelledby','photo-viewer-title');
 dialog.setAttribute('aria-describedby','photo-viewer-description');
 dialog.innerHTML='<div class="photo-viewer-shell"><header class="photo-viewer-bar"><span class="photo-viewer-count" role="status" aria-live="polite"></span><button type="button" class="photo-viewer-reload" hidden>重試照片</button><button type="button" class="photo-viewer-close" aria-label="關閉照片展覽">關閉 ×</button></header><div class="photo-viewer-stage"><button type="button" class="photo-viewer-prev" aria-label="上一張照片">‹</button><img class="photo-viewer-image" alt=""><p class="photo-viewer-loading" role="status">照片載入中…</p><button type="button" class="photo-viewer-next" aria-label="下一張照片">›</button></div><footer class="photo-viewer-caption"><h2 id="photo-viewer-title"></h2><p id="photo-viewer-description"></p><span class="photo-viewer-hint">左右滑動或使用方向鍵切換 · Esc 關閉</span></footer></div>';
 let returnToGallery=false;
 const galleryHeading=document.querySelector('.gallery-page h1');
 if(galleryHeading){
  const back=document.createElement('button');
  back.type='button';
  back.textContent='返回攝影館';
  back.addEventListener('click',()=>{returnToGallery=true;dialog.close()});
  dialog.querySelector('.photo-viewer-bar').prepend(back);
 }
 document.body.append(dialog);
 const image=dialog.querySelector('.photo-viewer-image'),status=dialog.querySelector('.photo-viewer-loading'),count=dialog.querySelector('.photo-viewer-count'),title=dialog.querySelector('h2'),description=dialog.querySelector('#photo-viewer-description');
 const retry=dialog.querySelector('.photo-viewer-reload');
 let current=0,returnFocus=null,previousOverflow='',touch=null,requestId=0,pendingFull=null;
 const neighbors=new Map();
 function warmNeighbors(){
  if(navigator.connection&&navigator.connection.saveData)return;
  const urls=[current,(current+1)%links.length,(current-1+links.length)%links.length].map(i=>{const p=links[i].querySelector('img');return p.currentSrc||p.src});
  for(const [url,img] of neighbors){if(!urls.includes(url)){img.src='';neighbors.delete(url)}}
  for(const url of urls.slice(1)){if(neighbors.has(url))continue;const img=new Image();img.decoding='async';img.referrerPolicy=links[current].querySelector('img').referrerPolicy;neighbors.set(url,img);img.src=url}
 }
 function show(index){
  current=(index+links.length)%links.length;
  const link=links[current],photo=link.querySelector('img'),figure=link.closest('figure'),caption=figure.querySelector('figcaption');
  title.textContent=caption?.querySelector('h3,strong')?.textContent||photo.alt||'攝影作品';
  description.textContent=caption?[...caption.querySelectorAll('p')].map(p=>p.textContent).join('　'):'';
  count.textContent=(current+1)+' ／ '+links.length;
  image.alt=photo.alt;
  retry.hidden=true;status.hidden=false;status.textContent='照片載入中…';
  // The already-loaded thumbnail gives immediate feedback while the original downloads.
  const id=++requestId,preview=photo.currentSrc||photo.src,full=photo.dataset.fullSrc||preview;
  if(pendingFull){pendingFull.onload=null;pendingFull.onerror=null;pendingFull=null}
  image.referrerPolicy=photo.referrerPolicy;
  image.hidden=!(photo.complete&&photo.naturalWidth>0);image.src=preview;
  if(!image.hidden)status.hidden=true;
  if(full!==preview){
   const original=new Image();pendingFull=original;
   original.decoding='async';original.referrerPolicy=photo.referrerPolicy;
   original.onload=()=>{if(id!==requestId)return;pendingFull=null;retry.hidden=true;image.src=full;image.hidden=false;status.hidden=true};
   original.onerror=()=>{if(id!==requestId)return;pendingFull=null;retry.hidden=false};
   original.src=full;
  }
  warmNeighbors();
 }
 image.addEventListener('load',()=>{image.hidden=false;status.hidden=true});
 image.addEventListener('error',()=>{image.hidden=true;status.hidden=false;status.textContent='照片暫時無法載入。';retry.hidden=false});
 retry.addEventListener('click',()=>{
  dialog.querySelector('.photo-viewer-close').focus({preventScroll:true});
  image.removeAttribute('src');
  show(current);
 });
 links.forEach((link,index)=>link.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();returnFocus=link;show(index);previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';dialog.showModal();dialog.querySelector('.photo-viewer-close').focus();
 }));
 dialog.querySelector('.photo-viewer-close').addEventListener('click',()=>dialog.close());
 dialog.querySelector('.photo-viewer-prev').addEventListener('click',()=>show(current-1));
 dialog.querySelector('.photo-viewer-next').addEventListener('click',()=>show(current+1));
 dialog.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='ArrowLeft'){event.preventDefault();show(current-1)}
  if(event.key==='ArrowRight'){event.preventDefault();show(current+1)}
 });
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>{for(const img of neighbors.values())img.src='';neighbors.clear();requestId++;if(pendingFull){pendingFull.onload=null;pendingFull.onerror=null;pendingFull=null}document.body.style.overflow=previousOverflow;if(returnToGallery){
  returnToGallery=false;
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  galleryHeading.setAttribute('tabindex','-1');
  galleryHeading.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
 }else{returnFocus?.focus({preventScroll:true})}});
 const stage=dialog.querySelector('.photo-viewer-stage');
 stage.addEventListener('touchstart',event=>{touch=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null},{passive:true});
 stage.addEventListener('touchmove',event=>{if(event.touches.length!==1)touch=null},{passive:true});
 stage.addEventListener('touchcancel',()=>{touch=null},{passive:true});
 stage.addEventListener('touchend',event=>{
  if(!touch||event.touches.length){touch=null;return}
  const point=event.changedTouches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;touch=null;
  if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)show(current+(dx<0?1:-1));
 },{passive:true});
})();
