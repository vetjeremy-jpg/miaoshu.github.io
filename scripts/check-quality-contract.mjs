import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const errors=[], warnings=[];
const exists=p=>fs.existsSync(path.join(ROOT,p.replace(/^\//,'')));
const text=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const htmlFiles=[];
const walk=d=>{for(const e of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const p=path.posix.join(d,e.name);if(['.git','node_modules','playwright-report','test-results'].some(x=>p===x||p.startsWith(x+'/')))continue;if(e.isDirectory())walk(p);else if(/\.html$/i.test(e.name))htmlFiles.push(p)}};
walk('.');

for(const file of htmlFiles){
 const s=text(file);
 for(const m of s.matchAll(/(?:href|src)=["']([^"'#]+)["']/gi)){
  const u=m[1];
  if(/^(?:https?:|mailto:|tel:|data:|javascript:|about:|blob:|\/\/)/i.test(u))continue;
  let clean=u.split(/[?#]/)[0]; if(!clean)continue; try{clean=decodeURIComponent(clean)}catch{}
  const base=path.posix.dirname(file);
  let target=clean.startsWith('/miaoshu.github.io/')?clean.slice('/miaoshu.github.io/'.length):path.posix.normalize(path.posix.join(base,clean));
  target=target.replace(/^\.\//,'');
  if(target.endsWith('/'))target+='index.html';
  if(!exists(target) && !exists(target+'.html') && !exists(path.posix.join(target,'index.html')))errors.push(`${file}: missing local resource ${u}`);
 }
 if(!/<title>[^<]+<\/title>/i.test(s))errors.push(`${file}: missing non-empty <title>`);
 if(!/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+/i.test(s) && file==='index.html')errors.push('index.html: missing meta description');
}

const manifest=JSON.parse(text('site.webmanifest'));
for(const key of ['name','short_name','start_url','scope','display','icons'])if(!manifest[key])errors.push(`site.webmanifest: missing ${key}`);
for(const icon of manifest.icons||[])if(!exists(icon.src.replace(/^\/miaoshu.github.io\//,'')))errors.push(`site.webmanifest: missing icon ${icon.src}`);
if(manifest.start_url!=='/miaoshu.github.io/'||manifest.scope!=='/miaoshu.github.io/')errors.push('site.webmanifest: start_url/scope must stay inside GitHub Pages project scope');

for(const required of ['sw.js','robots.txt','sitemap.xml','apple-touch-icon.png'])if(!exists(required))errors.push(`missing required root asset: ${required}`);

const sitemap=text('sitemap.xml');
if(!sitemap.includes('https://vetjeremy-jpg.github.io/miaoshu.github.io/'))errors.push('sitemap.xml: canonical site root missing');

const ASSET_BASELINE = new Map([
  ['gallery/ChatGPT Image 2026年9月3日 下午04_34_30.png', 2635000],
  ['gallery/ChatGPT Image 2026年9月3日 下午04_36_27.png', 2731386],
  ['gallery/ChatGPT Image 2026年9月3日 下午04_43_25.png', 2720000],
  ['logo.PNG', 1910000],
  ['logo.png', 2400000]
]);
const LARGE_ASSET_LIMIT=1024*1024;
const large=[];
const scan=d=>{for(const e of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const p=path.posix.join(d,e.name);if(['.git','node_modules','playwright-report','test-results'].some(x=>p===x||p.startsWith(x+'/')))continue;if(e.isDirectory())scan(p);else{const n=fs.statSync(path.join(ROOT,p)).size;if(n>1024*1024)large.push([p,n])}}};
scan('.');
for(const [p,n] of large){
 const baseline=ASSET_BASELINE.get(p);
 if(baseline===undefined)errors.push(`new large asset exceeds 1 MiB budget: ${p} ${(n/1024/1024).toFixed(2)} MiB`);
 else if(n>baseline)errors.push(`existing large asset regressed: ${p} ${n} > baseline ${baseline} bytes`);
 else warnings.push(`known performance debt: ${p} ${(n/1024/1024).toFixed(2)} MiB (must not grow)`);
}
for(const p of ASSET_BASELINE.keys())if(!exists(p))warnings.push(`performance debt removed or renamed: ${p}; update baseline after verification`);
for(const p of ASSET_BASELINE.keys()){
 if(!exists(p)) continue;
 const referenced=htmlFiles.some(file=>text(file).includes(p)||text(file).includes(encodeURI(p)));
 if(!referenced) warnings.push(`known large asset appears unreferenced by HTML: ${p}; verify CSS/JS references before removal`);
}

console.log(`Quality contract: ${htmlFiles.length} HTML files checked`);
warnings.forEach(x=>console.warn('WARN '+x));
if(errors.length){errors.forEach(x=>console.error('ERROR '+x));console.error(`Quality contract failed with ${errors.length} error(s)`);process.exit(1)}
console.log('Quality contract passed');
