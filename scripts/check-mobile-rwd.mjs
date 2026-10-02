import fs from 'node:fs';

const fail = [];
const read = p => fs.readFileSync(p,'utf8');
const home = read('index.html');
const mobile = read('assets/mobile-rwd-final.css');
const reader = read('books/reader.css');

function must(name, ok){ if(!ok) fail.push(name); }

must('homepage loads mobile-rwd-final.css', /mobile-rwd-final\.css/.test(home));
must('final mobile CSS is loaded before </head>', /mobile-rwd-final\.css[^>]*>\s*<\/head>/s.test(home));
must('430px breakpoint exists', /max-width:\s*430px/.test(mobile));
must('320px-class safety breakpoint exists', /max-width:\s*340px/.test(mobile));
must('mobile navigation has 44px touch target', /navlinks a[^}]*min-height:\s*44px/s.test(mobile));
must('mobile header respects safe areas', /safe-area-inset-left/.test(mobile) && /safe-area-inset-right/.test(mobile));
must('mobile navigation scrolls horizontally', /navlinks[^}]*overflow-x:auto/s.test(mobile));
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
