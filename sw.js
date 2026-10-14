const CACHE='moonlit-shell-v65';
const PAGES='moonlit-pages-v3';
const MAX_PAGES=24;
const NAVIGATION_TIMEOUT=1500;
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
 SCOPE+'assets/homepage-inline.css?v=20261004-rhythm-p0p1',
 SCOPE+'assets/moonlit-v2.js?v=20261013-runtime29',
 SCOPE+'assets/moonlit-home-loader.js?v=20261013-resilience2',
 SCOPE+'assets/mobile-safety.css?v=20261004-books1'
];
const LAZY_ASSETS=[
 SCOPE+'assets/icons/icon-192.png',
 SCOPE+'assets/icons/icon-512.png',
 SCOPE+'assets/moonlit-home-content.js?v=20261004-curation-retired1',
 SCOPE+'assets/moonlit-home-idle.js?v=20261013-resilience1',
 SCOPE+'assets/moonlit-home-reading-state.js?v=20261004-immersion1',
 SCOPE+'assets/moonlit-gallery-content.js?v=20261002-split1',
 SCOPE+'assets/moonlit-footer.js?v=20261002-split1',
 SCOPE+'assets/moonlit-refinement-home.js?v=20261004-curation1',
 SCOPE+'assets/moonlit-refinement-reader.js?v=20261003-reader-layout1',
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
   .then(()=>self.clients.claim())
 );
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
  event.respondWith(Promise.race([network,cachedAfterDeadline]).finally(()=>clearTimeout(timer)));
  return;
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
