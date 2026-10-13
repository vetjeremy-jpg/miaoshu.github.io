import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const origin='https://example.test';
function worker(){
 const handlers={},stores=new Map();let offline=false;
 const cache=name=>{if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {put:async(k,v)=>store.set(k.url||new URL(k,origin).href,v),match:async k=>store.get(k.url||new URL(k,origin).href),delete:async k=>store.delete(k.url||k),keys:async()=>[...store.keys()].map(url=>({url}))}};
 const caches={open:async name=>cache(name),match:async k=>{for(const name of stores.keys()){const hit=await cache(name).match(k);if(hit)return hit}},keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)};
 const ctx={URL,Request,Response,Set,Promise,location:{origin},caches,fetch:async()=>{if(offline)throw Error('offline');return new Response('resource')},self:{location:{origin},addEventListener:(name,fn)=>handlers[name]=fn}};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),ctx);
 return {stores,setOffline:()=>offline=true,request:async(url,destination,mode='cors')=>{const tasks=[];let response;handlers.fetch({request:{url:origin+url,method:'GET',destination,mode},waitUntil:p=>tasks.push(p),respondWith:p=>response=p});if(!response)return;const result=await response;await Promise.all(tasks);return result}};
}
test('visited reader resources and pages survive an offline revisit',async()=>{
 const w=worker();const page='/miaoshu.github.io/books/liangzhongtiankong/';
 await w.request(page,'document','navigate');await w.request('/miaoshu.github.io/books/reader.css?v=1','style');await w.request('/miaoshu.github.io/books/reader.js?v=1','script');
 w.setOffline();assert.equal(await (await w.request(page,'document','navigate')).text(),'resource');assert.equal(await (await w.request('/miaoshu.github.io/books/reader.css?v=1','style')).text(),'resource');assert.equal(await (await w.request('/miaoshu.github.io/books/reader.js?v=1','script')).text(),'resource');
});
test('runtime storage is bounded and does not copy photographs',async()=>{
 const w=worker();for(let i=0;i<70;i++)await w.request('/miaoshu.github.io/style'+i+'.css','style');
 assert.equal(w.stores.get('moonlit-runtime-v1').size,64);
 assert.equal(await w.request('/miaoshu.github.io/photo.jpg','image'),undefined);
});
for(const path of ['books/reader.js','assets/moonlit-home-idle.js']){
 test(path+' restores stalled requests including stalled JSON bodies',async()=>{
  const source=fs.readFileSync(path,'utf8');const helper=source.slice(source.indexOf('const requestLikes='),source.indexOf('\n',source.indexOf('const requestLikes=')));
  let timeout,cleared=false;const ctx={AbortController,setTimeout:fn=>(timeout=fn,1),clearTimeout:()=>cleared=true,fetch:async(_,opts)=>({ok:true,json:()=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Object.assign(Error('aborted'),{name:'AbortError'}))))})};
  vm.runInNewContext(helper+'globalThis.requestLikes=requestLikes',ctx);
  const promise=ctx.requestLikes('/likes');await new Promise(resolve=>setImmediate(resolve));timeout();await assert.rejects(promise,/連線逾時/);assert.equal(cleared,true);
 });
}
