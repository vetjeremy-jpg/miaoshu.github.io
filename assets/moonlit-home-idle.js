(()=>{
'use strict';
if(window.__moonlitHomeIdleLoaded)return;window.__moonlitHomeIdleLoaded=true;
const requestLikes=async(url,options={})=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),4000);try{const response=await fetch(url,{...options,signal:controller.signal});const data=await response.json();if(!response.ok)throw Error(data.message||'按讚暫時無法使用。');return data}catch(error){if(error.name==='AbortError')throw Error('連線逾時，請稍後再試。');throw error}finally{clearTimeout(timer)}};
const get=k=>{try{return localStorage.getItem(k)}catch{return null}},set=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
const feedback=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text};
const progress=document.getElementById('progress');let frame=0;
const update=()=>{frame=0;const d=document.documentElement,h=d.scrollHeight-d.clientHeight;if(progress)progress.style.width=(h?scrollY/h*100:0)+'%'};
addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});update();
document.getElementById('share-site')?.addEventListener('click',async()=>{
 feedback('share-feedback','正在開啟分享…');const url=location.origin+location.pathname;
 try{if(navigator.share){await navigator.share({title:'喵叔 Moonlit Stories',url});feedback('share-feedback','分享視窗已關閉。')}else if(navigator.clipboard){await navigator.clipboard.writeText(url);feedback('share-feedback','網站連結已複製。')}else feedback('share-feedback','請從網址列複製連結。')}
 catch(e){feedback('share-feedback',e.name==='AbortError'?'已取消分享。':'分享暫時無法開啟，請從網址列複製連結。')}
});
document.getElementById('save-site')?.addEventListener('click',async()=>{feedback('save-feedback','正在複製連結…');try{await navigator.clipboard.writeText(location.origin+location.pathname);feedback('save-feedback','網站連結已複製。')}catch{feedback('save-feedback','請從網址列複製連結。')}});
const like=document.getElementById('like-site'),endpoint='https://miaoshu-comments.vetjeremy.chatgpt.site/api/likes';
if(!like)return;
let visitor=get('miaoshu-anonymous-visitor');if(!visitor||!/^[0-9a-f-]{36}$/i.test(visitor)){visitor=(crypto.randomUUID?crypto.randomUUID():"10000000-1000-4000-8000-100000000000".replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));set('miaoshu-anonymous-visitor',visitor)}
let active=false,generation=0;const render=count=>{like.disabled=false;like.setAttribute('aria-pressed',String(active));like.textContent=(active?'♥ 已喜歡作品':'♡ 喜歡作品')+(count===undefined?'':' · '+Number(count||0))};
render();
like.addEventListener('click',async()=>{
 generation++;like.disabled=true;like.setAttribute('aria-busy','true');like.textContent='正在儲存喜歡…';feedback('support-feedback','正在連線儲存…');
 try{const data=await requestLikes(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'site',visitorId:visitor,liked:!active})});active=!!data.liked;render(data.count);feedback('support-feedback',active?'謝謝你喜歡喵叔的作品！':'已取消喜歡。')}
 catch(e){render();feedback('support-feedback',e.message+' 可再按一次重試。')}
 finally{like.disabled=false;like.removeAttribute('aria-busy')}
});
const loadCount=()=>{const current=generation;requestLikes(endpoint+'?visitorId='+encodeURIComponent(visitor),{cache:'no-store'}).then(data=>{if(current!==generation)return;active=(data.liked||[]).includes('site');render(data.counts?.site)}).catch(()=>{if(current!==generation)return;render();feedback('support-feedback','讚數暫時無法載入，仍可點擊重試。')})};
if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();loadCount()}},{rootMargin:'180px 0px'});io.observe(like)}else loadCount();
})();
