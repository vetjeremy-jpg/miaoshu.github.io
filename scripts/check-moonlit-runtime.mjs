#!/usr/bin/env node
import { readFile, readdir, access } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const index=await readFile(join(root,'index.html'),'utf8');
const match=index.match(/assets\/moonlit-v2\.js\?v=([^"'\s<]+)/);
if(!match){console.error('首頁缺少版本化 moonlit-v2.js');process.exit(1)}
const expected=match[1],errors=[];
const readerRefinement=await readFile(join(root,'assets','moonlit-refinement-reader.js'),'utf8');
if(/addEventListener\(["']scroll["']/.test(readerRefinement))errors.push('reader refinement must consume canonical Reader progress instead of adding its own scroll listener');
if(readerRefinement.includes('new MutationObserver(syncFocus)'))errors.push('reader refinement must not shadow canonical focus state with a MutationObserver');
if(readerRefinement.includes("focus.hidden=true")||readerRefinement.includes("inlineFocus.hidden=true"))errors.push('reader refinement must reuse the canonical focus control instead of hiding it');
const readerRuntime=await readFile(join(root,'books','reader.js'),'utf8');
if(!readerRuntime.includes('__moonlitReaderProgress'))errors.push('books/reader.js must expose the canonical Reader progress stream');
if(readerRuntime.includes('moonlit-v2.css'))errors.push('books/reader.js must not dynamically reload retired moonlit-v2.css');
try{await access(join(root,'assets','moonlit-refinement.js'));errors.push('retired assets/moonlit-refinement.js 不應回到 runtime；首頁與 Reader 已有各自 owner')}catch{}
async function walk(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.name.startsWith('.git'))continue;
  const full=join(dir,entry.name);
  if(entry.isDirectory())await walk(full);
  else if(entry.name.endsWith('.html')){
   const html=await readFile(full,'utf8');
   const refs=[...html.matchAll(/moonlit-v2\.js\?v=([^"'\s<]+)/g)].map(m=>m[1]);
   for(const ref of refs)if(ref!==expected)errors.push(`${relative(root,full)} 使用 ${ref}，應為 ${expected}`);
  }
 }
}
await walk(root);
const homeLoader=await readFile(join(root,'assets','moonlit-home-loader.js'),'utf8');
const homeContent=await readFile(join(root,'assets','moonlit-home-content.js'),'utf8');
const experience=await readFile(join(root,'assets','moonlit-experience.js'),'utf8');
if(!homeLoader.includes('__moonlitHomeLoaderLoaded'))errors.push('moonlit-home-loader.js 缺少全域初始化 guard');
if(!homeContent.includes('__moonlitHomeContentLoaded'))errors.push('moonlit-home-content.js 缺少全域初始化 guard');
if(!experience.includes('__moonlitExperienceLoaded'))errors.push('moonlit-experience.js 缺少全域初始化 guard');
if(!homeContent.includes('!d.querySelector(".moonlit-curation")'))errors.push('moonlit-home-content.js 缺少 moonlit-curation 重複掛載 guard');
if(!experience.includes('button.dataset.moonlitMounted'))errors.push('moonlit-experience.js 缺少 picker 重複掛載 guard');
const sharedRuntime=await readFile(join(root,'assets','moonlit-v2.js'),'utf8');
if(/s\.src=[^;]*moonlit-home-content\.js|createElement\(["']script["']\)[\s\S]{0,240}moonlit-home-content\.js/.test(sharedRuntime))errors.push('moonlit-v2.js 不應再載入 homepage-only moonlit-home-content.js；首頁 orchestration 應由 moonlit-home-loader.js 單獨負責');
if(!homeLoader.includes('moonlit-home-idle.js')||!homeLoader.includes('moonlit-home-reading-state.js'))errors.push('moonlit-home-loader.js 必須保留首頁 idle 與 reading-state orchestration');
const sw=await readFile(join(root,'sw.js'),'utf8');
if(!sw.includes(`assets/moonlit-v2.js?v=${expected}`))errors.push(`sw.js 未同步 moonlit-v2.js?v=${expected}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Moonlit runtime cache key 一致：${expected}`);
