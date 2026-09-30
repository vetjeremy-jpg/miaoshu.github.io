(()=>{const ROOT="/miaoshu.github.io/";
const works=[
 {type:"小說",title:"《浮生歲月》",url:"books/fushengsuiyue/index.html#toc"},
 {type:"小說",title:"《兩種天空》",url:"books/liangzhongtiankong/index.html#toc"},
 {type:"小說",title:"《兩種天空 II》",url:"books/liangzhongtiankong-part2/index.html#toc"},
 {type:"小說",title:"《烏溪月》",url:"books/wuxiyue/index.html#toc"},
 {type:"小說",title:"《建康劫·聽泉引》",url:"books/jiankangjie-tingquanyin/index.html#toc"},
 {type:"小說",title:"《緋色雪月抄》",url:"books/hiiro-setsugetsusho/index.html#toc"},
 {type:"小說",title:"《風門夜譚》",url:"books/fengmen-yetan/index.html#toc"},
 {type:"小說",title:"《異形：起源之沙》",url:"books/alien-origin-sands/index.html#toc"},
 {type:"小說",title:"《沉睡的呼喚》",url:"books/chenshui-de-huhuan/index.html#toc"},
 {type:"小說",title:"《殘照寫龍契》",url:"books/canzhao-xie-longqi/index.html#toc"},
 {type:"札記",title:"〈把臺北走成一封給自己的信〉",url:"posts/taipei-grand-trail-20260928/index.html"},
 {type:"攝影",title:"雪庭舞劍",url:"gallery/index.html#degoo-album"},
 {type:"攝影",title:"林蔭午後",url:"gallery/index.html#earlier-work"},
 {type:"攝影",title:"月映晚霞",url:"gallery/index.html#moonlit-sky"},
 {type:"攝影",title:"台北夜色",url:"gallery/index.html#taipei-night"}
];
function choose(){
 const previous=sessionStorage.getItem("moonlit-last-pick");
 let pool=works.filter(w=>w.url!==previous);
 if(!pool.length)pool=works;
 const pick=pool[Math.floor(Math.random()*pool.length)];
 sessionStorage.setItem("moonlit-last-pick",pick.url);
 return pick;
}
function go(button){
 const pick=choose(),original=button.dataset.moonlitOriginal||button.textContent;
 button.dataset.moonlitOriginal=original;
 button.disabled=true;
 button.setAttribute("aria-live","polite");
 button.textContent="✦ 月光今晚選了 "+pick.type+" "+pick.title;
 setTimeout(()=>window.location.assign(ROOT+pick.url),650);
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-moonlit-random]");if(!b)return;e.preventDefault();go(b);});
window.MOONLIT_RANDOM={works,choose,go};
})();