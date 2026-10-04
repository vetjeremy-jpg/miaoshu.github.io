/* Moonlit shared runtime ownership:
   - cross-page navigation / Safari lifecycle
   - page-specific enhancement loading
   - app metadata fallback
   - scoped service-worker registration
   Keep homepage-only UI and reader feature logic in their dedicated modules. */
(()=>{const d=document,body=d.body;d.documentElement.classList.add("moonlit-enter");requestAnimationFrame(()=>{d.documentElement.classList.add("moonlit-ready");d.documentElement.classList.remove("moonlit-enter")});
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches,canFadeNav=!reduce&&matchMedia("(hover:hover) and (pointer:fine)").matches;const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;let standalone=isStandalone();const syncDisplayMode=()=>{standalone=isStandalone();d.documentElement.dataset.displayMode=standalone?"standalone":"browser"};syncDisplayMode();addEventListener("pageshow",e=>{syncDisplayMode();if(e.persisted){body.style.opacity="";d.documentElement.classList.add("moonlit-ready");d.documentElement.classList.remove("moonlit-enter")}});d.addEventListener("click",e=>{if(!canFadeNav)return;const a=e.target.closest("a[href]");if(!a||e.metaKey||e.ctrlKey||e.shiftKey||a.target==="_blank"||a.hasAttribute("download"))return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname===location.pathname&&u.hash)return;if(standalone)return;e.preventDefault();body.style.opacity="0";setTimeout(()=>location.assign(u.href),180)});
const hour=new Date().getHours(),phase=hour>=18&&hour<23?"evening":hour>=23||hour<5?"late":hour>=5&&hour<7?"dawn":"day";body.dataset.moonPhase=phase;
/* Homepage night label injection removed: the permanent hero-side-caption in index.html is the single moonlight caption. */
const isHome=location.pathname==="/miaoshu.github.io/"||location.pathname==="/miaoshu.github.io/index.html";
/* Homepage below-fold orchestration is owned by moonlit-home-loader.js. Keep this shared runtime free of duplicate homepage loaders. */
if(location.pathname.includes("/gallery/")){const loadGallery=()=>{if(d.querySelector("script[data-moonlit-gallery-content]"))return;const s=d.createElement("script");s.src="/miaoshu.github.io/assets/moonlit-gallery-content.js?v=20261002-split1";s.dataset.moonlitGalleryContent="";d.head.append(s)};"requestIdleCallback"in window?requestIdleCallback(loadGallery,{timeout:1200}):setTimeout(loadGallery,0)}
})();

/* Moonlit footer: load the full enhancement only near the page end. */
(()=>{const d=document,f=d.querySelector("body > footer");if(!f||f.classList.contains("moonlit-site-footer"))return;const load=()=>{if(d.querySelector("script[data-moonlit-footer]"))return;const s=d.createElement("script");s.src="/miaoshu.github.io/assets/moonlit-footer.js?v=20261002-split1";s.dataset.moonlitFooter="";d.head.append(s)};if("IntersectionObserver"in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();load()}},{rootMargin:"600px 0px"});io.observe(f)}else load()})();

/* Moonlit 2026 refinement loader: load only the page-specific enhancement bundle. */
(()=>{if(window.__moonlitRefinementLoaded)return;
 const path=location.pathname,isHome=/\/miaoshu\.github\.io\/?$/.test(path)||/\/miaoshu\.github\.io\/index\.html$/.test(path),isReader=!!document.body.dataset.bookId;
 if(!isHome&&!isReader)return;
 window.__moonlitRefinementLoaded=true;
 const own=document.currentScript?.src||[...document.scripts].map(s=>s.src).find(src=>/\/assets\/moonlit-v2\.js/.test(src));
 if(!own)return;
 const base=new URL("./",own);
 const load=()=>{if(!document.querySelector('link[data-moonlit-refinement]')){const l=document.createElement("link");l.rel="stylesheet";l.href=new URL(isReader?"moonlit-refinement-reader.css?v=20261003-reader-layout1":"moonlit-refinement.css?v=20261004-comfort2",base);l.dataset.moonlitRefinement="";document.head.append(l)}if(!document.querySelector("script[data-moonlit-refinement]")){const s=document.createElement("script");s.src=new URL(isReader?"moonlit-refinement-reader.js?v=20261003-reader-layout1":"moonlit-refinement-home.js?v=20261004-curation1",base);s.dataset.moonlitRefinement="";s.defer=true;document.head.append(s)}};
 const schedule=()=>{"requestIdleCallback"in window?requestIdleCallback(load,{timeout:1200}):setTimeout(load,0)};
 const scheduleHomeTouch=()=>{const anchor=document.querySelector("#continue-reading")||document.querySelector("#book");if(anchor&&"IntersectionObserver"in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();load()}},{rootMargin:"900px 0px"});io.observe(anchor)}else schedule()};
 const start=()=>{if(isHome&&!matchMedia("(hover:hover) and (pointer:fine)").matches)scheduleHomeTouch();else schedule()};
 if(document.readyState==="loading")addEventListener("DOMContentLoaded",start,{once:true});else start();
})();

/* Moonlit app metadata fallback: homepage is complete; other pages fill only missing metadata. */
(()=>{try{
 const path=location.pathname;if(path==="/miaoshu.github.io/"||path==="/miaoshu.github.io/index.html")return;
 const meta=(name,content)=>{let m=document.querySelector('meta[name="'+name+'"]');if(!m){m=document.createElement("meta");m.name=name;m.content=content;document.head.append(m)}};
 meta("application-name","喵叔 Moonlit Stories");
 meta("apple-mobile-web-app-title","喵叔 Moonlit");
 meta("apple-mobile-web-app-capable","yes");
 meta("apple-mobile-web-app-status-bar-style","black-translucent");
 meta("theme-color","#071521");
}catch(e){}})();


/* Navigation lifecycle: initialize mobile scroll position and current section together. */
(()=>{try{
 const reset=()=>{if(!matchMedia("(max-width:700px)").matches)return;document.querySelectorAll(".navlinks,.top nav").forEach(n=>{n.scrollLeft=0})};
 const sync=()=>{const nav=document.querySelector(".navlinks,.top nav");if(!nav)return;const home=nav.querySelector('a[href="./"],a[href="../"],a[href="/miaoshu.github.io/"]'),book=[...nav.querySelectorAll("a")].find(a=>a.textContent.trim()==="小說");if(location.hash==="#book"&&book){home?.removeAttribute("aria-current");book.setAttribute("aria-current","page")}else if(location.pathname.endsWith("/miaoshu.github.io/")||location.pathname.endsWith("/miaoshu.github.io/index.html")){book?.removeAttribute("aria-current");home?.setAttribute("aria-current","page")}};
 const init=()=>{reset();sync()};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();addEventListener("pageshow",reset);addEventListener("hashchange",sync);
}catch(e){}})();


/* PWA shell: keep iOS Home Screen navigation inside the Moonlit scope. */
if('serviceWorker' in navigator){let swReg,lastSWCheck=0;const checkSW=()=>{const now=Date.now();if(swReg&&now-lastSWCheck>300000){lastSWCheck=now;swReg.update().catch(()=>{})}};addEventListener('load',()=>navigator.serviceWorker.register('/miaoshu.github.io/sw.js',{scope:'/miaoshu.github.io/'}).then(reg=>{swReg=reg;lastSWCheck=Date.now()}).catch(()=>{}),{once:true});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkSW()});addEventListener('pageshow',checkSW);}
