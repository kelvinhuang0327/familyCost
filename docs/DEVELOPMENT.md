# 家庭財務管理系統 - 開發者指南

## 📋 目錄
- [開發環境設置](#開發環境設置)
- [項目結構](#項目結構)
- [代碼規範](#代碼規範)
- [開發流程](#開發流程)
- [測試指南](#測試指南)
- [部署指南](#部署指南)
- [貢獻指南](#貢獻指南)

## 🛠️ 開發環境設置

### 系統要求
- **Node.js**: v16.0.0 或更高版本
- **npm**: v7.0.0 或更高版本
- **Git**: v2.0.0 或更高版本
- **操作系統**: Windows, macOS, Linux

### 環境安裝

#### 1. 安裝 Node.js
```bash
# 使用官方安裝包
# 下載：https://nodejs.org/

# 或使用包管理器
# macOS (Homebrew)
brew install node

# Ubuntu/Debian
sudo apt-get install nodejs npm

# Windows (Chocolatey)
choco install nodejs
```

#### 2. 克隆項目
```bash
git clone https://github.com/kelvinhuang0327/familyCost.git
cd familyCost
```

#### 3. 安裝依賴
```bash
npm install
```

#### 4. 環境變量設置
創建 `.env` 文件：
```bash
# GitHub Token (可選，用於數據同步)
GITHUB_TOKEN=your_github_token_here

# 服務器端口
PORT=3000

# 環境類型
NODE_ENV=development
```

### 開發工具推薦
- **編輯器**: Visual Studio Code
- **版本控制**: Git + GitHub Desktop
- **API 測試**: Postman 或 Insomnia
- **調試工具**: Chrome DevTools
- **代碼檢查**: ESLint

## 📁 項目結構

```
familyCost/
├── app/                          # 應用程式核心
│   ├── backend/                  # 後端代碼
│   │   ├── server.js            # 主服務器 (1000+ 行)
│   │   ├── database.js          # 數據庫操作
│   │   ├── github_data_manager.js # GitHub 數據管理
│   │   ├── github_token_manager.js # GitHub Token 管理
│   │   └── token_manager.js     # Token 管理
│   ├── frontend/                 # 前端代碼
│   │   ├── index.html           # 主頁面 (500+ 行)
│   │   ├── script.js            # 前端邏輯 (5000+ 行)
│   │   └── styles.css           # 樣式文件 (3000+ 行)
│   └── config/                   # 配置文件
│       └── config.js            # 環境配置
├── data/                         # 數據目錄
│   ├── data.json                # 主數據文件
│   ├── data_backup.json         # 數據備份
│   └── version.json             # 版本信息
├── docs/                         # 文檔目錄
│   ├── ARCHITECTURE.md          # 系統架構
│   ├── API.md                   # API 文檔
│   ├── USER_GUIDE.md            # 用戶指南
│   └── DEVELOPMENT.md           # 開發者指南
├── scripts/                      # 腳本目錄
│   ├── start_local.sh           # 本地啟動
│   ├── start_services.sh        # 服務啟動
│   └── update-version.js        # 版本更新
├── uploads/                      # 文件上傳目錄
├── .git/                        # Git 倉庫
├── .gitignore                   # Git 忽略文件
├── .git/hooks/                  # Git 鉤子
│   └── pre-commit               # 提交前鉤子
├── package.json                 # 項目配置
├── render.yaml                  # 部署配置
└── README.md                    # 項目說明
```

### 核心文件說明

#### server.js - 主服務器文件
- **行數**: 1000+ 行
- **功能**: API 端點、中間件、錯誤處理
- **關鍵模組**: 記錄 CRUD、文件上傳、數據同步

#### script.js - 前端邏輯
- **行數**: 5000+ 行
- **功能**: UI 控制、數據管理、統計計算
- **關鍵模組**: 記錄管理、查詢功能、文件處理

#### styles.css - 樣式文件
- **行數**: 3000+ 行
- **功能**: 響應式設計、組件樣式、主題
- **關鍵模組**: 移動端適配、組件樣式、動畫效果

## 📝 代碼規範

### JavaScript 規範

#### 命名約定
```javascript
// 變量：camelCase
let selectedDashboardMonth = null;
let isExplicitlyAll = false;

// 函數：camelCase
function changeDashboardMonth() { }
function getFilteredRecords() { }

// 常量：UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RECORDS = 1000;

// 類：PascalCase
class GitHubDataManager { }
class ConfigManager { }
```

#### 函數結構
```javascript
// 函數註釋
/**
 * 獲取篩選後的記錄
 * @param {string} page - 頁面類型 ('dashboard' | 'list')
 * @returns {Array} 篩選後的記錄陣列
 */
function getFilteredRecords(page = 'dashboard') {
    // 函數實現
}
```

#### 錯誤處理
```javascript
// 使用 try-catch 處理異步操作
try {
    const response = await fetch('/api/records');
    const data = await response.json();
    
    if (data.success) {
        // 成功處理
    } else {
        console.error('API 錯誤:', data.message);
    }
} catch (error) {
    console.error('請求失敗:', error);
}
```

### CSS 規範

#### 類命名
```css
/* BEM 命名法 */
.query-selector { }           /* Block */
.query-selector__content { }  /* Element */
.query-selector--active { }   /* Modifier */

/* 或使用語義化命名 */
.date-range-inputs { }
.month-selector { }
.stat-card { }
```

#### 響應式設計
```css
/* 移動優先 */
.base-style {
    /* 基礎樣式 */
}

/* 平板 */
@media screen and (min-width: 768px) {
    .base-style {
        /* 平板樣式 */
    }
}

/* 桌面 */
@media screen and (min-width: 1200px) {
    .base-style {
        /* 桌面樣式 */
    }
}
```

### HTML 規範

#### 語義化標籤
```html
<!-- 使用語義化標籤 -->
<header class="header">...</header>
<nav class="navigation">...</nav>
<main class="content">...</main>
<footer class="footer">...</footer>

<!-- 表單標籤 -->
<form class="record-form">
    <label for="amount">金額</label>
    <input type="number" id="amount" required>
    <button type="submit">提交</button>
</form>
```

#### 可訪問性
```html
<!-- 添加 aria 標籤 -->
<button aria-label="刪除記錄">🗑️</button>
<input aria-describedby="amount-help" type="number" id="amount">
<div id="amount-help">請輸入金額</div>
```

## 🔄 開發流程

### 1. 功能開發流程

#### 新功能開發
```bash
# 1. 創建功能分支
git checkout -b feature/new-feature

# 2. 開發功能
# - 編寫代碼
# - 添加測試
# - 更新文檔

# 3. 提交更改
git add .
git commit -m "feat: 添加新功能"

# 4. 推送到遠程
git push origin feature/new-feature

# 5. 創建 Pull Request
```

#### 修復 Bug
```bash
# 1. 創建修復分支
git checkout -b fix/bug-description

# 2. 修復問題
# - 定位問題
# - 編寫修復代碼
# - 添加測試

# 3. 提交修復
git add .
git commit -m "fix: 修復問題描述"

# 4. 推送修復
git push origin fix/bug-description
```

### 2. 代碼審查流程

#### Pull Request 檢查清單
- [ ] 代碼符合項目規範
- [ ] 功能測試通過
- [ ] 文檔已更新
- [ ] 無語法錯誤
- [ ] 響應式設計正常
- [ ] 無安全問題

#### 審查重點
1. **代碼質量**: 可讀性、可維護性
2. **功能正確性**: 邏輯正確、邊界處理
3. **性能影響**: 無性能回退
4. **安全性**: 輸入驗證、XSS 防護
5. **用戶體驗**: 界面友好、響應及時

### 3. 版本發布流程

#### 版本號規範
- **主版本號**: 重大功能變更
- **次版本號**: 新功能添加
- **修訂號**: Bug 修復

#### 發布步驟
```bash
# 1. 更新版本號
npm run version:update

# 2. 更新 CHANGELOG
# 3. 創建 Release Tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# 4. 推送標籤
git push origin v1.0.0

# 5. 部署到生產環境
```

## 🧪 測試指南

### 1. 手動測試

#### 功能測試清單
- [ ] 記錄 CRUD 操作
- [ ] 查詢功能（月份/日期區間）
- [ ] 統計計算正確性
- [ ] 文件上傳下載
- [ ] 響應式設計
- [ ] 錯誤處理

#### 瀏覽器兼容性
- [ ] Chrome (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (最新版)
- [ ] Edge (最新版)
- [ ] 移動端瀏覽器

### 2. 自動化測試

#### 設置測試環境
```bash
# 安裝測試依賴
npm install --save-dev jest supertest

# 運行測試
npm test
```

#### 測試文件結構
```
tests/
├── unit/                    # 單元測試
│   ├── api.test.js         # API 測試
│   ├── database.test.js    # 數據庫測試
│   └── utils.test.js       # 工具函數測試
├── integration/             # 整合測試
│   ├── records.test.js     # 記錄功能測試
│   └── upload.test.js      # 文件上傳測試
└── e2e/                     # 端到端測試
    ├── user-flow.test.js   # 用戶流程測試
    └── responsive.test.js  # 響應式測試
```

### 3. 性能測試

#### 測試指標
- **頁面載入時間**: < 3 秒
- **API 響應時間**: < 500ms
- **文件上傳速度**: 根據文件大小
- **內存使用**: < 100MB

#### 測試工具
- **Lighthouse**: 網頁性能分析
- **WebPageTest**: 詳細性能測試
- **Chrome DevTools**: 開發時性能分析

## 🚀 部署指南

### 1. 本地部署

#### 開發環境啟動
```bash
# 啟動開發服務器
npm run dev

# 或使用腳本
./scripts/start_local.sh
```

#### 生產環境構建
```bash
# 安裝依賴
npm install --production

# 啟動生產服務器
npm start
```

### 2. 雲端部署 (Render)

#### 自動部署設置
1. 連接 GitHub 倉庫
2. 設置環境變量
3. 配置構建命令
4. 設置自動部署

#### 環境變量配置
```bash
GITHUB_TOKEN=your_token_here
NODE_ENV=production
PORT=10000
```

#### 部署檢查清單
- [ ] 環境變量設置正確
- [ ] 依賴安裝成功
- [ ] 服務器啟動正常
- [ ] API 端點可訪問
- [ ] 靜態文件載入正常

### 3. 監控和維護

#### 日誌監控
```javascript
// 添加日誌記錄
console.log('API 請求:', req.method, req.url);
console.error('錯誤信息:', error.message);
```

#### 性能監控
- 監控 API 響應時間
- 追蹤錯誤率
- 監控資源使用
- 用戶行為分析

## 🤝 貢獻指南

### 1. 如何貢獻

#### 報告問題
1. 檢查現有 Issues
2. 創建詳細的問題報告
3. 提供重現步驟
4. 包含環境信息

#### 提交代碼
1. Fork 項目倉庫
2. 創建功能分支
3. 編寫代碼和測試
4. 提交 Pull Request

### 2. 貢獻類型

#### Bug 修復
- 修復現有功能問題
- 改善錯誤處理
- 提升系統穩定性

#### 新功能
- 添加用戶請求的功能
- 改善用戶體驗
- 增加系統功能

#### 文檔改進
- 更新用戶指南
- 完善 API 文檔
- 改善代碼註釋

#### 代碼優化
- 重構代碼結構
- 提升性能
- 改善可維護性

### 3. 社區準則

#### 行為準則
- 友善和包容
- 建設性討論
- 尊重他人觀點
- 專業態度

#### 溝通方式
- 使用清晰的中文
- 提供具體的建議
- 保持專業態度
- 及時回應

## 📚 學習資源

### 技術文檔
- [Node.js 官方文檔](https://nodejs.org/docs/)
- [Express.js 指南](https://expressjs.com/guide/)
- [MDN Web 文檔](https://developer.mozilla.org/)
- [Git 官方教程](https://git-scm.com/doc)

### 最佳實踐
- [JavaScript 最佳實踐](https://github.com/airbnb/javascript)
- [CSS 最佳實踐](https://github.com/airbnb/css)
- [RESTful API 設計](https://restfulapi.net/)
- [響應式設計指南](https://web.dev/responsive-web-design-basics/)

### 開發工具
- [VS Code 擴展推薦](https://code.visualstudio.com/docs)
- [Chrome DevTools 指南](https://developers.google.com/web/tools/chrome-devtools)
- [Postman 使用指南](https://learning.postman.com/)

---

*最後更新：2025-10-07*
*版本：1.0.0*
