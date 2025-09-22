# 🚀 後端部署指南

## 📋 **部署選項**

### 選項1: Vercel (推薦) ⭐

#### 優點
- ✅ 免費額度充足
- ✅ 自動從GitHub部署
- ✅ 支持Node.js
- ✅ 全球CDN
- ✅ 簡單易用

#### 部署步驟
1. 前往 [Vercel](https://vercel.com)
2. 使用GitHub帳號登入
3. 點擊 "New Project"
4. 選擇 `kelvinhuang0327/familyCost` 倉庫
5. 框架選擇 "Other"
6. 構建設置：
   - Build Command: `npm install`
   - Output Directory: `.`
   - Install Command: `npm install`
7. 環境變量：
   - `NODE_ENV=production`
8. 點擊 "Deploy"

#### 部署後
- 前端: https://your-project.vercel.app
- 後端API: https://your-project.vercel.app/api/health

---

### 選項2: Railway

#### 優點
- ✅ 現代化界面
- ✅ 自動部署
- ✅ 支持多種語言
- ✅ 免費額度

#### 部署步驟
1. 前往 [Railway](https://railway.app)
2. 使用GitHub登入
3. 點擊 "New Project"
4. 選擇 "Deploy from GitHub repo"
5. 選擇 `kelvinhuang0327/familyCost`
6. 自動檢測Node.js並部署

---

### 選項3: Render

#### 優點
- ✅ 免費額度充足
- ✅ 自動SSL
- ✅ 簡單配置

#### 部署步驟
1. 前往 [Render](https://render.com)
2. 使用GitHub登入
3. 點擊 "New +"
4. 選擇 "Web Service"
5. 連接GitHub倉庫
6. 配置：
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: `Node`

---

## 🔧 **部署前準備**

### 1. 更新package.json
確保包含所有依賴：
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 2. 環境變量設置
在部署平台設置：
- `NODE_ENV=production`
- `PORT=3001` (或平台分配的端口)

### 3. 前端API地址更新
部署後需要更新前端中的API地址：
```javascript
// 從
const API_BASE = 'http://localhost:3001/api';

// 改為
const API_BASE = 'https://your-deployed-app.vercel.app/api';
```

---

## 📱 **部署後功能**

### ✅ **保持的功能**
- 🔐 Token安全儲存
- 🔄 跨瀏覽器同步
- 📦 GitHub備份
- 🍎 Safari兼容性
- 🔍 數據健康檢查

### ⚠️ **注意事項**
- Token儲存會重置（需要重新設置）
- 需要重新配置GitHub認證
- 數據會從GitHub恢復

---

## 🎯 **推薦部署流程**

### 1. Vercel部署 (最簡單)
```bash
# 1. 推送代碼到GitHub
git add .
git commit -m "準備Vercel部署"
git push origin main

# 2. 在Vercel部署
# 3. 更新前端API地址
# 4. 重新設置Token
```

### 2. 測試部署
```bash
# 測試健康檢查
curl https://your-app.vercel.app/api/health

# 測試Token API
curl https://your-app.vercel.app/api/token/status
```

---

## 🔗 **相關鏈接**

- [Vercel部署文檔](https://vercel.com/docs)
- [Railway部署文檔](https://docs.railway.app)
- [Render部署文檔](https://render.com/docs)

---

**選擇Vercel是最簡單的開始方式！** 🚀
