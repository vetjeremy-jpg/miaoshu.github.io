#!/usr/bin/env node
import fs from 'node:fs';

const budgets={
  'assets/moonlight.css':{hero:9,topbar:12,navlinks:2,panel:4,important:22},
  'assets/homepage-desktop-below-fold.css':{hero:0,topbar:0,navlinks:0,panel:2,important:10},
};
const patterns={
  hero:/\.hero\b/g,
  topbar:/\.topbar\b/g,
  navlinks:/\.navlinks\b/g,
  panel:/\.panel\b/g,
  important:/!important/g,
};
const errors=[];
// Novel card pseudo-element suppression has one canonical #book owner.
// Legacy hero aliases are retired; `.hero` is the canonical shared hook.
function stripMediaBlocks(css){
  let out='',i=0;
  while(i<css.length){
    const at=css.indexOf('@media',i);
    if(at<0){out+=css.slice(i);break;}
    out+=css.slice(i,at);
    const open=css.indexOf('{',at);
    if(open<0){out+=css.slice(at);break;}
    let depth=1,j=open+1;
    while(j<css.length&&depth){
      if(css[j]==='{')depth++;
      else if(css[j]==='}')depth--;
      j++;
    }
    i=j;
  }
  return out;
}

const readerBase=fs.readFileSync('books/reader.css','utf8');
if(/\.chapter\{scroll-margin-top:105px;background:#0b1a2a/.test(readerBase))errors.push('superseded first-generation Reader chapter theme returned');
if(/\.chapter-body\{max-width:720px/.test(readerBase))errors.push('superseded first-generation Reader body width returned');
if(/\.chapter-body p\{font-size:1em;line-height:2\.15/.test(readerBase))errors.push('superseded first-generation Reader paragraph rhythm returned');
if(/\.chapter\{scroll-margin-top:105px\}/.test(readerBase))errors.push('books reader must defer chapter scroll offset to editorial interiors');
if(/\.chapter-body\{max-width:680px\}/.test(readerBase))errors.push('books reader must defer final chapter-body width to editorial interiors');
if(/\.chapter-body p\{color:#e8e7e3;line-height:2\.12/.test(readerBase))errors.push('books reader must defer final paragraph color and rhythm to editorial interiors');
if(/html\[data-reading-theme="paper"\] body\{background:#eee8dc/.test(readerBase))errors.push('books reader must defer paper body theme to editorial interiors');
if(/html\[data-reading-theme="paper"\] \.chapter-body p\{color:#302b24\}/.test(readerBase))errors.push('books reader must defer paper prose color to editorial interiors');
if(/html\[data-reading-theme="paper"\] :focus-visible\{outline-color:#735a31\}/.test(readerBase))errors.push('books reader must defer paper focus color to editorial interiors');
if(/html\[data-reading-theme="paper"\] \.toc a\{background:#f5efe4/.test(readerBase))errors.push('books reader must defer paper TOC link styling to editorial interiors');
if(/html\[data-reading-theme="paper"\] \.chapter-search input,[\s\S]*?background:#fffaf1/.test(readerBase))errors.push('books reader must defer paper form styling to editorial interiors');
if(/html\[data-reading-theme="paper"\] \.audiobook-actions \.audio-primary\{background:#735a31/.test(readerBase))errors.push('books reader must defer paper audio primary styling to editorial interiors');
if(/html\[data-reading-theme="paper"\] \.panel,[\s\S]*?\.audiobook-launcher\{background:#f8f3e9/.test(readerBase))errors.push('books reader must defer paper panel and chapter surfaces to editorial interiors');
if(/html\[data-reading-theme="paper"\] \.reader-controls button,[\s\S]*?\.audiobook-actions button,[\s\S]*?background:#fbf6ed/.test(readerBase))errors.push('books reader must defer shared paper controls to editorial interiors');
if(/\.chapter-bookmark\[aria-pressed="true"\],[\s\S]*?\.chapter-like\[aria-pressed="true"\]\{background:#dfd2bc/.test(readerBase))errors.push('books reader must defer paper bookmark and like active states to editorial interiors');
if(/html\[data-reading-theme="paper"\] \.hero h1,[\s\S]*?\.audiobook-heading h2\{color:#29231c\}/.test(readerBase))errors.push('books reader must defer paper heading color to editorial interiors');
if(/html\[data-reading-theme="paper"\] \.audiobook-note\{color:#665f54\}/.test(readerBase))errors.push('books reader must defer paper audiobook note color to editorial interiors');
if(/html\[data-reading-theme="paper"\]\{[^}]*--bg:/.test(readerBase))errors.push('books reader must not redefine the canonical paper palette');
if(/html\[data-reading-theme="paper"\] \.continue-box\{[^}]*background:/.test(readerBase))errors.push('books reader must defer paper continue-box background to editorial interiors');
if(/html\[data-reading-theme="paper"\] \.audio-reading\{/.test(readerBase))errors.push('books reader must defer paper audio-reading highlight to editorial interiors');
if(/@media\(max-width:650px\)\{\.chapter\{padding:24px 20px\}/.test(readerBase))errors.push('books reader must defer first mobile chapter padding to editorial interiors');
if(/@media\(max-width:650px\)\{\.chapter\{padding:25px 20px\}\.chapter-body p\{line-height:2\.05\}\}/.test(readerBase))errors.push('books reader must defer final 650px chapter rhythm to editorial interiors');
if(/@media\(max-width:430px\)\{\.reading-intro\{padding:20px 16px\}/.test(readerBase))errors.push('superseded first 430px compact entry layout returned');
const readerReducedScrollRules=(readerBase.match(/@media\(prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}\}/g)||[]).length;
if(readerReducedScrollRules>1)errors.push(`books reader has ${readerReducedScrollRules} duplicate reduced-motion scroll rules; keep one canonical owner`);
const reader720Blocks=(readerBase.match(/@media\(max-width:720px\)/g)||[]).length;
if(reader720Blocks>5)errors.push(`books reader has ${reader720Blocks} max-width:720px blocks; keep mobile Reader ownership converged`);
const reader430Blocks=(readerBase.match(/@media\(max-width:430px\)/g)||[]).length;
if(reader430Blocks>6)errors.push(`books reader has ${reader430Blocks} max-width:430px blocks; keep compact Reader ownership converged`);
const reader340Blocks=(readerBase.match(/@media\(max-width:340px\)/g)||[]).length;
if(reader340Blocks>2)errors.push(`books reader has ${reader340Blocks} max-width:340px blocks; keep narrow-screen overrides consolidated`);
if(/@media\(max-width:720px\)\{\.audiobook-options\{grid-template-columns:1fr\}\.audiobook-actions button\{flex:1 1 44%\}/.test(readerBase))errors.push('superseded flex sizing returned to the 720px audiobook grid');
const audioResumeRules=(readerBase.match(/#audio-resume\{/g)||[]).length;
if(audioResumeRules>1)errors.push(`books reader has ${audioResumeRules} #audio-resume base rules; keep the final utility owner singular`);
if(/\.wrap\{padding-left:14px;padding-right:14px\}/.test(readerBase))errors.push('superseded 430px wrap gutter returned');
if(/\.panel,\.chapter\{padding-left:18px;padding-right:18px\}/.test(readerBase))errors.push('430px panel and chapter padding must not be coupled');
if(/@media\(max-width:720px\)\{\.audiobook-launcher\{margin:22px 0/.test(readerBase))errors.push('superseded 720px audiobook launcher margin returned');
if(/\.audiobook-launcher\+\.book-directory\{margin-top:22px\}/.test(readerBase))errors.push('redundant adjacent audiobook directory margin override returned');
if(/\.audiobook-launch-button\{margin-top:18px;width:100%/.test(readerBase))errors.push('superseded mobile audiobook launch margin returned');
if(/@media\(max-width:430px\)\{\.reader-controls\{gap:8px\}[\s\S]*?\.reader-controls button\{min-width:44px;min-height:44px\}/.test(readerBase))errors.push('duplicated 430px reader control touch target returned');
const homepageHtml=fs.readFileSync('index.html','utf8');
if(homepageHtml.includes('cinematic-editorial.css'))errors.push('homepage must not reload retired cinematic-editorial.css');
if(fs.existsSync('cinematic-editorial.css'))errors.push('retired cinematic-editorial.css must not be recreated');
const homepageDesktopBelow=fs.readFileSync('assets/homepage-desktop-below-fold.css','utf8');
const homepageMobileBelow=fs.readFileSync('assets/homepage-mobile-below-fold.css','utf8');
const moonlightCss=fs.readFileSync('assets/moonlight.css','utf8');
if(/Final site-wide responsive QA/.test(moonlightCss)||/html,body\{max-width:100%;overflow-x:clip\}/.test(moonlightCss))errors.push('moonlight.css must not regain retired responsive QA ownership');
const refinementCss=fs.readFileSync('assets/moonlit-refinement.css','utf8');
if(!/\.album-photos img\{transition:transform \.45s/.test(homepageDesktopBelow))errors.push('homepage owner must preserve album image interaction');
if(/\.moonlight-emblem\{position:absolute|--moonlight:#dce8f2|\.moonlight-emblem svg\{display:block/.test(moonlightCss))errors.push('moonlight.css must not own homepage crescent primitives');
if(/@media\(max-width:(?:850|650|520)px\)\{\s*\}/.test(moonlightCss))errors.push('moonlight.css must not contain empty responsive media blocks');
if(/:is\(\.topbar,\.top\) nav a,:is\(\.topbar,\.top\) \.navlinks a\{display:inline-flex;align-items:center;min-height:44px/.test(moonlightCss))errors.push('moonlight.css must not regain shared nav touch ownership');
if((moonlightCss.match(/\.brand::after/g)||[]).length>1)errors.push('moonlight.css must keep one canonical brand pseudo-element suppression rule');
if(/#book \.cover-emblem,#book \.cover-moon/.test(moonlightCss))errors.push('moonlight.css must not duplicate bookshelf moon suppression outside the canonical :is() rule');
if((moonlightCss.match(/footer\{border-top-color:/g)||[]).length>1)errors.push('moonlight.css must keep a single footer border owner');
if(/--moon-crescent:|--moon-soft:|--moon-focus:/.test(moonlightCss))errors.push('moonlight.css must not restore retired moon token data');

if(fs.existsSync('assets/moonlit-v2.css'))errors.push('retired assets/moonlit-v2.css must not be recreated');
for(const path of fs.readdirSync('.', {recursive:true}).filter(path=>path.endsWith('.html')&&!path.startsWith('.git/'))){if(fs.readFileSync(path,'utf8').includes('moonlit-v2.css'))errors.push(path+' must not load retired moonlit-v2.css');}
const systemCss=fs.readFileSync('assets/moonlit-system.css','utf8');
if(!systemCss.includes('html.moonlit-enter body{opacity:0}')||!systemCss.includes('@media(prefers-reduced-motion:reduce){body{transition:none}html.moonlit-enter body{opacity:1}}'))errors.push('moonlit-system.css must preserve shared page transition and reduced-motion behavior');
if(!/\.moonlit-cover\{position:relative;min-height:230px/.test(homepageDesktopBelow)||!/\.moonlit-quote-v2\{position:relative;margin:28px 0/.test(homepageDesktopBelow))errors.push('homepage desktop owner must preserve dynamic cover and quote components');
if(!/@media\(max-width:700px\)\{\.moonlit-cover\{min-height:190px\}\.moonlit-quote-v2\{padding-inline:20px\}\}/.test(homepageMobileBelow))errors.push('homepage mobile owner must preserve dynamic cover and quote sizing');
const mobileSafety=fs.readFileSync('assets/mobile-safety.css','utf8');
if(/\.(?:post-card|album-card|gallery-card|photo-card|video-card)|\.chapter-number/.test(moonlightCss+mobileSafety))errors.push('retired zero-reference card selectors must stay out of shared CSS');
if(/\.(?:page-hero|gallery-hero|book-hero|post-hero|journal-hero|video-hero)/.test(moonlightCss))errors.push('retired legacy hero aliases must stay out of moonlight.css');
if(!/\.hero\{isolation:isolate\}/.test(moonlightCss))errors.push('moonlight.css must preserve canonical hero isolation');
if(/:is\([^)]*\.novel-card[^)]*\)::after\{content:none!important\}/.test(moonlightCss))errors.push('generic suppression must not duplicate #book novel-card after ownership');
if(!/#book \.novel-card::after,#book \.bookshelf-top::before/.test(moonlightCss))errors.push('moonlight.css must preserve canonical #book novel-card suppression');
if(/:is\(\.tile,\.novel-card,\.book-card\) :is\(h2,h3,b\):first-child::before|main :is\(section,article\):not\(\.hero\)::before/.test(moonlightCss))errors.push('dead generic before suppressions must stay retired');
if(!/html,body\{max-width:100%;overflow-x:clip\}/.test(mobileSafety))errors.push('mobile safety must own global horizontal overflow protection');
if(!/:is\(\.panel,\.chapter,\.creator-card,\.novel-card,\.tile,\.book-card\)\{max-width:100%;min-width:0\}/.test(mobileSafety))errors.push('mobile safety must preserve narrow-screen card width guard');
if(!/footer\.moonlit-site-footer\{padding-inline:18px!important\}/.test(mobileSafety))errors.push('mobile safety must preserve compact Moonlit footer padding');
const serviceWorker=fs.readFileSync('sw.js','utf8');
if(serviceWorker.includes("assets/mobile-rwd-final.css"))errors.push('service worker shell must not cache legacy mobile-rwd-final.css');
if(!serviceWorker.includes("assets/mobile-safety.css?v=20261002-h2"))errors.push('service worker shell must cache canonical mobile-safety.css');
const runtimeEntryFiles=['index.html','about/index.html','gallery/index.html','posts/index.html','videos/index.html','sw.js'];
for(const path of runtimeEntryFiles){
  const source=fs.readFileSync(path,'utf8');
  if(source.includes('mobile-rwd-final.css'))errors.push(path+' must not reference retired mobile-rwd-final.css');
}

if(/@media\(max-width:430px\)\{\s*\.hero h1\{max-width:100%\}/.test(mobileSafety))errors.push('mobile safety layer must not own homepage hero h1 max-width');
if(/\.hero h1,\.hero-lede\{max-width:100%!important\}/.test(mobileSafety))errors.push('mobile safety layer must defer homepage hero h1 width to homepage CSS');
if(!/body:not\(\[data-book-id\]\) #book \.bookshelf-scene::before/.test(mobileSafety)||!/body:not\(\[data-book-id\]\) #book \.bookshelf-scene::after/.test(mobileSafety))errors.push('mobile safety layer must preserve both homepage bookshelf rails');
if(/\.wrap\{width:100%;max-width:100%;padding-left:18px!important/.test(mobileSafety))errors.push('mobile safety layer must not own page-specific wrap gutters');
if(/@media\(max-width:340px\)\{[\s\S]*?\.panel\{padding-left:15px!important/.test(mobileSafety))errors.push('mobile safety layer must not own narrow-screen panel padding');
if(!/scroll-padding-right:max\(18px,env\(safe-area-inset-right\)\)/.test(mobileSafety))errors.push('mobile nav safety must preserve right safe-area scroll padding');
if(!/\.navlinks a:last-child,\.top nav a:last-child\{margin-right:4px\}/.test(mobileSafety))errors.push('mobile nav safety must preserve trailing space for the final navigation item');
if(!/\.navlinks a,\.top nav a\{min-height:44px;/.test(mobileSafety))errors.push('mobile nav safety must preserve 44px navigation touch targets');
if(/\.topbar \.brand img,\.top \.brand img\{flex:0 0 auto\}/.test(mobileSafety))errors.push('mobile safety layer must not style brand image flex behavior');
if(/\.navlinks a,\.top nav a\{min-height:44px;display:inline-flex;align-items:center;/.test(mobileSafety))errors.push('mobile safety layer must not restyle navigation link display/alignment');
if(/\.navlinks,\.top nav,\.tonight-grid/.test(mobileSafety))errors.push('mobile safety layer must not own homepage horizontal scrollers');
if(!/\.tonight-grid,\.moonlit-entry-grid,\.novels-grid,\.creator-grid,\.album-photos\{overscroll-behavior-inline:contain;/.test(homepageMobileBelow))errors.push('homepage mobile owner must preserve horizontal scroller containment');
if(!/\.tonight-grid::-webkit-scrollbar,\.moonlit-entry-grid::-webkit-scrollbar,\.novels-grid::-webkit-scrollbar,\.creator-grid::-webkit-scrollbar,\.album-photos::-webkit-scrollbar\{display:none\}/.test(homepageMobileBelow))errors.push('homepage mobile owner must preserve hidden horizontal scroller bars');
if(/#featured,#updates,#moonlit-discovery,#book,#creative/.test(mobileSafety))errors.push('mobile safety layer must not own homepage section content visibility');
if(!/#featured,#updates,#moonlit-discovery,#book,#creative,#miaoshu-album,#featured-short,#instagram-reel,#support,#follow,#about,#community,#newsletter\{content-visibility:auto;contain-intrinsic-size:auto 720px\}/.test(homepageDesktopBelow))errors.push('homepage below-fold owner must preserve section rendering optimization');
if(/\.moonlit-newsletter\{|\.moonlit-subscribe-shell\{|\.moonlit-curation\{|\.moonlit-phase-legend\{/.test(moonlightCss))errors.push('moonlight.css must not regain homepage-only Newsletter or Curation ownership');
if(!/\.moonlit-newsletter\{overflow:hidden\}/.test(homepageDesktopBelow)||!/\.moonlit-curation\{max-width:1180px/.test(homepageDesktopBelow))errors.push('homepage desktop owner must preserve Newsletter and Curation base styles');
if(!/\.moonlit-subscribe-row input\{font-size:16px\}/.test(homepageMobileBelow)||!/\.moonlit-curation\{margin:12px 16px;padding:25px 18px\}/.test(homepageMobileBelow))errors.push('homepage mobile owner must preserve Newsletter and Curation mobile refinements');
const editorialInteriors=fs.readFileSync('editorial-interiors.css','utf8');
if(/\.video-page \.layout/.test(mobileSafety)||/\.video-page \.screen/.test(mobileSafety))errors.push('mobile safety layer must defer video layout and screen sizing to editorial interiors');
if(/\.gallery-page figure\{margin-left:0;margin-right:0\}/.test(mobileSafety))errors.push('mobile safety layer must defer gallery figure margins to editorial interiors');
if(!/@media\(max-width:850px\)\{[\s\S]*?\.layout\{grid-template-columns:1fr\}/.test(editorialInteriors))errors.push('editorial interiors must preserve mobile video single-column layout');
if(!/\.gallery figure\{margin:0;min-width:0\}/.test(editorialInteriors))errors.push('editorial interiors must preserve gallery figure margin safety');
if(/\.gallery-page \.series-grid/.test(mobileSafety)||/\.journal-timeline,\.journey-map/.test(mobileSafety)||/\.moonlit-route\{max-width:100%;overflow:hidden\}/.test(mobileSafety))errors.push('mobile safety layer must defer Gallery and Journal/Journey page-specific safety to editorial interiors');
if(!/\.gallery-page \.series-grid\{grid-template-columns:1fr!important\}/.test(editorialInteriors))errors.push('editorial interiors must preserve single-column mobile gallery series');
if(!/\.journal-timeline,\.journey-map,\.moonlit-route\{max-width:100%\}\.moonlit-route\{overflow:hidden\}/.test(editorialInteriors))errors.push('editorial interiors must preserve Journal/Journey width and route overflow safety');
if(/\.hero-actions,\.feature-actions,\.actions/.test(mobileSafety)||/\.creator-grid,\.featured-grid,\.series-grid,\.layout,\.grid/.test(mobileSafety))errors.push('mobile safety layer must not own component action/grid styling');
if(/\.hero-inner,\.hero-copy/.test(mobileSafety)||/\.hero-lede/.test(mobileSafety)||/\.hero-index/.test(mobileSafety)||/\.hero h1\{font-size/.test(mobileSafety))errors.push('mobile safety layer must not own homepage hero mobile styling');
if(/\.support-actions|\.follow-actions|\.about-links|\.community-actions/.test(mobileSafety))errors.push('mobile safety layer must not own homepage action groups');
const readerRefinement=fs.readFileSync('assets/moonlit-refinement-reader.css','utf8');
if(/\.moonlit-reader-comfort\{|\.moonlit-wide-spacing|\.moonlit-focus-mode|\.moonlit-reader-dock\{|\.moonlit-ui-dim/.test(moonlightCss))errors.push('moonlight.css must not regain reader-only comfort or dock ownership');
if(!/\.moonlit-reader-comfort\{display:flex;justify-content:center/.test(readerRefinement)||!/\.moonlit-focus-mode/.test(readerRefinement)||!/\.moonlit-reader-dock\{/.test(readerRefinement))errors.push('reader refinement must preserve comfort, focus mode and reader dock');
if(/\.chapter-body\{font-size:var\(--reader-size,18px\);line-height:2\.04\}/.test(readerRefinement))errors.push('superseded Reader chapter-body 2.04 line-height returned');
const discovery=fs.readFileSync('moonlit-discovery.css','utf8');
if(/\.tonight-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(discovery))errors.push('legacy discovery Tonight desktop layout returned');
if(/\.tonight-grid article\{padding:28px 26px/.test(discovery))errors.push('legacy discovery Tonight card geometry returned');
if(/@media\(max-width:650px\)[\s\S]*?\.tonight-grid\{grid-template-columns:1fr\}/.test(discovery))errors.push('legacy discovery mobile Tonight fallback returned');
if(/\.moonlit-discovery\{|\.moonlit-entry-grid\{|\.moonlit-entry\{/.test(discovery))errors.push('moonlit-discovery.css must not regain homepage Discovery component ownership');
const premium='';
if(fs.existsSync('assets/homepage-premium.css'))errors.push('retired homepage-premium.css must stay deleted');
if(/\.hero h1\{[^}]*color:var\(--hp-ink\)!important/.test(premium))errors.push('premium hero h1 color must defer to system owner');
if(/\.moonlit-discovery\{[^}]*border:1px solid rgba\(185,213,238,.13\)!important/.test(premium)||/\.moonlit-discovery\{[^}]*background:radial-gradient/.test(premium))errors.push('premium discovery surface must defer to system owner');
if(/\.creator-card\{[^}]*border-radius:0!important/.test(premium)||/\.creator-card\{[^}]*background:#081725!important/.test(premium))errors.push('premium creator card radius/background must defer to system owner');
if(/\.creator-art\{[^}]*color:#6f879b!important/.test(premium)||/\.album-description\{color:#91a3b2!important/.test(premium))errors.push('premium creator/album colors must defer to system owner');
if(/#creative\{|\.creator-grid\{|\.creator-card\{|\.creator-art\{|\.creator-copy\{|\.creator-copy h3\{|\.creator-copy p\{|\.creator-copy a\{/.test(premium))errors.push('premium must not regain Creator component ownership');
if(!/#creative\{padding-top:90px\}/.test(homepageDesktopBelow)||!/\.creator-grid\{display:grid;grid-template-columns:repeat\(4,1fr\)/.test(homepageDesktopBelow))errors.push('homepage desktop owner must preserve Creator desktop composition');
if(/\.tonight-grid article\{[^}]*background:transparent!important/.test(premium))errors.push('premium Tonight card background must defer to system owner');
if(/#tonight\{|\.tonight-grid\{|\.tonight-grid article\{|\.tonight-grid article:last-child\{|\.tonight-grid h3\{|\.tonight-grid p\{|\.tonight-grid a\{/.test(premium))errors.push('premium must not regain Tonight component ownership');
if(/#book\{|\.bookshelf-scene\{|\.bookshelf-top|\.bookshelf-base|\.library-colophon|\.novels-grid\{|\.novel-card\{|\.novel-number\{|\.book-object\{|\.book-cover\{|\.book-spine|\.book-pages|\.novel-card h3\{|\.novel-card p\{|\.book-read\{/.test(premium))errors.push('premium must not regain Bookshelf component ownership');
if(/#featured\{|\.featured-grid\{|\.featured-visual\{|\.featured-copy h2\{|#miaoshu-album\{|\.album-photos\{|\.album-photo\{|\.album-photo img\{|\.album-photo figcaption\{|\.moonlit-found-line blockquote\{/.test(premium))errors.push('premium must not regain Featured Album or Found Line component ownership');
if(/#reading-list\{|\.reader-shelf\{|\.shelf-heading h2\{|#updates\{|\.latest-update \.section-title\{|\.update-heading time\{|#featured-short|#instagram-reel|#support|#follow|#about|#community|#newsletter|\.about-layout\{|\.moonlit-newsletter\{|footer\{/.test(premium))errors.push('premium must not regain secondary section ownership');
if(/\.wrap\{|\.panel\{|\.chapter-kicker|\.creator-tag|\.section-title\{|\.notice\{/.test(premium))errors.push('premium must not regain homepage layout or section typography ownership');
if(/\.hero-actions\{margin-top:32px!important|\.hero-index\{color:#73889b!important|\.hero-actions \.hero-primary:hover\{background:#efe2c9!important/.test(premium))errors.push('premium must not regain superseded Hero rules');
if(!/@media\(min-width:701px\)\{\.wrap\{max-width:1240px;padding:64px 28px 120px\}/.test(homepageDesktopBelow))errors.push('homepage desktop owner must preserve wrap composition');
if(!/@media\(max-width:700px\)\{\.wrap\{padding:34px 18px 80px!important\}\}/.test(homepageMobileBelow))errors.push('homepage mobile owner must preserve wrap spacing');
if(!/#reading-list\{padding:32px 0\}/.test(homepageDesktopBelow)||!/#updates\{padding:38px 0\}/.test(homepageDesktopBelow))errors.push('homepage owner must preserve Reading List and Updates composition');
if(!/@media\(min-width:701px\)\{#featured\{padding-top:90px\}/.test(homepageDesktopBelow)||!/#miaoshu-album\{padding-top:96px\}/.test(homepageDesktopBelow))errors.push('homepage desktop owner must preserve Featured and Album desktop composition');
if(!/@media\(min-width:701px\)\{#book\{padding-top:80px\}\.bookshelf-scene\{margin-top:42px/.test(homepageDesktopBelow))errors.push('homepage desktop owner must preserve Bookshelf desktop composition');
if(!/body:not\(\[data-book-id\]\) #book \.bookshelf-scene::before/.test(mobileSafety)||!/body:not\(\[data-book-id\]\) #book \.bookshelf-scene::after/.test(mobileSafety))errors.push('Bookshelf migration must preserve both mobile rails');
if(!/@media\(min-width:701px\)\{#tonight\{padding-top:32px\}\.tonight-grid\{margin-top:34px;display:grid;grid-template-columns:1\.15fr \.9fr \.9fr/.test(homepageDesktopBelow))errors.push('homepage desktop owner must preserve Tonight desktop composition');
if(/\.moonlit-entry\{[^}]*background:transparent!important/.test(premium))errors.push('premium Discovery entry background must defer to system owner');
if(/\.moonlit-discovery\{|\.moonlit-entry-grid\{|\.moonlit-entry\{|\.moonlit-entry:last-child\{|\.moonlit-entry:hover\{/.test(premium))errors.push('premium must not regain Discovery component ownership');
if(!/@media\(min-width:701px\)\{\.moonlit-discovery\{margin:70px 0;padding:clamp\(40px,6vw,70px\)/.test(homepageDesktopBelow))errors.push('homepage desktop owner must preserve Discovery desktop geometry');
const photoViewerCss=fs.readFileSync('photo-viewer.css','utf8');
if(/\.book-object\{[^}]*filter:drop-shadow/.test(premium))errors.push('homepage premium must not override canonical book-object shadow');
const inline=fs.readFileSync('assets/homepage-inline.css','utf8');
if(!/body:not\(\[data-book-id\]\) > header\.hero \.moonlight-emblem\{display:block;position:absolute/.test(inline)||!/\.moonlight-emblem svg\{display:block;width:100%;height:100%;filter:brightness\(\.78\) saturate\(\.78\)\}/.test(inline))errors.push('homepage inline owner must preserve crescent geometry and rendering');
const homepage=fs.readFileSync('index.html','utf8');
if(/\.cta\{[^}]*margin-top:18px/.test(inline))errors.push('legacy inline CTA declarations returned: margin-top');
if(/\.cta\{[^}]*font-weight:700/.test(inline))errors.push('legacy inline CTA declarations returned: font-weight');
if(/\.notice\{[^}]*color:var\(--muted\)/.test(inline))errors.push('inline notice must not own canonical notice color');
if(/\.notice\{[^}]*color:var\(--hp-muted\)!important/.test(premium))errors.push('premium notice must not override system notice color');
if(/@media\(max-width:700px\)[\s\S]*?\.section-title\{[^}]*font-size:[^}]*!important/.test(inline))errors.push('dead mobile section-title typography returned: font-size');
if(/@media\(max-width:700px\)[\s\S]*?\.section-title\{[^}]*line-height:[^}]*!important/.test(inline))errors.push('dead mobile section-title typography returned: line-height');
if(/\.section-title\{[^}]*margin:\s*12px 0 20px!important/.test(premium))errors.push('premium section-title vertical margin override returned');
if(/\.hero \.eyebrow\{font-size:13px;letter-spacing:\.22em;color:var\(--gold2\)\}/.test(inline))errors.push('legacy hero eyebrow typography returned');
if(/\.hero \.eyebrow\{letter-spacing:\.28em\}/.test(inline))errors.push('dead hero eyebrow letter-spacing override returned');
if(/\.chapter-kicker\{[^}]*color:var\(--gold\)[^}]*letter-spacing:3px/.test(inline))errors.push('dead chapter-kicker base typography returned');
if(premium.includes('@media(max-width:700px){.hero-edition{margin-bottom:25px}'))errors.push('duplicate mobile hero-edition breakpoint returned');
if(/@media\(max-width:700px\)[\s\S]*?\.hero-edition\{margin-bottom:25px\}/.test(inline))errors.push('dead mobile hero-edition margin returned');
if(premium.includes('@media(max-width:700px){body:not([data-book-id]) > header.hero h1 > span{white-space:normal!important}}'))errors.push('duplicate mobile hero headline breakpoint returned');
if(inline.includes('@media(min-width:851px){body:not([data-book-id]) > .topbar .brand img{width:62px!important;height:auto!important;max-width:none!important}'))errors.push('dead desktop logo breakpoint override returned');
if(/@media\s*\(min-width:851px\)[\s\S]*?\.topbar \.brand img\{\s*width:62px!important;\s*height:auto!important;\s*max-width:none!important;\s*\}/.test(premium))errors.push('duplicate premium desktop nav logo override returned');
if(/@media\s*\(min-width:851px\)[\s\S]*?header\.hero\{\s*position:relative!important;/.test(premium))errors.push('duplicate desktop hero geometry returned: position');
if(/@media\s*\(min-width:851px\)[\s\S]*?moonlight-emblem\{\s*right:auto!important;/.test(premium))errors.push('duplicate desktop hero geometry returned: moon right');
if(/@media\s*\(min-width:851px\)[\s\S]*?hero-side-caption\{\s*top:61%!important;/.test(premium))errors.push('duplicate desktop hero geometry returned: caption top');
if(/@media\s*\(min-width:851px\)[\s\S]*?moonlight-emblem\{[^}]*drop-shadow\(0 0 24px/.test(premium))errors.push('duplicate desktop hero geometry returned: moon filter');
if(/@media\s*\(min-width:851px\)[\s\S]*?hero-copy h1\{\s*text-shadow:0 10px 38px/.test(premium))errors.push('duplicate desktop hero geometry returned: h1 shadow');
if(premium.includes('@media(max-width:700px){.hero-text-link{border:0}}'))errors.push('duplicate mobile hero text-link border returned');
if(/@media\(max-width:700px\)[\s\S]*?\.hero-text-link\{border:0\}/.test(inline))errors.push('mobile hero-text-link must not use broad border reset');
if(/\.hero-actions\{[^}]*gap:12px[^}]*justify-content:center/.test(inline))errors.push('legacy hero-actions base alignment returned');
if(/@media\(max-width:700px\)[\s\S]*?\.hero-actions\{[^}]*margin-top:22px!important/.test(inline))errors.push('dead mobile hero-actions margin returned');
if(/@media\(max-width:700px\)[\s\S]*?\.hero-actions\{[^}]*gap:4px!important/.test(inline))errors.push('dead mobile hero-actions gap returned');
if(/hero-inner\{\s*box-sizing:border-box!important;\s*\}/.test(premium))errors.push('redundant hero-inner box-sizing override returned');
if(inline.includes('body:not([data-book-id]) > header.hero{height:auto!important;min-height:0!important}'))errors.push('mobile hero must inherit tablet height');
if(inline.includes('body:not([data-book-id]) > header.hero .hero-inner{display:grid!important;grid-template-columns:1fr!important;height:auto!important}'))errors.push('mobile hero-inner must inherit tablet display');
if(inline.includes('body:not([data-book-id]) > header.hero .hero-copy{grid-column:auto!important;margin:0!important;padding:0!important}'))errors.push('mobile hero-copy must inherit tablet margin');
for(const token of ['--hp-bg','--hp-ink','--hp-muted','--hp-gold','--hp-line']){
  if(premium.includes(token+':'))errors.push('premium must not redeclare canonical hp tokens: '+token);
}
for(const [file,budget] of Object.entries(budgets)){
  const css=fs.readFileSync(file,'utf8');
  for(const [key,max] of Object.entries(budget)){
    const count=(css.match(patterns[key])||[]).length;
    if(count>max)errors.push(`${file}: ${key} grew from budget ${max} to ${count}`);
  }
}
if(/\.hero \.eyebrow\{[^}]*font-size:11px!important;[^}]*letter-spacing:\.28em!important/.test(premium)&&!/@media\(min-width:701px\)\{body:not\(\[data-book-id\]\) > header \.eyebrow\{font-size:11px!important;letter-spacing:\.28em!important\}\}/.test(premium))errors.push('premium hero eyebrow typography must be desktop/tablet only');

if(/\.hero \.eyebrow\{[^}]*color:#b6a98e!important/.test(inline))errors.push('hero eyebrow inline color must defer to premium owner');

if(/\.eyebrow,\.hero-edition,\.hero-index\{[^}]*text-transform:none/.test(inline))errors.push('inline hero typography must defer text-transform to system owner');

if(/\.hero-index\{[^}]*color:#708698!important/.test(inline))errors.push('hero-index inline color must defer to premium owner');
if(/\.hero-index\{border-color:rgba\(230,210,177,\.4\)\}/.test(inline))errors.push('hero-index inline border color must defer to premium owner');

if(/\.hero-index\{[^}]*margin-top:46px/.test(inline))errors.push('dead hero-index base margin returned');
if(/\.hero-index\{[^}]*padding-top:18px/.test(inline))errors.push('dead hero-index base padding returned');
if(/@media\(max-width:700px\)[\s\S]*?\.hero-index\{[^}]*margin-top:22px!important/.test(inline))errors.push('dead mobile hero-index margin returned');
if(/@media\(max-width:700px\)[\s\S]*?\.hero-index\{[^}]*gap:7px!important/.test(inline))errors.push('dead mobile hero-index gap returned');
if(/\.hero-index\{[^}]*margin-top:52px!important/.test(premium))errors.push('dead premium hero-index margin returned');

if(/@media\(max-width:700px\)[\s\S]*?\.hero-index\{[^}]*font-size:8px!important/.test(inline))errors.push('dead mobile hero-index font-size returned');

if(/\.hero-index\{[^}]*grid-template-columns:repeat\(3,1fr\)!important/.test(inline))errors.push('hero-index flex container must not carry grid-template-columns');

if(/assets\/homepage-premium\.css/.test(homepage))errors.push('retired homepage-premium.css must remain unloaded');
if(/assets\/homepage-mobile\.css/.test(homepage))errors.push('retired homepage-mobile.css must remain unloaded');

if(fs.existsSync('assets/homepage-mobile.css'))errors.push('retired homepage-mobile.css file must stay deleted');

if(/moonlit-new-reader/.test(premium))errors.push('unused moonlit-new-reader owner returned');
if(!/\.gallery-story-index\{/.test(photoViewerCss)||!/\.gallery-story-note\{/.test(photoViewerCss))errors.push('photo viewer must own gallery story metadata');

if(!/\.moonlit-crosscuration\{max-width:760px/.test(photoViewerCss))errors.push('photo-viewer.css must own gallery cross-curation base');
if(!/\.moonlit-crosscuration\{max-width:760px/.test(readerRefinement))errors.push('reader refinement must own reader cross-curation base');

if(errors.length){
  console.error('Moonlit CSS ownership budget failed:\n - '+errors.join('\n - '));
  process.exit(1);
}
console.log('Moonlit CSS ownership budgets passed.');

if(fs.existsSync('assets/homepage-final.css'))errors.push('retired homepage-final.css file must stay deleted');

if(/hero-brand-mark/.test(inline)||/hero-brand-mark/.test(premium))errors.push('dead hero-brand-mark owner returned');

if(/(?:\.gallery-series|\.series-card|\.intro h1|\.btn(?:[),.{:#\[]|$))/.test(refinementCss))errors.push('homepage refinement must not own unused gallery or series selectors');
