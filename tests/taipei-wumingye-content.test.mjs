import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('臺北無名夜 publishes the approved fifty-nine chapters without dropping or changing paragraphs',()=>{
 const source=JSON.parse(fs.readFileSync('books/taipei-wumingye.json','utf8'));
 const html=fs.readFileSync('books/taipei-wumingye/index.html','utf8');
 const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
 const sections=[...html.matchAll(/<section class="chapter" id="chapter-(\d+)"[^>]*>([\s\S]*?)<\/section>/g)];
 assert.equal(source.chapters.length,59);
 assert.equal(source.chapters[0].title,'第一章　雨往上落的時候');
 assert.equal(source.chapters[58].title,'第五十九章　我在這裡');
 assert.equal(sections.length,59);
 let characters=0;
 source.chapters.forEach((chapter,i)=>{
  assert.equal(Number(sections[i][1]),i+1);
  assert.ok(sections[i][2].includes(`<h2 id="heading-${i+1}">${escape(chapter.title)}</h2>`));
  const paragraphs=[...sections[i][2].matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m=>m[1]);
  assert.deepEqual(paragraphs,chapter.paragraphs.map(escape),`chapter ${i+1} must preserve the complete source`);
  characters+=chapter.paragraphs.join('').match(/[\u3400-\u9fff]/g)?.length||0;
 });
 assert.ok(characters>=80000);
 assert.ok(source.chapters[58].paragraphs.at(-1).includes('全書完'));
});
