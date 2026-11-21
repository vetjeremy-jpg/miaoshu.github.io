/* Moonlit gallery content enhancement — gallery only. */
(()=>{'use strict';const d=document;
if(!d.querySelector(".gallery-to-words")){const host=d.querySelector("main")||d.body,box=d.createElement("aside");box.className="moonlit-crosscuration gallery-to-words";box.innerHTML='<small>PHOTOGRAPHY × WORDS / 攝影 × 文字</small><strong>影像看完了，沿著相同的雪與夜色回到文字。</strong><a href="../books/hiiro-setsugetsusho/">讀《緋色雪月抄》 →</a>　<a href="../works/">從作品星圖繼續探索 →</a>';host.append(box)}
})();
