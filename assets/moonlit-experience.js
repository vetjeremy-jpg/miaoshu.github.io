(()=>{const ROOT="/miaoshu.github.io/";
const works=[
 {id:"fusheng",type:"小說",title:"《浮生歲月》",note:"從青春走進上一代的戰火與記憶。",url:"books/fushengsuiyue/index.html#toc"},
 {id:"sky1",type:"小說",title:"《兩種天空》",note:"在兩種人生與天空之間開始一段故事。",url:"books/liangzhongtiankong/index.html#toc"},
 {id:"sky2",type:"小說",title:"《兩種天空 II》",note:"沿著未完的天空，繼續下一章。",url:"books/liangzhongtiankong-part2/index.html#toc"},
 {id:"wuxi",type:"小說",title:"《烏溪月》",note:"舊宅、家族與月色裡被重新翻開的往事。",url:"books/wuxiyue/index.html#toc"},
 {id:"jiankang",type:"小說",title:"《建康劫·聽泉引》",note:"亂世刀兵之外，追問守護與代價。",url:"books/jiankangjie-tingquanyin/index.html#toc"},
 {id:"hiiro",type:"小說",title:"《緋色雪月抄》",note:"雪色、鋒刃與想要守護重要之人的心。",url:"books/hiiro-setsugetsusho/index.html#toc"},
 {id:"fengmen",type:"小說",title:"《風門夜譚》",note:"提一盞燈，走進夜裡未說完的故事。",url:"books/fengmen-yetan/index.html#toc"},
 {id:"alien",type:"小說",title:"《異形：起源之沙》",note:"從沙與未知之中，走向另一個世界。",url:"books/alien-origin-sands/index.html#toc"},
 {id:"sleep",type:"小說",title:"《沉睡的呼喚》",note:"沿著夢境的救生索，潛入沉睡深處。",url:"books/chenshui-de-huhuan/index.html#toc"},
 {id:"dragon",type:"小說",title:"《殘照寫龍契》",note:"殘照之下，歷史與命運留下裂痕。",url:"books/canzhao-xie-longqi/index.html#toc"},
 {id:"trail",type:"札記",title:"〈把臺北走成一封給自己的信〉",note:"沿著臺北大縱走第五段，把一天走成一封信。",url:"posts/taipei-grand-trail-20260928/index.html"},
 {id:"sword",type:"攝影",title:"雪庭舞劍",note:"雪色與劍光之間，一段由靜到動的影像敘事。",url:"gallery/index.html#degoo-album"},
 {id:"trees",type:"攝影",title:"林蔭午後",note:"在樹影與舊鐵道旁，把午後放慢。",url:"gallery/index.html#earlier-work"},
 {id:"sky",type:"攝影",title:"月映晚霞",note:"白晝未盡，月色已來。",url:"gallery/index.html#moonlit-sky"},
 {id:"taipei",type:"攝影",title:"台北夜色",note:"從暮光走到燈海，看城市慢慢入夜。",url:"gallery/index.html#taipei-night"}
];
const key=t=>"moonlit-bag-"+t;
function eligible(type="全部"){return type==="全部"?works:works.filter(w=>w.type===type)}
function freshBag(type="全部"){const a=eligible(type).map(w=>w.id);for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function choose(type="全部"){
 let bag;try{bag=JSON.parse(localStorage.getItem(key(type))||"[]")}catch{bag=[]}
 const valid=new Set(eligible(type).map(w=>w.id));bag=bag.filter(id=>valid.has(id));
 if(!bag.length)bag=freshBag(type);
 const recent=JSON.parse(sessionStorage.getItem("moonlit-recent")||"[]");
 let idx=bag.findIndex(id=>!recent.includes(id));if(idx<0)idx=0;
 const id=bag.splice(idx,1)[0],pick=works.find(w=>w.id===id);
 localStorage.setItem(key(type),JSON.stringify(bag));
 const next=[id,...recent.filter(x=>x!==id)].slice(0,4);sessionStorage.setItem("moonlit-recent",JSON.stringify(next));
 return pick;
}
function mount(button){
 if(button.dataset.moonlitMounted)return;button.dataset.moonlitMounted="1";
 const box=document.createElement("section");box.className="moonlit-picker";box.hidden=true;box.innerHTML='<div class="moonlit-picker-head"><small>MOONLIT SERENDIPITY / 月光漫遊</small><button type="button" class="moonlit-picker-close" aria-label="關閉">×</button></div><div class="moonlit-picker-filters" role="group" aria-label="想讓月光從哪一類作品選"><button type="button" data-type="全部" aria-pressed="true">全部</button><button type="button" data-type="小說" aria-pressed="false">小說</button><button type="button" data-type="攝影" aria-pressed="false">攝影</button><button type="button" data-type="札記" aria-pressed="false">札記</button></div><div class="moonlit-picker-result" aria-live="polite"><span class="moonlit-picker-type"></span><strong class="moonlit-picker-title"></strong><p class="moonlit-picker-note"></p></div><div class="moonlit-picker-actions"><button type="button" class="moonlit-reroll">↻ 再讓月光選一次</button><a class="moonlit-go" href="#">就去這裡 →</a></div><p class="moonlit-picker-meta"></p>';
 button.insertAdjacentElement("afterend",box);let type="全部",current=null;
 const render=()=>{current=choose(type);box.querySelector(".moonlit-picker-type").textContent=current.type;box.querySelector(".moonlit-picker-title").textContent=current.title;box.querySelector(".moonlit-picker-note").textContent=current.note;box.querySelector(".moonlit-go").href=ROOT+current.url;const left=JSON.parse(localStorage.getItem(key(type))||"[]").length;box.querySelector(".moonlit-picker-meta").textContent=type==="全部"?"月光會盡量帶你走遍全部作品，再開始新一輪。":"目前只從「"+type+"」中挑選；這一輪還有 "+left+" 件未遇見。"};
 const open=()=>{box.hidden=false;render();box.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"})};
 button.addEventListener("click",e=>{e.preventDefault();open()});
 box.querySelector(".moonlit-picker-close").addEventListener("click",()=>{box.hidden=true;button.focus()});
 box.querySelector(".moonlit-reroll").addEventListener("click",render);
 box.querySelectorAll("[data-type]").forEach(x=>x.addEventListener("click",()=>{type=x.dataset.type;box.querySelectorAll("[data-type]").forEach(y=>y.setAttribute("aria-pressed",String(y===x)));render()}));
}
document.querySelectorAll("[data-moonlit-random]").forEach(mount);
window.MOONLIT_RANDOM={works,choose,mount};
})();