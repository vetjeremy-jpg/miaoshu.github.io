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
  const meta=(name,property=false)=>{
    const attr=property?'property':'name';
    const tags=[...html.matchAll(/<meta\s+[^>]*>/gi)].map(m=>m[0]);
    const tag=tags.find(t=>new RegExp('\\b'+attr+'=["\\\']'+name.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&')+'["\\\']','i').test(t));
    if(!tag) return '';
    return (tag.match(/\bcontent=["']([^"']*)["']/i)||[])[1]?.trim()||'';
  };
  const title=(html.match(/<title>([^<]+)<\/title>/i)||[])[1]?.trim()||'';
  const description=meta('description');
  const ogTitle=meta('og:title',true);
  const ogDescription=meta('og:description',true);
  const ogUrl=meta('og:url',true);
  if(!title || !title.includes(w.title.replace(/^《|》$/g,''))) fail(`${w.id} title missing work name`);
  if(description.length<25) fail(`${w.id} meta description is missing or too thin`);
  if(!ogTitle) fail(`${w.id} missing og:title`);
  if(!ogDescription) fail(`${w.id} missing og:description`);
  if(ogUrl!==canonical) fail(`${w.id} og:url does not match canonical`);
  if(meta('og:type',true)!=='book') fail(`${w.id} og:type must be book`);
  if(meta('og:site_name',true)!=='喵叔 Moonlit Stories') fail(`${w.id} missing Moonlit og:site_name`);
  if(meta('og:locale',true)!=='zh_TW') fail(`${w.id} og:locale must be zh_TW`);
  const jsonLdBlocks=[...html.matchAll(/<script[^>]+type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi)].map(m=>m[1]);
  let bookLd=null;
  for(const raw of jsonLdBlocks){try{const v=JSON.parse(raw); if(v?.['@type']==='Book') bookLd=v;}catch{}}
  if(!bookLd) fail(`${w.id} missing valid Book JSON-LD`);
  else {
    if(bookLd.author?.name!=='喵叔') fail(`${w.id} Book JSON-LD author must be 喵叔`);
    if(bookLd.inLanguage!=='zh-Hant') fail(`${w.id} Book JSON-LD language must be zh-Hant`);
    if(bookLd.url!==canonical) fail(`${w.id} Book JSON-LD URL does not match canonical`);
    if(!bookLd.description || bookLd.description.length<25) fail(`${w.id} Book JSON-LD description is missing or too thin`);
  }
  const chapterIds=[...html.matchAll(/<section[^>]+class=["'][^"']*chapter[^"']*["'][^>]+id=["'](chapter-\d+)["']/gi)].map(m=>m[1]);
  const chapterSet=new Set(chapterIds);
  if(chapterIds.length===0) fail(`${w.id} has no chapter sections`);
  if(chapterSet.size!==chapterIds.length) fail(`${w.id} has duplicate chapter ids`);
  const nums=chapterIds.map(id=>Number(id.slice(8)));
  for(let i=1;i<=nums.length;i++) if(!nums.includes(i)) fail(`${w.id} chapter sequence missing chapter-${i}`);
  const tocStart=html.search(/<section[^>]+id=["']toc["']/i);
  const textStart=html.search(/<div[^>]+id=["']text["']/i);
  const tocBlock=tocStart>=0 ? html.slice(tocStart,textStart>tocStart?textStart:html.length) : '';
  const tocIds=[...new Set([...tocBlock.matchAll(/href=["']#(chapter-\d+)["']/gi)].map(m=>m[1]))];
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
if(!process.exitCode) console.log(`Content contract OK: ${novels.length} published novels synchronized across registry, homepage, search, sitemap, canonical URLs, TOC and chapter anchors.`);
if(process.exitCode) process.exit(process.exitCode);
