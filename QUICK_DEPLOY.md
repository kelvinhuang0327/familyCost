# ⚡ 快速部署到 Vercel

## 🎯 最簡單的方法

### 方法1: 使用 Vercel 網站 (推薦)

1. **訪問 Vercel**
   - 打開 [vercel.com](https://vercel.com)
   - 使用 GitHub 帳戶登錄

2. **導入項目**
   - 點擊 "New Project"
   - 選擇 `kelvinhuang0327/familyCost` 倉庫
   - 點擊 "Import"

3. **自動部署**
   - Vercel 會自動檢測 Node.js 項目
   - 使用默認設置即可
   - 點擊 "Deploy"

4. **完成**
   - 等待部署完成 (通常 1-2 分鐘)
   - 獲得部署 URL (例如: `https://family-cost-xxx.vercel.app`)

### 方法2: 使用命令行

```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 登錄 Vercel
vercel login

# 3. 部署
vercel --prod
```

### 方法3: 使用部署腳本

```bash
# 運行自動部署腳本
./deploy_to_vercel.sh
```

## 🔧 部署後設置

### 1. 設置環境變量
在 Vercel 項目設置中添加：
- `NODE_ENV`: `production`

### 2. 測試部署
訪問以下 URL 測試：
- **主應用**: `https://your-project.vercel.app`
- **API 健康檢查**: `https://your-project.vercel.app/api/health`
- **Token 狀態**: `https://your-project.vercel.app/api/token/status`

### 3. 設置自定義域名 (可選)
- 在 Vercel 項目設置中添加自定義域名
- 例如: `family-cost.yourdomain.com`

## ✅ 部署後功能

### 完整功能支持
- ✅ **Token 儲存**: 安全的 GitHub Token 管理
- ✅ **自動備份**: 數據自動備份到 GitHub
- ✅ **數據同步**: 跨瀏覽器數據共享
- ✅ **API 端點**: 完整的後端 API 支持
- ✅ **數據健康檢查**: 數據完整性檢查

### 環境優勢
- ✅ **全球 CDN**: 快速訪問
- ✅ **自動 HTTPS**: 安全連接
- ✅ **自動擴展**: 處理高流量
- ✅ **零配置**: 無需服務器管理

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
1. **部署失敗**: 檢查 `vercel.json` 和 `package.json`
2. **API 不可用**: 確認 `server.js` 正確配置
3. **環境變量**: 檢查 Vercel 項目設置

### 調試步驟
1. 查看 Vercel 部署日誌
2. 檢查環境變量設置
3. 測試 API 端點
4. 查看瀏覽器控制台錯誤

## 📊 性能監控

### Vercel Analytics
- 啟用 Vercel Analytics 查看性能數據
- 監控 API 響應時間
- 查看用戶訪問統計

### 建議設置
- 啟用 Vercel Analytics
- 配置自定義域名 (可選)
- 設置環境變量
- 啟用自動部署

---

**部署完成後，您將擁有完整的雲端家庭收支管理平台！** 🎉

**建議先使用方法1 (Vercel 網站) 進行首次部署，這是最簡單的方式。**
