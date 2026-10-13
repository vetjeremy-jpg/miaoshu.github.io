import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const origin='https://example.test',page=origin+'/miaoshu.github.io/books/example/';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function worker({cached=true,shell=false,cacheBroken=false}={}){
 const handlers={},stores=new Map(),timers=new Map();let nextTimer=0,requests=0;
 const key=k=>k.url||new URL(k,origin).href;
 const store=name=>{if(!stores.has(name))stores.set(name,new Map());return stores.get(name)};
 if(cached)store('moonlit-pages-v3').set(page,new Response('cached page'));
 if(shell)store('moonlit-shell-v59').set(origin+'/miaoshu.github.io/',new Response('home shell'));
 const caches={open:async name=>({
  put:async(k,r)=>store(name).set(key(k),r),delete:async k=>store(name).delete(key(k)),
  keys:async()=>[...store(name).keys()].map(url=>({url}))
 }),match:async k=>{
  if(cacheBroken)throw Error('cache unavailable');
  for(const data of stores.values()){const hit=data.get(key(k));if(hit)return hit.clone()}
 }};
 let release,reject;
 const response=new Promise((resolve,fail)=>{release=resolve;reject=fail});
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{
  URL,Request,Response,Set,Promise,location:{origin},caches,
  fetch:()=>{requests++;return response},
  setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{fn,ms});return id},
  clearTimeout:id=>timers.delete(id),
  self:{location:{origin},addEventListener:(type,fn)=>handlers[type]=fn}
 });
 return {stores,timers,requests:()=>requests,release:body=>release(new Response(body)),reject,
  releaseStatus:status=>release(new Response('removed',{status})),
  start(url=page){
   let result;const tasks=[];
   handlers.fetch({request:{url,method:'GET',mode:'navigate',destination:'document'},
    respondWith:p=>result=p,waitUntil:p=>tasks.push(p)});
   return {result,finish:async()=>{for(let i=0;i<tasks.length;i++)await tasks[i]}};
  },
  deadline:async()=>{assert.equal(timers.size,1);const timer=[...timers.values()][0];assert.equal(timer.ms,1500);timer.fn();await flush()}
 };
}

test('slow warmed navigation displays cache at deadline and refreshes in background',async()=>{
 const w=worker(),event=w.start();let displayed=false;event.result.then(()=>displayed=true);
 await flush();assert.equal(displayed,false,'fresh network receives priority before the deadline');
 await w.deadline();assert.equal(await (await event.result).text(),'cached page');
 assert.equal(w.timers.size,0);
 w.release('fresh page');await event.finish();
 assert.equal(await w.stores.get('moonlit-pages-v3').get(page).text(),'fresh page');
});
test('first visit without cache continues waiting instead of returning a blank response',async()=>{
 const w=worker({cached:false}),event=w.start();let displayed=false;event.result.then(()=>displayed=true);
 await w.deadline();assert.equal(displayed,false);
 w.release('first visit');assert.equal(await (await event.result).text(),'first visit');
 await event.finish();assert.equal(w.timers.size,0);
});
test('fast network wins and clears the deadline',async()=>{
 const w=worker(),event=w.start();w.release('latest');
 assert.equal(await (await event.result).text(),'latest');await event.finish();assert.equal(w.timers.size,0);
});
test('offline warmed navigation returns cache immediately',async()=>{
 const w=worker(),event=w.start();w.reject(Error('offline'));
 assert.equal(await (await event.result).text(),'cached page');await event.finish();assert.equal(w.timers.size,0);
});
test('homepage index alias can use the installed shell during a stall',async()=>{
 const w=worker({cached:false,shell:true}),event=w.start(origin+'/miaoshu.github.io/index.html');
 await w.deadline();assert.equal(await (await event.result).text(),'home shell');
 w.release('new home');await event.finish();
});
test('fast HTTP failure is not masked by old cached content',async()=>{
 const w=worker(),event=w.start();w.releaseStatus(404);
 assert.equal((await event.result).status,404);await event.finish();
 assert.equal(await w.stores.get('moonlit-pages-v3').get(page).text(),'cached page');
});
test('cache read failure cannot interrupt a slow successful network response',async()=>{
 const w=worker({cacheBroken:true}),event=w.start();await w.deadline();
 w.release('network content');assert.equal(await (await event.result).text(),'network content');await event.finish();
});
test('worker leaves navigations outside the site scope untouched',()=>{
 const w=worker();assert.equal(w.start(origin+'/other/').result,undefined);assert.equal(w.requests(),0);
});
