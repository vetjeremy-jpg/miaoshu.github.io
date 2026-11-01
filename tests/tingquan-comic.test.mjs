import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const dir=new URL('../books/jiankangjie-tingquanyin/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('comic/pages.json',dir),'utf8'));
test('comic includes every original chapter in novel order, with unique external images',()=>{
 const headings=[...readFileSync(new URL('index.html',dir),'utf8').matchAll(/<h2 id="heading-\d+">(.*?)<\/h2>/g)].map(m=>m[1]);
 assert.equal(manifest.pages.length,39);
 assert.deepEqual(manifest.pages.map(p=>p.title),headings);
 assert.equal(new Set(manifest.pages.map(p=>p.imageUrl)).size,39);
 manifest.pages.forEach((p,i)=>{assert.equal(p.chapter,i);assert.match(p.imageUrl,/^https:\/\/lh3\.googleusercontent\.com\/[^=]+=s0$/)});
 assert.ok(readdirSync(new URL('comic/',dir)).every(n=>!/\.(png|jpe?g|webp)$/i.test(n)));
});
test('manual image-heading mapping corrects the shuffled upload order',()=>{
 // Original image headings visually verified on 2026-11-01: chapters 4/5,
 // 9/11, 17/20, and 32/37 are not in upload or filename order.
 for(const [chapter,id] of [[0,'20971169679'],[4,'20971169693'],[5,'20971169691'],[9,'20971169711'],[11,'20971169696'],[17,'20971169719'],[20,'20971169726'],[32,'20971169742'],[37,'20971169744'],[38,'20971169778']]) assert.equal(manifest.pages[chapter].degooFileId,id);
});
