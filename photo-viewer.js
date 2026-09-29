/* Accessible photo exhibition for homepage and gallery. */
(()=>{
 if(!window.HTMLDialogElement||!HTMLDialogElement.prototype.showModal)return;
 const links=[...document.querySelectorAll('.gallery figure>a:has(img),#miaoshu-album .album-photo>a:has(img)')];
 if(!links.length)return;
 const dialog=document.createElement('dialog');
 dialog.className='photo-viewer';
 dialog.setAttribute('aria-labelledby','photo-viewer-title');
 dialog.setAttribute('aria-describedby','photo-viewer-description');
 dialog.innerHTML='<div class="photo-viewer-shell"><header class="photo-viewer-bar"><span class="photo-viewer-count" role="status" aria-live="polite"></span><button type="button" class="photo-viewer-close" aria-label="關閉照片展覽">關閉 ×</button></header><div class="photo-viewer-stage"><button type="button" class="photo-viewer-prev" aria-label="上一張照片">‹</button><img class="photo-viewer-image" alt=""><p class="photo-viewer-loading" role="status">照片載入中…</p><button type="button" class="photo-viewer-next" aria-label="下一張照片">›</button></div><footer class="photo-viewer-caption"><h2 id="photo-viewer-title"></h2><p id="photo-viewer-description"></p><a class="photo-viewer-source" target="_blank" rel="noopener noreferrer">開啟原始照片／相簿 ↗</a><span class="photo-viewer-hint">左右滑動或使用方向鍵切換 · Esc 關閉</span></footer></div>';
 document.body.append(dialog);
 const image=dialog.querySelector('.photo-viewer-image'),status=dialog.querySelector('.photo-viewer-loading'),count=dialog.querySelector('.photo-viewer-count'),title=dialog.querySelector('h2'),description=dialog.querySelector('#photo-viewer-description'),source=dialog.querySelector('.photo-viewer-source');
 let current=0,returnFocus=null,previousOverflow='',touch=null;
 function show(index){
  current=(index+links.length)%links.length;
  const link=links[current],photo=link.querySelector('img'),figure=link.closest('figure'),caption=figure.querySelector('figcaption');
  title.textContent=caption?.querySelector('h3,strong')?.textContent||photo.alt||'攝影作品';
  description.textContent=caption?[...caption.querySelectorAll('p')].map(p=>p.textContent).join('　'):'';
  count.textContent=(current+1)+' ／ '+links.length;
  source.href=link.href;image.alt=photo.alt;
  status.hidden=false;status.textContent='照片載入中…';
  image.hidden=true;image.src=photo.currentSrc||photo.src;
 }
 image.addEventListener('load',()=>{image.hidden=false;status.hidden=true});
 image.addEventListener('error',()=>{image.hidden=true;status.hidden=false;status.textContent='照片暫時無法載入，請使用下方連結開啟。'});
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
 dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;returnFocus?.focus({preventScroll:true})});
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