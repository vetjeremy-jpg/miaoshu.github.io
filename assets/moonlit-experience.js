(()=>{const ROOT="/miaoshu.github.io/";
const works=[
 {id:"fusheng",featured:true,type:"小說",title:"《浮生歲月》",note:"從青春走進上一代的戰火與記憶。",url:"books/fushengsuiyue/index.html#toc"},
 {id:"sky1",type:"小說",title:"《兩種天空》",note:"在兩種人生與天空之間開始一段故事。",url:"books/liangzhongtiankong/index.html#toc"},
 {id:"sky2",type:"小說",title:"《兩種天空 II》",note:"沿著未完的天空，繼續下一章。",url:"books/liangzhongtiankong-part2/index.html#toc"},
 {id:"wuxi",type:"小說",title:"《烏溪月》",note:"舊宅、家族與月色裡被重新翻開的往事。",url:"books/wuxiyue/index.html#toc"},
 {id:"jiankang",featured:true,type:"小說",title:"《建康劫·聽泉引》",note:"亂世刀兵之外，追問守護與代價。",url:"books/jiankangjie-tingquanyin/index.html#toc"},
 {id:"hiiro",featured:true,type:"小說",title:"《緋色雪月抄》",note:"雪色、鋒刃與想要守護重要之人的心。",url:"books/hiiro-setsugetsusho/index.html#toc"},
 {id:"fengmen",type:"小說",title:"《風門夜譚》",note:"提一盞燈，走進夜裡未說完的故事。",url:"books/fengmen-yetan/index.html#toc"},
 {id:"alien",type:"小說",title:"《異形：起源之沙》",note:"從沙與未知之中，走向另一個世界。",url:"books/alien-origin-sands/index.html#toc"},
 {id:"sleep",type:"小說",title:"《沉睡的呼喚》",note:"沿著夢境的救生索，潛入沉睡深處。",url:"books/chenshui-de-huhuan/index.html#toc"},
 {id:"dragon",type:"小說",title:"《殘照寫龍契》",note:"殘照之下，歷史與命運留下裂痕。",url:"books/canzhao-xie-longqi/index.html#toc"},
 {id:"trail",type:"札記",title:"〈把臺北走成一封給自己的信〉",note:"沿著臺北大縱走第五段，把一天走成一封信。",url:"posts/taipei-grand-trail-20260928/index.html"},
 {id:"sword",featured:true,type:"攝影",title:"雪庭舞劍",note:"雪色與劍光之間，一段由靜到動的影像敘事。",url:"gallery/index.html#degoo-album"},
 {id:"trees",type:"攝影",title:"林蔭午後",note:"在樹影與舊鐵道旁，把午後放慢。",url:"gallery/index.html#earlier-work"},
 {id:"sky",type:"攝影",title:"月映晚霞",note:"白晝未盡，月色已來。",url:"gallery/index.html#moonlit-sky"},
 {id:"taipei",featured:true,type:"攝影",title:"台北夜色",note:"從暮光走到燈海，看城市慢慢入夜。",url:"gallery/index.html#taipei-night"}
];
const modes={
 all:{label:"全部作品",intro:"今晚沒有指定方向，就讓月光從整座網站裡挑一件作品。",pool:()=>works,reason:w=>"今晚不設路線，月光從 "+w.type+" 裡替你留下這一件。"},
 read:{label:"今夜適合閱讀",intro:"把速度放慢一點。今晚讓文字帶你走遠。",pool:()=>works.filter(w=>w.type==="小說"||w.type==="札記"),reason:w=>w.type==="札記"?"今晚適合讀一段真實走過的路。":"今晚適合把燈調暗，從一段故事開始。"},
 image:{label:"今夜適合看影像",intro:"今晚先不急著讀很多字，跟著光線與畫面走。",pool:()=>works.filter(w=>w.type==="攝影"),reason:w=>"今晚適合把文字留白，慢慢看「"+w.title+"」裡的光與時間。"},
 hidden:{label:"今夜適合探索冷門作品",intro:"避開最常被看見的入口，讓月光帶你走一條比較少人走的路。",pool:()=>works.filter(w=>!w.featured),reason:w=>"這次刻意避開主要推薦作品，月光想讓你遇見 "+w.title+"。"}
};
const key=m=>"moonlit-theme-bag-"+m;
function freshBag(mode){const a=modes[mode].pool().map(w=>w.id);for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function choose(mode="all"){
 const eligible=modes[mode].pool(),valid=new Set(eligible.map(w=>w.id));let bag;
 try{bag=JSON.parse(localStorage.getItem(key(mode))||"[]")}catch{bag=[]}
 bag=bag.filter(id=>valid.has(id));if(!bag.length)bag=freshBag(mode);
 let recent=[];try{recent=JSON.parse(sessionStorage.getItem("moonlit-recent")||"[]")}catch{}
 let idx=bag.findIndex(id=>!recent.includes(id));if(idx<0)idx=0;
 const id=bag.splice(idx,1)[0],pick=works.find(w=>w.id===id);
 localStorage.setItem(key(mode),JSON.stringify(bag));sessionStorage.setItem("moonlit-recent",JSON.stringify([id,...recent.filter(x=>x!==id)].slice(0,5)));
 return {...pick,recommendation:modes[mode].reason(pick)};
}
function mount(button){
 if(button.dataset.moonlitMounted)return;button.dataset.moonlitMounted="1";
 const box=document.createElement("section");box.className="moonlit-picker";box.hidden=true;
 box.innerHTML='<div class="moonlit-picker-head"><small>MOONLIT SERENDIPITY / 月光漫遊</small><button type="button" class="moonlit-picker-close" aria-label="關閉">×</button></div><div class="moonlit-theme-grid" role="group" aria-label="今晚的月光主題"><button type="button" data-mode="read"><small>READ</small><strong>今夜適合閱讀</strong><span>小說與札記</span></button><button type="button" data-mode="image"><small>SEE</small><strong>今夜適合看影像</strong><span>攝影系列</span></button><button type="button" data-mode="hidden"><small>WANDER</small><strong>今夜適合探索冷門作品</strong><span>避開主要推薦</span></button><button type="button" data-mode="all" aria-pressed="true"><small>MOON</small><strong>全部交給月光</strong><span>全站作品</span></button></div><p class="moonlit-mode-intro"></p><div class="moonlit-picker-result" aria-live="polite"><span class="moonlit-picker-type"></span><strong class="moonlit-picker-title"></strong><p class="moonlit-picker-note"></p><p class="moonlit-picker-reason"></p></div><div class="moonlit-picker-actions"><button type="button" class="moonlit-reroll">↻ 同主題再選一次</button><a class="moonlit-go" href="#">就去這裡 →</a></div><p class="moonlit-picker-meta"></p>';
 button.insertAdjacentElement("afterend",box);let mode="all",current;
 const render=()=>{current=choose(mode);box.querySelector(".moonlit-mode-intro").textContent=modes[mode].intro;box.querySelector(".moonlit-picker-type").textContent=current.type+" · "+modes[mode].label;box.querySelector(".moonlit-picker-title").textContent=current.title;box.querySelector(".moonlit-picker-note").textContent=current.note;box.querySelector(".moonlit-picker-reason").textContent=current.recommendation;box.querySelector(".moonlit-go").href=ROOT+current.url;let left=0;try{left=JSON.parse(localStorage.getItem(key(mode))||"[]").length}catch{}box.querySelector(".moonlit-picker-meta").textContent="此主題使用獨立抽選輪次；目前還有 "+left+" 件作品等待月光帶你遇見。"};
 const setMode=m=>{mode=m;box.querySelectorAll("[data-mode]").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.mode===m)));render()};
 button.addEventListener("click",e=>{e.preventDefault();box.hidden=false;setMode("all");box.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"})});
 box.querySelector(".moonlit-picker-close").addEventListener("click",()=>{box.hidden=true;button.focus()});
 box.querySelector(".moonlit-reroll").addEventListener("click",render);
 box.querySelectorAll("[data-mode]").forEach(x=>x.addEventListener("click",()=>setMode(x.dataset.mode)));
}
document.querySelectorAll("[data-moonlit-random]").forEach(mount);
window.MOONLIT_RANDOM={works,modes,choose,mount};
})();