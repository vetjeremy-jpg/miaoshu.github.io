import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root=process.cwd();
const base='https://vetjeremy-jpg.github.io/miaoshu.github.io/';
const sitemap=readFileSync(join(root,'sitemap.xml'),'utf8');
const robots=readFileSync(join(root,'robots.txt'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const fail=[];
const must=(ok,msg)=>{if(!ok)fail.push(msg)};

must(urls.length>0,'sitemap contains URLs');
must(new Set(urls).size===urls.length,'sitemap has no duplicate URLs');
must(robots.includes('Sitemap: '+base+'sitemap.xml'),'robots.txt points to canonical sitemap');

const booksDir=join(root,'books');
const novels=readdirSync(booksDir,{withFileTypes:true})
 .filter(e=>e.isDirectory()&&!e.name.startsWith('_')&&existsSync(join(booksDir,e.name,'index.html')))
 .map(e=>base+'books/'+e.name+'/');
for(const url of novels) must(urls.includes(url),'formal novel missing from sitemap: '+url);

for(const url of urls){
 must(url.startsWith(base),'non-canonical sitemap URL: '+url);
 if(!url.startsWith(base)) continue;
 const rel=url.slice(base.length).replace(/\/$/,'');
 const target=rel?join(root,rel):root;
 const ok=existsSync(target)&&(statSync(target).isDirectory()?existsSync(join(target,'index.html')):true);
 must(ok,'sitemap URL has no matching page: '+url);
}
if(fail.length){console.error('SEO contract failed:\n'+fail.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log(`SEO sitemap contract OK: ${urls.length} URLs, ${novels.length} formal novels.`);
