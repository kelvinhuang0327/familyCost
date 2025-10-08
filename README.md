# 💰 家庭財務管理系統

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/kelvinhuang0327/familyCost)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-v16.0.0+-green.svg)](https://nodejs.org/)
[![Deploy](https://img.shields.io/badge/deploy-Render-blue.svg)](https://render.com/)

一個現代化的家庭財務記錄和管理系統，提供直觀的用戶界面和強大的數據分析功能。

## ✨ 功能特色

### 📊 核心功能
- **收支記錄管理** - 完整的收入支出記錄系統
- **多成員統計** - 支援家庭多成員的財務追蹤
- **智能查詢** - 月份查詢和自定義日期區間查詢
- **實時統計** - 自動計算收支統計和成員分析
- **日曆視圖** - 按日期查看財務記錄

### 🔧 數據管理
- **Excel 匯入匯出** - 支援 .xlsx/.xls 格式
- **GitHub 數據同步** - 自動備份到雲端
- **數據備份還原** - 完整的數據保護機制
- **批量操作** - 支援批量匯入和清理

### 📱 用戶體驗
- **響應式設計** - 完美適配手機、平板、電腦
- **直觀界面** - 簡潔現代的用戶界面
- **快速操作** - 優化的交互流程
- **無需註冊** - 開箱即用

## 🚀 快速開始

### 在線體驗
直接訪問：**https://familycost-1.onrender.com**

### 本地部署

#### 環境要求
- Node.js v16.0.0+
- npm v7.0.0+

#### 安裝步驟
```bash
# 1. 克隆項目
git clone https://github.com/kelvinhuang0327/familyCost.git
cd familyCost

# 2. 安裝依賴
npm install

# 3. 啟動服務
npm start

# 4. 訪問系統
# 打開瀏覽器訪問：http://localhost:3000
```

#### 環境變量設置（可選）
創建 `.env` 文件：
```bash
GITHUB_TOKEN=your_github_token_here
PORT=3000
NODE_ENV=development
```

## 📖 文檔

| 文檔 | 描述 | 連結 |
|------|------|------|
| 🏗️ **系統架構** | 完整的系統架構說明 | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 🔌 **API 文檔** | RESTful API 接口說明 | [API.md](docs/API.md) |
| 👤 **用戶指南** | 詳細的使用說明 | [USER_GUIDE.md](docs/USER_GUIDE.md) |
| 👨‍💻 **開發指南** | 開發者文檔和貢獻指南 | [DEVELOPMENT.md](docs/DEVELOPMENT.md) |

## 🏗️ 系統架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Web)    │    │   後端 (API)    │    │   數據存儲      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • HTML5         │◄──►│ • Node.js       │◄──►│ • JSON 文件     │
│ • CSS3          │    │ • Express.js    │    │ • GitHub 同步   │
│ • JavaScript    │    │ • RESTful API   │    │ • 數據備份      │
│ • 響應式設計    │    │ • 文件處理      │    │ • 版本控制      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技術棧
- **前端**: HTML5, CSS3, JavaScript ES6+, 響應式設計
- **後端**: Node.js, Express.js, RESTful API
- **數據**: JSON 文件存儲, GitHub API 同步
- **部署**: Render 雲端平台
- **版本控制**: Git, GitHub

## 📁 項目結構

```
familyCost/
├── app/                          # 應用程式核心目錄
│   ├── backend/                  # 後端服務
│   │   ├── server.js            # 主服務器文件
│   │   ├── database.js          # 數據庫操作
│   │   ├── github_data_manager.js # GitHub 數據管理
│   │   ├── github_token_manager.js # GitHub Token 管理
│   │   └── token_manager.js     # Token 管理
│   ├── frontend/                 # 前端文件
│   │   ├── index.html           # 主頁面
│   │   ├── script.js            # 前端邏輯
│   │   └── styles.css           # 樣式文件
│   └── config/                   # 配置目錄
│       └── config.js            # 環境配置
├── data/                         # 數據目錄
│   ├── data.json                # 主要數據文件
│   └── version.json             # 版本信息
├── docs/                         # 文檔目錄
│   ├── ARCHITECTURE.md          # 系統架構說明
│   ├── API.md                   # API 接口文檔
│   ├── USER_GUIDE.md            # 用戶使用指南
│   └── DEVELOPMENT.md           # 開發者指南
├── scripts/                      # 腳本目錄
│   ├── start_local.sh           # 本地啟動腳本
│   ├── start_services.sh        # 服務啟動腳本
│   └── update-version.js        # 版本更新腳本
├── uploads/                      # 文件上傳目錄
├── package.json                  # 項目配置
├── render.yaml                   # 部署配置
└── README.md                     # 項目說明
```

## 🎯 主要功能

### 📊 總覽頁面
- 支出統計和信用卡支出分析
- 成員收支統計和個人分析
- 支援月份查詢和日期區間查詢
- 記錄查看和篩選功能

### 📋 列表頁面
- 完整的記錄列表管理
- 多種篩選條件（成員、類別、類型）
- 搜尋功能
- 編輯和刪除記錄

### 📅 日曆頁面
- 月曆視圖顯示記錄
- 按日期查看詳細記錄
- 月份切換功能

### ➕ 新增頁面
- 直觀的記錄添加表單
- 智能的類別建議
- 表單驗證和錯誤提示

### ⚙️ 設定頁面
- Excel 文件匯入匯出
- GitHub 數據同步
- 數據管理和備份

## 🔄 部署選項

### 1. Render 部署（推薦）
```yaml
# render.yaml 配置
services:
  - type: web
    name: familycost
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: GITHUB_TOKEN
        value: your_token_here
```

### 2. 其他雲端平台
- **Heroku**: 支援 Node.js 應用
- **Vercel**: 靜態部署 + Serverless Functions
- **Railway**: 簡單的 Node.js 部署

### 3. 自建服務器
```bash
# 使用 PM2 管理進程
npm install -g pm2
pm2 start server.js --name "familycost"
pm2 startup
pm2 save
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
- ✅ 輸入驗證和 XSS 防護
- ✅ 數據本地存儲，無需註冊

## 📊 API 端點

### 記錄管理
- `GET /api/records` - 獲取所有記錄
- `POST /api/records` - 新增記錄
- `PUT /api/records/:id` - 更新記錄
- `DELETE /api/records/:id` - 刪除記錄
- `POST /api/records/clear` - 清空記錄

### 文件處理
- `POST /api/upload` - Excel 文件上傳
- `GET /api/export` - 數據匯出

### 系統信息
- `GET /api/version` - 獲取版本信息
- `GET /api/stats` - 獲取統計信息

詳細 API 文檔請參考 [API.md](docs/API.md)

## 🐛 故障排除

### Token 相關問題
**問題：Token 檢查顯示未設置**
解決方案：
1. 檢查 .env 文件是否存在且包含 GITHUB_TOKEN
2. 重啟服務
3. 在 Render Dashboard 確認環境變數已設置

### 數據相關問題
**問題：數據丟失**
解決方案：
1. 從 GitHub 恢復數據
2. 使用 Excel 匯入功能
3. 檢查 Git 歷史記錄

## 🤝 貢獻

我們歡迎各種形式的貢獻！

### 如何貢獻
1. **Fork** 項目倉庫
2. 創建功能分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 開啟 **Pull Request**

### 貢獻類型
- 🐛 Bug 修復
- ✨ 新功能開發
- 📚 文檔改進
- 🎨 UI/UX 優化
- ⚡ 性能提升

## 📈 未來規劃

- [ ] 多語言支援
- [ ] 主題切換功能
- [ ] 高級報表和分析
- [ ] 移動端應用
- [ ] 數據庫遷移選項
- [ ] API 開放平台

## 📄 授權

本項目採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 文件。

## 👥 團隊

- **開發者**: [Kelvin Huang](https://github.com/kelvinhuang0327)
- **項目維護**: 活躍維護中
- **社區支援**: 歡迎 Issue 和 Pull Request

## 📞 聯絡方式

- **GitHub Issues**: [提交問題](https://github.com/kelvinhuang0327/familyCost/issues)
- **Pull Requests**: [貢獻代碼](https://github.com/kelvinhuang0327/familyCost/pulls)
- **討論區**: [GitHub Discussions](https://github.com/kelvinhuang0327/familyCost/discussions)

## 📄 更新日誌

最新版本信息請查看 `data/version.json`

主要更新：
- **2025-10-07**: 新增日期區間查詢功能，優化查詢選擇器佈局
- **2025-09-30**: 統一改為本地數據讀取，手動 GitHub 同步
- **2025-09-28**: 修復編輯功能，優化 UI/UX
- **2025-09-26**: 簡化現金統計邏輯

---

⭐ **如果這個項目對您有幫助，請給我們一個 Star！**