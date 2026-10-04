
(()=>{
 const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
 const set=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
 const legacyTitles=["楔子","第一章：貓一樣的女人","第二章：在戰火中盛開的玫瑰","第三章：血濺眉心，羅曼史的終結","第四章：戰火下的情義與白色山茶花","第五章：亂世浮萍，渡海歸來","第六章：竹籬笆裡的孤獨與情義","第七章：被詛咒的幸福與飛蛾的最終一舞","第八章：三隻小鳥的母親與海洋的呼喚","第九章：海的呼喚與遲來的寧靜","第十章：夕陽下的淚痕與永恆的承諾","第十一章：故事的餘溫","第十二章：一場與命運的賭博","第十三章：遲來的幸福","第十四章：故事的永恆"];
 const books=[...document.querySelectorAll('#book .novel-card')].map(card=>({id:card.dataset.bookId,title:card.querySelector('h3')?.textContent,url:card.querySelector('a')?.getAttribute('href')?.split('#')[0]})).filter(book=>/^[a-z0-9-]+$/.test(book.id)&&book.title&&book.url);
 const chapterId=id=>get('miaoshu-'+id+'-chapter')||(id==='fushengsuiyue'?get('miaoshu-reading-chapter'):null);
 const validChapter=id=>/^chapter-[1-9]\d*$/.test(id||'');
 const chapterTitle=(book,id)=>{
  let titles;try{titles=JSON.parse(get('miaoshu-'+book.id+'-chapter-titles')||'{}')}catch(e){titles={}}
  const n=Number(id.slice(8));
  return titles?.[id]||(book.id==='fushengsuiyue'?legacyTitles[n-1]:null)||'第 '+n+' 章';
 };
 const reading=books.map(book=>({book,id:chapterId(book.id),time:Number(get('miaoshu-'+book.id+'-last-read-at'))||0})).filter(item=>validChapter(item.id)).sort((a,b)=>b.time-a.time)[0];
 if(reading){
  const box=document.getElementById('continue-reading');
  document.getElementById('continue-label').textContent='上次讀到'+reading.book.title+'：'+chapterTitle(reading.book,reading.id);
  document.getElementById('continue-link').href=reading.book.url+'#'+reading.id;
  box.classList.add('is-visible');
 }
 const shelf=document.getElementById('saved-chapters');
 const shelfSection=document.getElementById('reading-list');
 const saved=books.flatMap(book=>{
  let ids;try{ids=JSON.parse(get('miaoshu-'+book.id+'-bookmarks')||(book.id==='fushengsuiyue'?get('miaoshu-saved-chapters'):null)||'[]')}catch(e){ids=[]}
  return Array.isArray(ids)?[...new Set(ids)].filter(validChapter).map(id=>({book,id})):[];
 });
 if(saved.length){if(shelfSection)shelfSection.hidden=false;shelf.replaceChildren();saved.forEach(({book,id})=>{const li=document.createElement('li'),a=document.createElement('a');a.href=book.url+'#'+id;a.textContent=book.title+' · '+chapterTitle(book,id);li.append(a);shelf.append(li)})}
})();
