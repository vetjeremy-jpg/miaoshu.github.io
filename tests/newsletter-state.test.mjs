import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../newsletter/index.html', import.meta.url), 'utf8');
const defaultTitle = html.match(/<h1\s+id="title">([^<]*)<\/h1>/)?.[1];
const defaultMessage = html.match(/<p\s+id="message">([^<]*)<\/p>/)?.[1];
const statusScript = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .find(script => script.includes('new URLSearchParams(location.search)'));

function renderStatus(search) {
  assert.ok(defaultTitle && defaultMessage && statusScript, 'newsletter status page structure must remain available');
  const elements = { title: { textContent: defaultTitle }, message: { textContent: defaultMessage } };
  runInNewContext(statusScript, {
    URLSearchParams,
    location: { search },
    document: { getElementById: id => elements[id] }
  }, { timeout: 1000 });
  return { title: elements.title.textContent, message: elements.message.textContent };
}

test('opening the status page directly must not claim a subscription succeeded', () => {
  for (const search of ['', '?', '?state=', '?state=unknown']) {
    const result = renderStatus(search);
    assert.match(result.title + result.message, /首頁|訂閱資訊|填寫/);
    assert.doesNotMatch(result.title + result.message, /已收到你的訂閱|你的訂閱已確認|已成功訂閱/);
  }
});

test('status page remains honest when JavaScript is disabled', () => {
  assert.match(defaultTitle + defaultMessage, /首頁|訂閱資訊|填寫/);
  assert.doesNotMatch(defaultTitle + defaultMessage, /已收到你的訂閱|你的訂閱已確認|已成功訂閱/);
});

test('the confirmed state retains its existing confirmation message', () => {
  const result = renderStatus('?state=confirmed');
  assert.match(result.title, /歡迎來到月光之下/);
  assert.match(result.message, /訂閱已確認/);
});

test('the error state retains its retry instructions', () => {
  const result = renderStatus('?state=error');
  assert.match(result.title, /沒有成功送出/);
  assert.match(result.message, /回到首頁重新輸入/);
});
