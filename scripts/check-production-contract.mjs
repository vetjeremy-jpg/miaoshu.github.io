import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const source=fs.readFileSync(path.join(ROOT,'scripts/check-production-smoke.mjs'),'utf8');
const errors=[];
const refs=[...source.matchAll(/file:'\.\.\/([^']+)'/g)].map(m=>m[1]);
for(const rel of refs){
  if(!fs.existsSync(path.join(ROOT,rel))) errors.push('production smoke references missing repository file: '+rel);
}
for(const rel of ['robots.txt','sitemap.xml','site.webmanifest','sw.js','index.html']){
  if(!fs.existsSync(path.join(ROOT,rel))) errors.push('production smoke prerequisite missing: '+rel);
}
if(new Set(refs).size!==refs.length) errors.push('production smoke contains duplicate local route fingerprints');
if(errors.length){
  errors.forEach(e=>console.error('ERROR '+e));
  process.exit(1);
}
console.log('Production smoke contract: '+refs.length+' local route files verified');
