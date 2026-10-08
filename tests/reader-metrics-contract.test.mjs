import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_FIELDS, validateEvent, mayRecordEvent } from '../scripts/reader-metrics-contract.mjs';

const sample = (name) => ({
  name,
  properties: Object.fromEntries(EVENT_FIELDS[name].map(key => [key, key === 'event_version' ? 1 : key === 'chapter_index' ? 0 : 'moonlit_work']))
});

test('all eight specified events have an offline valid contract', () => {
  assert.equal(Object.keys(EVENT_FIELDS).length, 8);
  for (const name of Object.keys(EVENT_FIELDS)) assert.equal(validateEvent(sample(name)), true, name);
});
test('rejects unexpected names, fields, and personal data', () => {
  assert.equal(validateEvent({ name: 'unknown', properties: {} }), false);
  for (const name of Object.keys(EVENT_FIELDS)) {
    for (const key of ['email','ip','url','user_agent','reading_text','session_id','error_message']) {
      const item = sample(name); item.properties[key] = 'private';
      assert.equal(validateEvent(item), false, name + ':' + key);
    }
  }
});
test('rejects malformed properties, version, ids, and chapter index', () => {
  assert.equal(validateEvent(null), false);
  assert.equal(validateEvent({name:'reader_start',properties:null}), false);
  const a=sample('reader_start'); a.properties.chapter_index=-1; assert.equal(validateEvent(a),false);
  const b=sample('reader_start'); b.properties.event_version=2; assert.equal(validateEvent(b),false);
  const c=sample('reader_start'); c.properties.work_id='https://example.org/?email=a'; assert.equal(validateEvent(c),false);
  const d=sample('reader_start'); delete d.properties.work_id; assert.equal(validateEvent(d),false);
});
test('consent and provider review are both required', () => {
  for (const consent of [undefined,false,true]) for (const providerReviewed of [undefined,false,true])
    assert.equal(mayRecordEvent({consent,providerReviewed}), consent===true && providerReviewed===true);
});
