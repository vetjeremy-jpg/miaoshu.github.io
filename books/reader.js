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
 {
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
 }
 // Optional audiobook mode: uses the visitor's installed speech voices.
 if('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window && chapters.length){
  const synth=window.speechSynthesis;
  const player=document.createElement('section');player.className='audiobook-player panel';player.id='audiobook-player';player.setAttribute('aria-labelledby','audiobook-title');
  player.innerHTML='<div class="audiobook-heading"><div><span class="chapter-kicker">LISTEN · 有聲閱讀</span><h2 id="audiobook-title">聽喵叔說故事</h2><p class="audiobook-note">按下開始才會朗讀。使用裝置內建語音，音色依瀏覽器及系統而異。</p></div></div><div class="audiobook-options"><label>朗讀章節<select id="audio-chapter"></select></label><label>朗讀音色<select id="audio-voice"><option value="">系統預設中文語音</option></select></label><label>朗讀速度<select id="audio-rate"><option value="0.8">舒緩 · 0.8×</option><option value="0.9">從容 · 0.9×</option><option value="1" selected>標準 · 1×</option><option value="1.15">稍快 · 1.15×</option><option value="1.3">快速 · 1.3×</option></select></label></div><div class="audiobook-actions"><button type="button" id="audio-prev-chapter">⇤ 上一章</button><button type="button" id="audio-prev">← 上一段</button><button type="button" id="audio-play" class="audio-primary">▶ 開始朗讀</button><button type="button" id="audio-next">下一段 →</button><button type="button" id="audio-next-chapter">下一章 ⇥</button><button type="button" id="audio-stop">■ 停止</button></div><label class="audiobook-continuous"><input type="checkbox" id="audio-continuous" checked> 本章結束後自動接續下一章</label><p class="audiobook-status" id="audio-status" role="status" aria-live="polite">選擇章節，按「開始朗讀」。</p><p class="audiobook-note">朗讀在本機進行，不會將小說文字傳送到本站的語音服務；切換頁面或關閉分頁即停止。部分手機瀏覽器可能在鎖定螢幕後暫停。</p>';
  const target=document.querySelector('.book-directory')||document.querySelector('#toc')||document.querySelector('main');
  target?.after(player);
  const chSel=player.querySelector('#audio-chapter'),voiceSel=player.querySelector('#audio-voice'),rateSel=player.querySelector('#audio-rate'),play=player.querySelector('#audio-play'),status=player.querySelector('#audio-status');
  chapters.forEach(ch=>{const option=document.createElement('option');option.value=ch.id;option.textContent=ch.querySelector('h2')?.textContent||ch.id;chSel.append(option)});
  const initial=location.hash.slice(1);chSel.value=valid(initial)?initial:(valid(get('chapter'))?get('chapter'):chapters[0].id);
  let voices=[],items=[],position=0,active=false,paused=false,token=0;const continuous=player.querySelector('#audio-continuous');continuous.checked=get('audio-continuous')!=='off';continuous.addEventListener('change',()=>set('audio-continuous',continuous.checked?'on':'off'));
  function loadVoices(){
   const prior=voiceSel.value;voices=synth.getVoices().filter(v=>/^zh(?:-|_)/i.test(v.lang));
   voiceSel.replaceChildren();const fallback=document.createElement('option');fallback.value='';fallback.textContent='系統預設中文語音';voiceSel.append(fallback);
   voices.forEach(v=>{const option=document.createElement('option');option.value=v.voiceURI;option.textContent=v.name+' · '+v.lang;voiceSel.append(option)});
   if(voices.some(v=>v.voiceURI===prior))voiceSel.value=prior;
   else if(voices.length){const traditional=voices.find(v=>/zh[-_](TW|HK)/i.test(v.lang));voiceSel.value=(traditional||voices[0]).voiceURI}
  }
  loadVoices();synth.addEventListener?.('voiceschanged',loadVoices);
  function paragraphs(){const ch=valid(chSel.value);if(!ch)return [];return [...ch.querySelectorAll('.chapter-body p,.chapter-body .chapter-subheading')].flatMap(el=>{const text=el.textContent.trim();if(!text)return [];const chunks=text.match(/.{1,65}(?:[。！？；，、]|$)|.{1,65}/gu)||[text];return chunks.map(part=>({el,text:part.trim()})).filter(x=>x.text)})}
  function clearMark(){player.ownerDocument.querySelectorAll('.audio-reading').forEach(el=>el.classList.remove('audio-reading'))}
  let watchdog=0,recovery=0,lastStarted=0,utterance=null,retries=0;
  function clearTimers(){clearInterval(watchdog);clearTimeout(recovery);watchdog=0;recovery=0}
  function stop(message='已停止朗讀。'){
   token++;active=false;paused=false;clearTimers();utterance=null;synth.cancel();clearMark();
   play.textContent='▶ 開始朗讀';status.textContent=message
  }
  function advanceChapter(){
   const index=chapters.findIndex(ch=>ch.id===chSel.value);
   if(index<0||index+1>=chapters.length)return false;
   chSel.value=chapters[index+1].id;begin(0);return true
  }
  function previousChapter(fromEnd=false){
   const index=chapters.findIndex(ch=>ch.id===chSel.value);
   if(index<=0)return false;
   chSel.value=chapters[index-1].id;
   begin(fromEnd?Number.MAX_SAFE_INTEGER:0);
   return true
  }
  function finishChunk(run){
   if(run!==token||!active)return;
   clearTimers();utterance=null;retries=0;position++;set('audio-position',String(position));
   recovery=setTimeout(()=>{if(run===token&&active&&!paused)speak()},180)
  }
  function speak(){
   if(!active||paused)return;
   clearTimers();
   if(position>=items.length){if(continuous.checked&&advanceChapter())return;stop('本章朗讀完畢。已到最後一章，或未啟用自動接續。');return}
   const current=items[position],run=token;
   clearMark();current.el.classList.add('audio-reading');
   status.textContent=chSel.selectedOptions[0].textContent+' · 第 '+(position+1)+'／'+items.length+' 段';
   const u=new SpeechSynthesisUtterance(current.text);utterance=u;u.lang='zh-TW';u.rate=Number(rateSel.value)||1;
   const chosen=voices.find(v=>v.voiceURI===voiceSel.value);if(chosen)u.voice=chosen;
   lastStarted=Date.now();
   u.onstart=()=>{if(run===token)lastStarted=Date.now()};
   u.onend=()=>finishChunk(run);
   u.onerror=e=>{
    if(run!==token||!active)return;
    if(e.error==='canceled'||e.error==='interrupted')return;
    recover(run,'語音中斷')
   };
   // iOS Safari occasionally omits onend. Recover when the engine is silent,
   // and retry a stuck utterance rather than leaving the entire novel frozen.
   watchdog=setInterval(()=>{
    if(run!==token||!active||paused||document.hidden)return;
    const elapsed=Date.now()-lastStarted;
    if(elapsed>4500&&!synth.speaking&&!synth.pending){finishChunk(run);return}
    if(elapsed>90000)recover(run,'語音逾時')
   },2500);
   try{synth.speak(u)}catch(e){recover(run,'無法啟動語音')}
  }
  function recover(run,reason){
   if(run!==token||!active||paused)return;
   clearTimers();synth.cancel();utterance=null;
   if(retries<2){
    retries++;status.textContent=reason+'，正在恢復第 '+(position+1)+' 段（'+retries+'／2）…';
    recovery=setTimeout(()=>{if(run===token&&active&&!paused)speak()},350)
   }else{
    retries=0;position++;set('audio-position',String(position));
    status.textContent=reason+'，已略過無法播放的短段，繼續朗讀。';
    recovery=setTimeout(()=>{if(run===token&&active&&!paused)speak()},350)
   }
  }
  function begin(at=0){
   stop('');items=paragraphs();position=Math.max(0,Math.min(at,Math.max(0,items.length-1)));retries=0;
   if(!items.length){status.textContent='本章沒有可朗讀的段落。';return}
   active=true;paused=false;const run=token;play.textContent='Ⅱ 暫停朗讀';
   set('audio-chapter',chSel.value);set('audio-position',String(position));
   // Safari may retain the canceled utterance for a moment. Start only after
   // its queue has settled, and invalidate delayed callbacks on every stop.
   recovery=setTimeout(()=>{if(run===token&&active&&!paused)speak()},200)
  }
  play.addEventListener('click',()=>{
   if(!active){begin(position);return}
   if(paused){synth.resume();paused=false;lastStarted=Date.now();play.textContent='Ⅱ 暫停朗讀';status.textContent='繼續朗讀中。'}
   else{synth.pause();paused=true;play.textContent='▶ 繼續朗讀';status.textContent='已暫停朗讀。'}
  });
  player.querySelector('#audio-stop').addEventListener('click',()=>{position=0;set('audio-position','0');stop()});
  player.querySelector('#audio-prev-chapter').addEventListener('click',()=>{if(!previousChapter())status.textContent='已經是第一章。'});
  player.querySelector('#audio-prev').addEventListener('click',()=>{if(position<=0){if(!previousChapter(true))begin(0)}else begin(position-1)});
  player.querySelector('#audio-next').addEventListener('click',()=>{if(position+1>=items.length){if(!advanceChapter())stop('已到最後一章。')}else begin(position+1)});
  player.querySelector('#audio-next-chapter').addEventListener('click',()=>{if(!advanceChapter())status.textContent='已經是最後一章。'});
  chSel.addEventListener('change',()=>{position=0;stop('已選擇「'+chSel.selectedOptions[0].textContent+'」，按開始朗讀。');set('audio-chapter',chSel.value);set('audio-position','0')});
  voiceSel.addEventListener('change',()=>{if(active)begin(position)});
  rateSel.addEventListener('change',()=>{if(active)begin(position)});
  const savedChapter=get('audio-chapter');if(!valid(initial)&&valid(savedChapter)){chSel.value=savedChapter;position=Math.max(0,Number(get('audio-position'))||0)}
  // Do not pause when the screen locks or the reader switches apps; the browser decides background audio support.
  addEventListener('pagehide',()=>{clearTimers();synth.cancel()});
 } else {
  const target=document.querySelector('.book-directory')||document.querySelector('#toc');
  if(target){const note=document.createElement('p');note.className='audio-unsupported';note.textContent='此瀏覽器未提供語音朗讀功能，請改用支援語音合成的 Chrome、Edge 或 Safari。';target.append(note)}
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
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',mode==='paper'?'#f5f0e6':'#101111');
  if(persist){try{localStorage.setItem(key,mode)}catch(e){}}
 }
 let saved;try{saved=localStorage.getItem(key)}catch(e){}apply(saved,false);
 group.addEventListener('click',event=>{const button=event.target.closest('button[data-reading-mode]');if(button)apply(button.dataset.readingMode,true)});
 addEventListener('storage',event=>{if(event.key===key)apply(event.newValue,false)});
})();
