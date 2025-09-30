# 🚀 Render Token 快速設置指南

## 📋 您的 Token 信息
```
Token: your_github_token_here
```

## 🔧 設置步驟

### 1. 登入 Render Dashboard
- 前往：https://dashboard.render.com
- 登入您的帳號

### 2. 選擇服務
- 找到並點擊 `family-cost` 服務

### 3. 設置環境變數
- 點擊左側菜單的 **"Environment"**
- 找到 `GITHUB_TOKEN` 環境變數
- 如果沒有，點擊 **"Add Environment Variable"**
- 設置：
  ```
  Key: GITHUB_TOKEN
  Value: your_github_token_here
  ```

### 4. 保存並部署
- 點擊 **"Save Changes"**
- Render 會自動重新部署服務

## ✅ 驗證設置

### 檢查服務狀態
1. 在 Dashboard 中確認服務狀態為 "Live"
2. 查看最近部署是否成功

### 測試 GitHub 同步
1. 訪問您的 Render 應用
2. 添加一筆測試記錄
3. 檢查是否成功同步到 GitHub

## 🔍 如果遇到問題

### 問題 1：服務啟動失敗
- 檢查 Environment 頁面，確認所有環境變數都已設置
- 查看 "Logs" 頁面的錯誤信息

### 問題 2：GitHub 同步失敗
- 確認 token 是否有效且有正確權限
- 檢查 token 是否有 `repo` 權限
- 查看服務日誌中的錯誤信息

## 📞 需要幫助？
如果設置過程中遇到問題，請檢查：
1. Render Dashboard 中的環境變數設置
2. 服務日誌中的錯誤信息
3. GitHub token 的權限設置
