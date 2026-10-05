# Moonlit Stories Content Release Gate

> Stable Maintenance：內容優先、證據驅動、禁止無必要 redesign。

## GO / HOLD / NO-GO
- **GO**：內容完整、讀者路徑正常、手機/PWA正常、相關 CI 全綠、沒有無關 UI/CSS 修改。
- **HOLD**：部署尚未同步、CI 尚未完成、或仍待實機確認。等待證據，不做補丁式修改。
- **NO-GO**：缺章、錯誤連結、可重現 PWA/手機問題、Reader Journey 或 Production Smoke 真實失敗。只修 regression。

## 發布前
### 共通
- [ ] 一句話說明本次新增的讀者價值
- [ ] 名稱、日期、繁中、標點與段落完成校對
- [ ] 內部連結無空白或錯誤路徑
- [ ] title / description / canonical / OG 與內容一致
- [ ] 圖片尺寸合理；非首屏圖片不阻塞首屏
- [ ] 沒有順手修改 Hero、首頁結構、CSS、動畫或新增 CTA

### 小說
- [ ] 書房有非空簡介與明確閱讀入口
- [ ] 作品狀態、章節數與正文一致
- [ ] 目錄、上一章、下一章、返回目錄正確
- [ ] 續讀、書籤、字級、搜尋、朗讀正常
- [ ] 《兩種天空》第一部保留 15 章、本部完結、閱讀時間、第一章入口

### 札記
- [ ] 日期、標題、地區、摘要、正文完整
- [ ] 有地圖資料時，地點/座標/articleUrl 正確
- [ ] 時間軸順序正確；手機無橫向溢出

### 攝影作品集
- [ ] 有主題名稱與 100–200 字策展文字
- [ ] 精選照片有開場、發展、收尾；剔除重複畫面
- [ ] 圖片尺寸/lazy loading/srcset 合理
- [ ] 375/390px 與 PWA 可正常觀看
- [ ] 拿掉社群嵌入後仍是一件完整作品

### 作品關聯
- [ ] 每個關聯都有主題/人物/地點/情緒/時代等內容理由
- [ ] 主要作品至少有 2 個合理延伸作品（有內容可關聯時）
- [ ] 連結有效；手機不依賴 hover 才能理解
- [ ] 不為增加星圖密度而硬湊關聯

### 月光來信
- [ ] 有真正的新作品或重要內容才寄送
- [ ] 一段喵叔的話 + 1 件新作品 + 1 件舊作品
- [ ] CTA 直接到作品，連結有效
- [ ] 訂閱承諾與網站一致

## CI Gate
- [ ] Pages Build & Deployment
- [ ] Reader Contract
- [ ] Mobile RWD Contract
- [ ] Internal Links
- [ ] SEO Contract
- [ ] Runtime Contract
- [ ] CSS Ownership
- [ ] JavaScript Syntax
- [ ] P0 Navigation
- [ ] Cross-page RC
- [ ] PWA Lifecycle
- [ ] Editorial / Responsive
- [ ] Novel Reader Journey
- [ ] P1 Interaction
- [ ] Production Smoke（正式環境需要時）

紅燈處理固定為：**看 log → 判斷真 regression / 假陽性 → 可重現 → 最小修正 → PR → CI → merge**。禁止用 production CSS/HTML workaround 迎合脆弱測試。

## 發布後
- [ ] 正式網址與圖片正常
- [ ] 首頁/分類入口可找到新內容
- [ ] 返回路徑正常
- [ ] 320/375/390/430 無橫向溢出或版面破壞
- [ ] iPhone Safari 與 Home Screen PWA 閱讀路徑正常
- [ ] 舊作品與 Newsletter 未受影響

最終只問：**找得到嗎？打得開嗎？讀得完嗎？還想繼續下一件作品嗎？**
