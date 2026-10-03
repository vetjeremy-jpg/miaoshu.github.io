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
const cinematic=fs.readFileSync('cinematic-editorial.css','utf8');
if(/\.brand::after\{[^}]*content:""[^}]*box-shadow:3px 2px 0 0/.test(cinematic))errors.push('disabled cinematic brand moon pseudo-element returned');
const premium=fs.readFileSync('assets/homepage-premium.css','utf8');
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
