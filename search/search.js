/* Search stays local: no account, remote API, or keystroke network requests. */
(()=>{'use strict';
const data=window.MOONLIT_SEARCH_INDEX||[],q=document.querySelector('#q'),filters=document.querySelector('#filters'),results=document.querySelector('#results'),status=document.querySelector('#status');
const types=['全部',...new Set(data.map(x=>x.category))],normalize=s=>String(s||'').normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/台/g,'臺').replace(/\p{P}+/gu,' ');
const indexed=data.map(item=>{
 const number=item.url.match(/#chapter-(\d+)$/)?.[1];
 const unit=item.title.match(/^第[〇零一二三四五六七八九十百]+([章回節])/)?.[1];
 const title=normalize(item.title+(number&&unit?' 第'+number+unit:''));
 return {item,title,text:title+' '+normalize(item.text)};
});
let type='全部',shown=50;
const more=document.createElement('button');more.type='button';more.className='search-more';more.textContent='顯示更多結果 ↓';more.hidden=true;results.after(more);
const clear=document.createElement('button');clear.type='button';clear.className='search-clear';clear.textContent='清除搜尋與篩選';filters.after(clear);
const buttons=new Map();for(const t of types){const b=document.createElement('button');b.type='button';b.textContent=t;b.addEventListener('click',()=>{type=t;shown=50;render(true)});buttons.set(t,b);filters.append(b)}
function readURL(){const params=new URLSearchParams(location.search);q.value=params.get('q')||'';type=types.includes(params.get('type'))?params.get('type'):'全部';shown=50;render(false)}
function render(sync){
 const parts=normalize(q.value).trim().split(/\s+/).filter(Boolean);
 const matches=indexed.filter(x=>(type==='全部'||x.item.category===type)&&parts.every(w=>x.text.includes(w)));
 if(parts.length){
  const titleMatches=x=>parts.every(w=>x.title.includes(w));
  matches.sort((a,b)=>Number(titleMatches(b))-Number(titleMatches(a)));
 }
 const found=matches.map(x=>x.item);
 buttons.forEach((b,t)=>b.setAttribute('aria-pressed',String(t===type)));clear.hidden=!q.value&&type==='全部';
 if(sync){const u=new URL(location.href);if(q.value.trim())u.searchParams.set('q',q.value.trim());else u.searchParams.delete('q');if(type!=='全部')u.searchParams.set('type',type);else u.searchParams.delete('type');history.replaceState(null,'',u)}
 const fragment=document.createDocumentFragment();for(const x of found.slice(0,shown)){const a=document.createElement('a');a.className='result';a.href=x.url;const tag=document.createElement('span');tag.textContent=x.category;const h=document.createElement('strong');h.textContent=x.title;const p=document.createElement('p');p.textContent=x.text;a.append(tag,h,p);fragment.append(a)}
 if(!found.length){const p=document.createElement('p');p.textContent=data.length?'沒有找到符合的內容。試試較短的關鍵字，或清除篩選。':'搜尋資料暫時未載入，請重新整理後再試。';fragment.append(p)}
 results.replaceChildren(fragment);more.hidden=found.length<=shown;status.textContent=found.length+' 筆符合的內容'+(found.length>shown?'，目前顯示前 '+shown+' 筆':'');
}
more.addEventListener('click',()=>{const firstNew=shown;shown+=50;render(false);const next=results.querySelectorAll('.result')[firstNew];if(next){next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',behavior:'auto'})}});
clear.addEventListener('click',()=>{q.value='';type='全部';shown=50;render(true);q.focus({preventScroll:true})});
document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{q.value=b.dataset.query;shown=50;render(true)}));const updateQuery=()=>{shown=50;render(true)};
q.addEventListener('input',event=>{if(!event.isComposing)updateQuery()});
q.addEventListener('compositionend',updateQuery);addEventListener('popstate',readURL);readURL();
})();
