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
}
for(const id of cards) if(!ids.has(id)) fail(`homepage book ${id} missing from registry`);
const heroCount=home.match(/<b>(\d+)<\/b> 小說/);
if(!heroCount || Number(heroCount[1])!==novels.length) fail('hero novel count is stale');
const buttonCount=home.match(/查看全部 (\d+) 本小說/);
if(!buttonCount || Number(buttonCount[1])!==novels.length) fail('show-all novel count is stale');
console.log(`Content contract OK: ${novels.length} published novels synchronized across registry, homepage, search, sitemap and canonical URLs.`);
if(process.exitCode) process.exit(process.exitCode);
