(()=>{const d=document,body=d.body;d.documentElement.classList.add("moonlit-enter");requestAnimationFrame(()=>{d.documentElement.classList.add("moonlit-ready");d.documentElement.classList.remove("moonlit-enter")});
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;let standalone=isStandalone();const syncDisplayMode=()=>{standalone=isStandalone();d.documentElement.dataset.displayMode=standalone?"standalone":"browser"};syncDisplayMode();addEventListener("pageshow",syncDisplayMode);d.addEventListener("click",e=>{const a=e.target.closest("a[href]");if(!a||reduce||e.metaKey||e.ctrlKey||e.shiftKey||a.target==="_blank"||a.hasAttribute("download"))return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname===location.pathname&&u.hash)return;if(standalone)return;e.preventDefault();body.style.opacity="0";setTimeout(()=>location.assign(u.href),180)});
const hour=new Date().getHours(),phase=hour>=18&&hour<23?"evening":hour>=23||hour<5?"late":hour>=5&&hour<7?"dawn":"day";body.dataset.moonPhase=phase;
/* Homepage night label injection removed: the permanent hero-side-caption in index.html is the single moonlight caption. */
const isHome=location.pathname==="/miaoshu.github.io/"||location.pathname==="/miaoshu.github.io/index.html";if(isHome){const loadHomeContent=()=>{if(d.querySelector("script[data-moonlit-home-content]"))return;const s=d.createElement("script");s.src="/miaoshu.github.io/assets/moonlit-home-content.js?v=20261002-split2";s.dataset.moonlitHomeContent="";d.head.append(s)};"requestIdleCallback"in window?requestIdleCallback(loadHomeContent,{timeout:1200}):setTimeout(loadHomeContent,0)}
if(location.pathname.includes("/gallery/")){const loadGallery=()=>{if(d.querySelector("script[data-moonlit-gallery-content]"))return;const s=d.createElement("script");s.src="/miaoshu.github.io/assets/moonlit-gallery-content.js?v=20261002-split1";s.dataset.moonlitGalleryContent="";d.head.append(s)};"requestIdleCallback"in window?requestIdleCallback(loadGallery,{timeout:1200}):setTimeout(loadGallery,0)}
})();

/* Moonlit 3.0 — curation, functional phases, reader dock, unified footer */
(()=>{const d=document,b=d.body;if(b.dataset.moonlit3)return;b.dataset.moonlit3="1";
const oldFooter=d.querySelector("body > footer");if(oldFooter&&!oldFooter.classList.contains("moonlit-site-footer")){const enhanceFooter=()=>{if(oldFooter.classList.contains("moonlit-site-footer"))return;oldFooter.classList.add("moonlit-site-footer");oldFooter.innerHTML='<strong>喵叔 · Moonlit Stories</strong><p>故事、影像與札記，在這裡慢慢相遇。讀完一頁，不必急著離開。</p><nav aria-label="頁尾導覽"><a href="/miaoshu.github.io/">首頁</a><a href="/miaoshu.github.io/#book">小說</a><a href="/miaoshu.github.io/gallery/">攝影</a><a href="/miaoshu.github.io/posts/">札記</a><a href="/miaoshu.github.io/about/?v=20261002-pwa2">關於喵叔</a></nav><span class="moonlit-colophon">© 2026 喵叔 · MOONLIT STORIES</span>'};if("IntersectionObserver"in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();enhanceFooter()}},{rootMargin:"600px 0px"});io.observe(oldFooter)}else enhanceFooter()}
})();

/* Moonlit 2026 refinement loader: load only the page-specific enhancement bundle. */
(()=>{if(window.__moonlitRefinementLoaded)return;
 const path=location.pathname,isHome=/\/miaoshu\.github\.io\/?$/.test(path)||/\/miaoshu\.github\.io\/index\.html$/.test(path),isReader=!!document.body.dataset.bookId;
 if(!isHome&&!isReader)return;
 window.__moonlitRefinementLoaded=true;
 const own=document.currentScript?.src||[...document.scripts].map(s=>s.src).find(src=>/\/assets\/moonlit-v2\.js/.test(src));
 if(!own)return;
 const base=new URL("./",own);
 const load=()=>{if(!document.querySelector('link[data-moonlit-refinement]')){const l=document.createElement("link");l.rel="stylesheet";l.href=new URL(isReader?"moonlit-refinement-reader.css?v=20261002-split1":"moonlit-refinement.css?v=20261002-home3",base);l.dataset.moonlitRefinement="";document.head.append(l)}if(!document.querySelector("script[data-moonlit-refinement]")){const s=document.createElement("script");s.src=new URL(isReader?"moonlit-refinement-reader.js?v=20261002-split2":"moonlit-refinement-home.js?v=20261002-split6",base);s.dataset.moonlitRefinement="";s.defer=true;document.head.append(s)}};
 const schedule=()=>{"requestIdleCallback"in window?requestIdleCallback(load,{timeout:1200}):setTimeout(load,0)};
 if(document.readyState==="loading")addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();

/* Moonlit app metadata fallback: static pages own icons; runtime only fills missing metadata. */
(()=>{try{
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
