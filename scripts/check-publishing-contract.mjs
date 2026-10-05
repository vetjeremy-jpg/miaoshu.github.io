import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const errors=[], warnings=[];
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const site='https://vetjeremy-jpg.github.io/miaoshu.github.io/';
const sitemap=read('sitemap.xml');
const discovery=[read('index.html'),read('works/index.html')].join('\n');

const bookDirs=fs.readdirSync(path.join(ROOT,'books'),{withFileTypes:true})
  .filter(e=>e.isDirectory()&&!e.name.startsWith('_')&&exists(`books/${e.name}/index.html`))
  .map(e=>e.name);

for(const slug of bookDirs){
  const canonical=site+`books/${slug}/`;
  if(!sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`novel missing from sitemap: books/${slug}/`);
  const needles=[`books/${slug}/`,`books/${slug}/index.html`];
  if(!needles.some(n=>discovery.includes(n))) errors.push(`novel has no homepage/works discovery link: books/${slug}/`);
}

const postDirs=fs.readdirSync(path.join(ROOT,'posts'),{withFileTypes:true})
  .filter(e=>e.isDirectory()&&!e.name.startsWith('_')&&e.name!=='files'&&exists(`posts/${e.name}/index.html`))
  .map(e=>e.name);
const postsIndex=read('posts/index.html');
for(const slug of postDirs){
  const canonical=site+`posts/${slug}/`;
  if(!sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`post missing from sitemap: posts/${slug}/`);
  if(!postsIndex.includes(`${slug}/`)&&!postsIndex.includes(`${slug}/index.html`)) errors.push(`post missing from posts index: posts/${slug}/`);
}

const publicPages=['index.html','gallery/index.html','posts/index.html','videos/index.html','about/index.html','works/index.html',
  ...bookDirs.map(s=>`books/${s}/index.html`),...postDirs.map(s=>`posts/${s}/index.html`)];
for(const file of publicPages){
  const html=read(file);
  for(const m of html.matchAll(/<img\b([^>]*)>/gi)){
    const attrs=m[1];
    if(!/\balt\s*=\s*["'][^"']*["']/i.test(attrs)) errors.push(`${file}: image missing alt attribute`);
    const src=attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]||'';
    const isLocal=src && !/^(?:https?:|data:|blob:|\/\/)/i.test(src);
    const isBrandLogo=/(?:^|\/)logo\.(?:webp|png|jpe?g|svg)(?:[?#]|$)/i.test(src);
    const before=html.slice(Math.max(0,m.index-240),m.index);
    const isHeroContext=/<(?:header|section)\b[^>]*class=["'][^"']*hero[^"']*["'][^>]*>[\s\S]*$/i.test(before);
    const isCritical=isBrandLogo||isHeroContext||/\b(?:fetchpriority\s*=\s*["']high["']|class\s*=\s*["'][^"']*(?:hero|logo)[^"']*["'])/i.test(attrs);
    if(isHeroContext && /\bloading\s*=\s*["']lazy["']/i.test(attrs)) errors.push(`${file}: hero/LCP candidate must not be lazy-loaded: ${src}`);
    if(isLocal && !isCritical && !/\bloading\s*=\s*["']lazy["']/i.test(attrs)) warnings.push(`${file}: local non-critical image should use loading="lazy": ${src}`);
    if(isLocal && !isBrandLogo && !/\bwidth\s*=\s*["']?\d+/i.test(attrs) && !/\bheight\s*=\s*["']?\d+/i.test(attrs)) warnings.push(`${file}: local image should declare intrinsic width/height where practical: ${src}`);
  }
}

console.log(`Publishing contract: ${bookDirs.length} novels, ${postDirs.length} posts, ${publicPages.length} public pages checked`);
warnings.forEach(e=>console.warn('WARN '+e));
if(errors.length){
  errors.forEach(e=>console.error('ERROR '+e));
  console.error(`Publishing contract failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log('Publishing contract passed');
