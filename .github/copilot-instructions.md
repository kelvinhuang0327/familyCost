# Copilot Instructions for `familyCost`

## 系統架構總覽
- **前端** (`app/frontend/`): 純靜態 HTML/CSS/JS，無框架，直接操作 DOM，資料由後端 API 提供。
- **後端** (`server.js` + `app/backend/`): Node.js + Express，主要 API 入口，負責資料 CRUD、Excel 匯入/匯出、GitHub 雲端同步。
- **資料儲存**：預設僅用 `data/data.json` 檔案（JSON 格式），無資料庫。GitHub 作為備份/同步來源。
- **設定**：環境參數集中於 `app/config/config.js`，支援 local/sit 兩種環境，依 `NODE_ENV` 切換。

## 關鍵開發流程
- **本地啟動**：
  - `npm install` → `npm run start:local` 或執行 `scripts/start_local.sh`
  - 前端靜態檔案由 `python3 -m http.server 8000` 提供（見啟動腳本）
  - 後端 API 預設 http://localhost:3001
- **SIT/Production 啟動**：
  - `scripts/start_sit.sh` 或 Render/Vercel 雲端自動部署
- **資料同步**：
  - 主要以本地 JSON 檔為主，GitHub 僅作備份/還原（見 `GitHubDataManager`）
  - `GITHUB_TOKEN` 需設於環境變數
- **Excel 匯入/匯出**：
  - 透過 `/api/upload` 上傳 Excel，後端自動解析並寫入 JSON
  - 匯出時由後端產生 Excel 檔案

## 專案慣例與注意事項
- **API 路徑**：所有 API 皆以 `/api/` 為前綴
- **資料結構**：`data/data.json` 為主，格式 `{ records: [...] }`
- **多環境支援**：`NODE_ENV` 控制環境，對應不同 API/前端 URL
- **Token 管理**：僅支援 GitHub Token，無其他 OAuth/登入
- **無資料庫**：所有資料皆為檔案型態，無 SQL/NoSQL
- **部署腳本**：所有啟動、切環境、資料轉換皆集中於 `scripts/`
- **前端 JS**：僅用原生 JS，無模組化，所有邏輯集中於 `app/frontend/script.js`

## 重要檔案/目錄
- `server.js`：主後端 API 入口
- `app/backend/github_data_manager.js`：GitHub 同步/備份邏輯
- `app/config/config.js`：環境與參數設定
- `data/data.json`：主資料檔案
- `scripts/`：啟動、環境切換、資料處理腳本
- `app/frontend/`：前端靜態頁面與 JS

## 範例：新增 API 路由
```js
// 在 server.js
app.post('/api/xxx', async (req, res) => {
  // ...邏輯...
});
```

---
如需更動架構，請優先考慮：
- 是否仍維持無資料庫、檔案為主的設計
- 前後端分離是否有必要提升（目前為靜態頁面+API）
- 雲端同步是否需更嚴謹（目前僅備份）
- 腳本與環境切換流程是否可自動化
