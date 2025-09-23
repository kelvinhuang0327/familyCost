# Railway 部署指南

## 🚀 Railway 部署步驟

### 1. 訪問 Railway
- 前往 [railway.app](https://railway.app)
- 使用 GitHub 帳戶登入

### 2. 創建新專案
- 點擊 "New Project"
- 選擇 "Deploy from GitHub repo"
- 選擇 `kelvinhuang0327/familyCost` 倉庫

### 3. 配置環境變數
- 在 Railway Dashboard 中
- 進入專案的 "Variables" 標籤
- 添加環境變數：
  ```
  NODE_ENV=production
  PORT=3000
  ```

### 4. 自動部署
- Railway 會自動檢測 `package.json`
- 自動安裝依賴並啟動服務
- 提供公開的 HTTPS URL

## ✅ Railway 優勢

- ✅ **無部署保護**：直接公開訪問
- ✅ **自動 HTTPS**：安全的連接
- ✅ **環境變數管理**：簡單的配置
- ✅ **自動擴展**：根據流量自動調整
- ✅ **免費額度**：每月 $5 免費額度

## 🔗 部署完成後

您將獲得一個類似這樣的 URL：
```
https://family-cost-production.up.railway.app
```

## 🧪 測試功能

部署完成後，您可以：
1. 訪問前端頁面
2. 使用 Token 儲存功能
3. 測試所有後端 API

## 📞 需要幫助？

如果遇到問題，Railway 提供：
- 詳細的部署日誌
- 實時監控
- 簡單的環境變數管理
