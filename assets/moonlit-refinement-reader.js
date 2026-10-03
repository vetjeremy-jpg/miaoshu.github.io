/* Moonlit reader refinement — reader-only progressive enhancement. */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), safeGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}},safeSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
/* Reader focus + exact-line moonlight bookmarks. */
if(document.body.dataset.bookId){
 const id=document.body.dataset.bookId;
 const focus=[...document.querySelectorAll('.moonlit-reader-comfort button')].find(button=>/專注閱讀|退出專注閱讀/.test(button.textContent));
 if(focus)focus.classList.add('moonlit-focus-toggle');
 const key='moonlit-lines-'+id,detailKey='moonlit-bookmark-details';let saved=[];try{saved=JSON.parse(safeGet(key)||'[]');if(!Array.isArray(saved))saved=[]}catch(e){saved=[]}
 const bookTitle=(document.querySelector('h1')?.textContent||document.title.split('｜')[0]||'Moonlit Stories').trim();
 document.querySelectorAll('.chapter-body p').forEach((p,i)=>{const chapter=p.closest('.chapter')?.id||'chapter';const pid=chapter+'-p'+(i+1);p.dataset.moonlitLine=pid;p.id=p.id||pid;if(saved.includes(pid))p.classList.add('moonlit-saved-line');const b=document.createElement('button');b.type='button';b.className='moonlit-line-save';b.title='把月光留在這一句';b.setAttribute('aria-label',saved.includes(pid)?'取消收藏這一段':'收藏這一段');b.textContent='☾';p.prepend(b);b.addEventListener('click',()=>{let arr=[],details=[];try{arr=JSON.parse(safeGet(key)||'[]')}catch(e){};try{details=JSON.parse(safeGet(detailKey)||'[]')}catch(e){};arr=Array.isArray(arr)?arr:[];details=Array.isArray(details)?details:[];const exists=arr.includes(pid);if(exists){arr=arr.filter(x=>x!==pid);details=details.filter(x=>!(x.bookId===id&&x.pid===pid))}else{arr.push(pid);const quote=p.cloneNode(true);quote.querySelector('.moonlit-line-save')?.remove();details=details.filter(x=>!(x.bookId===id&&x.pid===pid));details.push({bookId:id,pid,title:bookTitle,text:(quote.textContent||'').trim().slice(0,180),url:location.pathname+'#'+p.id,savedAt:Date.now()})}safeSet(key,JSON.stringify(arr));safeSet(detailKey,JSON.stringify(details.slice(-30)));p.classList.toggle('moonlit-saved-line',!exists);b.setAttribute('aria-label',!exists?'取消收藏這一段':'收藏這一段')})});
 if(!$('.moonlit-bookmarks-link')){const shelf=document.createElement('a');shelf.className='moonlit-bookmarks-link';shelf.href='../../bookmarks/';shelf.textContent='☾ 我的月光';shelf.setAttribute('aria-label','查看所有月光書籤');document.body.append(shelf)}
 const last=[...document.querySelectorAll('.chapter[id]')].at(-1);if(last&&!$('.moonlit-path')){const path=document.createElement('aside');path.className='moonlit-path';path.innerHTML='<small>FOLLOW THE MOONLIGHT</small><h2>如果你還不想離開今晚……</h2><p><a href="../../gallery/">去攝影館看一束光</a>　·　<a href="../../search/">沿著一個意象繼續探索</a>　·　<a href="../../index.html#book">回到小說書房</a></p>';last.insertAdjacentElement('afterend',path)}
}



/* Reader-only cross-curation and quick dock. */
const d=document,b=d.body,bookId=b.dataset.bookId;
if(bookId){
 const map={fushengsuiyue:["歲月之後，看一束城市的光","../../gallery/#taipei"],wuxiyue:["從舊宅的月色，走進攝影館","../../gallery/"],"jiankangjie-tingquanyin":["離開刀兵，去看雪庭裡的一柄劍","../../gallery/#degoo-album"],"hiiro-setsugetsusho":["從文字的雪，走向影像的雪","../../gallery/#degoo-album"],"fengmen-yetan":["夜譚之後，沿著夜色繼續走","../../gallery/#taipei"]};
 if(map[bookId]&&!$('.moonlit-crosscuration')){const last=[...d.querySelectorAll(".chapter[id]")].pop();if(last){const x=d.createElement("aside");x.className="moonlit-crosscuration";x.innerHTML='<small>WORDS × PHOTOGRAPHY / 文字 × 攝影</small><strong>'+map[bookId][0]+'</strong><a href="'+map[bookId][1]+'">看相關攝影作品 →</a>';last.insertAdjacentElement("afterend",x)}}
 if(!$('.moonlit-reader-dock')){const dock=d.createElement("div");dock.className="moonlit-reader-dock";dock.setAttribute("aria-label","快速閱讀工具");dock.innerHTML='<button type="button" data-act="smaller" aria-label="縮小文字">A−</button><button type="button" data-act="larger" aria-label="放大文字">A+</button><button type="button" data-act="focus" aria-label="切換專注閱讀">◐</button><span class="reading-percent">0%</span>';d.body.append(dock);let size=Number(getComputedStyle(d.documentElement).getPropertyValue("--reader-size").replace("px",""))||18;const saveSize=()=>{d.documentElement.style.setProperty("--reader-size",size+"px");try{localStorage.setItem("miaoshu-"+bookId+"-font-size",size)}catch{}};dock.addEventListener("click",e=>{const a=e.target.closest("button")?.dataset.act;if(a==="smaller"||a==="larger"){size=Number(getComputedStyle(d.documentElement).getPropertyValue("--reader-size").replace("px",""))||size;size=Math.max(16,Math.min(24,size+(a==="larger"?1:-1)));saveSize()}if(a==="focus")d.querySelector(".moonlit-focus-toggle")?.click()});const pct=dock.querySelector(".reading-percent");let timer;const update=ratio=>{pct.textContent=Math.round(ratio*100)+"%";b.classList.add("moonlit-ui-dim");clearTimeout(timer);timer=setTimeout(()=>b.classList.remove("moonlit-ui-dim"),1500)};window.__moonlitReaderProgress?.subscribe(update)}
}

})();
