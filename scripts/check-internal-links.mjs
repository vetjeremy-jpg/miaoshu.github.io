import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, normalize, posix } from 'node:path';

const ROOT=process.cwd();
const SKIP_DIRS=new Set(['.git','node_modules']);
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
 if(!v || v.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(v) || v.startsWith('//')) return null;
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
