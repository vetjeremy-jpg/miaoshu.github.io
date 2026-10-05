import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const errors=[], warnings=[];
const changed=new Set((process.env.MOONLIT_CHANGED_FILES||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean));
const strictChanged=changed.size>0;
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


const videosHtml=read('videos/index.html');
const videoButtons=[...videosHtml.matchAll(/class=["'][^"']*video-pick[^"']*["'][^>]*data-video=["']([^"']+)["']/g)].map(m=>m[1]);
const videoIds=[...videosHtml.matchAll(/const ids=\[([^\]]+)\]/g)].flatMap(m=>[...m[1].matchAll(/["']([^"']+)["']/g)].map(x=>x[1]));
if(!videoButtons.length) errors.push('videos: no playable video controls found');
if(videoButtons.length!==videoIds.length||videoButtons.some((id,i)=>id!==videoIds[i])) errors.push('videos: playlist data-video order must match player ids[]');
if(!/id=["']youtube-link["'][^>]+href=["']https:\/\/www\.youtube\.com\/watch\?v=/i.test(videosHtml)) errors.push('videos: YouTube player requires a direct external fallback link');
if(/instagram\.com\/reel\//i.test(videosHtml)){
  if(!/<iframe\b[^>]+instagram\.com\/reel\/[^>]+title=["'][^"']+["'][^>]*>/i.test(videosHtml)) errors.push('videos: Instagram embed requires an accessible iframe title');
  if(!/<a\b[^>]+href=["']https:\/\/www\.instagram\.com\/reel\//i.test(videosHtml)) errors.push('videos: Instagram embed requires a direct external fallback link');
}

const galleryHtml=read('gallery/index.html');
const externalGalleryImages=[...galleryHtml.matchAll(/<img\b[^>]+src=["']https?:\/\/[^"']+["'][^>]*>/gi)];
for(const m of externalGalleryImages){
  const before=galleryHtml.slice(Math.max(0,m.index-500),m.index);
  if(!/<a\b[^>]+href=["']https?:\/\/[^"']+["'][^>]*>[\s\S]*$/i.test(before)) errors.push('gallery: externally hosted image must retain a clickable external fallback');
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
    if(isLocal && !isCritical && !/\bloading\s*=\s*["']lazy["']/i.test(attrs)){
      const msg=`${file}: local non-critical image should use loading="lazy": ${src}`;
      if(strictChanged&&changed.has(file)) errors.push(msg); else warnings.push(msg);
    }
    if(isLocal && !isBrandLogo && (!/\bwidth\s*=\s*["']?\d+/i.test(attrs) || !/\bheight\s*=\s*["']?\d+/i.test(attrs))){
      const msg=`${file}: local image should declare both intrinsic width and height where practical: ${src}`;
      if(strictChanged&&changed.has(file)) errors.push(msg); else warnings.push(msg);
    }
  }
}

console.log(`Publishing contract: ${bookDirs.length} novels, ${postDirs.length} posts, ${publicPages.length} public pages checked${strictChanged?`, ${changed.size} changed files under strict media policy`:''}`);
warnings.forEach(e=>console.warn('WARN '+e));
if(errors.length){
  errors.forEach(e=>console.error('ERROR '+e));
  console.error(`Publishing contract failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log('Publishing contract passed');
