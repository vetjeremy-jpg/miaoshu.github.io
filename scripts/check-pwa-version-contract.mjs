import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const sw=read('sw.js');
const html=read('index.html');
const errors=[];
const shellMatch=sw.match(/const CACHE=['\"]([^'\"]+)['\"]/);
const pagesMatch=sw.match(/const PAGES=['\"]([^'\"]+)['\"]/);
if(!shellMatch) errors.push('sw.js: shell cache version constant is missing');
if(!pagesMatch) errors.push('sw.js: page cache version constant is missing');
const shellBlock=(sw.match(/const SHELL=\[([\s\S]*?)\];/)||[])[1]||'';
const versioned=[...shellBlock.matchAll(/SCOPE\+['\"]([^'\"]+\?v=[^'\"]+)['\"]/g)].map(m=>m[1]);
if(versioned.length<3) errors.push('sw.js: critical shell must keep explicit versioned CSS/JS assets');
for(const asset of versioned){
 const forms=[asset,'./'+asset,'/miaoshu.github.io/'+asset];
 if(!forms.some(x=>html.includes(x))) errors.push('index.html and sw.js disagree on critical asset version: '+asset);
}
if(!/req\.mode===['\"]navigate['\"]/.test(sw)||!/fetch\(req\)/.test(sw)) errors.push('sw.js: navigation must remain network-first');
if(!/skipWaiting\(\)/.test(sw)||!/clients\.claim\(\)/.test(sw)) errors.push('sw.js: lifecycle takeover contract missing');
if(!/moonlit-shell-v\d+/.test(shellMatch?.[1]||'')) errors.push('sw.js: shell cache name must carry a numeric generation');
if(!/moonlit-pages-v\d+/.test(pagesMatch?.[1]||'')) errors.push('sw.js: page cache name must carry a numeric generation');
if(errors.length){errors.forEach(e=>console.error('ERROR '+e));process.exit(1)}
console.log('PWA version contract passed: '+versioned.length+' critical versioned shell assets agree with index.html');
