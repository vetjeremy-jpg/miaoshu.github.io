(()=>{const $=(s,r=document)=>r.querySelector(s);
const picks=[
 {label:"小說",title:"今晚讀一段故事",url:"books/fushengsuiyue/index.html#toc"},
 {label:"攝影",title:"在月光裡看一組照片",url:"gallery/"},
 {label:"札記",title:"沿著走過的路出發",url:"posts/"},
 {label:"小說",title:"走進《建康劫·聽泉引》",url:"books/jiankangjie-tingquanyin/#toc"},
 {label:"攝影",title:"看《雪庭舞劍》",url:"gallery/#degoo-album"},
 {label:"探索",title:"讓一個關鍵字帶路",url:"search/"}
];
document.addEventListener("click",e=>{const b=e.target.closest("[data-moonlit-random]");if(!b)return;const p=picks[Math.floor(Math.random()*picks.length)];location.href=p.url});
})();