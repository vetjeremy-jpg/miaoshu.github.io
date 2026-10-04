const CACHE='moonlit-shell-v55';
const PAGES='moonlit-pages-v3';
const MAX_PAGES=24;
const SCOPE='/miaoshu.github.io/';
const trimPages=async cache=>{const keys=await cache.keys();if(keys.length>MAX_PAGES)await Promise.all(keys.slice(0,keys.length-MAX_PAGES).map(key=>cache.delete(key)));};
const pageKey=req=>{const u=new URL(req.url);for(const key of [...u.searchParams.keys()])if(key==='v'||key==='fbclid'||key==='gclid'||key.startsWith('utm_'))u.searchParams.delete(key);return new Request(u.href,{method:'GET',headers:{accept:'text/html'}})};
const SHELL=[
 SCOPE,
 SCOPE+'site.webmanifest',
 SCOPE+'assets/homepage-inline.css?v=20261004-a11y11',
 SCOPE+'assets/moonlit-v2.js?v=20261003-runtime28',
 SCOPE+'assets/moonlit-home-loader.js?v=20261004-mainthread9',
 SCOPE+'assets/mobile-safety.css?v=20261004-books1'
];
const LAZY_ASSETS=[
 SCOPE+'assets/icons/icon-192.png',
 SCOPE+'assets/icons/icon-512.png',
 SCOPE+'assets/moonlit-home-content.js?v=20261004-curation-retired1',
 SCOPE+'assets/moonlit-home-idle.js?v=20261004-mainthread9',
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
   .then(keys=>Promise.all(keys.filter(key=>(key.startsWith('moonlit-shell-')&&key!==CACHE)||(key.startsWith('moonlit-pages-')&&key!==PAGES)).map(key=>caches.delete(key))))
   .then(()=>self.clients.claim())
 );
});

self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==location.origin||!url.pathname.startsWith(SCOPE))return;

 // Network-first prevents an installed iPhone Home Screen app from being
 // stranded on an older HTML/CSS/JS shell after a GitHub Pages deployment.
 if(req.mode==='navigate'){
  event.respondWith(
   fetch(req)
    .then(res=>{
     if(res&&res.ok){
      const copy=res.clone(),key=pageKey(req);
      caches.open(PAGES).then(async cache=>{await cache.delete(key);await cache.put(key,copy);await trimPages(cache)});
     }
     return res;
    })
    .catch(async()=>{
     const hit=await caches.match(pageKey(req));
     if(hit)return hit;
     if(url.pathname===SCOPE||url.pathname===SCOPE+'index.html')return caches.match(SCOPE);
     return Response.error();
    })
  );
  return;
 }

 const assetKey=url.pathname+url.search;
 if(VERSIONED_ASSETS.has(assetKey)){
  event.respondWith(
   caches.match(req).then(hit=>hit||fetch(req).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}
    return res;
   }))
  );
 }
});
