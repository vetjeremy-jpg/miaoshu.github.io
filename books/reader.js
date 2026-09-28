/* Shared reader behavior for every novel page. Set data-book-id and data-book-title on body. */
(()=>{
 const chapters=[...document.querySelectorAll('.chapter[id]')];
 const bookId=document.body.dataset.bookId||'novel';
 const bookTitle=document.body.dataset.bookTitle||document.querySelector('h1')?.textContent||'喵叔小說';
 const prefix='miaoshu-'+bookId+'-';
 const get=(key)=>{try{return localStorage.getItem(prefix+key)}catch(e){return null}};
 const set=(key,value)=>{try{localStorage.setItem(prefix+key,value);return true}catch(e){return false}};
 if(bookId==='fushengsuiyue'){
  for(const [next,old] of [['chapter','miaoshu-reading-chapter'],['font-size','miaoshu-reader-font-size'],['bookmarks','miaoshu-saved-chapters']]){
   if(get(next)===null){try{const value=localStorage.getItem(old);if(value!==null)set(next,value)}catch(e){}}
  }
 }
 const box=document.getElementById('continue-reading'),label=document.getElementById('continue-label'),resume=document.getElementById('continue-link');
 const valid=id=>chapters.find(chapter=>chapter.id===id);
 function show(id){const chapter=valid(id);if(!chapter||!box)return;label.textContent='上次讀到'+bookTitle+'：'+chapter.querySelector('h2').textContent;resume.href='#'+id;box.classList.add('is-visible')}
 show(get('chapter'));
 const progress=document.getElementById('progress');
 let queued=false,last='';
 function onScroll(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{
   queued=false;
   const doc=document.documentElement,h=doc.scrollHeight-doc.clientHeight;
   if(progress)progress.style.width=(h?scrollY/h*100:0)+'%';
   let current;
   for(const chapter of chapters){if(chapter.getBoundingClientRect().top<innerHeight*.55)current=chapter;else break}
   if(current&&last!==current.id){last=current.id;set('chapter',last);show(last)}
  });
 }
 addEventListener('scroll',onScroll,{passive:true});
 if(location.hash.startsWith('#chapter-'))show(location.hash.slice(1));
 const root=document.documentElement;
 let size=Math.max(16,Math.min(24,Number(get('font-size'))||18));
 function applySize(){root.style.setProperty('--reader-size',size+'px');set('font-size',String(size))}
 applySize();
 document.getElementById('font-smaller')?.addEventListener('click',()=>{size=Math.max(16,size-1);applySize()});
 document.getElementById('font-larger')?.addEventListener('click',()=>{size=Math.min(24,size+1);applySize()});
 document.getElementById('font-reset')?.addEventListener('click',()=>{size=18;applySize()});
 const input=document.getElementById('chapter-search'),status=document.getElementById('chapter-search-status');
 const links=[...document.querySelectorAll('#toc .toc a[href^="#chapter-"]')];
 input?.addEventListener('input',()=>{
  const term=input.value.trim().toLocaleLowerCase('zh-Hant');let count=0;
  links.forEach(link=>{const chapter=valid(link.getAttribute('href').slice(1));const match=!term||link.textContent.toLocaleLowerCase('zh-Hant').includes(term)||chapter?.querySelector('.chapter-body')?.textContent?.toLocaleLowerCase('zh-Hant').includes(term);link.hidden=!match;if(match)count++});
  status.textContent=term?count+' 個符合的章節':'';
 });
 const shelf=document.getElementById('saved-chapters');
 const bookmarks=()=>{
  try{return JSON.parse(get('bookmarks')||'[]').filter(valid)}catch(e){return []}
 };
 function renderShelf(){
  if(!shelf)return;
  const saved=bookmarks();shelf.replaceChildren();
  if(!saved.length){const li=document.createElement('li');li.className='empty-shelf';li.textContent='還沒有收藏章節。閱讀時點選「收藏本章」即可加入。';shelf.append(li)}
  saved.forEach(id=>{const li=document.createElement('li'),a=document.createElement('a');a.href='#'+id;a.textContent=valid(id).querySelector('h2').textContent;li.append(a);shelf.append(li)});
  chapters.forEach(chapter=>{const button=chapter.querySelector('.chapter-bookmark');if(button){const active=saved.includes(chapter.id);button.setAttribute('aria-pressed',String(active));button.textContent=active?'▣ 已收藏':'▢ 收藏本章'}});
 }
 chapters.forEach(chapter=>{
  const title=chapter.querySelector('h2')?.textContent||'章節';
  const tools=document.createElement('div');tools.className='chapter-tools';
  const share=document.createElement('button');share.type='button';share.textContent='分享本章 ↗';
  const url=location.origin+location.pathname+'#'+chapter.id;
  share.addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:bookTitle+'・'+title,url});else if(navigator.clipboard){await navigator.clipboard.writeText(url);share.textContent='章節連結已複製 ✓';setTimeout(()=>share.textContent='分享本章 ↗',2500)}else location.href=url}catch(e){}});
  const line=document.createElement('a');line.href='https://social-plugins.line.me/lineit/share?url='+encodeURIComponent(url);line.target='_blank';line.rel='noopener noreferrer';line.textContent='分享到 LINE ↗';
  const quote=document.createElement('button');quote.type='button';quote.textContent='分享選取文字';
  const feedback=document.createElement('p');feedback.className='chapter-share-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  quote.addEventListener('click',async()=>{
   const selection=getSelection(),text=selection?.toString().trim(),range=selection?.rangeCount?selection.getRangeAt(0):null;
   if(!text||!range||!chapter.contains(range.commonAncestorContainer)){feedback.textContent='請先在本章選取想分享的文字。';return}
   const excerpt=text.slice(0,160)+(text.length>160?'…':'');
   try{if(navigator.share){await navigator.share({title:bookTitle+'・'+title,text:'「'+excerpt+'」',url});feedback.textContent='已開啟分享選單。'}else if(navigator.clipboard){await navigator.clipboard.writeText('「'+excerpt+'」\n'+bookTitle+'・'+title+'\n'+url);feedback.textContent='摘錄與章節連結已複製。'}else feedback.textContent='請使用瀏覽器的分享功能。'}catch(e){if(e.name!=='AbortError')feedback.textContent='分享未完成，請再試一次。'}
  });
  const discuss=document.createElement('a');discuss.href='../../index.html#community';discuss.textContent='讀後留言 ↗';
  tools.append(share,line,quote,discuss);chapter.querySelector('.chapter-body')?.after(tools);tools.after(feedback);
  const bookmark=document.createElement('button');bookmark.type='button';bookmark.className='chapter-bookmark';bookmark.setAttribute('aria-label','收藏或取消收藏'+title);
  bookmark.addEventListener('click',()=>{const saved=bookmarks(),next=saved.includes(chapter.id)?saved.filter(id=>id!==chapter.id):[chapter.id,...saved];if(set('bookmarks',JSON.stringify(next)))renderShelf();else bookmark.textContent='無法儲存，請檢查瀏覽器設定'});
  feedback.after(bookmark);
 });
 renderShelf();
 if(bookId==='fushengsuiyue'){
  const endpoint='https://miaoshu-comments.vetjeremy.chatgpt.site/api/likes';
  let visitorId;
  try{visitorId=localStorage.getItem('miaoshu-anonymous-visitor')}catch(e){}
  if(!visitorId||!/^[0-9a-f-]{36}$/i.test(visitorId)){visitorId=crypto.randomUUID();try{localStorage.setItem('miaoshu-anonymous-visitor',visitorId)}catch(e){}}
  const buttons=new Map(),counts={},liked=new Set();
  function render(key){const button=buttons.get(key);if(!button)return;const active=liked.has(key);button.disabled=false;button.setAttribute('aria-pressed',String(active));button.textContent=(active?'♥ 已喜歡本章':'♡ 喜歡本章')+' · '+Number(counts[key]||0)}
  chapters.forEach(chapter=>{
   const button=document.createElement('button');button.type='button';button.className='chapter-like';button.disabled=true;button.textContent='♡ 喜歡本章 · 載入中';button.setAttribute('aria-label','喜歡或取消喜歡'+chapter.querySelector('h2').textContent);
   chapter.querySelector('.chapter-bookmark').after(button);buttons.set(chapter.id,button);
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:chapter.id,visitorId,liked:!liked.has(chapter.id)})});const data=await response.json();if(!response.ok)throw Error(data.message||'按讚暫時無法使用。');counts[chapter.id]=data.count;if(data.liked)liked.add(chapter.id);else liked.delete(chapter.id);render(chapter.id)}
    catch(e){button.disabled=false;button.textContent='♡ 按讚失敗，請重試'}
   });
  });
  fetch(endpoint+'?visitorId='+encodeURIComponent(visitorId),{cache:'no-store'}).then(response=>{if(!response.ok)throw Error();return response.json()}).then(data=>{Object.assign(counts,data.counts||{});(data.liked||[]).forEach(key=>liked.add(key));for(const key of buttons.keys())render(key)}).catch(()=>{for(const button of buttons.values())button.textContent='♡ 暫時無法按讚'});
 }
})();
