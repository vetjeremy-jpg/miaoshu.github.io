import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const origin='https://example.test',path='/miaoshu.github.io/books/new/';
function worker(){
 const handlers={},stores=new Map();let requests=0,stalled=false;
 const key=x=>x.url||new URL(x,origin).href;
 const cache=name=>{if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {match:async x=>data.get(key(x))?.clone(),keys:async()=>[...data.keys()].map(url=>({url})),put:async(x,r)=>data.set(key(x),r),delete:async x=>data.delete(key(x))}};
 const caches={open:async name=>cache(name),match:async x=>{for(const name of stores.keys()){const hit=await cache(name).match(x);if(hit)return hit}},keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)};
 vm.runInNewContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),{URL,Request,Response,AbortController,Set,Map,Promise,setTimeout,clearTimeout,caches,location:{origin},self:{location:{origin},addEventListener:(type,fn)=>handlers[type]=fn},fetch:async()=>{requests++;return stalled?new Promise(()=>{}):new Response('fresh destination')}});
 return {requests:()=>requests,stall:()=>stalled=true,async warm(url){let task;handlers.message({data:{type:'moonlit:prefetch',url},waitUntil:p=>task=p});await task},navigate(){let response;handlers.fetch({request:{url:origin+path,method:'GET',mode:'navigate'},waitUntil:()=>{},respondWith:p=>response=p});return response}};
}
test('intent-warmed destination displays without waiting for a stalled navigation fetch',async()=>{
 const w=worker();await w.warm(origin+path);assert.equal(w.requests(),1);w.stall();
 let timer;try{const result=await Promise.race([w.navigate(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('warm page waited for network')),100))]);assert.equal(await result.text(),'fresh destination')}finally{clearTimeout(timer)}
});
test('prefetch rejects off-site and non-document resources, and reuses a fresh warm page',async()=>{
 const w=worker();await w.warm('https://external.test/');await w.warm(origin+'/miaoshu.github.io/photo.jpg');assert.equal(w.requests(),0);
 await w.warm(origin+path);await w.warm(origin+path);assert.equal(w.requests(),1);
});
