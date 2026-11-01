import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const origin='https://example.test',comic=origin+'/miaoshu.github.io/books/jiankangjie-tingquanyin/comic/';
async function activate(offline=false){
 const handlers={},pages=new Map([[comic,'old source caption'],[comic+'index.html','old alias'],[origin+'/miaoshu.github.io/books/other/','novel progress']]),navigations=[],requests=[];
 const normalize=x=>x.url||x;
 let work;
 const windows=[{url:comic+'#page-3',navigate:async url=>navigations.push(url)},{url:origin+'/miaoshu.github.io/books/other/',navigate:async url=>navigations.push(url)}];
 vm.runInNewContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),{
  URL,Request,Response,Set,Promise,setTimeout,clearTimeout,location:{origin},
  caches:{keys:async()=>['moonlit-pages-v4'],delete:async()=>true,open:async()=>({keys:async()=>[...pages.keys()].map(url=>({url})),delete:async r=>pages.delete(normalize(r)),put:async(r,res)=>pages.set(normalize(r),await res.text())})},
  fetch:async(url,options)=>{requests.push({url,options});if(offline)throw Error('offline');return new Response('<main>updated comic</main>')},
  self:{location:{origin},clients:{claim:async()=>{},matchAll:async()=>windows},addEventListener:(type,fn)=>handlers[type]=fn}
 });
 handlers.activate({waitUntil:p=>work=p});await work;return {pages,navigations,requests};
}
test('activation replaces stale comic aliases and refreshes only open comics, preserving page number',async()=>{
 const r=await activate();assert.equal(r.pages.get(comic),'<main>updated comic</main>');assert.equal(r.pages.has(comic+'index.html'),false);
 assert.equal(r.pages.get(origin+'/miaoshu.github.io/books/other/'),'novel progress');assert.equal(r.navigations.length,1);
 assert.equal(new URL(r.navigations[0]).hash,'#page-3');assert.equal(new URL(r.navigations[0]).searchParams.get('v'),'20261101-source-clean');
 assert.equal(r.requests[0].options.cache,'reload');
});
test('offline activation keeps cached comic and avoids a disruptive refresh',async()=>{
 const r=await activate(true);assert.equal(r.pages.get(comic),'old source caption');assert.equal(r.navigations.length,0);
});
