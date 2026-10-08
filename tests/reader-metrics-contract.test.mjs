import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const spec=readFileSync(new URL('../docs/reader-metrics-contract-v1.md',import.meta.url),'utf8');
const schema=Object.freeze({
  reader_start:['work_id','chapter_index','event_version'],
  reader_next_chapter:['work_id','chapter_index','event_version'],
  reader_complete:['work_id','chapter_index','event_version'],
  explore_open:['entry_id','destination_id','event_version'],
  explore_arrive:['entry_id','destination_id','event_version'],
  subscribe_submit:['form_id','event_version'],
  subscribe_success:['form_id','event_version'],
  subscribe_failure:['form_id','event_version']
});
const forbidden=new Set(['email','ip','name','user_agent','url','query','content','text','location','cookie','fingerprint','device_id','session_id','user_id']);
function validate(name,payload){
  assert.ok(Object.hasOwn(schema,name),'event must be allowlisted');
  assert.equal(payload!==null && typeof payload==='object' && !Array.isArray(payload),true,'payload must be an object');
  assert.deepEqual(Object.keys(payload).sort(),[...schema[name]].sort(),'payload keys must exactly match the allowlist');
  for(const key of Object.keys(payload)) assert.ok(!forbidden.has(key.toLowerCase()),'forbidden field');
  assert.equal(Number.isInteger(payload.event_version)&&payload.event_version>0,true,'event_version must be a positive integer');
  if('chapter_index' in payload) assert.equal(Number.isInteger(payload.chapter_index)&&payload.chapter_index>=0,true,'chapter_index must be a nonnegative integer');
  for(const key of ['work_id','entry_id','destination_id','form_id'])
    if(key in payload) assert.match(payload[key],/^[a-z0-9_-]{1,64}$/,'identifier must be a fixed nonpersonal token');
}

test('all eight events are documented',()=>{
  for(const event of Object.keys(schema)) assert.ok(spec.includes('`'+event+'`'),event+' missing from spec');
});
test('valid minimal events pass',()=>{
  for(const [name,keys] of Object.entries(schema)){
    const payload=Object.fromEntries(keys.map(k=>[k,k==='event_version'?1:k==='chapter_index'?0:'fixed_code']));
    assert.doesNotThrow(()=>validate(name,payload));
  }
});
test('unknown event and extra sensitive fields are rejected',()=>{
  assert.throws(()=>validate('page_view',{event_version:1}));
  for(const key of forbidden) assert.throws(()=>validate('subscribe_success',{form_id:'newsletter',event_version:1,[key]:'secret'}));
});
test('missing and malformed fields are rejected',()=>{
  assert.throws(()=>validate('reader_start',{work_id:'novel',event_version:1}));
  assert.throws(()=>validate('reader_start',{work_id:'novel',chapter_index:-1,event_version:1}));
  assert.throws(()=>validate('subscribe_success',{form_id:'reader@example.com',event_version:1}));
  assert.throws(()=>validate('subscribe_success',{form_id:'newsletter',event_version:0}));
});
test('offline contract has no transport or persistent storage',()=>{
  const source=readFileSync(new URL(import.meta.url),'utf8');
  for(const forbiddenCall of [/\\bfetch\\s*\\(/,/XMLHttpRequest/,/sendBeacon/,/localStorage/,/sessionStorage/,/document\\.cookie/])
    assert.equal(forbiddenCall.test(source),false,'offline contract must not access transport or storage');
});
