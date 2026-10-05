import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const BASE='https://vetjeremy-jpg.github.io/miaoshu.github.io/';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function get(path, attempts=6){
  let last;
  for(let i=0;i<attempts;i++){
    try{
      const res=await fetch(new URL(path,BASE),{redirect:'follow',headers:{'cache-control':'no-cache'}});
      if(res.ok)return res;
      last=new Error(`${path}: HTTP ${res.status}`);
    }catch(err){last=err;}
    if(i<attempts-1)await sleep(5000*(i+1));
  }
  throw last;
}
const must=(label,ok)=>{if(!ok)throw new Error(label);};
const contentType=res=>(res.headers.get('content-type')||'').toLowerCase();
const mustType=(path,res,pattern)=>must(`${path} must return expected Content-Type, found ${contentType(res)||'missing'}`,pattern.test(contentType(res)));
const headerSnapshot=(label,res)=>({
  label,
  contentType:contentType(res)||'missing',
  cacheControl:res.headers.get('cache-control')||'missing',
  age:res.headers.get('age')||'missing',
  etag:res.headers.get('etag')||'missing',
  lastModified:res.headers.get('last-modified')||'missing'
});
const diagnostics=[];
const normalizeText=s=>s.replace(/\r\n/g,'\n');
const sha256=s=>createHash('sha256').update(normalizeText(s),'utf8').digest('hex');


const localHome=await readFile(new URL('../index.html',import.meta.url),'utf8');
const localSw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
const localManifest=JSON.parse(await readFile(new URL('../site.webmanifest',import.meta.url),'utf8'));
const swValue=(source,name)=>source.match(new RegExp(`const ${name}='([^']+)'`))?.[1];
const expectedShell=swValue(localSw,'CACHE');
const expectedPages=swValue(localSw,'PAGES');
const expectedScope=swValue(localSw,'SCOPE');
must('repository service worker must expose shell, page and scope fingerprints',Boolean(expectedShell&&expectedPages&&expectedScope));
const expectedHomeHash=sha256(localHome);
const expectedRuntime=localHome.match(/assets\/moonlit-v2\.js\?v=([^"'\s<]+)/)?.[1];
must('repository homepage must expose a versioned Moonlit runtime',Boolean(expectedRuntime));

async function waitForRuntime(attempts=6){
  let home='',liveRuntime;
  for(let i=0;i<attempts;i++){
    const homeRes=await get('');
    diagnostics.push(headerSnapshot('homepage',homeRes));
    home=await homeRes.text();
    liveRuntime=home.match(/assets\/moonlit-v2\.js\?v=([^"'\s<]+)/)?.[1];
    if(liveRuntime===expectedRuntime)return {home,liveRuntime};
    if(i<attempts-1){
      console.log(`Production propagation pending: expected runtime ${expectedRuntime}, found ${liveRuntime||'missing'}; retry ${i+1}/${attempts-1}`);
      await sleep(10000);
    }
  }
  throw new Error(`production runtime must match repository fingerprint (expected ${expectedRuntime}, found ${liveRuntime||'missing'})`);
}
const {home,liveRuntime}=await waitForRuntime(12);
const liveHomeHash=sha256(home);
must(`production homepage content fingerprint must match repository (expected ${expectedHomeHash.slice(0,12)}, found ${liveHomeHash.slice(0,12)})`,liveHomeHash===expectedHomeHash);
const nav=home.match(/<nav class="navlinks"[^>]*>([\s\S]*?)<\/nav>/)?.[1]||'';
const labels=[...nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map(m=>m[1].replace(/<[^>]+>/g,'').trim());
const expected=['首頁','小說','攝影','作品星圖','札記','影片','關於','月光來信','⌕ 搜尋'];
must('production homepage must expose the exact nine-entry navigation',JSON.stringify(labels)===JSON.stringify(expected));
must('production homepage must link its manifest',home.includes('href="/miaoshu.github.io/site.webmanifest"'));

const routeFingerprints=[];
const criticalRoutes=[
  {path:'videos/',file:'../videos/index.html'},
  {path:'works/',file:'../works/index.html'},
  {path:'search/',file:'../search/index.html'},
  {path:'gallery/',file:'../gallery/index.html',sentinels:['<h1>喵叔攝影館</h1>','id="degoo-album"','aria-label="攝影作品"']},
  {path:'posts/',file:'../posts/index.html',sentinels:['<h1>寫作札記</h1>','id="journey-timeline"','id="journey-map"']},
  {path:'about/',file:'../about/index.html',sentinels:['<h1>關於喵叔</h1>','about-crescent-gold','aria-label="主選單"']},
  {path:'books/fushengsuiyue/',file:'../books/fushengsuiyue/index.html'},
  {path:'books/liangzhongtiankong/',file:'../books/liangzhongtiankong/index.html'},
  {path:'newsletter/',file:'../newsletter/index.html'}
];
for(const route of criticalRoutes){
  const local=await readFile(new URL(route.file,import.meta.url),'utf8');
  const expectedHash=sha256(local);
  const res=await get(route.path);
  mustType(route.path,res,/text\/html/);
  const live=await res.text();
  const liveHash=sha256(live);
  must(`production ${route.path} content fingerprint must match repository (expected ${expectedHash.slice(0,12)}, found ${liveHash.slice(0,12)})`,liveHash===expectedHash);
  for(const sentinel of route.sentinels||[]){
    must(`repository ${route.path} must retain semantic sentinel: ${sentinel}`,local.includes(sentinel));
    must(`production ${route.path} must retain semantic sentinel: ${sentinel}`,live.includes(sentinel));
  }
  routeFingerprints.push({path:route.path,expected:expectedHash,live:liveHash,match:liveHash===expectedHash,semanticSentinels:(route.sentinels||[]).length});
}
for(const path of ['robots.txt','sitemap.xml']){
  const local=await readFile(new URL('../'+path,import.meta.url),'utf8');
  const res=await get(path);
  mustType(path,res,/text\/(?:plain|xml)|application\/xml/);
  const live=await res.text();
  must(`production ${path} content fingerprint must match repository`,sha256(live)===sha256(local));
}
const manifestRes=await get('site.webmanifest');
diagnostics.push(headerSnapshot('manifest',manifestRes));
mustType('site.webmanifest',manifestRes,/(application\/manifest\+json|application\/json)/);
const swRes=await get('sw.js');
diagnostics.push(headerSnapshot('service-worker',swRes));
mustType('sw.js',swRes,/(javascript|text\/plain)/);
for(const path of ['apple-touch-icon.png','assets/icons/icon-192.png','assets/icons/icon-512.png']){
  const res=await get(path);
  mustType(path,res,/image\/png/);
}
const runtimeRes=await get(`assets/moonlit-v2.js?v=${expectedRuntime}`);
diagnostics.push(headerSnapshot('runtime',runtimeRes));
mustType('canonical Moonlit runtime',runtimeRes,/(javascript|text\/plain)/);
const runtimeBody=await runtimeRes.text();
must('canonical Moonlit runtime must be JavaScript, not an HTML fallback',!/<(?:!doctype|html|head|body)\b/i.test(runtimeBody));
must('canonical Moonlit runtime must retain service worker registration',runtimeBody.includes('serviceWorker.register'));
const liveSw=await swRes.text();
must('production service worker must be JavaScript, not an HTML fallback',!/<(?:!doctype|html|head|body)\b/i.test(liveSw));
must('production service worker must precache the canonical runtime fingerprint',liveSw.includes(`moonlit-v2.js?v=${expectedRuntime}`));
must(`production shell cache must match repository fingerprint (expected ${expectedShell})`,swValue(liveSw,'CACHE')===expectedShell);
must(`production page cache must match repository fingerprint (expected ${expectedPages})`,swValue(liveSw,'PAGES')===expectedPages);
must(`production service-worker scope must match repository fingerprint (expected ${expectedScope})`,swValue(liveSw,'SCOPE')===expectedScope);
for(const asset of ['site.webmanifest','assets/icons/icon-192.png','assets/icons/icon-512.png']) must(`production service worker must retain ${asset} in its managed asset contract`,liveSw.includes(asset));

const manifest=await manifestRes.json();
must('production manifest id must match repository',manifest.id===localManifest.id);
must('production manifest start_url must match repository',manifest.start_url===localManifest.start_url);
must('production manifest scope must match repository',manifest.scope===localManifest.scope);
must('production manifest must remain standalone',manifest.display==='standalone');
must('manifest start_url must stay inside Moonlit scope',manifest.start_url==='/miaoshu.github.io/');
must('manifest must keep 192 and 512 icons',Array.isArray(manifest.icons)&&['192x192','512x512'].every(size=>manifest.icons.some(icon=>icon.sizes===size)));

const report={
  schemaVersion:1,
  checkedAt:new Date().toISOString(),
  provenance:{
    mainSha:process.env.MOONLIT_MAIN_SHA||'local',
    eventName:process.env.MOONLIT_EVENT_NAME||'local',
    actionsRunId:process.env.MOONLIT_ACTIONS_RUN_ID||null,
    actionsRunAttempt:process.env.MOONLIT_ACTIONS_RUN_ATTEMPT||null,
    pagesRunId:process.env.MOONLIT_PAGES_RUN_ID||null,
    pagesRunUrl:process.env.MOONLIT_PAGES_RUN_URL||null
  },
  base:BASE,
  expectedRuntime,
  liveRuntime,
  homepageFingerprint:{expected:expectedHomeHash,live:liveHomeHash,match:liveHomeHash===expectedHomeHash},
  routeFingerprints,
  serviceWorker:{shell:expectedShell,pages:expectedPages,scope:expectedScope},
  resources:diagnostics.slice(-4)
};
await writeFile('production-smoke-report.json',JSON.stringify(report,null,2)+'\n','utf8');
console.log('Moonlit production cache diagnostics:');
for(const item of report.resources) console.log(JSON.stringify(item));
console.log('Moonlit production smoke: PASS');
