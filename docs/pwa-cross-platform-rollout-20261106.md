# 喵叔 Moonlit Stories — PWA 跨平台驗收計畫

> 測試分支專用。不得直接變更正式站 main。

## 已確認（2026-11-06）
- 正式網站 canonical: https://vetjeremy-jpg.github.io/miaoshu.github.io/
- `site.webmanifest` 已設定 `display: standalone`、`start_url`、`scope` 與 192/512 圖示。
- `index.html` 已連結 manifest、Apple Touch Icon 與 iOS standalone meta。
- `sw.js` 已有 shell/page/runtime 快取、頁面預熱及更新處理。
- `package.json` 已有 `npm run test:pwa`、`npm run test:performance`。

## 待驗證與調整
1. **安裝**：Chrome/Edge Windows、Chrome Android、Safari iOS（分享→加入主畫面），確認金色貓 Logo 未裁切、名稱正確。
2. **啟動**：桌面圖示啟動後沒有一般瀏覽器網址列；內部導覽保持在 APP 範圍；外部連結正確跳出。
3. **快取**：第一次訪問、二次啟動、弱網、離線、更新時均可正常使用；避免 cache-first 長期顯示舊版 HTML。
4. **內容**：小說章節、字級、閱讀位置、專注模式、漫畫翻頁、攝影館外部相簿、影片、遊戲退出與重新開始。
5. **效能**：行動裝置測試 LCP <= 2.5s、INP <= 200ms、CLS <= 0.1（75 百分位）；測量首頁首訪與重訪。
6. **安全**：不可預先快取大量 Degoo 原圖；外部資源載入失敗不可阻塞首頁。
7. **無障礙**：iOS 安全區、320/375/390/430px、鍵盤焦點、螢幕閱讀器標籤。
8. **回歸測試**：`npm run test:pwa`、`npm run test:performance`、`npm run test:gate`，必要時於真機人工驗收。

## 發布門檻
- 不修改原有 Logo 設計。
- 不影響原有小說、漫畫、攝影館、遊戲。
- 僅於測試完成且審核通過後合併 main。
- iOS 安裝入口以 Safari 分享選單為主；不要假設瀏覽器一定支援自動安裝提示。

## 現況
這份文件是實施與驗收清單，不代表跨平台測試已通過。
