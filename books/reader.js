(()=>{const l=document.createElement("link");l.rel="stylesheet";l.href="../../assets/moonlit-v2.css?v=20260930";document.head.append(l)})();
/* Shared reader behavior for every novel page. Set data-book-id and data-book-title on body. */
(()=>{
 const chapters=[...document.querySelectorAll('.chapter[id]')];
 const bookId=document.body.dataset.bookId||'novel';
 const bookTitle=document.body.dataset.bookTitle||document.querySelector('h1')?.textContent||'喵叔小說';
 const prefix='miaoshu-'+bookId+'-';
 const get=(key)=>{try{return localStorage.getItem(prefix+key)}catch(e){return null}};
 const set=(key,value)=>{try{localStorage.setItem(prefix+key,value);return true}catch(e){return false}};
 /* Reader comfort: local-only spacing and distraction-free mode. */
 const comfort=document.createElement('div');comfort.className='moonlit-reader-comfort';comfort.setAttribute('role','group');comfort.setAttribute('aria-label','閱讀舒適度設定');
 const spacing=document.createElement('button');spacing.type='button';spacing.textContent='行距：舒適';
 const focus=document.createElement('button');focus.type='button';focus.textContent='專注閱讀';
 comfort.append(spacing,focus);(document.querySelector('#continue-reading')||document.querySelector('#toc')||document.querySelector('main'))?.before(comfort);
 let wide=get('wide-spacing')==='1';function applySpacing(){document.body.classList.toggle('moonlit-wide-spacing',wide);spacing.textContent=wide?'行距：寬鬆':'行距：舒適';spacing.setAttribute('aria-pressed',String(wide))}applySpacing();spacing.addEventListener('click',()=>{wide=!wide;set('wide-spacing',wide?'1':'0');applySpacing()});
 let focused=get('focus-mode')==='1';function applyFocus(){document.body.classList.toggle('moonlit-focus-mode',focused);focus.textContent=focused?'退出專注閱讀':'專注閱讀';focus.setAttribute('aria-pressed',String(focused))}applyFocus();focus.addEventListener('click',()=>{focused=!focused;set('focus-mode',focused?'1':'0');applyFocus()});

 const searchLink=document.createElement('a');searchLink.href='../../search/';searchLink.className='moonlit-search-link';searchLink.textContent='⌕ 搜尋全站創作';searchLink.setAttribute('aria-label','搜尋小說、章節、攝影及札記');const readerNav=document.querySelector('nav')||document.querySelector('header');readerNav?.append(searchLink);

 if(bookId==='fushengsuiyue'){
  for(const [next,old] of [['chapter','miaoshu-reading-chapter'],['font-size','miaoshu-reader-font-size'],['bookmarks','miaoshu-saved-chapters']]){
   if(get(next)===null){try{const value=localStorage.getItem(old);if(value!==null)set(next,value)}catch(e){}}
  }
 }
 const box=document.getElementById('continue-reading'),label=document.getElementById('continue-label'),resume=document.getElementById('continue-link');
 const valid=id=>chapters.find(chapter=>chapter.id===id);
 set('chapter-titles',JSON.stringify(Object.fromEntries(chapters.map(chapter=>[chapter.id,chapter.querySelector('h2')?.textContent||'章節']))));
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
   if(current&&last!==current.id){last=current.id;set('chapter',last);set('last-read-at',String(Date.now()));show(last)}
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
 /* Mobile quick access to the permanent audiobook player. */
 const audioQuick=document.createElement('button');audioQuick.type='button';audioQuick.className='reader-audio-quick';audioQuick.textContent='🎧';audioQuick.setAttribute('aria-label','開啟有聲閱讀');audioQuick.addEventListener('click',()=>{const player=document.getElementById('audiobook-player')||document.getElementById('audiobook-launcher');player?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>document.getElementById('audio-play')?.focus(),350)});document.body.append(audioQuick);

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
 try {
  const endpoint='https://miaoshu-comments.vetjeremy.chatgpt.site/api/likes';
  let visitorId;
  try{visitorId=localStorage.getItem('miaoshu-anonymous-visitor')}catch(e){}
  if(!visitorId||!/^[0-9a-f-]{36}$/i.test(visitorId)){visitorId=crypto.randomUUID();try{localStorage.setItem('miaoshu-anonymous-visitor',visitorId)}catch(e){}}
  // Keep the original keys for 《浮生歲月》 so existing likes are preserved.
  // Other books use book-scoped keys to avoid sharing counts across novels.
  const likeKey=chapter=>bookId==='fushengsuiyue'?chapter.id:bookId+'-'+chapter.id;
  const buttons=new Map(),counts={},liked=new Set();
  function render(key){const button=buttons.get(key);if(!button)return;const active=liked.has(key);button.disabled=false;button.setAttribute('aria-pressed',String(active));button.textContent=(active?'♥ 已喜歡本章':'♡ 喜歡本章')+' · '+Number(counts[key]||0)}
  chapters.forEach(chapter=>{
   const button=document.createElement('button');button.type='button';button.className='chapter-like';button.disabled=true;button.textContent='♡ 喜歡本章 · 載入中';button.setAttribute('aria-label','喜歡或取消喜歡'+chapter.querySelector('h2').textContent);
   const key=likeKey(chapter);
   chapter.querySelector('.chapter-bookmark').after(button);buttons.set(key,button);
   button.addEventListener('click',async()=>{
    button.disabled=true;
    try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,visitorId,liked:!liked.has(key)})});const data=await response.json();if(!response.ok)throw Error(data.message||'按讚暫時無法使用。');counts[key]=data.count;if(data.liked)liked.add(key);else liked.delete(key);render(key)}
    catch(e){button.disabled=false;button.textContent='♡ 按讚失敗，請重試'}
   });
  });
  fetch(endpoint+'?visitorId='+encodeURIComponent(visitorId),{cache:'no-store'}).then(response=>{if(!response.ok)throw Error();return response.json()}).then(data=>{Object.assign(counts,data.counts||{});(data.liked||[]).forEach(key=>liked.add(key));for(const key of buttons.keys())render(key)}).catch(()=>{for(const button of buttons.values())button.textContent='♡ 暫時無法按讚'});
  } catch(e) { console.warn('Moonlit chapter likes unavailable; reader continues.',e); }
 // Audiobook is initialized by reader-audio-fallback.js as the single audio core.
 // Mobile/reader quick access to the single audiobook core.
 const readerControls=document.querySelector('.reader-controls');
 if(readerControls&&!readerControls.querySelector('.reader-audio-shortcut')){
  const audioShortcut=document.createElement('button');audioShortcut.type='button';audioShortcut.className='reader-audio-shortcut';audioShortcut.setAttribute('aria-label','開啟有聲閱讀');audioShortcut.textContent='🎧 朗讀';
  audioShortcut.addEventListener('click',()=>{const player=document.getElementById('audiobook-player')||document.getElementById('audiobook-launcher');if(player){player.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>player.querySelector('#audio-play,.audiobook-launch-button')?.focus(),350)}});
  readerControls.append(audioShortcut);
 }


})();

/* Reading atmosphere is shared across books and remembered on this device. */
(()=>{
 if(!document.body.dataset.bookId)return;
 const key='miaoshu-reading-theme',root=document.documentElement;
 const controls=document.querySelector('.reader-controls');if(!controls)return;
 const group=document.createElement('div');group.className='reading-theme';group.setAttribute('role','group');group.setAttribute('aria-label','閱讀配色');
 group.innerHTML='<span>閱讀配色</span><button type="button" data-reading-mode="moon" aria-pressed="true">☾ 月光</button><button type="button" data-reading-mode="paper" aria-pressed="false">☀ 紙頁</button>';
 controls.append(group);
 function apply(theme,persist){
  const mode=theme==='paper'?'paper':'moon';root.dataset.readingTheme=mode;
  group.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.readingMode===mode)));
  let themeMeta=document.querySelector('meta[name="theme-color"]');
  if(!themeMeta){themeMeta=document.createElement('meta');themeMeta.name='theme-color';document.head.append(themeMeta)}
  themeMeta.content=mode==='paper'?'#eee8dc':'#071521';
  if(persist){try{localStorage.setItem(key,mode)}catch(e){}}
 }
 let saved;try{saved=localStorage.getItem(key)}catch(e){}apply(saved,false);
 group.addEventListener('click',event=>{const button=event.target.closest('button[data-reading-mode]');if(button)apply(button.dataset.readingMode,true)});
 addEventListener('storage',event=>{if(event.key===key)apply(event.newValue,false)});
})();

/* Moon-phase reading progress and a quiet cross-work doorway. */
(()=>{const chapters=[...document.querySelectorAll(".chapter[id]")];if(!chapters.length)return;const host=document.querySelector(".reader-controls")||document.querySelector(".book-directory");if(host){const phase=document.createElement("span");phase.className="moon-phase-progress";phase.setAttribute("aria-label","閱讀進度月相");phase.innerHTML="<span>○</span><span>◔</span><span>◑</span><span>◕</span><span>●</span>";host.append(phase);const update=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),ratio=Math.max(0,Math.min(1,scrollY/max)),lit=Math.ceil(ratio*5);phase.querySelectorAll("span").forEach((x,i)=>x.classList.toggle("is-lit",i<lit));phase.title="閱讀進度 "+Math.round(ratio*100)+"%"};addEventListener("scroll",update,{passive:true});update()}const last=chapters[chapters.length-1];const x=document.createElement("aside");x.className="reader-crosslink";x.innerHTML="如果你還不想離開這個夜晚，<a href=\"../../gallery/\">去攝影館看一束光</a>，或 <a href=\"../../search/\">沿著一個意象繼續探索</a>。";last.insertAdjacentElement("afterend",x)})();
