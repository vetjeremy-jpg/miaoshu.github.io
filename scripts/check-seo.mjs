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

for(const url of novels){
 const rel=url.slice(base.length);
 const html=readFileSync(join(root,rel,'index.html'),'utf8');
 const expected=url;
 must(/<title>[^<]+<\/title>/i.test(html),'formal novel missing title: '+rel);
 must(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html),'formal novel missing description: '+rel);
 must(html.includes('rel="canonical"') && html.includes('href="'+expected+'"'),'formal novel missing canonical: '+rel);
 must(/property=["']og:title["']/i.test(html),'formal novel missing og:title: '+rel);
 must(/property=["']og:description["']/i.test(html),'formal novel missing og:description: '+rel);
 must(html.includes('property="og:url"') && html.includes('content="'+expected+'"'),'formal novel missing og:url: '+rel);
}


for(const url of urls){
 must(url.startsWith(base),'non-canonical sitemap URL: '+url);
 if(!url.startsWith(base)) continue;
 const rel=url.slice(base.length).replace(/\/$/,'');
 const target=rel?join(root,rel):root;
 const ok=existsSync(target)&&(statSync(target).isDirectory()?existsSync(join(target,'index.html')):true);
 must(ok,'sitemap URL has no matching page: '+url);
}

for(const url of urls){
 if(!url.startsWith(base)) continue;
 const rel=url.slice(base.length).replace(/\/$/,'');
 const file=rel?join(root,rel,'index.html'):join(root,'index.html');
 if(!existsSync(file)) continue;
 const html=readFileSync(file,'utf8');
 const count=re=>(html.match(re)||[]).length;
 must(count(/<title>[^<]+<\/title>/gi)===1,'public page needs one title: '+url);
 must(count(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["'][^>]*>/gi)===1,'public page needs one meta description: '+url);
 must(count(/<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+["'][^>]*>/gi)===1,'public page needs one canonical: '+url);
 must(count(/<meta[^>]+property=["']og:title["'][^>]+content=["'][^"']+["'][^>]*>/gi)===1,'public page needs og:title: '+url);
 must(count(/<meta[^>]+property=["']og:description["'][^>]+content=["'][^"']+["'][^>]*>/gi)===1,'public page needs og:description: '+url);
}

if(fail.length){console.error('SEO contract failed:\n'+fail.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log(`SEO sitemap contract OK: ${urls.length} URLs, ${novels.length} formal novels.`);
