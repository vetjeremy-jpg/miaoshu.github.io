import fs from 'node:fs';
import assert from 'node:assert/strict';

const root='/miaoshu.github.io/';
const manifest=JSON.parse(fs.readFileSync('site.webmanifest','utf8'));
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const failures=[];
const check=(label,fn)=>{try{fn();console.log('PASS '+label)}catch(error){failures.push(label+': '+error.message);console.error('FAIL '+label+': '+error.message)}};

check('identity, start and scope are consistent',()=>{
 assert.equal(manifest.id,root);
 assert.equal(manifest.start_url,root);
 assert.equal(manifest.scope,root);
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.name,'喵叔 Moonlit Stories');
});
check('manifest and iOS metadata are present',()=>{
 assert.match(html,/<link\s+rel="manifest"\s+href="\/miaoshu\.github\.io\/site\.webmanifest"/);
 assert.match(html,/<meta\s+name="apple-mobile-web-app-capable"\s+content="yes"/);
 assert.match(html,/<link\s+rel="apple-touch-icon"\s+sizes="180x180"\s+href="\/miaoshu\.github\.io\/apple-touch-icon\.png"/);
});
check('icon paths exist and are valid PNG dimensions',()=>{
 const icons=[...manifest.icons,{src:root+'apple-touch-icon.png',sizes:'180x180'}];
 for(const icon of icons){
  assert.ok(icon.src.startsWith(root),'icon must remain in app scope');
  const file=icon.src.slice(root.length);
  const bytes=fs.readFileSync(file);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','invalid PNG: '+file);
  const expected=Number(icon.sizes.split('x')[0]);
  assert.equal(bytes.readUInt32BE(16),expected,'wrong icon width: '+file);
  assert.equal(bytes.readUInt32BE(20),expected,'wrong icon height: '+file);
 }
});
check('shortcuts remain inside app scope',()=>{
 for(const item of manifest.shortcuts||[]){
  assert.ok(item.name,'shortcut must have name');
  assert.ok(item.url.startsWith(root),'shortcut outside app scope: '+item.url);
 }
});
check('service worker keeps network-first HTML and scoped caching',()=>{
 assert.match(sw,/const SCOPE=['"]\/miaoshu\.github\.io\/['"]/);
 assert.match(sw,/req\.mode===['"]navigate['"]/);
 assert.match(sw,/fetch\(req\)/);
 assert.match(sw,/self\.skipWaiting\(\)/);
 assert.match(sw,/self\.clients\.claim\(\)/);
});
if(failures.length){console.error(failures.length+' PWA contract checks failed');process.exitCode=1}
else console.log('All PWA install contracts passed');
