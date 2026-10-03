#!/usr/bin/env node
import fs from 'node:fs';

const budgets={
  'assets/homepage-premium.css':{hero:28,topbar:1,navlinks:1,panel:3,important:191},
  'assets/moonlit-v2.css':{hero:3,topbar:0,navlinks:0,panel:0,important:0},
  'assets/moonlight.css':{hero:6,topbar:12,navlinks:2,panel:4,important:22},
  'assets/homepage-desktop-below-fold.css':{hero:0,topbar:0,navlinks:0,panel:0,important:10},
};
const patterns={
  hero:/\.hero\b/g,
  topbar:/\.topbar\b/g,
  navlinks:/\.navlinks\b/g,
  panel:/\.panel\b/g,
  important:/!important/g,
};
const errors=[];
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
const readerRefinement=fs.readFileSync('assets/moonlit-refinement-reader.css','utf8');
if(/\.chapter-body\{font-size:var\(--reader-size,18px\);line-height:2\.04\}/.test(readerRefinement))errors.push('superseded Reader chapter-body 2.04 line-height returned');
const discovery=fs.readFileSync('moonlit-discovery.css','utf8');
const cinematic=fs.readFileSync('cinematic-editorial.css','utf8');
const cinematicBase=stripMediaBlocks(cinematic);
if(/\.tonight-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(discovery))errors.push('legacy discovery Tonight desktop layout returned');
if(/\.tonight-grid article\{padding:28px 26px/.test(discovery))errors.push('legacy discovery Tonight card geometry returned');
if(/@media\(max-width:650px\)[\s\S]*?\.tonight-grid\{grid-template-columns:1fr\}/.test(discovery))errors.push('legacy discovery mobile Tonight fallback returned');
if(/\.moonlit-discovery\{|\.moonlit-entry-grid\{|\.moonlit-entry\{/.test(discovery))errors.push('moonlit-discovery.css must not regain homepage Discovery component ownership');
if(/\.topbar\{|\.navlinks\s+a\{|\.navlinks\s+\.nav-follow\{|\.brand\{/.test(cinematicBase))errors.push('cinematic editorial must not own homepage topbar/nav component styling');
if(/\.cta\{|\.cta\.secondary\{|\.panel\{/.test(cinematicBase))errors.push('cinematic editorial must not own base CTA/panel component styling');
if(/\.section-title\{/.test(cinematicBase))errors.push('cinematic editorial must not own base section-title typography');
if(/\.section-title:after\{background:linear-gradient\(90deg,var\(--gold\),transparent\)\}/.test(cinematic))errors.push('superseded cinematic section-title base underline returned');
if(/#book \.bookshelf-scene\{|#book \.novel-card\{|#book \.novel-card p\{/.test(cinematic))errors.push('cinematic editorial must not own homepage bookshelf theme styling');
if(/\.brand::after\{[^}]*content:""[^}]*box-shadow:3px 2px 0 0/.test(cinematic))errors.push('disabled cinematic brand moon pseudo-element returned');
const premium=fs.readFileSync('assets/homepage-premium.css','utf8');
if(/\.book-object\{[^}]*filter:drop-shadow/.test(premium))errors.push('homepage premium must not override canonical book-object shadow');
const inline=fs.readFileSync('assets/homepage-inline.css','utf8');
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
if(premium.includes('@media(max-width:700px){body:not([data-book-id]) > header.hero h1 > span{white-space:normal!important}}'))errors.push('duplicate mobile hero headline breakpoint returned');
if(inline.includes('@media(min-width:851px){body:not([data-book-id]) > .topbar .brand img{width:62px!important;height:auto!important;max-width:none!important}'))errors.push('dead desktop logo breakpoint override returned');
if(/@media\s*\(min-width:851px\)[\s\S]*?\.topbar \.brand img\{\s*width:62px!important;\s*height:auto!important;\s*max-width:none!important;\s*\}/.test(premium))errors.push('duplicate premium desktop nav logo override returned');
if(/@media\s*\(min-width:851px\)[\s\S]*?header\.hero\{\s*position:relative!important;/.test(premium))errors.push('duplicate desktop hero geometry returned: position');
if(/@media\s*\(min-width:851px\)[\s\S]*?moonlight-emblem\{\s*right:auto!important;/.test(premium))errors.push('duplicate desktop hero geometry returned: moon right');
if(/@media\s*\(min-width:851px\)[\s\S]*?hero-side-caption\{\s*top:61%!important;/.test(premium))errors.push('duplicate desktop hero geometry returned: caption top');
if(/@media\s*\(min-width:851px\)[\s\S]*?moonlight-emblem\{[^}]*drop-shadow\(0 0 24px/.test(premium))errors.push('duplicate desktop hero geometry returned: moon filter');
if(/@media\s*\(min-width:851px\)[\s\S]*?hero-copy h1\{\s*text-shadow:0 10px 38px/.test(premium))errors.push('duplicate desktop hero geometry returned: h1 shadow');
if(premium.includes('@media(max-width:700px){.hero-text-link{border:0}}'))errors.push('duplicate mobile hero text-link border returned');
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
if(errors.length){
  console.error('Moonlit CSS ownership budget failed:\n - '+errors.join('\n - '));
  process.exit(1);
}
console.log('Moonlit CSS ownership budgets passed.');
