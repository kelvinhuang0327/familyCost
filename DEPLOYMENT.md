# 📦 部署指南

## 🚀 Render 雲端部署

### 前置準備

1. **GitHub 倉庫**
   - 代碼已推送到 GitHub
   - 倉庫地址：https://github.com/kelvinhuang0327/familyCost

2. **GitHub Personal Access Token**
   - 前往 GitHub Settings → Developer settings → Personal access tokens
   - 生成新的 token，需要 `repo` 權限
   - 保存 token（只顯示一次）

### 部署步驟

#### 1. 在 Render 創建服務

1. 登入 [Render Dashboard](https://dashboard.render.com)
2. 點擊 "New +" → "Web Service"
3. 連接 GitHub 倉庫：`kelvinhuang0327/familyCost`
4. 配置服務：
   - **Name**: `family-cost`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`

#### 2. 設置環境變數

在 Render Dashboard 的 "Environment" 頁面添加：

| 變數名稱 | 值 | 說明 |
|---------|-----|------|
| `NODE_ENV` | `production` | 環境模式 |
| `PORT` | `10000` | 服務端口 |
| `GITHUB_TOKEN` | `你的 token` | GitHub Personal Access Token |
| `GITHUB_OWNER` | `kelvinhuang0327` | GitHub 用戶名 |
| `GITHUB_REPO` | `familyCost` | 倉庫名稱 |
| `GITHUB_BRANCH` | `main` | 分支名稱 |

**重要**：
- ✅ 環境變數在 Render 中加密存儲
- ✅ 重新部署時不會丟失
- ❌ 不要將 token 寫在代碼或 render.yaml 中

#### 3. 部署

點擊 "Create Web Service"，Render 會自動：
1. 克隆代碼
2. 安裝依賴（npm install）
3. 啟動服務（node server.js）
4. 分配 URL（例如：https://familycost-1.onrender.com）

#### 4. 驗證部署

1. **檢查服務狀態**
   - Dashboard 顯示 "Live"
   - 訪問分配的 URL

2. **測試功能**
   - 添加一筆記錄
   - 點擊 "GitHub 同步"
   - 檢查 GitHub 倉庫中的 data/data.json 是否更新

3. **查看日誌**
   - Dashboard → Logs
   - 確認沒有錯誤

### render.yaml 配置

```yaml
services:
  - type: web
    name: family-cost
    env: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: GITHUB_TOKEN
        sync: false  # 需要在 Dashboard 手動設置
      - key: GITHUB_OWNER
        value: kelvinhuang0327
      - key: GITHUB_REPO
        value: familyCost
      - key: GITHUB_BRANCH
        value: main
```

## 💻 本地開發部署

### 1. 安裝依賴

```bash
npm install
```

### 2. 設置環境變數

```bash
# 複製環境變數範例
cp env.example .env

# 編輯 .env 文件
# 添加你的 GITHUB_TOKEN
```

.env 文件內容：
```
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=kelvinhuang0327
GITHUB_REPO=familyCost
GITHUB_BRANCH=main
```

或使用腳本：
```bash
bash scripts/set_token.sh your_github_token
```

### 3. 啟動服務

```bash
# 方法 1：使用 npm
npm run local

# 方法 2：使用啟動腳本
bash scripts/start_local.sh

# 方法 3：直接運行
node server.js
```

### 4. 訪問應用

打開瀏覽器訪問：http://localhost:3000

## 🔄 更新部署

### Render 更新

```bash
# 1. 提交代碼
git add .
git commit -m "更新說明"

# 2. 推送到 GitHub
git push origin main

# 3. Render 會自動檢測並重新部署
```

### 本地更新

```bash
# 拉取最新代碼
git pull origin main

# 重新安裝依賴（如有更新）
npm install

# 重啟服務
npm run local
```

## 🐛 故障排除

### Render 部署問題

#### 問題：服務啟動失敗

**解決方案**：
1. 檢查 Dashboard 中的構建日誌
2. 確認所有環境變數已設置
3. 檢查 package.json 的啟動命令
4. 查看錯誤信息

#### 問題：GitHub 同步失敗

**解決方案**：
1. 檢查 GITHUB_TOKEN 是否正確設置
2. 確認 token 有 `repo` 權限
3. 檢查 GITHUB_OWNER、GITHUB_REPO、GITHUB_BRANCH 是否正確
4. 查看服務日誌中的錯誤信息

#### 問題：503 Service Unavailable

**解決方案**：
1. Free plan 服務在閒置 15 分鐘後會休眠
2. 首次訪問需要等待服務啟動（約 30-60 秒）
3. 考慮升級到付費 plan 避免休眠

### 本地開發問題

#### 問題：Node.js 未找到

**解決方案**：
```bash
# 使用 nvm 管理 Node.js
nvm use node

# 或安裝 Node.js
# macOS
brew install node

# 檢查版本
node -v
npm -v
```

#### 問題：端口已被占用

**解決方案**：
```bash
# 查找占用端口的進程
lsof -i :3000

# 終止進程
kill -9 PID

# 或使用不同端口
PORT=3001 node server.js
```

#### 問題：Token 檢查失敗

**解決方案**：
1. 確認 .env 文件存在且包含 GITHUB_TOKEN
2. 檢查 .env 文件格式（不要有引號、空格）
3. 重啟服務
4. 使用 `scripts/set_token.sh` 重新設置

## 📊 監控和維護

### 日誌監控

**Render**：
- Dashboard → Logs
- 實時查看服務日誌
- 過濾錯誤和警告

**本地**：
- 查看控制台輸出
- 檢查 server.log 和 server_debug.log

### 數據備份

**自動備份**：
- 每次操作都保存到本地 data/data.json
- data_backup.json 作為本地備份
- data/backups/ 目錄存儲歷史備份

**手動備份**：
```bash
# 備份數據
cp data/data.json data/backups/data_$(date +%Y%m%d_%H%M%S).json

# 同步到 GitHub
# 在應用中點擊 "GitHub 同步" 按鈕
```

### 版本管理

**自動版本更新**：
- Git commit 時自動更新 data/version.json
- 版本號格式：YYYY-MM-DD HH:MM:SS

**手動版本更新**：
```bash
npm run version:update
```

**查看版本**：
```bash
npm run version:show
```

## 🔐 安全最佳實踐

1. **環境變數管理**
   - ✅ 使用 .env 文件（本地）
   - ✅ 使用 Render Dashboard（生產）
   - ❌ 不要提交 .env 到 Git
   - ❌ 不要在代碼中硬編碼 token

2. **Token 安全**
   - ✅ 定期更換 GitHub token
   - ✅ 只給必要的權限（repo）
   - ✅ 不要分享 token
   - ❌ 不要在日誌中輸出 token

3. **數據安全**
   - ✅ 定期備份數據
   - ✅ 使用 GitHub 作為遠程備份
   - ✅ 檢查數據完整性

## 📞 支援

遇到問題？
1. 查看本文檔的故障排除部分
2. 檢查 [GitHub Issues](https://github.com/kelvinhuang0327/familyCost/issues)
3. 查看 Render 官方文檔
4. 聯繫開發者

## 🔗 相關鏈接

- [Render Dashboard](https://dashboard.render.com)
- [GitHub Repository](https://github.com/kelvinhuang0327/familyCost)
- [Render 官方文檔](https://render.com/docs)
- [GitHub Token 設置](https://github.com/settings/tokens)
