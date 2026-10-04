import { readFile } from 'node:fs/promises';

const BASE='https://vetjeremy-jpg.github.io/miaoshu.github.io/';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function get(path, attempts=4){
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

const localHome=await readFile(new URL('../index.html',import.meta.url),'utf8');
const expectedRuntime=localHome.match(/assets\/moonlit-v2\.js\?v=([^"'\s<]+)/)?.[1];
must('repository homepage must expose a versioned Moonlit runtime',Boolean(expectedRuntime));

const home=await (await get('')).text();
const liveRuntime=home.match(/assets\/moonlit-v2\.js\?v=([^"'\s<]+)/)?.[1];
must(`production runtime must match repository fingerprint (expected ${expectedRuntime}, found ${liveRuntime||'missing'})`,liveRuntime===expectedRuntime);
const nav=home.match(/<nav class="navlinks"[^>]*>([\s\S]*?)<\/nav>/)?.[1]||'';
const labels=[...nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map(m=>m[1].replace(/<[^>]+>/g,'').trim());
const expected=['首頁','小說','攝影','作品星圖','札記','影片','關於','月光來信','⌕ 搜尋'];
must('production homepage must expose the exact nine-entry navigation',JSON.stringify(labels)===JSON.stringify(expected));
must('production homepage must link its manifest',home.includes('href="/miaoshu.github.io/site.webmanifest"'));

for(const path of ['videos/','works/','search/','site.webmanifest','sw.js','apple-touch-icon.png','assets/icons/icon-192.png','assets/icons/icon-512.png']){
  await get(path);
}
const liveSw=await (await get('sw.js')).text();
must('production service worker must precache the canonical runtime fingerprint',liveSw.includes(`moonlit-v2.js?v=${expectedRuntime}`));

const manifest=await (await get('site.webmanifest')).json();
must('manifest start_url must stay inside Moonlit scope',manifest.start_url==='/miaoshu.github.io/');
must('manifest must keep 192 and 512 icons',Array.isArray(manifest.icons)&&['192x192','512x512'].every(size=>manifest.icons.some(icon=>icon.sizes===size)));

console.log('Moonlit production smoke: PASS');
