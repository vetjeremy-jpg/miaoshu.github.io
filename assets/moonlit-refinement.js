/* Moonlit refinement — progressive enhancement only; no pseudo-element copy injection. */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const safeGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}},safeSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}},safeKeys=()=>{try{return Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).filter(Boolean)}catch(e){return []}};

/* Phase vocabulary on navigation, never extra large moons. */
const phaseFor=text=>/小說|書房/.test(text)?'full':/攝影|影像/.test(text)?'half':/札記|文章|旅行/.test(text)?'crescent':/關於|喵叔/.test(text)?'new':null;
$$('header nav a,.navlinks a').forEach(a=>{const phase=phaseFor(a.textContent);if(!phase||a.querySelector('.moonlit-phase-mark'))return;a.classList.add('moonlit-phase-nav');a.dataset.phase=phase;const mark=document.createElement('span');mark.className='moonlit-phase-mark';mark.setAttribute('aria-hidden','true');a.prepend(mark)});

/* Cinematic homepage glow with restrained pointer parallax. */
const hero=$('.hero');
if(hero&&!document.body.dataset.bookId){
 hero.style.position=hero.style.position||'relative';
 if(!$('.moonlit-ambient-glow',hero)){const glow=document.createElement('i');glow.className='moonlit-ambient-glow';glow.setAttribute('aria-hidden','true');hero.prepend(glow)}
 if(matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches)hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--ml-x',((e.clientX-r.left)/r.width-.5)*10+'px');hero.style.setProperty('--ml-y',((e.clientY-r.top)/r.height-.5)*7+'px')},{passive:true});
}

/* Curated "tonight" discovery. */
const homeMain=$('main');
if(homeMain&&$('#book')&&!document.body.dataset.bookId&&!$('.moonlit-tonight')){
 const works=[
  {m:'read',t:'《建康劫·聽泉引》',d:'今晚適合走進亂世與人心之間，慢慢讀一段有重量的故事。',u:'books/jiankangjie-tingquanyin/index.html#toc'},
  {m:'read',t:'《浮生歲月》',d:'如果今晚想讀記憶、時間與人的選擇，就從這裡開始。',u:'books/fushengsuiyue/index.html#toc'},
  {m:'image',t:'雪庭舞劍',d:'今晚少一點文字，讓雪色、衣袖與劍光替你說故事。',u:'gallery/index.html#snow-sword'},
  {m:'image',t:'台北夜色',d:'沿著暮光走進城市的燈海，看白晝如何慢慢交給夜晚。',u:'gallery/index.html#taipei-night'},
  {m:'rare',t:'《風門夜譚》',d:'繞開最醒目的入口，去讀一個夜裡還沒說完的故事。',u:'books/fengmen-yetan/index.html#toc'},
  {m:'rare',t:'《烏溪月》',d:'舊宅、家族與月色，是今晚比較安靜的一條路。',u:'books/wuxiyue/index.html#toc'},
  {m:'note',t:'把臺北走成一封給自己的信',d:'如果今晚不想進小說，就跟著腳步重新走一次臺北。',u:'posts/taipei-grand-trail-20260928/index.html'}
 ];
 const box=document.createElement('section');box.className='moonlit-tonight';box.setAttribute('aria-labelledby','moonlit-tonight-title');
 box.innerHTML='<small>TONIGHT · BY MOONLIGHT</small><h2 id="moonlit-tonight-title">今晚想把月光帶去哪裡？</h2><p>不是純亂數。先選今晚的心情，Moonlit 再從對應作品裡替你挑一條路。</p><div class="moonlit-moods" role="group" aria-label="今晚的推薦主題"><button data-mood="read">適合閱讀</button><button data-mood="image">適合看影像</button><button data-mood="rare">探索冷門作品</button><button data-mood="note">讀一篇札記</button><button data-mood="any">交給月光</button></div><div class="moonlit-result" aria-live="polite"><div><strong></strong><p></p></div><a>沿著月光前往 →</a></div>';
 const anchor=$('#book');anchor.parentNode.insertBefore(box,anchor);
 box.addEventListener('click',e=>{const b=e.target.closest('button[data-mood]');if(!b)return;$$('button',box).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));let pool=b.dataset.mood==='any'?works:works.filter(w=>w.m===b.dataset.mood);const last=safeGet('moonlit-last-pick');let candidates=pool.filter(w=>w.u!==last);if(!candidates.length)candidates=pool;const pick=candidates[Math.floor(Math.random()*candidates.length)];safeSet('moonlit-last-pick',pick.u);const r=$('.moonlit-result',box);$('strong',r).textContent=pick.t;$('p',r).textContent=pick.d;$('a',r).href=pick.u;r.classList.add('is-visible')});
}

/* Reader focus + exact-line moonlight bookmarks. */
if(document.body.dataset.bookId){
 const id=document.body.dataset.bookId;
 const focus=document.createElement('button');focus.type='button';focus.className='moonlit-focus-toggle';focus.textContent='專注閱讀';focus.setAttribute('aria-pressed','false');document.body.append(focus);
 focus.addEventListener('click',()=>{const on=document.body.classList.toggle('moonlit-reading-focus');focus.setAttribute('aria-pressed',String(on));focus.textContent=on?'顯示導覽':'專注閱讀'});
 const key='moonlit-lines-'+id;let saved=[];try{saved=JSON.parse(safeGet(key)||'[]');if(!Array.isArray(saved))saved=[]}catch(e){saved=[]}
 $$('.chapter-body p').forEach((p,i)=>{const chapter=p.closest('.chapter')?.id||'chapter';const pid=chapter+'-p'+(i+1);p.dataset.moonlitLine=pid;if(saved.includes(pid))p.classList.add('moonlit-saved-line');const b=document.createElement('button');b.type='button';b.className='moonlit-line-save';b.title='把月光留在這一句';b.setAttribute('aria-label','收藏這一段');b.textContent='☾';p.prepend(b);b.addEventListener('click',()=>{let arr=[];try{arr=JSON.parse(safeGet(key)||'[]')}catch(e){};arr=Array.isArray(arr)?arr:[];if(arr.includes(pid))arr=arr.filter(x=>x!==pid);else arr.push(pid);safeSet(key,JSON.stringify(arr));p.classList.toggle('moonlit-saved-line',arr.includes(pid));b.setAttribute('aria-label',arr.includes(pid)?'取消收藏這一段':'收藏這一段')})});
 const last=$$('.chapter[id]').at(-1);if(last&&!$('.moonlit-path')){const path=document.createElement('aside');path.className='moonlit-path';path.innerHTML='<small>FOLLOW THE MOONLIGHT</small><h2>如果你還不想離開今晚……</h2><p><a href="../../gallery/">去攝影館看一束光</a>　·　<a href="../../search/">沿著一個意象繼續探索</a>　·　<a href="../../index.html#book">回到小說書房</a></p>';last.insertAdjacentElement('afterend',path)}
}

/* Surface the latest saved line on homepage as a true “moonlight bookmark”. */
if(homeMain&&!document.body.dataset.bookId){
 const keys=safeKeys().filter(k=>k.startsWith('moonlit-lines-'))
 if(keys.length){const count=keys.reduce((n,k)=>{try{return n+(JSON.parse(safeGet(k)||'[]').length||0)}catch(e){return n}},0);if(count){const target=$('#continue-reading');if(target){const note=document.createElement('p');note.className='moonlit-bookmark-note';note.textContent='☾ 你曾把月光留在 '+count+' 個段落；回到小說時，它們仍會在原處等你。';target.insertAdjacentElement('afterend',note)}}}
}
})();