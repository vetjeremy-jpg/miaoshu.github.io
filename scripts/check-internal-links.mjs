import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, normalize, posix } from 'node:path';

const ROOT=process.cwd();
const SKIP_DIRS=new Set(['.git','node_modules','playwright-report','test-results','coverage']);
const htmlFiles=[];
function walk(dir=''){
 for(const name of readdirSync(join(ROOT,dir))){
  if(SKIP_DIRS.has(name)) continue;
  const rel=dir?posix.join(dir,name):name;
  const abs=join(ROOT,rel);
  if(statSync(abs).isDirectory()) walk(rel);
  else if(name.endsWith('.html')) htmlFiles.push(rel);
 }
}
walk();

const failures=[];
const attrs=/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
function resolveLocal(page,raw){
 const v=raw.trim();
 if(!v || v.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|blob:|javascript:|about:)/i.test(v) || v.startsWith('//')) return null;
 let clean=v.split('#')[0].split('?')[0];
 try{ clean=decodeURIComponent(clean); }catch{}
 if(clean.startsWith('/miaoshu.github.io/')) clean=clean.slice('/miaoshu.github.io/'.length);
 else if(clean.startsWith('/')) clean=clean.slice(1);
 else clean=posix.normalize(posix.join(posix.dirname(page),clean));
 clean=clean.replace(/^\.\//,'');
 return clean;
}
function existsTarget(rel){
 const abs=join(ROOT,normalize(rel));
 if(existsSync(abs) && statSync(abs).isFile()) return true;
 if(existsSync(abs) && statSync(abs).isDirectory() && existsSync(join(abs,'index.html'))) return true;
 if(!posix.extname(rel) && existsSync(join(abs,'index.html'))) return true;
 return false;
}
for(const page of htmlFiles){
 const html=readFileSync(join(ROOT,page),'utf8');
 let m;
 while((m=attrs.exec(html))){
  const target=resolveLocal(page,m[1]);
  if(target!==null && !existsTarget(target)) failures.push(`${page} -> ${m[1]}`);
 }
}
if(failures.length){
 console.error('Broken internal references:\n'+failures.map(x=>' - '+x).join('\n'));
 process.exit(1);
}
console.log(`Internal links/assets OK across ${htmlFiles.length} HTML files.`);

// Validate document fragments too, including the explicitly registered dynamic anchors.
const base='https://vetjeremy-jpg.github.io/miaoshu.github.io/';
const documents=new Map(htmlFiles.map(path=>[path,readFileSync(join(ROOT,path),'utf8')]));
const ids=new Map([...documents].map(([path,html])=>[path,new Set([...html.matchAll(/\b(?:id|name)\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]))]));
const albums=JSON.parse(readFileSync(join(ROOT,'data/degoo-gallery-albums.json'),'utf8')).albums;
const missing=[];
for(const [page,html] of documents){for(const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)){
 let url;try{url=new URL(match[1],base+page)}catch{continue}
 if(url.origin!==new URL(base).origin||!url.pathname.startsWith('/miaoshu.github.io/')||!url.hash)continue;
 let path=decodeURIComponent(url.pathname.slice('/miaoshu.github.io/'.length));if(path.endsWith('/'))path+='index.html';
 if(!documents.has(path))continue;
 let id;try{id=decodeURIComponent(url.hash.slice(1))}catch{missing.push(`${page} -> ${match[1]} (invalid fragment)`);continue}
 if(ids.get(path).has(id))continue;
 const target=documents.get(path);
 if(id==='audiobook-player'&&target.includes('reader-audio-fallback.js'))continue;
 if(path==='gallery/index.html'&&target.includes('degoo-gallery-albums.js')&&albums.some(a=>id==='degoo-'+a.id))continue;
 const comic=id.match(/^page-(\d+)$/);if(path==='books/jiankangjie-tingquanyin/comic/index.html'&&comic&&Number(comic[1])>=1&&Number(comic[1])<=39)continue;
 missing.push(`${page} -> ${match[1]}`);
}}
if(missing.length){console.error('Broken document anchors:\n'+missing.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('Internal HTML anchors OK, including registered dynamic sections.');
