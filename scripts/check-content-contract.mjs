import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const fail=(m)=>{console.error('CONTENT CONTRACT: '+m);process.exitCode=1};
const registry=JSON.parse(fs.readFileSync(path.join(root,'data/content-registry.json'),'utf8'));
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const search=fs.readFileSync(path.join(root,'search/index-data.js'),'utf8');
const base='https://vetjeremy-jpg.github.io/miaoshu.github.io/';
if(registry.schemaVersion!==1) fail('unsupported registry schema');
const works=registry.works||[];
const ids=new Set();
for(const w of works){
  for(const k of ['id','title','type','status','url','author']) if(!w[k]) fail(`${w.id||'(unknown)'} missing ${k}`);
  if(ids.has(w.id)) fail(`duplicate id ${w.id}`); ids.add(w.id);
  if(w.author!=='喵叔') fail(`${w.id} author must remain 喵叔`);
  if(w.status==='published' && !fs.existsSync(path.join(root,w.url))) fail(`${w.id} published URL missing: ${w.url}`);
}
const novels=works.filter(w=>w.type==='novel'&&w.status==='published');
const cards=[...home.matchAll(/data-book-id="([^"]+)"/g)].map(m=>m[1]);
if(cards.length!==novels.length) fail(`homepage has ${cards.length} novel cards but registry has ${novels.length}`);
for(const w of novels) if(!cards.includes(w.id)) fail(`homepage missing published novel ${w.id}`);
for(const w of novels){
  const clean=w.url.replace(/index\.html$/,'');
  const canonical=base+clean;
  if(!sitemap.includes('<loc>'+canonical+'</loc>')) fail(`${w.id} missing from sitemap`);
  const searchUrl='../'+clean;
  if(!search.includes('"url":"'+searchUrl+'"')) fail(`${w.id} missing from search index`);
  const html=fs.readFileSync(path.join(root,w.url),'utf8');
  if(!html.includes('href="'+canonical+'"')) fail(`${w.id} canonical does not match registry URL`);
  const chapterIds=[...html.matchAll(/<section[^>]+class=["'][^"']*chapter[^"']*["'][^>]+id=["'](chapter-\d+)["']/gi)].map(m=>m[1]);
  const chapterSet=new Set(chapterIds);
  if(chapterIds.length===0) fail(`${w.id} has no chapter sections`);
  if(chapterSet.size!==chapterIds.length) fail(`${w.id} has duplicate chapter ids`);
  const nums=chapterIds.map(id=>Number(id.slice(8)));
  for(let i=1;i<=nums.length;i++) if(!nums.includes(i)) fail(`${w.id} chapter sequence missing chapter-${i}`);
  const tocBlock=(html.match(/<div class=["']toc["'][^>]*>([\s\S]*?)<\/div>/i)||[])[1]||'';
  const tocIds=[...tocBlock.matchAll(/href=["']#(chapter-\d+)["']/gi)].map(m=>m[1]);
  if(tocIds.length!==chapterIds.length) fail(`${w.id} TOC/chapter count mismatch: ${tocIds.length}/${chapterIds.length}`);
  for(const id of tocIds) if(!chapterSet.has(id)) fail(`${w.id} TOC points to missing ${id}`);
  for(const id of chapterIds) if(!tocIds.includes(id)) fail(`${w.id} chapter ${id} missing from TOC`);
  const localChapterLinks=[...html.matchAll(/href=["']#(chapter-\d+)["']/gi)].map(m=>m[1]);
  for(const id of localChapterLinks) if(!chapterSet.has(id)) fail(`${w.id} internal navigation points to missing ${id}`);
  for(const id of chapterIds){
    const searchUrl='../'+clean+'#'+id;
    if(!search.includes('"url":"'+searchUrl+'"')) fail(`${w.id} ${id} missing from search index`);
  }
}
for(const id of cards) if(!ids.has(id)) fail(`homepage book ${id} missing from registry`);
const heroCount=home.match(/<b>(\d+)<\/b> 小說/);
if(!heroCount || Number(heroCount[1])!==novels.length) fail('hero novel count is stale');
const buttonCount=home.match(/查看全部 (\d+) 本小說/);
if(!buttonCount || Number(buttonCount[1])!==novels.length) fail('show-all novel count is stale');
console.log(`Content contract OK: ${novels.length} published novels synchronized across registry, homepage, search, sitemap, canonical URLs, TOC and chapter anchors.`);
if(process.exitCode) process.exit(process.exitCode);
