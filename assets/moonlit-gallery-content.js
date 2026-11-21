/* Moonlit gallery content enhancement — gallery only. */
(()=>{'use strict';const d=document;
if(!d.querySelector(".gallery-to-words")){const host=d.querySelector("main")||d.body,box=d.createElement("aside");box.className="moonlit-crosscuration gallery-to-words";box.innerHTML='<small>PHOTOGRAPHY × WORDS / 攝影 × 文字</small><strong>影像看完了，沿著相同的雪與夜色回到文字。</strong><a href="../books/hiiro-setsugetsusho/">讀《緋色雪月抄》 →</a>　<a href="../works/">從作品星圖繼續探索 →</a>';host.append(box)}const first=d.querySelector(".gallery figure");if(first){const note=d.createElement("p");note.className="gallery-story-note";note.textContent="從第一張開始慢慢看：光線、眼神與動作不是單張展示，而是一段依序展開的影像敘事。";first.insertAdjacentElement("beforebegin",note)}
})();
