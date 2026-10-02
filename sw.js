const CACHE='moonlit-shell-v2';
const SCOPE='/miaoshu.github.io/';
const SHELL=[
 SCOPE,
 SCOPE+'site.webmanifest',
 SCOPE+'assets/moonlit-v2.js',
 SCOPE+'assets/mobile-rwd-final.css',
 SCOPE+'assets/icons/icon-192.png',
 SCOPE+'assets/icons/icon-512.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('moonlit-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const u=new URL(req.url);if(u.origin!==location.origin||!u.pathname.startsWith(SCOPE))return;
 if(req.mode==='navigate'){event.respondWith(fetch(req).catch(()=>caches.match(SCOPE)));return}
 if(SHELL.includes(u.pathname)){event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res})));}}
});
