/* Moonlit refinement — progressive enhancement only; no pseudo-element copy injection. */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const safeGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}},safeSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};

/* Navigation stays typographic and quiet; phase marks removed in Final Editorial pass. */
/* Cinematic homepage glow with restrained pointer parallax. */
const hero=$('.hero'),homeMain=$('main'),book=$('#book'),continueBox=$('#continue-reading'),canHover=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches;
const near=(el,fn)=>{if(!el)return;if(!('IntersectionObserver'in window)){fn();return}const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();fn()}},{rootMargin:'800px 0px'});io.observe(el)};
if(hero&&canHover){
 hero.style.position=hero.style.position||'relative';
 if(!$('.moonlit-ambient-glow',hero)){const glow=document.createElement('i');glow.className='moonlit-ambient-glow';glow.setAttribute('aria-hidden','true');hero.prepend(glow)}
 let px=0,py=0,raf=0;hero.addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY;if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const r=hero.getBoundingClientRect();hero.style.setProperty('--ml-x',((px-r.left)/r.width-.5)*10+'px');hero.style.setProperty('--ml-y',((py-r.top)/r.height-.5)*7+'px')})},{passive:true});
}

/* Three-tier homepage curation.
   Tier 1 is the single editorial pick. Tier 2 is the static Tonight trio.
   Tier 3 keeps Featured + free exploration together, with mood guidance as a nested tool. */
if(homeMain&&!$('.moonlit-editorial-feature')){
 const features=[
  {k:"EDITOR'S PICK · FICTION",t:"《建康劫·聽泉引》",d:"從一座將傾的城開始，看人在刀兵之外仍想守住什麼。",u:"books/jiankangjie-tingquanyin/"},
  {k:"EDITOR'S PICK · PHOTOGRAPHY",t:"雪庭舞劍",d:"雪色、衣袂與劍光，把一段未說出口的故事留在影像裡。",u:"gallery/#snow-sword"},
  {k:"EDITOR'S PICK · NOTE",t:"把臺北走成一封給自己的信",d:"一條步道不只通往終點，也通往一個稍微不同的自己。",u:"posts/taipei-grand-trail-20260928/"},
  {k:"EXPLORE · CONSTELLATION",t:"作品星圖",d:"不照分類走，沿著歷史、夜色、雪、旅行與光影，在作品之間漫遊。",u:"works/"}
 ];
 const day=Math.floor(Date.now()/86400000),pick=features[day%features.length],box=document.createElement('aside');
 box.className='moonlit-editorial-feature';
 box.setAttribute('aria-label','第一層推薦：本期選題');
 box.innerHTML='<small>01 · CURATED EDITION / 本期選題</small><span class="moonlit-editorial-kind">'+pick.k+'</span><strong>'+pick.t+'</strong><p>'+pick.d+'</p><a href="'+pick.u+'">進入本期選題 →</a>';
 if(hero)hero.insertAdjacentElement('afterend',box)
}

const moodBox=$('.moonlit-mood-selector');
if(homeMain&&moodBox&&!moodBox.dataset.moonlitMounted){
 moodBox.dataset.moonlitMounted='1';
 const works=[
  {m:'read',t:'《建康劫·聽泉引》',d:'今晚適合走進亂世與人心之間，慢慢讀一段有重量的故事。',u:'books/jiankangjie-tingquanyin/index.html#toc'},
  {m:'read',t:'《浮生歲月》',d:'如果今晚想讀記憶、時間與人的選擇，就從這裡開始。',u:'books/fushengsuiyue/index.html#toc'},
  {m:'image',t:'雪庭舞劍',d:'今晚少一點文字，讓雪色、衣袖與劍光替你說故事。',u:'gallery/index.html#snow-sword'},
  {m:'image',t:'台北夜色',d:'沿著暮光走進城市的燈海，看白晝如何慢慢交給夜晚。',u:'gallery/index.html#taipei-night'},
  {m:'rare',t:'《風門夜譚》',d:'繞開最醒目的入口，去讀一個夜裡還沒說完的故事。',u:'books/fengmen-yetan/index.html#toc'},
  {m:'rare',t:'《烏溪月》',d:'舊宅、家族與月色，是今晚比較安靜的一條路。',u:'books/wuxiyue/index.html#toc'},
  {m:'note',t:'把臺北走成一封給自己的信',d:'如果今晚不想進小說，就跟著腳步重新走一次臺北。',u:'posts/taipei-grand-trail-20260928/index.html'}
 ];
 const buttons=$$('button[data-mood]',moodBox),result=$('.moonlit-result',moodBox),resultTitle=$('strong',result),resultText=$('p',result),resultLink=$('a',result);
 moodBox.addEventListener('click',e=>{
  const b=e.target.closest('button[data-mood]');if(!b)return;
  buttons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  let pool=b.dataset.mood==='any'?works:works.filter(w=>w.m===b.dataset.mood);
  const last=safeGet('moonlit-last-pick');
  let candidates=pool.filter(w=>w.u!==last);if(!candidates.length)candidates=pool;
  const pick=candidates[Math.floor(Math.random()*candidates.length)];
  safeSet('moonlit-last-pick',pick.u);
  resultTitle.textContent=pick.t;resultText.textContent=pick.d;resultLink.href=pick.u;result.classList.add('is-visible')
 });
}

/* Surface the latest saved line on homepage as a true “moonlight bookmark”.
   Fast path uses the bookmark index; only legacy data falls back to a full storage scan. */
if(homeMain&&continueBox)near(continueBox,()=>{
 let details=[];try{details=JSON.parse(safeGet('moonlit-bookmark-details')||'[]')}catch(e){};details=Array.isArray(details)?details:[];
 const last=details.at(-1),target=continueBox;
 if(last&&target){const note=document.createElement('a');note.className='moonlit-bookmark-note';note.href=last.url;note.innerHTML='<small>YOUR MOONLIGHT BOOKMARK / 你留下的月光</small><strong>「'+last.text.replace(/[<>&]/g,s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))+'」</strong><span>'+last.title+' · 回到這一句 →</span>';target.insertAdjacentElement('afterend',note)}
 else if(target){let count=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('moonlit-lines-'))count+=JSON.parse(localStorage.getItem(k)||'[]').length||0}}catch(e){}if(count){const note=document.createElement('p');note.className='moonlit-bookmark-note';note.textContent='☾ 你曾把月光留在 '+count+' 個段落；回到小說時，它們仍會在原處等你。';target.insertAdjacentElement('afterend',note)}}
});

})();
