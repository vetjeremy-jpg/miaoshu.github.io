#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const index=await readFile(join(root,'index.html'),'utf8');
const match=index.match(/assets\/moonlit-v2\.js\?v=([^"'\s<]+)/);
if(!match){console.error('首頁缺少版本化 moonlit-v2.js');process.exit(1)}
const expected=match[1],errors=[];
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
const sw=await readFile(join(root,'sw.js'),'utf8');
if(!sw.includes(`assets/moonlit-v2.js?v=${expected}`))errors.push(`sw.js 未同步 moonlit-v2.js?v=${expected}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Moonlit runtime cache key 一致：${expected}`);
