/* Moonlit reader refinement — reader-only progressive enhancement. */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), safeGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}},safeSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
/* Reader focus + exact-line moonlight bookmarks. */
if(document.body.dataset.bookId){
 const id=document.body.dataset.bookId;
 const focus=document.createElement('button');focus.type='button';focus.className='moonlit-focus-toggle';focus.textContent='專注閱讀';focus.setAttribute('aria-pressed','false');document.body.append(focus);
 const syncFocus=()=>{const on=document.body.classList.contains('moonlit-focus-mode');focus.setAttribute('aria-pressed',String(on));focus.textContent=on?'顯示導覽':'專注閱讀'};
 syncFocus();
 focus.addEventListener('click',()=>{document.body.classList.toggle('moonlit-focus-mode');syncFocus()});
 new MutationObserver(syncFocus).observe(document.body,{attributes:true,attributeFilter:['class']});
 const key='moonlit-lines-'+id,detailKey='moonlit-bookmark-details';let saved=[];try{saved=JSON.parse(safeGet(key)||'[]');if(!Array.isArray(saved))saved=[]}catch(e){saved=[]}
 const bookTitle=(document.querySelector('h1')?.textContent||document.title.split('｜')[0]||'Moonlit Stories').trim();
 $('.chapter-body p').forEach((p,i)=>{const chapter=p.closest('.chapter')?.id||'chapter';const pid=chapter+'-p'+(i+1);p.dataset.moonlitLine=pid;p.id=p.id||pid;if(saved.includes(pid))p.classList.add('moonlit-saved-line');const b=document.createElement('button');b.type='button';b.className='moonlit-line-save';b.title='把月光留在這一句';b.setAttribute('aria-label',saved.includes(pid)?'取消收藏這一段':'收藏這一段');b.textContent='☾';p.prepend(b);b.addEventListener('click',()=>{let arr=[],details=[];try{arr=JSON.parse(safeGet(key)||'[]')}catch(e){};try{details=JSON.parse(safeGet(detailKey)||'[]')}catch(e){};arr=Array.isArray(arr)?arr:[];details=Array.isArray(details)?details:[];const exists=arr.includes(pid);if(exists){arr=arr.filter(x=>x!==pid);details=details.filter(x=>!(x.bookId===id&&x.pid===pid))}else{arr.push(pid);const quote=p.cloneNode(true);quote.querySelector('.moonlit-line-save')?.remove();details=details.filter(x=>!(x.bookId===id&&x.pid===pid));details.push({bookId:id,pid,title:bookTitle,text:(quote.textContent||'').trim().slice(0,180),url:location.pathname+'#'+p.id,savedAt:Date.now()})}safeSet(key,JSON.stringify(arr));safeSet(detailKey,JSON.stringify(details.slice(-30)));p.classList.toggle('moonlit-saved-line',!exists);b.setAttribute('aria-label',!exists?'取消收藏這一段':'收藏這一段')})});
 if(!$('.moonlit-bookmarks-link')){const shelf=document.createElement('a');shelf.className='moonlit-bookmarks-link';shelf.href='../../bookmarks/';shelf.textContent='☾ 我的月光';shelf.setAttribute('aria-label','查看所有月光書籤');document.body.append(shelf)}
 const last=$('.chapter[id]').at(-1);if(last&&!$('.moonlit-path')){const path=document.createElement('aside');path.className='moonlit-path';path.innerHTML='<small>FOLLOW THE MOONLIGHT</small><h2>如果你還不想離開今晚……</h2><p><a href="../../gallery/">去攝影館看一束光</a>　·　<a href="../../search/">沿著一個意象繼續探索</a>　·　<a href="../../index.html#book">回到小說書房</a></p>';last.insertAdjacentElement('afterend',path)}
}


})();
