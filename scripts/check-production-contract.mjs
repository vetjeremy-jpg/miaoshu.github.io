import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const smoke=fs.readFileSync(path.join(ROOT,'scripts/check-production-smoke.mjs'),'utf8');
const errors=[];
const sitemap=fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
const novels=[...sitemap.matchAll(/<loc>https:\/\/vetjeremy-jpg\.github\.io\/miaoshu\.github\.io\/(books\/[^<]+\/)<\/loc>/g)].map(m=>m[1]);
for(const rel of novels){
  if(!fs.existsSync(path.join(ROOT,rel,'index.html'))) errors.push('sitemap novel missing local page: '+rel);
}
for(const rel of ['index.html','newsletter/index.html','robots.txt','sitemap.xml','site.webmanifest','sw.js']){
  if(!fs.existsSync(path.join(ROOT,rel))) errors.push('production smoke prerequisite missing: '+rel);
}
for(const token of ['novelPaths','newsletter/','robots.txt','sitemap.xml']){
  if(!smoke.includes(token)) errors.push('production smoke lost required coverage token: '+token);
}
if(!novels.length) errors.push('production smoke contract found no formal novels in sitemap');
if(errors.length){errors.forEach(e=>console.error('ERROR '+e));process.exit(1)}
console.log('Production smoke contract: '+novels.length+' sitemap novels and core prerequisites verified');
