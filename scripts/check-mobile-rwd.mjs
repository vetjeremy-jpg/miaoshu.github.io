import fs from 'node:fs';

const fail = [];
const read = p => fs.readFileSync(p,'utf8');
const home = read('index.html');
const mobile = read('assets/mobile-rwd-final.css');
const homepageMobile = read('assets/homepage-mobile.css');
const moonlitV2 = read('assets/moonlit-v2.js');
const reader = read('books/reader.css');
const manifest = JSON.parse(read('site.webmanifest'));
const mainPages = ['index.html','gallery/index.html','videos/index.html','posts/index.html','about/index.html','book.html','bookmarks/index.html','books/alien-origin-sands/index.html','books/canzhao-xie-longqi/index.html','books/chenshui-de-huhuan/index.html','books/fengmen-yetan/index.html','books/fushengsuiyue/index.html','books/hiiro-setsugetsusho/index.html','books/jiankangjie-tingquanyin/index.html','books/liangzhongtiankong-part2/index.html','books/liangzhongtiankong/index.html','books/wuxiyue/index.html','newsletter/index.html','posts/taipei-grand-trail-20260928/index.html','search/index.html','start/index.html','works/index.html','books/_template/index.html'].map(p => [p, read(p)]);

function must(name, ok){ if(!ok) fail.push(name); }

must('homepage loads mobile-rwd-final.css', /mobile-rwd-final\.css/.test(home));
must('final mobile CSS is loaded before </head>', /mobile-rwd-final\.css[^>]*>\s*<\/head>/s.test(home));
must('homepage has one Apple touch icon declaration', (home.match(/rel="apple-touch-icon"[^>]*apple-touch-icon\.png/g) || []).length === 1);
must('homepage has one Moonlit theme-color', (home.match(/<meta\s+name=["']theme-color["'][^>]*>/gi) || []).length === 1 && /<meta\s+name=["']theme-color["']\s+content=["']#071521["']\s*>/i.test(home));
must('manifest start_url stays on Pages subpath', manifest.start_url === '/miaoshu.github.io/');
must('manifest scope stays on Pages subpath', manifest.scope === '/miaoshu.github.io/');
must('manifest uses standalone display', manifest.display === 'standalone');
must('manifest keeps Moonlit theme color', manifest.theme_color === '#071521' && manifest.background_color === '#071521');
must('manifest declares 192px icon', manifest.icons?.some(i => i.src === '/miaoshu.github.io/assets/icons/icon-192.png' && i.sizes === '192x192'));
must('manifest declares 512px icon', manifest.icons?.some(i => i.src === '/miaoshu.github.io/assets/icons/icon-512.png' && i.sizes === '512x512'));
must('192px icon file exists', fs.existsSync('assets/icons/icon-192.png'));
must('512px icon file exists', fs.existsSync('assets/icons/icon-512.png'));
must('Apple touch icon file exists', fs.existsSync('apple-touch-icon.png'));
const primaryNavPages = ['index.html','gallery/index.html','posts/index.html','videos/index.html','about/index.html'].map(p => [p, read(p)]);
for (const [page, html] of primaryNavPages) {
 for (const label of ['首頁','小說','攝影館','札記','影片','關於喵叔','搜尋創作']) {
  must(page+' primary nav has '+label, html.includes(label));
 }
}
const expectedCurrentNav = new Map([
 ['index.html','首頁'],['gallery/index.html','攝影館'],['posts/index.html','札記'],
 ['videos/index.html','影片'],['about/index.html','關於喵叔']
]);
for (const [page, label] of expectedCurrentNav) {
 const html = read(page);
 const current = [...html.matchAll(/<a\b[^>]*aria-current=["']page["'][^>]*>([\s\S]*?)<\/a>/gi)]
   .map(m => m[1].replace(/<[^>]+>/g,'').trim());
 must(page+' has exactly one current nav item: '+label, current.length === 1 && current[0] === label);
}
must('homepage #book switches current nav to novel', /location\.hash==="#book"[\s\S]*home\?\.removeAttribute\("aria-current"\)[\s\S]*book\.setAttribute\("aria-current","page"\)/.test(moonlitV2));
must('homepage without #book restores current nav to home', /book\?\.removeAttribute\("aria-current"\)[\s\S]*home\?\.setAttribute\("aria-current","page"\)/.test(moonlitV2));
must('current mobile nav item has highlight styling', /a\[aria-current="page"\][\s\S]*color:#f1d79a/.test(mobile));
function linkTags(html){ return html.match(/<link\b[^>]*>/gi) || []; }
function linkCount(html, rel, file){
 return linkTags(html).filter(tag => {
  const normalized = tag.toLowerCase();
  return (normalized.includes('rel="'+rel.toLowerCase()+'"') || normalized.includes("rel='"+rel.toLowerCase()+"'")) &&
   normalized.includes(file.toLowerCase());
 }).length;
}
for (const [page, html] of mainPages) {
 must(page+' has one favicon', linkCount(html, 'icon', 'favicon.webp') === 1);
 must(page+' has one Apple touch icon', linkCount(html, 'apple-touch-icon', 'apple-touch-icon.png') === 1);
 must(page+' loads manifest', linkCount(html, 'manifest', 'site.webmanifest') === 1);
}
must('430px breakpoint exists', /max-width:\s*430px/.test(mobile));
must('320px-class safety breakpoint exists', /max-width:\s*340px/.test(mobile));
must('mobile navigation has 44px touch target', /navlinks a[^}]*min-height:\s*44px/s.test(mobile));
must('mobile header respects safe areas', /safe-area-inset-left/.test(mobile) && /safe-area-inset-right/.test(mobile));
must('mobile navigation scrolls horizontally', /navlinks[^}]*overflow-x:auto/s.test(mobile));
must('mobile navigation hints horizontal overflow', /mask-image:linear-gradient\(90deg/.test(mobile));
must('mobile nav resets on page entry', /querySelectorAll\("\.navlinks,\.top nav"\)[\s\S]*scrollLeft=0[\s\S]*pageshow/.test(moonlitV2));
must('homepage creator links keep 44px touch target', /\.creator-copy a\{[^}]*min-height:\s*44px/.test(homepageMobile));
must('homepage tonight links keep 44px touch target', /\.tonight-grid article a\{[^}]*min-height:\s*44px/.test(homepageMobile));
must('homepage reading-list link keeps 44px touch target', /\.shelf-heading>a\{[^}]*min-height:\s*44px/.test(homepageMobile));
must('homepage mobile does not redefine bookshelf gap', !/\.novels-grid\{[^}]*gap:/s.test(homepageMobile));
must('homepage mobile does not redefine bookshelf margin', !/\.novels-grid\{[^}]*margin:/s.test(homepageMobile));
must('homepage mobile does not redefine bookshelf padding', !/\.novels-grid\{[^}]*padding:/s.test(homepageMobile));
must('bookshelf rails are forced visible on mobile', /bookshelf-scene::before[\s\S]*visibility:visible!important/.test(mobile));
must('books row scrolls horizontally', /#book \.novels-grid[\s\S]*overflow-x:auto!important/.test(mobile));
must('mobile media never exceeds viewport', /img,video,iframe,svg,canvas\{max-width:100%;height:auto\}/.test(mobile));
must('reader has 430px pass', /H1 mobile RWD final reader pass[\s\S]*max-width:430px/.test(reader));
must('reader chapter navigation wraps', /\.chapter-nav\{flex-wrap:wrap\}/.test(reader));
must('reader search input fits viewport', /\.chapter-search input\{width:100%\}/.test(reader));
must('reader media stays within viewport', /img,video,iframe,svg,canvas\{max-width:100%;height:auto\}/.test(reader));

if(fail.length){
 console.error('Moonlit mobile RWD contract failed:');
 for(const item of fail) console.error(' - '+item);
 process.exit(1);
}
console.log('Moonlit mobile RWD contract: PASS');
