import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the shared lifecycle block with desktop and Home Screen environments.
const source=fs.readFileSync('assets/moonlit-v2.js','utf8');
const runtime=source.slice(source.indexOf('(()=>{'),source.indexOf('/* Moonlit footer:'));
for(const standalone of [false,true]) test(`native clicks and BFCache restoration (standalone=${standalone})`,()=>{
 const handlers={}, classes=new Set(), body={style:{opacity:'0'},dataset:{}};
 const document={body,documentElement:{dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}},addEventListener:(type,fn)=>{handlers[type]=fn}};
 const events={};
 vm.runInNewContext(runtime,{document,navigator:{standalone},location:{pathname:'/miaoshu.github.io/'},matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>fn(),addEventListener:(type,fn)=>{events[type]=fn}});
 assert.equal(handlers.click,undefined,'shared runtime must leave native link clicks unblocked');
 events.pageshow({persisted:true});
 assert.equal(body.style.opacity,'');
 assert.equal(document.documentElement.dataset.displayMode,standalone?'standalone':'browser');
 assert.equal(classes.has('moonlit-ready'),true);
});
