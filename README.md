# 💰 家庭收支管理平台

一個現代化的家庭財務管理應用，支持多設備同步和雲端備份。

## 📁 項目結構

```
familyCost/
├── app/                          # 應用程式目錄
│   ├── frontend/                 # 前端文件
│   │   └── index.html            # 主應用界面（包含所有 CSS 和 JavaScript）
│   ├── backend/                  # 後端模組
│   │   ├── github_data_manager.js  # GitHub 數據管理
│   │   └── token_manager.js        # Token 管理
│   └── config/                   # 配置文件
│       └── config.js             # 環境配置
├── data/                         # 數據目錄
│   ├── data.json                 # 主要數據存儲
│   ├── data_backup.json          # 數據備份
│   ├── version.json              # 版本信息
│   └── backups/                  # 歷史備份
├── scripts/                      # 工具腳本
│   ├── start_local.sh            # 啟動本地服務
│   ├── start_sit.sh              # 啟動 SIT 服務
│   ├── start_services.sh         # 啟動生產服務
│   ├── switch_env.sh             # 切換環境
│   ├── set_token.sh              # 設置 GitHub Token
│   ├── update-version.js         # 版本更新
│   ├── show_version.js           # 顯示版本
│   ├── clean_data.js             # 清理數據
│   ├── env.local                 # 本地環境變數
│   ├── env.sit                   # SIT 環境變數
│   └── pre-commit                # Git 提交前鉤子
├── uploads/                      # 上傳文件目錄
├── server.js                     # 主服務器文件
├── package.json                  # 項目配置
├── env.example                   # 環境變數範例
├── render.yaml                   # Render 部署配置
└── README.md                     # 項目說明
```

## 🚀 快速開始

### 本地開發

```bash
# 1. 安裝依賴
npm install

# 2. 設置環境變數
cp env.example .env
# 編輯 .env 文件，設置 GITHUB_TOKEN

# 3. 啟動本地服務
npm run local
# 或使用腳本
bash scripts/start_local.sh
```

### Render 雲端部署

```bash
# 1. 推送代碼到 GitHub
git push origin main

# 2. 在 Render Dashboard 設置環境變數
# - GITHUB_TOKEN: 你的 GitHub Personal Access Token
# - GITHUB_OWNER: kelvinhuang0327
# - GITHUB_REPO: familyCost
# - GITHUB_BRANCH: main

# Render 會自動部署
```

詳細部署說明請參考 [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

## 🌍 環境配置

系統支持多環境配置：

- **local**: 本地開發環境（使用 .env 文件）
- **sit**: 測試環境
- **production**: 生產環境（Render）

### 環境變數

必需的環境變數：

```bash
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=kelvinhuang0327
GITHUB_REPO=familyCost
GITHUB_BRANCH=main
NODE_ENV=production
PORT=10000
```

## 📊 功能特性

### 核心功能
- ✅ 收支記錄管理（新增、編輯、刪除、查詢）
- ✅ 多成員支出統計
- ✅ 月度支出分析
- ✅ 日曆視圖
- ✅ Excel 數據導入/導出

### 數據管理
- ✅ 本地文件存儲（data/data.json）
- ✅ 手動 GitHub 同步備份
- ✅ 自動版本管理
- ✅ 數據備份機制

### 界面特性
- ✅ 響應式設計（支持手機、平板、桌面）
- ✅ 移動端滑動效果
- ✅ 現代化 UI/UX
- ✅ 跨瀏覽器兼容

## 🔧 技術棧

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **後端**: Node.js, Express.js
- **數據存儲**: JSON 文件, GitHub API
- **部署**: Render
- **版本控制**: Git, GitHub

## 📝 數據流程

### 讀取數據
```
所有 API 請求 → 讀取本地 data/data.json → 返回數據
```

### 寫入數據
```
所有數據操作 → 保存到本地 data/data.json → 返回成功
```

### GitHub 同步
```
手動點擊 "GitHub 同步" → 讀取本地數據 → 寫入 GitHub → 返回狀態
```

## 🛠️ 常用腳本

```bash
# 啟動本地服務
npm run local

# 啟動開發模式
npm run dev

# 啟動生產模式
npm start

# 更新版本號
npm run version:update

# 顯示當前版本
npm run version:show

# 設置 GitHub Token（本地）
bash scripts/set_token.sh your_github_token
```

## 📝 版本管理

版本號自動生成，格式：`YYYY-MM-DD HH:MM:SS`

每次 Git commit 時，pre-commit hook 會自動更新版本號到 `data/version.json`

查看當前版本：
```bash
npm run version:show
# 或
cat data/version.json
```

## 🔐 安全性

- ✅ GitHub Token 通過環境變數管理
- ✅ .env 文件已加入 .gitignore
- ✅ 敏感信息不會提交到 Git
- ✅ Render 環境變數安全存儲

## 📖 API 文檔

### 記錄管理
- `GET /api/records` - 獲取所有記錄
- `POST /api/records` - 新增記錄
- `PUT /api/records/:id` - 更新記錄
- `DELETE /api/records/:id` - 刪除單筆記錄
- `DELETE /api/records` - 批量刪除記錄
- `POST /api/records/clear` - 清空所有記錄
- `POST /api/records/import` - 導入記錄

### GitHub 同步
- `POST /api/github/sync` - 手動同步到 GitHub
- `GET /api/github/token/status` - 檢查 Token 狀態

### 系統
- `GET /api/health` - 健康檢查
- `GET /api/version` - 獲取版本信息

## 🐛 故障排除

### Token 相關問題

**問題：Token 檢查顯示未設置**

解決方案：
1. 檢查 .env 文件是否存在且包含 GITHUB_TOKEN
2. 重啟服務
3. 在 Render Dashboard 確認環境變數已設置

**問題：GitHub 同步失敗**

解決方案：
1. 檢查 Token 權限（需要 repo 權限）
2. 確認網絡連接
3. 查看服務器日誌

### 數據相關問題

**問題：數據丟失**

解決方案：
1. 檢查 data/data_backup.json
2. 檢查 data/backups/ 目錄
3. 從 GitHub 恢復數據

## 📄 更新日誌

最新版本信息請查看 `data/version.json`

主要更新：
- **2025-09-30**: 統一改為本地數據讀取，手動 GitHub 同步
- **2025-09-28**: 修復編輯功能，優化 UI/UX
- **2025-09-26**: 簡化現金統計邏輯

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 許可證

MIT License

## 👨‍💻 作者

Kelvin Huang

## 🔗 相關鏈接

- [GitHub Repository](https://github.com/kelvinhuang0327/familyCost)
- [Render Dashboard](https://dashboard.render.com/)