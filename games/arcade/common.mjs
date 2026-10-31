import {sound} from './sound.mjs?v=20261031-sound2';
export {sound};
export const $=id=>document.getElementById(id);
export function read(key,fallback,valid){try{const s=JSON.parse(localStorage.getItem('moonlit-arcade-v1-'+key));return valid(s)?s:fallback;}catch{return fallback;}}
export function save(key,s){try{localStorage.setItem('moonlit-arcade-v1-'+key,JSON.stringify(s));}catch{if($('save-note'))$('save-note').textContent='此瀏覽器無法存檔；仍可遊玩。';}}
export function status(t){$('status').textContent=t;}
export function complete(title,text,next){sound.play('win');$('complete-title').textContent=title;$('complete-text').textContent=text;$('next').textContent=next?'下一關 →':'再挑戰一次';$('next').onclick=()=>{$('complete').close();next?.();};$('complete').showModal();}
export function wireReset(reset){$('restart').onclick=()=>$('confirm').showModal();$('no').onclick=()=>$('confirm').close();$('yes').onclick=()=>{$('confirm').close();reset();};}
export function arrows(handler){const map={ArrowUp:'U',w:'U',ArrowRight:'R',d:'R',ArrowDown:'D',s:'D',ArrowLeft:'L',a:'L'};window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;const k=map[e.key];if(k){e.preventDefault();handler(k);}});document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>handler(b.dataset.move));}
