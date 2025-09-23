# Render 部署指南

## 🚀 Render 部署步驟

### 1. 訪問 Render
- 前往 [render.com](https://render.com)
- 使用 GitHub 帳戶登入

### 2. 創建新 Web Service
- 點擊 "New +"
- 選擇 "Web Service"
- 連接 GitHub 倉庫 `kelvinhuang0327/familyCost`

### 3. 配置服務
- **Name**: `family-cost`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### 4. 環境變數
- 在 "Environment" 標籤中添加：
  ```
  NODE_ENV=production
  ```

### 5. 部署
- 點擊 "Create Web Service"
- Render 會自動構建和部署

## ✅ Render 優勢

- ✅ **免費方案**：完全免費使用
- ✅ **無部署保護**：直接公開訪問
- ✅ **自動 HTTPS**：安全的連接
- ✅ **自動部署**：Git push 自動觸發
- ✅ **簡單配置**：最少的設定

## 🔗 部署完成後

您將獲得一個類似這樣的 URL：
```
https://family-cost.onrender.com
```

## 🧪 測試功能

部署完成後，您可以：
1. 訪問前端頁面
2. 使用 Token 儲存功能
3. 測試所有後端 API

## 📞 需要幫助？

Render 提供：
- 詳細的構建日誌
- 實時監控
- 簡單的環境變數管理
- 免費的自動 SSL 證書
