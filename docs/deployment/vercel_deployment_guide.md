# 🚀 Vercel 部署指南

## 📋 部署步驟

### 1. 準備工作
- ✅ 確保代碼已推送到 GitHub
- ✅ 確保 `vercel.json` 配置文件存在
- ✅ 確保 `package.json` 包含正確的腳本

### 2. 創建 Vercel 帳戶
1. 訪問 [vercel.com](https://vercel.com)
2. 使用 GitHub 帳戶登錄
3. 授權 Vercel 訪問您的 GitHub 倉庫

### 3. 部署項目
1. 在 Vercel 儀表板點擊 "New Project"
2. 選擇您的 GitHub 倉庫 `kelvinhuang0327/familyCost`
3. Vercel 會自動檢測到 Node.js 項目
4. 確認設置：
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (可選)
   - **Output Directory**: `./` (可選)
   - **Install Command**: `npm install`

### 4. 環境變量設置
在 Vercel 項目設置中添加環境變量：
- `NODE_ENV`: `production`
- `PORT`: `3001` (Vercel 會自動設置)

### 5. 部署
1. 點擊 "Deploy" 按鈕
2. 等待部署完成
3. 獲得部署 URL (例如: `https://family-cost-xxx.vercel.app`)

## 🔧 配置說明

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### package.json 腳本
```json
{
  "scripts": {
    "start": "NODE_ENV=production node server.js",
    "build": "echo 'No build step required'",
    "vercel-build": "echo 'Vercel build completed'"
  }
}
```

## 🌍 環境配置

### 生產環境設置
- **NODE_ENV**: `production`
- **端口**: Vercel 自動分配
- **域名**: Vercel 提供的域名

### 功能支持
- ✅ Node.js 後端服務
- ✅ API 端點
- ✅ Token 管理
- ✅ 數據同步
- ✅ 自動備份

## 📊 部署後功能

### 完整功能
- ✅ Token 儲存和管理
- ✅ 自動備份到 GitHub
- ✅ 數據同步
- ✅ 跨瀏覽器數據共享
- ✅ 數據健康檢查

### 訪問方式
- **主應用**: `https://your-project.vercel.app`
- **API 健康檢查**: `https://your-project.vercel.app/api/health`
- **Token 狀態**: `https://your-project.vercel.app/api/token/status`

## 🔄 自動部署

### GitHub 集成
- ✅ 每次推送到 main 分支會自動觸發部署
- ✅ 支持預覽部署 (Pull Request)
- ✅ 自動環境變量管理

### 部署流程
1. 推送代碼到 GitHub
2. Vercel 自動檢測變更
3. 自動構建和部署
4. 獲得新的部署 URL

## 🛠️ 故障排除

### 常見問題
1. **部署失敗**: 檢查 `package.json` 和 `vercel.json`
2. **API 不可用**: 確認 `server.js` 正確配置
3. **環境變量**: 檢查 Vercel 項目設置

### 調試步驟
1. 查看 Vercel 部署日誌
2. 檢查環境變量設置
3. 測試 API 端點
4. 查看瀏覽器控制台錯誤

## 📈 性能優化

### Vercel 優勢
- ✅ 全球 CDN
- ✅ 自動 HTTPS
- ✅ 零配置部署
- ✅ 自動擴展

### 建議設置
- 啟用 Vercel Analytics
- 配置自定義域名 (可選)
- 設置環境變量
- 啟用自動部署

---

**部署完成後，您將擁有完整的雲端家庭收支管理平台！** 🎉
