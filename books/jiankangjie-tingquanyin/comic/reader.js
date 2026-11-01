(() => {
'use strict';
const $ = id => document.getElementById(id);
const book=$('book'), select=$('chapters'), zoom=$('zoom'), zoomImage=$('zoom-image');
const wide=matchMedia('(min-width: 900px)'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
const key='moonlit-tingquan-comic-v1';
let pages=[], page=0, single=false, busy=false, touch=null, lastSwipe=0;
const read=(k)=>{try{return localStorage.getItem(k)}catch{return null}};
const save=(k,v)=>{try{localStorage.setItem(k,String(v))}catch{}};
single=read(key+'-single')==='true';
const spread=()=>wide.matches&&!single;
const count=()=>spread()?2:1;
function setHash(){history.replaceState(null,'','#page-'+(page+1))}
function openZoom(index){
 const p=pages[index]; zoomImage.src=p.imageUrl;zoomImage.alt=p.title;
 zoomImage.classList.remove('actual');$('zoom-size').textContent='原尺寸細讀';
 $('zoom-title').textContent=p.title;zoom.showModal();$('zoom-scroll').scrollTo(0,0);
}
function makeSheet(index){
 const p=pages[index], sheet=document.createElement('section');sheet.className='sheet';sheet.setAttribute('aria-label',p.title);
 const button=document.createElement('button');button.type='button';button.className='page-button';button.setAttribute('aria-label','放大閱讀：'+p.title);
 const img=new Image();img.alt=p.title+'｜漫畫第 '+(index+1)+' 頁';img.decoding='async';img.referrerPolicy='no-referrer';
 const placeholder=document.createElement('span');placeholder.className='placeholder';placeholder.textContent='正在載入第 '+(index+1)+' 頁…';
 img.onload=()=>{img.classList.add('loaded');button.setAttribute('aria-busy','false')};
 img.onerror=()=>{
  button.remove();const error=document.createElement('div');error.className='error';
  const text=document.createElement('p');text.textContent='這一頁暫時無法載入。';
  const retry=document.createElement('button');retry.type='button';retry.textContent='重新載入';retry.onclick=()=>{sheet.replaceWith(makeSheet(index))};
  const a=document.createElement('a');a.href='https://app.degoo.com/share/UjmLUCKjcSSp7RoqROdWiA';a.target='_blank';a.rel='noopener noreferrer';a.textContent='開啟原始相簿 ↗';
  error.append(text,retry,document.createElement('br'),a);sheet.prepend(error);
 };
 button.setAttribute('aria-busy','true');button.append(img,placeholder);button.onclick=()=>{if(Date.now()-lastSwipe>450)openZoom(index)};
 const folio=document.createElement('p');folio.className='folio';folio.textContent=p.title+'　·　'+(index+1);
 sheet.append(button,folio);img.src=p.imageUrl;return sheet;
}
function render(direction=0){
 const old=book.querySelector('.sheet'+(direction>0&&spread()?':nth-child(2)':'')+' img.loaded');
 const leaf=old&&direction&&!reduced.matches?document.createElement('div'):null;
 if(leaf){leaf.className='turn-leaf '+(direction>0?'turn-forward':'turn-backward');leaf.setAttribute('aria-hidden','true');leaf.append(old.cloneNode());}
 book.replaceChildren();book.classList.toggle('double',spread()&&page+1<pages.length);
 book.append(makeSheet(page));if(spread()&&page+1<pages.length)book.append(makeSheet(page+1));
 if(leaf){book.append(leaf);busy=true;setTimeout(()=>{leaf.remove();busy=false},500)}
 book.setAttribute('aria-busy','false');select.value=String(page);
 $('counter').textContent=(spread()&&page+1<pages.length?(page+1)+'–'+(page+2):page+1)+' / '+pages.length;
 $('status').textContent=pages[page].title+(spread()&&page+1<pages.length?' ／ '+pages[page+1].title:'');
 $('prev').disabled=page===0;$('next').disabled=page+count()>=pages.length;
 $('prev').textContent=spread()?'← 上一跨頁':'← 上一頁';$('next').textContent=spread()?'下一跨頁 →':'下一頁 →';
 $('mode').textContent=single?'雙頁閱讀':'單頁閱讀';$('mode').setAttribute('aria-pressed',String(single));$('mode').hidden=!wide.matches;
 $('progress').style.width=(Math.min(page+count(),pages.length)/pages.length*100)+'%';
 $('finish').hidden=page+count()<pages.length;
 save(key,page);setHash();
}
function go(next,direction=0){if(!pages.length||busy)return;page=Math.max(0,Math.min(pages.length-1,next));render(direction)}
function turn(direction){const n=page+direction*count();if(direction>0&&n>=pages.length||direction<0&&page===0)return;go(n,direction)}
$('prev').onclick=()=>turn(-1);$('next').onclick=()=>turn(1);
$('first').onclick=()=>go(0);select.onchange=()=>go(Number(select.value));
$('mode').onclick=()=>{single=!single;save(key+'-single',single);go(page)};
wide.addEventListener('change',()=>{if(pages.length)render()});
$('zoom-close').onclick=()=>zoom.close();
$('zoom-size').onclick=()=>{const actual=zoomImage.classList.toggle('actual');$('zoom-size').textContent=actual?'適合螢幕':'原尺寸細讀';$('zoom-scroll').scrollTo(0,0)};
zoom.addEventListener('close',()=>{zoomImage.removeAttribute('src')});
book.addEventListener('touchstart',e=>{if(e.touches.length===1){const t=e.touches[0];touch={x:t.clientX,y:t.clientY}}else touch=null},{passive:true});
book.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;touch=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){lastSwipe=Date.now();turn(dx<0?1:-1)}},{passive:true});
book.addEventListener('touchcancel',()=>touch=null,{passive:true});
document.addEventListener('keydown',e=>{if(zoom.open||/SELECT|INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowRight'){e.preventDefault();turn(1)}if(e.key==='ArrowLeft'){e.preventDefault();turn(-1)}});
fetch('pages.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('目錄載入失敗');return r.json()}).then(data=>{
 if(!Array.isArray(data.pages)||data.pages.length!==39)throw Error('目錄不完整');
 pages=data.pages;select.replaceChildren();pages.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=String(i+1).padStart(2,'0')+' · '+p.title;select.append(o)});select.disabled=false;
 const hash=location.hash.match(/^#page-(\d+)$/);const saved=hash?Number(hash[1])-1:Number(read(key)||0);go(Number.isInteger(saved)?saved:0);
}).catch(()=>{book.replaceChildren();$('status').textContent='漫畫目錄暫時無法載入，請重新整理，或開啟下方原始漫畫相簿。';book.setAttribute('aria-busy','false')});
})();
