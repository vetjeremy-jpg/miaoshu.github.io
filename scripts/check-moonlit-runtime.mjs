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
const readerAudio=await readFile(join(root,'books','reader-audio-fallback.js'),'utf8');
if(!readerAudio.includes('currentUtterance=null'))errors.push('Reader audiobook must own the active SpeechSynthesisUtterance');
if(!readerAudio.includes('const releaseUtterance='))errors.push('Reader audiobook must release utterance handlers during cancellation');
if(!readerAudio.includes('currentUtterance.onend=null')||!readerAudio.includes('currentUtterance.onerror=null'))errors.push('Reader audiobook must detach stale utterance callbacks');
if(!readerAudio.includes('const cancelSpeakTimer='))errors.push('Reader audiobook must own pending speech timers');
if(!readerAudio.includes('clearTimeout(speakTimer)'))errors.push('Reader audiobook must cancel pending speech timers');
if((readerAudio.match(/setTimeout\(speak/g)||[]).length)errors.push('Reader audiobook must route speech delays through queueSpeak instead of raw setTimeout');
if(!readerAudio.includes("addEventListener('pagehide'"))errors.push('Reader audiobook must cancel speech on pagehide to avoid PWA/Safari speech leakage');
if(!readerAudio.includes('synth.cancel();clear()'))errors.push('Reader audiobook page lifecycle cleanup must cancel synthesis and clear reading highlights');
const readerRefinement=await readFile(join(root,'assets','moonlit-refinement-reader.js'),'utf8');
if(/addEventListener\(["']scroll["']/.test(readerRefinement))errors.push('reader refinement must consume canonical Reader progress instead of adding its own scroll listener');
if(readerRefinement.includes('new MutationObserver(syncFocus)'))errors.push('reader refinement must not shadow canonical focus state with a MutationObserver');
if(readerRefinement.includes("focus.hidden=true")||readerRefinement.includes("inlineFocus.hidden=true"))errors.push('reader refinement must reuse the canonical focus control instead of hiding it');
const readerRuntime=await readFile(join(root,'books','reader.js'),'utf8');
if(!readerRuntime.includes('if(window.__moonlitReaderLoaded)return;')||!readerRuntime.includes('window.__moonlitReaderLoaded=true;'))errors.push('books/reader.js must keep a global idempotent initialization guard');
if(!readerRuntime.includes('__moonlitReaderProgress'))errors.push('books/reader.js must expose the canonical Reader progress stream');
const readerScrollOwners=(readerRuntime.match(/addEventListener\(["']scroll["']/g)||[]).length;
if(readerScrollOwners!==1)errors.push(`books/reader.js must keep one canonical scroll listener; found ${readerScrollOwners}`);
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
const homeIdle=await readFile(join(root,'assets','moonlit-home-idle.js'),'utf8');
const homeContent=await readFile(join(root,'assets','moonlit-home-content.js'),'utf8');
const experience=await readFile(join(root,'assets','moonlit-experience.js'),'utf8');
if(!homeLoader.includes('__moonlitHomeLoaderLoaded'))errors.push('moonlit-home-loader.js 缺少全域初始化 guard');
if(!homeContent.includes('__moonlitHomeContentLoaded'))errors.push('moonlit-home-content.js 缺少全域初始化 guard');
if(!experience.includes('__moonlitExperienceLoaded'))errors.push('moonlit-experience.js 缺少全域初始化 guard');
if(/moonlit-curation|TONIGHT AT MOONLIT|phaseItems/.test(homeContent))errors.push('moonlit-home-content.js 不得恢復舊的獨立推薦策展區塊');
if(!experience.includes('button.dataset.moonlitMounted'))errors.push('moonlit-experience.js 缺少 picker 重複掛載 guard');
if(!experience.includes('button.insertAdjacentElement("afterend",box)'))errors.push('Moonlit picker 必須掛在第三層探索按鈕之後，不得成為獨立推薦區塊');
const sharedRuntime=await readFile(join(root,'assets','moonlit-v2.js'),'utf8');
if(/s\.src=[^;]*moonlit-home-content\.js|createElement\(["']script["']\)[\s\S]{0,240}moonlit-home-content\.js/.test(sharedRuntime))errors.push('moonlit-v2.js 不應再載入 homepage-only moonlit-home-content.js；首頁 orchestration 應由 moonlit-home-loader.js 單獨負責');
if(!homeLoader.includes('moonlit-home-idle.js')||!homeLoader.includes('moonlit-home-reading-state.js'))errors.push('moonlit-home-loader.js 必須保留首頁 idle 與 reading-state orchestration');
if(/bell-site|miaoshu-bell/.test(homeIdle))errors.push('moonlit-home-idle.js 不得恢復已移除的回訪提醒 bell 邏輯');
if(!homeIdle.includes("if(!like||!feedback)return"))errors.push('合併後的 support runtime 必須在按讚元件不存在時安全返回');
if(!homeLoader.includes('moonlit-home-idle.js?v=20261004-immersion2'))errors.push('moonlit-home-loader.js 必須載入最新 immersion2 idle runtime');

const sw=await readFile(join(root,'sw.js'),'utf8');
if(!sw.includes(`assets/moonlit-v2.js?v=${expected}`))errors.push(`sw.js 未同步 moonlit-v2.js?v=${expected}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Moonlit runtime cache key 一致：${expected}`);
