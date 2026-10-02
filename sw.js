const CACHE='moonlit-shell-v4';
const SCOPE='/miaoshu.github.io/';
const SHELL=[
 SCOPE,
 SCOPE+'site.webmanifest',
 SCOPE+'assets/moonlit-v2.js?v=20261002-pwa-nav2',
 SCOPE+'assets/mobile-rwd-final.css?v=20261002-h2',
 SCOPE+'assets/icons/icon-192.png',
 SCOPE+'assets/icons/icon-512.png'
];

self.addEventListener('install',event=>{
 event.waitUntil(
  caches.open(CACHE)
   .then(cache=>cache.addAll(SHELL))
   .then(()=>self.skipWaiting())
 );
});

self.addEventListener('activate',event=>{
 event.waitUntil(
  caches.keys()
   .then(keys=>Promise.all(keys.filter(key=>key.startsWith('moonlit-shell-')&&key!==CACHE).map(key=>caches.delete(key))))
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
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(req,copy));
     }
     return res;
    })
    .catch(()=>caches.match(req).then(hit=>hit||caches.match(SCOPE)))
  );
  return;
 }

 const shellKey=url.pathname+url.search;
 if(SHELL.some(item=>new URL(item,self.location.origin).pathname+new URL(item,self.location.origin).search===shellKey)){
  event.respondWith(
   fetch(req)
    .then(res=>{
     if(res&&res.ok){
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(req,copy));
     }
     return res;
    })
    .catch(()=>caches.match(req))
  );
 }
});
