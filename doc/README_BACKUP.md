# 🔄 自動備份到GitHub功能

## 📋 功能概述

本系統已實現完整的自動備份功能，包括：

### ✅ **已實現功能**
1. **Node.js後端服務** - 處理Git操作和API請求
2. **自動備份觸發** - 新增、編輯、匯入數據後自動備份
3. **自動還原檢查** - 頁面載入時檢查GitHub最新數據
4. **備份狀態顯示** - 實時顯示備份狀態和時間
5. **本地備份** - 即使GitHub不可用也能本地備份

### 🔧 **技術架構**

```
前端 (index.html) 
    ↓ HTTP API
後端服務 (server.js:3001)
    ↓ Git命令
GitHub倉庫 (kelvinhuang0327/familyCost)
```

## 🚀 使用方法

### 方法1：使用啟動腳本（推薦）
```bash
./start_services.sh
```

### 方法2：手動啟動
```bash
# 1. 啟動後端服務
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
node server.js &

# 2. 啟動前端服務
python3 -m http.server 8000 &

# 3. 訪問應用
open http://localhost:8000
```

## 🔐 GitHub認證設置

### 選項1：使用Personal Access Token
```bash
# 設置Git認證
git config --global credential.helper store
git config --global user.name "你的用戶名"
git config --global user.email "你的郵箱"

# 在GitHub上創建Personal Access Token
# 然後使用以下命令設置：
git remote set-url origin https://你的用戶名:你的token@github.com/kelvinhuang0327/familyCost.git
```

### 選項2：使用SSH密鑰
```bash
# 生成SSH密鑰
ssh-keygen -t ed25519 -C "你的郵箱"

# 添加到GitHub
cat ~/.ssh/id_ed25519.pub

# 更改遠端URL為SSH
git remote set-url origin git@github.com:kelvinhuang0327/familyCost.git
```

## 📊 API端點

| 端點 | 方法 | 功能 |
|------|------|------|
| `/api/health` | GET | 健康檢查 |
| `/api/backup` | POST | 備份到GitHub |
| `/api/restore` | GET | 從GitHub還原 |
| `/api/git-status` | GET | 獲取Git狀態 |
| `/api/sync` | POST | 手動同步 |

## 🔄 自動備份流程

1. **觸發時機**：
   - 新增記錄後
   - 編輯記錄後
   - 匯入數據後

2. **備份流程**：
   ```
   前端操作 → 調用API → 更新data.json → Git提交 → 推送到GitHub
   ```

3. **還原流程**：
   ```
   頁面載入 → 檢查GitHub → 拉取更新 → 重新載入數據
   ```

## ⚠️ 故障排除

### 問題1：GitHub認證失敗
```
錯誤: fatal: could not read Username for 'https://github.com'
解決: 設置Personal Access Token或SSH密鑰
```

### 問題2：後端服務無法啟動
```bash
# 檢查Node.js是否安裝
node --version

# 檢查依賴是否安裝
npm install

# 檢查端口是否被佔用
lsof -i :3001
```

### 問題3：前端無法連接後端
```bash
# 檢查後端服務狀態
curl http://localhost:3001/api/health

# 檢查CORS設置
# 後端已配置CORS，允許跨域請求
```

## 🎯 優勢總結

### **為什麼使用後端程式？**

1. **安全性** ✅
   - Git操作在服務器端執行
   - 避免在瀏覽器中暴露敏感信息

2. **功能完整性** ✅
   - 可以使用完整的Node.js生態系統
   - 支持複雜的Git操作

3. **穩定性** ✅
   - 不受瀏覽器限制
   - 可以處理大文件和長時間操作

4. **可擴展性** ✅
   - 容易添加新功能
   - 支持多種備份方式

5. **離線支持** ✅
   - 即使GitHub不可用也能本地備份
   - 自動降級到本地模式

## 📝 下一步計劃

1. **設置GitHub認證** - 完成自動推送到GitHub
2. **添加備份歷史** - 顯示備份記錄和狀態
3. **實現增量備份** - 只備份變更的數據
4. **添加備份驗證** - 確保備份數據完整性
5. **支持多環境** - 開發/生產環境分離
