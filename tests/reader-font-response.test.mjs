import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync('books/reader.js','utf8');
const behavior=source.slice(source.indexOf(" const progress=document.getElementById('progress');"),source.indexOf(' /* Mobile quick access'));
function reader(){
 const styles=Array.from({length:8},()=>new Map());
 const chapters=styles.map((style,i)=>({id:`chapter-${i+1}`,querySelector:()=>({style:{setProperty:(k,v)=>style.set(k,v)}}),getBoundingClientRect(){throw Error('synchronous chapter layout read')}}));
 const root={dataset:{},scrollHeight:10000,clientHeight:800,style:{setProperty(){throw Error('font invalidation on document root')}}};
 const events={},buttons={},saved=new Map(),frames=[],timers=new Map();let observer,shown,id=0;
 const context={document:{documentElement:root,querySelector:()=>null,querySelectorAll:()=>[],getElementById:key=>buttons[key]??=(key==='progress'?{style:{}}:{addEventListener:(_,fn)=>buttons[key].click=fn})},window:{},chapters,set:(k,v)=>saved.set(k,v),get:()=>null,show:v=>shown=v,location:{hash:''},scrollY:300,innerHeight:800,addEventListener:(key,fn)=>events[key]=fn,requestAnimationFrame:fn=>frames.push(fn),setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:id=>timers.delete(id),IntersectionObserver:class{constructor(fn,options){observer={fn,options,observed:[]}}observe(chapter){observer.observed.push(chapter)}}};
 context.window.IntersectionObserver=context.IntersectionObserver;
 vm.runInNewContext(behavior,context);
 return {context,root,styles,events,buttons,saved,frames,timers,get observer(){return observer},get shown(){return shown}};
}
test('rapid mixed font controls update prose synchronously without layout reads; save is batched',()=>{
 const r=reader();r.context.window.__moonlitReaderFont.adjust(1);r.buttons['font-larger'].click();
 assert.equal(r.root.dataset.readerSize,'20');
 for(const style of r.styles)assert.equal(style.get('--reader-size'),'20px');
 assert.equal(r.saved.has('font-size'),false);
 assert.equal(r.timers.size,1);
 r.buttons['font-smaller'].click();
 for(const fn of r.timers.values())fn();
 assert.equal(r.saved.get('font-size'),'19');
 for(let i=0;i<20;i++)r.context.window.__moonlitReaderFont.adjust(1);
 assert.equal(r.root.dataset.readerSize,'24');
 for(let i=0;i<20;i++)r.context.window.__moonlitReaderFont.adjust(-1);
 assert.equal(r.root.dataset.readerSize,'16');
 r.buttons['font-reset'].click();r.events.pagehide();assert.equal(r.saved.get('font-size'),'18');
});
test('progress uses observer chapter visibility instead of forcing layout of skipped chapters',()=>{
 const r=reader();assert.equal(r.observer.observed.length,8);
 r.events.scroll();r.frames.shift()();
 const [first,,third]=r.context.chapters;
 r.observer.fn([{target:first,isIntersecting:true},{target:third,isIntersecting:true}]);
 assert.equal(r.saved.get('chapter'),'chapter-3');
 r.observer.fn([{target:third,isIntersecting:false}]);assert.equal(r.saved.get('chapter'),'chapter-1');
});
