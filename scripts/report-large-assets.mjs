import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const LIMIT=1024*1024;
const SKIP=new Set(['.git','node_modules','playwright-report','test-results']);
const SOURCE_EXT=/\.(html|css|js|mjs|json|webmanifest)$/i;
const files=[];
function walk(dir='.'){
  for(const e of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){
    const rel=path.posix.join(dir,e.name).replace(/^\.\//,'');
    if(SKIP.has(e.name)) continue;
    if(e.isDirectory()) walk(rel);
    else files.push(rel);
  }
}
walk();
const sources=files.filter(f=>SOURCE_EXT.test(f)).map(f=>[f,fs.readFileSync(path.join(ROOT,f),'utf8')]);
const isRuntimeSource=f=>!f.startsWith('scripts/')&&!f.startsWith('tests/')&&!f.startsWith('.github/');
const assets=files.map(f=>[f,fs.statSync(path.join(ROOT,f)).size]).filter(([,n])=>n>LIMIT);
const rows=assets.map(([asset,size])=>{
  const base=path.posix.basename(asset);
  const encoded=encodeURI(asset);
  const encodedBase=encodeURI(base);
  const refs=sources.filter(([,text])=>text.includes(asset)||text.includes('/'+asset)||text.includes(base)||text.includes(encoded)||text.includes(encodedBase)).map(([f])=>f);
  const allReferences=[...new Set(refs)].sort();
  const runtimeReferences=allReferences.filter(isRuntimeSource);
  const toolingReferences=allReferences.filter(f=>!isRuntimeSource(f));
  return {asset,size,mebibytes:Number((size/1024/1024).toFixed(2)),runtimeReferences,toolingReferences,unreferenced:runtimeReferences.length===0};
});
console.log('Large asset reference report (>1 MiB)');
for(const r of rows){
  console.log('\n'+r.asset+' — '+r.mebibytes+' MiB');
  console.log(r.runtimeReferences.length?'  runtime refs: '+r.runtimeReferences.join(', '):'  runtime refs: NONE (manual removal review candidate)');
  if(r.toolingReferences.length) console.log('  tooling refs: '+r.toolingReferences.join(', '));
}
fs.mkdirSync(path.join(ROOT,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'artifacts/large-asset-reference-report.json'),JSON.stringify({schemaVersion:1,limitBytes:LIMIT,assetCount:rows.length,assets:rows},null,2)+'\n');
console.log('\nAsset reference report: '+rows.length+' large assets checked; '+rows.filter(r=>r.unreferenced).length+' unreferenced candidate(s).');
