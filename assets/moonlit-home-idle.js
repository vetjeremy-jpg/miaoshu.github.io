/* Moonlit homepage idle interactions — loaded after the critical reading state. */
(()=>{'use strict';
 const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
 const set=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
const initLater=()=>{ const progress=document.getElementById('progress');let progressFrame=0;
 const updateProgress=()=>{progressFrame=0;const d=document.documentElement,h=d.scrollHeight-d.clientHeight;progress.style.width=(h?scrollY/h*100:0)+'%'};
 addEventListener('scroll',()=>{if(!progressFrame)progressFrame=requestAnimationFrame(updateProgress)},{passive:true});updateProgress();
 document.getElementById('share-site')?.addEventListener('click',async()=>{const url=location.origin+location.pathname;try{if(navigator.share)await navigator.share({title:'喵叔 Moonlit Stories',url});else if(navigator.clipboard){await navigator.clipboard.writeText(url);document.getElementById('share-feedback').textContent='網站連結已複製。'}else document.getElementById('share-feedback').textContent='請從網址列複製連結。'}catch(e){if(e.name!=='AbortError')document.getElementById('share-feedback').textContent='請從網址列複製連結。'}});
 document.getElementById('save-site')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname);document.getElementById('save-feedback').textContent='網站連結已複製。'}catch(e){document.getElementById('save-feedback').textContent='請從網址列複製連結。'}});
 const initSupport=()=>{ const like=document.getElementById('like-site'),feedback=document.getElementById('support-feedback'),endpoint='https://miaoshu-comments.vetjeremy.chatgpt.site/api/likes';
 if(!like||!feedback)return;
 let visitor=get('miaoshu-anonymous-visitor');
 if(!visitor||!/^[0-9a-f-]{36}$/i.test(visitor)){visitor=crypto.randomUUID();set('miaoshu-anonymous-visitor',visitor)}
 let active=false;like.disabled=true;like.textContent='♡ 喜歡作品 · 載入中';
 function render(count){like.disabled=false;like.setAttribute('aria-pressed',String(active));like.textContent=(active?'♥ 已喜歡作品':'♡ 喜歡作品')+' · '+Number(count||0)}
 fetch(endpoint+'?visitorId='+encodeURIComponent(visitor),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{active=(data.liked||[]).includes('site');render(data.counts?.site)}).catch(()=>{like.disabled=false;like.textContent='♡ 暫時無法按讚';feedback.textContent='共用讚數暫時無法載入，請稍後再試。'});
 like.addEventListener('click',async()=>{like.disabled=true;try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'site',visitorId:visitor,liked:!active})});const data=await r.json();if(!r.ok)throw Error(data.message||'按讚暫時無法使用。');active=!!data.liked;render(data.count);feedback.textContent=active?'謝謝你喜歡喵叔的作品！':'已取消喜歡。'}catch(e){feedback.textContent=e.message||'按讚暫時無法使用。';like.disabled=false}});

 };
 const support=document.getElementById('support');if(support&&'IntersectionObserver'in window){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();initSupport()}},{rootMargin:'700px 0px'});io.observe(support)}else initSupport(); };if('requestIdleCallback'in window)requestIdleCallback(initLater,{timeout:1500});else setTimeout(initLater,700);
})();
