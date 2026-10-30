(() => {
'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem('moonlit-games-v1-' + key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem('moonlit-games-v1-' + key, JSON.stringify(value)); } catch { $('storage-note').textContent = '目前瀏覽器無法儲存紀錄；仍可正常遊玩，離開後進度可能重置。'; } }
};
// Photography memory game: only these six existing, optimized images are requested.
const photos = [
  ['photo-03.webp', '午後樹影'], ['photo-05.webp', '月映晚霞'],
  ['photo-06.webp', '迎風起勢'], ['photo-15.webp', '藍夜台北'],
  ['photo-16.webp', '城市入夜'], ['photo-18.webp', '台北暮光']
];
let memory = { active: false, paused: false, elapsed: 0, moves: 0, pairs: 0, open: [], locked: false, mismatchLeft: 0 };
const board = $('memory-board');
function memoryRecord() {
  const best = store.get('memory-best', null);
  $('memory-best').textContent = best && Number.isFinite(best.moves) && Number.isFinite(best.seconds) ? `本機最佳：${best.moves} 次翻牌 · ${best.seconds} 秒（以較少次數優先）` : '本機最佳：還沒有紀錄，第一場就從今晚開始。';
}
function conceal(card) {
  card.querySelector('img').hidden = true;
  card.querySelector('span').hidden = false;
  card.setAttribute('aria-label', `第 ${Number(card.dataset.index) + 1} 張，尚未翻開`);
}
function reveal(card) {
  const image = card.querySelector('img');
  image.hidden = image.dataset.failed === 'true';
  card.querySelector('span').hidden = image.dataset.failed !== 'true';
  card.setAttribute('aria-label', `第 ${Number(card.dataset.index) + 1} 張，${photos[Number(card.dataset.photo)][1]}`);
}
function buildMemory(started) {
  const deck = [...photos.keys(), ...photos.keys()];
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  board.replaceChildren();
  deck.forEach((photo, index) => {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'memory-card'; card.dataset.photo = photo; card.dataset.index = index;
    const image = document.createElement('img');
    image.src = '../assets/optimized/' + photos[photo][0]; image.alt = photos[photo][1]; image.width = 240; image.height = 300; image.decoding = 'async'; image.hidden = true;
    image.addEventListener('error', () => { image.dataset.failed = 'true'; card.querySelector('span').textContent = photos[photo][1]; if (memory.open.includes(card) || card.classList.contains('matched')) { image.hidden = true; card.querySelector('span').hidden = false; } });
    const back = document.createElement('span'); back.textContent = '☾'; back.setAttribute('aria-hidden', 'true');
    card.append(image, back); conceal(card); card.disabled = !started;
    card.addEventListener('click', () => flip(card)); board.append(card);
  });
}
function flip(card) {
  if (!memory.active || memory.paused || memory.locked || memory.open.includes(card) || card.classList.contains('matched')) return;
  reveal(card); memory.open.push(card);
  if (memory.open.length < 2) return;
  $('memory-moves').textContent = ++memory.moves;
  const [a, b] = memory.open;
  if (a.dataset.photo === b.dataset.photo) {
    memory.pairs++;
    for (const c of memory.open) { c.classList.add('matched'); c.disabled = true; c.setAttribute('aria-label', c.getAttribute('aria-label') + '，已配對'); }
    memory.open = []; $('memory-pairs').textContent = `${memory.pairs} / 6`;
    $('memory-message').textContent = `找到「${photos[Number(a.dataset.photo)][1]}」！已配對 ${memory.pairs} 組。`;
    if (memory.pairs === 6) {
      memory.active = false; $('memory-pause').disabled = true;
      const seconds = Math.floor(memory.elapsed);
      $('memory-message').textContent = `全部找到了！用了 ${memory.moves} 次翻牌、${seconds} 秒。再來一場，或到攝影館看看吧。`;
      const best = store.get('memory-best', null);
      if (!best || !Number.isFinite(best.moves) || memory.moves < best.moves || (memory.moves === best.moves && seconds < best.seconds)) store.set('memory-best', { moves: memory.moves, seconds });
      memoryRecord();
    }
  } else { memory.locked = true; memory.mismatchLeft = .85; }
}
function pauseMemory(value) {
  if (!memory.active) return;
  memory.paused = value; board.classList.toggle('paused', value);
  for (const card of board.children) card.disabled = value || card.classList.contains('matched');
  $('memory-pause').textContent = value ? '繼續' : '暫停';
  if (!value) ensureFrame();
  $('memory-message').textContent = value ? '已暫停，照片與計時一起休息。' : '繼續尋找相同的光影。';
}
$('memory-start').onclick = () => {
  pauseStars(true);
  memory = { active: true, paused: false, elapsed: 0, moves: 0, pairs: 0, open: [], locked: false, mismatchLeft: 0 };
  board.classList.remove('paused'); buildMemory(true);
  $('memory-start').textContent = '重新洗牌'; $('memory-pause').disabled = false; $('memory-pause').textContent = '暫停';
  $('memory-pairs').textContent = '0 / 6'; $('memory-moves').textContent = '0'; $('memory-time').textContent = '0 秒';
  $('memory-message').textContent = '挑兩張牌，找找看相同的照片。'; ensureFrame();
};
$('memory-pause').onclick = () => pauseMemory(!memory.paused);
buildMemory(false); memoryRecord();

// Original standalone branching fiction; no changes to published novels.
const scenes = {
  platform: { title: '一封沒有地址的信', chapter: '序幕 / 月台', text: ['晚上十一點五十分，雨停在老車站的屋簷邊。你是車站最後一晚的值班員。明天起，這條支線就要停駛了。', '長椅底下，一隻金色小貓壓著一封信。信封只寫了：「請交給還在等的人。」遠處，最後一班列車亮起頭燈。'], choices: [['蹲下來，看看小貓守著什麼', 'cat'], ['先去問問站長，這封信的來歷', 'keeper']] },
  cat: { title: '小貓帶路', chapter: '第一幕 / 等待', text: ['小貓沒有躲開。牠用鼻尖碰了碰你的手，然後走向上鎖的候車室。', '玻璃後有一只舊皮箱，箱面寫著「林秋月」。你想起站長每天收班前，總會多看這間房一眼。'], choices: [['帶著信，請站長打開候車室', 'room'], ['時間不多了，先帶信登上列車', 'train']] },
  keeper: { title: '他一直沒收起的時刻表', chapter: '第一幕 / 舊事', text: ['站長聽見信封上的字，手停在舊時刻表上。「秋月每年都說要回來，後來信也不寫了。她弟弟還住在河那頭。」', '他拿出候車室的鑰匙：「要不要再看一眼？也許她留過什麼。」列車即將進站，雨後的鐵軌映著月光。'], choices: [['打開候車室，找找留下的線索', 'room'], ['到河邊，找那位等信的人', 'river']] },
  room: { title: '皮箱裡的車票', chapter: '第二幕 / 留下的東西', text: ['皮箱裡只有一張未使用的車票和一張照相館收據。背面寫著：「那天沒能道別，照片替我留著。」', '站長輕聲說，照相館就在河邊。你把信翻過來，封口已經鬆開；裡面的第一行寫著：「阿弟，別再怪自己。」'], choices: [['帶著信和收據，去河邊照相館', 'photo'], ['邀站長一起搭最後一班車，沿途尋找收信人', 'train']] },
  train: { title: '最後一班車', chapter: '第二幕 / 出發', text: ['車門將關時，站長追上來，把一把舊鑰匙放進你掌心。「河邊那間照相館的。他弟弟叫阿遠。」', '你在靠窗的位置坐下。下一站是河岸，終點是你從沒去過的小鎮。小貓在月台上望著你，像在等待你的答案。'], choices: [['在河岸下車，替這封信找到阿遠', 'photo'], ['把信交給列車長，請他轉交阿遠，自己往終點走', 'dawn']] },
  river: { title: '亮著燈的照相館', chapter: '第二幕 / 河岸', text: ['照相館還亮著燈。一位老人正把玻璃櫥窗裡的合照翻過來。照片上的女子站在車站前，笑得瞇起眼睛。', '「我是阿遠。」他看著你手上的信，沒有伸手。「這麼多年了，我一直不知道，她是不是在怪我。」'], choices: [['把信交給他，陪他坐一會', 'reunion'], ['問他願不願意帶著合照，回車站看最後一班車', 'return']] },
  photo: { title: '照片背面的名字', chapter: '第三幕 / 相認', text: ['阿遠打開照相館的門。你說起信、皮箱與那張沒用過的車票。他從抽屜拿出一張合照：「她走的那天，我沒有去送。」', '信裡寫著：「我去遠方是自己的決定。若你還想我，就到車站走走。那裡有人記得我們年輕的模樣。」阿遠的手微微發抖。'], choices: [['陪他把信讀完，讓道別留在這裡', 'reunion'], ['邀他帶上照片，回車站跟站長見面', 'return']] },
  reunion: { title: '結局一 / 信終於到家', ending: true, text: ['你們在照相館裡坐到天亮。阿遠讀了兩遍信，第三遍時，終於能平靜地念出姐姐的名字。', '他沒有等到她回來，卻不必再替那年的離別負責。離開前，他替你拍了一張照片，說下次來取。', '你答應了。這一回，約定有了地址。'] },
  return: { title: '結局二 / 月台上的重逢', ending: true, text: ['你們趕回車站時，列車剛駛過河橋。站長還沒關燈。阿遠把合照放上售票窗口，站長一眼就認出照片裡的自己。', '三個人站在同一盞燈下，說起秋月愛坐哪個位置、總買哪一種糖。金色小貓跳上長椅，縮成一個小小的月亮。', '車站明天就要關了，但那些被好好記住的人，終於又見了一面。'] },
  dawn: { title: '結局三 / 向天亮出發', ending: true, text: ['列車長記下照相館的地址，把信妥善收進皮包。你看著河岸的燈遠去，第一次沒有在熟悉的站下車。', '到終點時，山後已經亮了。手機收到列車長的訊息：「信送到了。老人家說謝謝你。」', '你收起手機，走進晨光。有人終於等到消息，而你開始尋找下一個想停留的地方。'] },
  home: { title: '結局四 / 留下一盞燈', ending: true, text: ['你把照相館的地址寫在信封上，託站長天亮後親手送去。他點了頭，把信放進胸前的口袋。', '你留下來，和小貓收好長椅、掃去地上的雨水。關燈前，你替牠在值班室安置了一個紙箱。', '明天，你會帶牠回家。最後一晚的車站，沒有留下任何一個無處可去的身影。'] }
};
// A fourth route from the opening preserves a complete, deliberate choice.
scenes.platform.choices.push(['請站長明早送信，今晚留下來照顧小貓', 'home']);
let storySaved = store.get('story', {});
let endings = Array.isArray(storySaved.endings) ? storySaved.endings.filter(id => scenes[id]?.ending) : [];
let sceneId = scenes[storySaved.scene] ? storySaved.scene : 'platform';
function renderScene(id, focus = false) {
  sceneId = id; const s = scenes[id];
  if (s.ending && !endings.includes(id)) endings.push(id);
  $('story-chapter').textContent = s.chapter || '終幕 / 你的月光'; $('scene-title').textContent = s.title;
  $('story-text').replaceChildren(...s.text.map(t => { const p = document.createElement('p'); p.textContent = t; return p; }));
  $('story-choices').replaceChildren();
  for (const [label, next] of s.choices || [['再走一條不同的路', 'platform']]) {
    const button = document.createElement('button'); button.textContent = label; button.onclick = () => renderScene(next, true); $('story-choices').append(button);
  }
  $('story-record').textContent = `已收藏 ${endings.length} / 4 種結局` + (endings.length ? '：' + endings.map(e => scenes[e].title.split(' / ')[1]).join('、') : ' · 選擇會自動儲存');
  store.set('story', { scene: id, endings });
  if (focus) $('scene-title').focus({ preventScroll: true });
}
$('story-restart').onclick = () => renderScene('platform', true);
renderScene(sceneId);

// Star catcher uses a fixed logical coordinate space for consistent phone/desktop play.
const canvas = $('stars-canvas'); const ctx = canvas.getContext('2d');
let star = { active: false, paused: false, elapsed: 0, score: 0, lives: 3, x: 360, objects: [], spawn: 0, hit: 0 };
const held = new Set();
function starRecord() { const n = store.get('stars-best', 0); $('stars-best').textContent = `本機最高：${Number.isFinite(n) ? n : 0} 分`; }
function starStats() {
  $('stars-score').textContent = star.score; $('stars-time').textContent = `${Math.max(0, Math.ceil(60 - star.elapsed))} 秒`;
  $('stars-lives').textContent = '♥'.repeat(star.lives) + '♡'.repeat(3 - star.lives);
  $('stars-lives').setAttribute('aria-label', `剩餘 ${star.lives} 顆愛心`);
  $('stars-position').value = Math.round(star.x / 720 * 100);
}
function pauseStars(value) {
  if (!star.active) return; star.paused = value; held.clear();
  if (!value) ensureFrame();
  $('stars-pause').textContent = value ? '繼續' : '暫停';
  $('stars-message').textContent = value ? '已暫停。按「繼續」，再替小貓收集星光。' : '收集星星，小心烏雲！'; drawStars();
}
function endStars() {
  star.active = false; held.clear(); $('stars-pause').disabled = true;
  const old = store.get('stars-best', 0);
  if (!Number.isFinite(old) || star.score > old) store.set('stars-best', star.score);
  $('stars-message').textContent = `${star.lives ? '時間到！' : '愛心用完了！'}今晚收集了 ${star.score} 分星光。按「再玩一次」重新出發。`;
  $('stars-start').textContent = '再玩一次'; starStats(); starRecord(); drawStars();
}
function starShape(x, y, r) {
  ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * .45 : r; const px = x + Math.cos(a) * radius, py = y + Math.sin(a) * radius; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill();
}
function drawStars() {
  if (!ctx) return;
  ctx.clearRect(0, 0, 720, 720);
  const sky = ctx.createLinearGradient(0, 0, 0, 720); sky.addColorStop(0, '#0b1b2b'); sky.addColorStop(1, '#25454c'); ctx.fillStyle = sky; ctx.fillRect(0, 0, 720, 720);
  for (let i = 0; i < 36; i++) { ctx.globalAlpha = .2 + (i % 3) * .15; ctx.fillStyle = '#ead6a4'; ctx.beginPath(); ctx.arc((i * 137 + 25) % 720, (i * 83 + 15) % 590, i % 3 === 0 ? 2 : 1, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.fillStyle = '#e8c987'; ctx.beginPath(); ctx.arc(620, 90, 39, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0e2030'; ctx.beginPath(); ctx.arc(638, 77, 36, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#718b87'; ctx.globalAlpha = .25; ctx.beginPath(); ctx.ellipse(360, 730, 440, 72, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  for (const o of star.objects) {
    ctx.fillStyle = o.cloud ? '#b2c9d3' : '#f5d486';
    if (o.cloud) { ctx.beginPath(); ctx.ellipse(o.x, o.y, 29, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(o.x - 9, o.y - 13, 16, 0, Math.PI * 2); ctx.arc(o.x + 10, o.y - 9, 18, 0, Math.PI * 2); ctx.fill(); }
    else starShape(o.x, o.y, 22);
  }
  ctx.save(); ctx.translate(star.x, 626);
  ctx.fillStyle = star.hit > 0 ? '#f2a4a0' : '#e8c987';
  ctx.beginPath(); ctx.moveTo(-35, 5); ctx.lineTo(-40, -41); ctx.lineTo(-12, -23); ctx.quadraticCurveTo(0, -28, 12, -23); ctx.lineTo(40, -41); ctx.lineTo(35, 5); ctx.bezierCurveTo(56, 47, -56, 47, -35, 5); ctx.fill();
  ctx.fillStyle = '#172e3a'; ctx.beginPath(); ctx.arc(-16, 0, 3, 0, Math.PI * 2); ctx.arc(16, 0, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#172e3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 13); ctx.quadraticCurveTo(0, 21, 6, 13); ctx.moveTo(-25, 13); ctx.lineTo(-49, 9); ctx.moveTo(25, 13); ctx.lineTo(49, 9); ctx.stroke(); ctx.restore();
  if (!star.active || star.paused) {
    ctx.fillStyle = '#091722b8'; ctx.fillRect(0, 0, 720, 720); ctx.textAlign = 'center'; ctx.fillStyle = '#e8c987'; ctx.font = '32px system-ui'; ctx.fillText(star.paused ? '月光小憩 · 已暫停' : star.elapsed > 0 ? `今晚收集 ${star.score} 分星光` : '準備接住今晚的星光？', 360, 330);
    ctx.fillStyle = '#d0dce0'; ctx.font = '21px system-ui'; ctx.fillText(star.paused ? '按上方「繼續」回到遊戲' : '按上方按鈕，與小貓一起出發', 360, 377);
  }
}
$('stars-start').onclick = () => {
  if (!ctx) return;
  pauseMemory(true);
  star = { active: true, paused: false, elapsed: 0, score: 0, lives: 3, x: 360, objects: [], spawn: .25, hit: 0 }; held.clear();
  $('stars-start').textContent = '重新開始'; $('stars-pause').disabled = false; $('stars-pause').textContent = '暫停';
  $('stars-message').textContent = '收集星星，小心烏雲！'; starStats(); drawStars(); ensureFrame();
};
$('stars-pause').onclick = () => pauseStars(!star.paused);
function moveTo(x) { if (!star.active || star.paused) return; star.x = Math.max(44, Math.min(676, x)); $('stars-position').value = Math.round(star.x / 720 * 100); }
$('stars-position').oninput = e => moveTo(Number(e.target.value) / 100 * 720);
function pointerMove(e) { const r = canvas.getBoundingClientRect(); moveTo((e.clientX - r.left) / r.width * 720); }
canvas.addEventListener('pointerdown', e => { canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId); pointerMove(e); });
canvas.addEventListener('pointermove', e => { if (e.buttons) pointerMove(e); });
for (const [id, dir] of [['stars-left', 'left'], ['stars-right', 'right']]) {
  const b = $(id);
  b.addEventListener('pointerdown', e => { if (star.active && !star.paused) { b.setPointerCapture(e.pointerId); held.add(dir); } });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(event, () => held.delete(dir));
  b.addEventListener('click', () => moveTo(star.x + (dir === 'left' ? -48 : 48)));
}
$('stars').addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); held.add(e.key === 'ArrowLeft' ? 'left' : 'right'); }
  if (e.code === 'Space' && e.target === canvas && !e.repeat) { e.preventDefault(); pauseStars(!star.paused); }
});
addEventListener('keyup', e => { if (e.key === 'ArrowLeft') held.delete('left'); if (e.key === 'ArrowRight') held.delete('right'); });
addEventListener('blur', () => { held.clear(); pauseStars(true); pauseMemory(true); });
canvas.addEventListener('blur', () => held.clear());
function tickStars(dt, elapsedDt) {
  star.elapsed = Math.min(60, star.elapsed + elapsedDt); star.hit = Math.max(0, star.hit - dt);
  const dir = Number(held.has('right')) - Number(held.has('left')); moveTo(star.x + dir * dt * 480);
  star.spawn -= dt;
  if (star.spawn <= 0) { star.objects.push({ x: 35 + Math.random() * 650, y: -35, cloud: Math.random() < .22 }); star.spawn = .52; }
  for (const o of star.objects) {
    o.y += dt * (175 + star.elapsed * 2);
    if (o.y >= 580 && o.y <= 670 && Math.abs(o.x - star.x) < (o.cloud ? 58 : 53)) {
      o.caught = true;
      if (o.cloud) { star.lives = Math.max(0, star.lives - 1); star.score = Math.max(0, star.score - 15); star.hit = .35; $('stars-message').textContent = `碰到烏雲，剩餘 ${star.lives} 顆愛心。`; }
      else star.score += 10;
      if (!star.lives) break;
    }
  }
  star.objects = star.objects.filter(o => !o.caught && o.y < 770);
  starStats();
  if (!star.lives || star.elapsed >= 60) endStars(); else drawStars();
}
let last = performance.now(); let frameId = null;
function ensureFrame() {
  if (frameId === null && !document.hidden) { last = performance.now(); frameId = requestAnimationFrame(frame); }
}
function frame(now) {
  frameId = null;
  const elapsedDt = Math.max(0, (now - last) / 1000);
  const dt = Math.min(.05, elapsedDt); last = now;
  if (memory.active && !memory.paused) {
    memory.elapsed += elapsedDt; $('memory-time').textContent = `${Math.floor(memory.elapsed)} 秒`;
    if (memory.locked) {
      memory.mismatchLeft -= dt;
      if (memory.mismatchLeft <= 0) { memory.open.forEach(conceal); memory.open = []; memory.locked = false; }
    }
  }
  if (star.active && !star.paused) tickStars(dt, elapsedDt);
  if ((memory.active && !memory.paused) || (star.active && !star.paused)) frameId = requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pauseMemory(true); pauseStars(true); cancelAnimationFrame(frameId); frameId = null; }
  else if ((memory.active && !memory.paused) || (star.active && !star.paused)) ensureFrame();
});
// Moving to a different game should never leave a running challenge behind.
for (const link of document.querySelectorAll('a[href^="#"]')) link.addEventListener('click', () => {
  if (link.hash !== '#memory') pauseMemory(true);
  if (link.hash !== '#stars') pauseStars(true);
});
if (!ctx) { $('stars-start').disabled = true; $('stars-message').textContent = '目前瀏覽器不支援畫布，請先玩另外兩款遊戲。'; }
starRecord(); drawStars();
})();
