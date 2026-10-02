const CACHE='moonlit-shell-v1';
const SCOPE='/miaoshu.github.io/';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll([SCOPE,SCOPE+'site.webmanifest'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('moonlit-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin||!u.pathname.startsWith(SCOPE))return;if(req.mode==='navigate'){event.respondWith(fetch(req).catch(()=>caches.match(SCOPE)));}});
