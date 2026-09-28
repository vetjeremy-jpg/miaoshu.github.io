# 喵叔小說閱讀頁標準

《浮生歲月》是本站所有小說的閱讀設計基準。現有的《兩種天空》也使用同一套 `reader.css` 與 `reader.js`，包括全文目錄、章節搜尋、字級調整、閱讀進度、書籤、章節分享、讀後留言入口及各章按讚。每本書以 `data-book-id` 分開儲存進度、書籤與按讚資料；《浮生歲月》的既有按讚鍵保留，以免舊數字消失。

## 新增小說

1. 準備一個 UTF-8 JSON 檔，內容如下。`id` 是網址資料夾名稱，只能使用英文小寫字母、數字及連字號。每個段落放在 `paragraphs` 中，產生器會安全地轉成 HTML。

```json
{
  "id": "new-story",
  "title": "新故事",
  "description": "這部小說的簡短介紹。",
  "chapters": [
    { "title": "楔子", "paragraphs": ["第一段正文。", "第二段正文。"] },
    { "title": "第一章：相遇", "paragraphs": ["第一章正文。"] }
  ]
}
```

2. 執行 `node books/create-novel.mjs books/new-story.json`。產生器會建立 `books/new-story/index.html`，套用同款頁首、小說封面區、目錄、章節、頁尾與共用互動。小說資料 JSON 請一併保留，供日後修改與重新產生。不要直接改動共用功能的 HTML 結構。
3. 在首頁 `index.html` 的小說區加入新書連結。執行 `node books/check-readers.mjs`，確認所有小說都有完整閱讀元件和連續的章節目錄。GitHub Actions 也會在後續提交時執行同一項檢查。

如需手動製作頁面，可參考 `books/_template/index.html`，但必須填妥 SEO 資料、移除 `noindex` 並通過同一項檢查。\n\n調整所有小說的介面時，修改 `books/reader.css` 或 `books/reader.js`。既有正文不用重寫；新書使用產生器即可繼承後續的共用介面更新。
