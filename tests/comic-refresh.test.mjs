import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const origin='https://example.test',comic=origin+'/miaoshu.github.io/books/jiankangjie-tingquanyin/comic/';
async function activate(offline=false){
 const handlers={},pages=new Map([[comic,'old source caption'],[comic+'index.html','old alias'],[origin+'/miaoshu.github.io/books/other/','novel progress']]),navigations=[],messages=[],requests=[];
 const normalize=x=>x.url||x;
 let work;
 const windows=[{url:comic+'#page-3',navigate:async url=>navigations.push(url),postMessage:data=>messages.push(data)},{url:origin+'/miaoshu.github.io/books/other/',navigate:async url=>navigations.push(url),postMessage:data=>messages.push(data)}];
 vm.runInNewContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),{
  URL,Request,Response,Set,Promise,setTimeout,clearTimeout,location:{origin},
  caches:{keys:async()=>['moonlit-pages-v4'],delete:async()=>true,open:async()=>({keys:async()=>[...pages.keys()].map(url=>({url})),delete:async r=>pages.delete(normalize(r)),put:async(r,res)=>pages.set(normalize(r),await res.text())})},
  fetch:async(url,options)=>{requests.push({url,options});if(offline)throw Error('offline');return new Response('<main>updated comic</main>')},
  self:{location:{origin},clients:{claim:async()=>{},matchAll:async()=>windows},addEventListener:(type,fn)=>handlers[type]=fn}
 });
 handlers.activate({waitUntil:p=>work=p});await work;return {pages,navigations,messages,requests};
}
test('activation never waits for a remote fetch or a client navigation',async()=>{
 const r=await activate();assert.equal(r.requests.length,0);assert.equal(r.navigations.length,0);assert.equal(r.messages.length,0);assert.equal(r.pages.get(comic),'old source caption');assert.equal(r.pages.get(origin+'/miaoshu.github.io/books/other/'),'novel progress');
});
test('offline activation preserves cached reading pages',async()=>{
 const r=await activate(true);assert.equal(r.pages.get(comic),'old source caption');assert.equal(r.requests.length,0);assert.equal(r.navigations.length,0);
});
