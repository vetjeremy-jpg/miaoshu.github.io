const CACHE='moonlit-shell-v82';
const PAGES='moonlit-pages-v4';
const MAX_PAGES=24;
const NAVIGATION_TIMEOUT=180;
const RUNTIME='moonlit-runtime-v1';
const MAX_RUNTIME=64;
const keepAlive=(event,work)=>event.waitUntil(work.catch(()=>{}));
const trimRuntime=async cache=>{const keys=await cache.keys();await Promise.all(keys.slice(0,Math.max(0,keys.length-MAX_RUNTIME)).map(key=>cache.delete(key)))};
const SCOPE='/miaoshu.github.io/';
const trimPages=async cache=>{const keys=await cache.keys();if(keys.length>MAX_PAGES)await Promise.all(keys.slice(0,keys.length-MAX_PAGES).map(key=>cache.delete(key)));};
const pageKey=req=>{const u=new URL(req.url);for(const key of [...u.searchParams.keys()])if(key==='v'||key==='fbclid'||key==='gclid'||key.startsWith('utm_'))u.searchParams.delete(key);return new Request(u.href,{method:'GET',headers:{accept:'text/html'}})};
const SHELL=[
 SCOPE,
 SCOPE+'site.webmanifest',
 SCOPE+'assets/homepage-inline.css?v=20261106-video-optin',
 SCOPE+'assets/moonlit-v2.js?v=20261018-runtime31',
 SCOPE+'assets/moonlit-home-loader.js?v=20261106-video-optin',
 SCOPE+'assets/mobile-safety.css?v=20261004-books1'
];
const LAZY_ASSETS=[
 SCOPE+'assets/icons/icon-192.png',
 SCOPE+'assets/icons/icon-512.png',
 SCOPE+'assets/moonlit-home-content.js?v=20261004-curation-retired1',
 SCOPE+'assets/moonlit-home-idle.js?v=20261101-responsive1',
 SCOPE+'assets/moonlit-home-reading-state.js?v=20261101-live-state1',
 SCOPE+'assets/moonlit-gallery-content.js?v=20261002-split1',
 SCOPE+'assets/moonlit-footer.js?v=20261002-split1',
 SCOPE+'assets/moonlit-refinement-home.js?v=20261101-current1',
 SCOPE+'assets/moonlit-refinement-reader.js?v=20261102-lines1',
 SCOPE+'assets/moonlit-refinement.css?v=20261004-comfort2',
 SCOPE+'assets/moonlit-refinement-reader.css?v=20261003-paper1'
];
const VERSIONED_ASSETS=new Set([...SHELL,...LAZY_ASSETS].map(item=>{const u=new URL(item,self.location.origin);return u.pathname+u.search}));

self.addEventListener('install',event=>{
 event.waitUntil(
  caches.open(CACHE).then(cache=>Promise.all(SHELL.map(async url=>{
   const res=await fetch(url,{cache:'reload'});
   if(!res.ok)throw new Error('Critical shell fetch failed: '+url);
   await cache.put(url,res);
  }))).then(()=>self.skipWaiting())
 );
});

self.addEventListener('activate',event=>{
 event.waitUntil(
  caches.keys()
   .then(keys=>Promise.all(keys.filter(key=>(key.startsWith('moonlit-shell-')&&key!==CACHE)||(key.startsWith('moonlit-pages-')&&key!==PAGES)||(key.startsWith('moonlit-runtime-')&&key!==RUNTIME)).map(key=>caches.delete(key))))
   
   .then(async()=>{const cache=await caches.open(PAGES);for(const request of await cache.keys()){const path=new URL(request.url,self.location.origin).pathname;if(path===SCOPE||path===SCOPE+'index.html')await cache.delete(request)}})
   .then(()=>self.clients.claim())
 );
});

const recentlyWarmed=new Map(),warming=new Set();
self.addEventListener('message',event=>{
 if(event.data?.type!=='moonlit:prefetch')return;
 let url;try{url=new URL(event.data.url,self.location.origin)}catch{return}
 if(url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE)||!(/\/$|\.html$/.test(url.pathname)))return;
 const key=url.origin+url.pathname;
 if(warming.has(key)||warming.size>=3||(recentlyWarmed.has(key)&&Date.now()-recentlyWarmed.get(key)<30000))return;warming.add(key);
 if(recentlyWarmed.size>8)recentlyWarmed.delete(recentlyWarmed.keys().next().value);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
 event.waitUntil(fetch(url.href,{cache:'no-cache',signal:controller.signal,priority:'low'}).then(async res=>{if(!res.ok)return;const cache=await caches.open(PAGES);const request=pageKey({url:url.href});await cache.delete(request);await cache.put(request,res);recentlyWarmed.set(key,Date.now());await trimPages(cache)}).catch(()=>{}).finally(()=>{warming.delete(key);clearTimeout(timer)}));
});

self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==location.origin||!url.pathname.startsWith(SCOPE))return;

 // Prefer fresh HTML, but let warmed pages remain usable when the network stalls.
 // Keep the original request alive so a timeout never cancels the cache refresh.
 if(req.mode==='navigate'){
  let timer;
  const network=fetch(req)
   .then(res=>{
    if(res&&res.ok){
     const copy=res.clone(),key=pageKey(req);
     keepAlive(event,caches.open(PAGES).then(async cache=>{await cache.delete(key);await cache.put(key,copy);await trimPages(cache)}));
    }
    return res;
   })
   .catch(async()=>{
    const hit=await caches.match(pageKey(req)).catch(()=>undefined);
    if(hit)return hit;
    if(url.pathname===SCOPE||url.pathname===SCOPE+'index.html')return await caches.match(SCOPE).catch(()=>undefined)||Response.error();
    return Response.error();
   });
  keepAlive(event,network.then(()=>{}));
  const cachedAfterDeadline=new Promise(resolve=>{
   timer=setTimeout(()=>{
    caches.match(pageKey(req)).then(async hit=>{
     if(!hit&&(url.pathname===SCOPE||url.pathname===SCOPE+'index.html'))hit=await caches.match(SCOPE);
     if(hit)resolve(hit); // Cache misses keep waiting for the network.
    }).catch(()=>{});
   },NAVIGATION_TIMEOUT);
  });
  const warm=recentlyWarmed.get(url.origin+url.pathname);
  event.respondWith((warm&&Date.now()-warm<30000?caches.match(pageKey(req)).then(hit=>hit||network):Promise.race([network,cachedAfterDeadline])).finally(()=>clearTimeout(timer)));
  return;
 }

 // Upgrade older novel documents without discarding their offline fallback.
 if(url.pathname===SCOPE+'books/reader.js'&&['20261018-response2','20260930-reading-mode','20261101-responsive1','20261101-sharing1','20261101-search2'].includes(url.searchParams.get('v'))){
  const current=new URL(url.href);current.searchParams.set('v','20261106-bookshelf');
  event.respondWith(caches.open(RUNTIME).then(async cache=>{
   const hit=await cache.match(current.href);if(hit)return hit;
   try{const res=await fetch(current.href,{cache:'reload'});if(!res.ok)throw Error('reader unavailable');const copy=res.clone();keepAlive(event,cache.put(current.href,copy));return res}catch{return await cache.match(req)||Response.error()}
  }));return;
 }
 if(url.pathname===SCOPE+'books/reader-audio-fallback.js'&&url.searchParams.get('v')==='20261018-response2'){
  const current=new URL(url.href);current.searchParams.set('v','20261101-controls2');
  event.respondWith(caches.open(RUNTIME).then(async cache=>{const hit=await cache.match(current.href);if(hit)return hit;try{const res=await fetch(current.href,{cache:'reload'});if(!res.ok)throw Error('audio reader unavailable');const copy=res.clone();keepAlive(event,cache.put(current.href,copy));return res}catch{return await cache.match(req)||Response.error()}}));return;
 }
 const assetKey=url.pathname+url.search;
 if(VERSIONED_ASSETS.has(assetKey)){
  event.respondWith(
   caches.match(req).then(hit=>hit||fetch(req).then(res=>{
    if(res&&res.ok){const copy=res.clone();keepAlive(event,caches.open(CACHE).then(cache=>cache.put(req,copy)))}
    return res;
   }))
  );
  return;
 }
 // Cache only first-party styles/scripts after use. Never copy external photos.
 if(['style','script'].includes(req.destination)){
  const network=()=>fetch(req).then(res=>{
   if(res.ok){const copy=res.clone();keepAlive(event,caches.open(RUNTIME).then(async cache=>{await cache.put(req,copy);await trimRuntime(cache)}))}
   return res;
  }).catch(async()=>{const cache=await caches.open(RUNTIME);return await cache.match(req)||Response.error()});
  // Versioned URLs identify immutable releases; revisits need no network round trip.
  event.respondWith(url.searchParams.get('v')?caches.open(RUNTIME).then(async cache=>await cache.match(req)||network()):network());
 }
});
