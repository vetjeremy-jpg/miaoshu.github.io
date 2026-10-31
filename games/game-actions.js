(()=>{
 const bar=document.querySelector('.game-actions');if(!bar)return;
 function restart(){
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  if(document.getElementById('restart')){document.getElementById('restart').click();return;}
  document.getElementById('game-restart-choice').showModal();
 }
 bar.querySelector('button').onclick=restart;
 for(const d of document.querySelectorAll('dialog')){
  const row=bar.cloneNode(true);row.removeAttribute('id');row.className='dialog-game-actions';row.querySelector('button').onclick=restart;d.append(row);
 }
 document.querySelectorAll('[data-classic-restart]').forEach(b=>b.onclick=()=>{document.getElementById('game-restart-choice').close();document.getElementById(b.dataset.classicRestart).click();document.getElementById(b.dataset.classicRestart).scrollIntoView({block:'center'});});
 document.getElementById('game-restart-cancel')?.addEventListener('click',()=>document.getElementById('game-restart-choice').close());
})();
