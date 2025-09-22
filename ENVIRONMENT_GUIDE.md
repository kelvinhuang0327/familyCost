# 🌍 環境配置指南

## 📋 **環境概覽**

系統支持兩種環境配置：
- **🏠 Local**: 本地開發環境
- **🧪 SIT**: 測試環境

## 🔧 **環境配置**

### Local 環境
```bash
# 環境變量
NODE_ENV=local
PORT=3001
FRONTEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:3001
API_BASE=http://localhost:3001/api

# GitHub配置
GITHUB_REPO=kelvinhuang0327/familyCost
GITHUB_BRANCH=main
```

### SIT 環境
```bash
# 環境變量
NODE_ENV=sit
PORT=3001
FRONTEND_URL=https://family-cost-sit.vercel.app
BACKEND_URL=https://family-cost-sit.vercel.app
API_BASE=https://family-cost-sit.vercel.app/api

# GitHub配置
GITHUB_REPO=kelvinhuang0327/familyCost
GITHUB_BRANCH=sit
```

## 🚀 **啟動方式**

### 方法1: 使用啟動腳本
```bash
# 本地環境
./start_local.sh

# SIT環境
./start_sit.sh
```

### 方法2: 使用npm腳本
```bash
# 本地環境
npm run start:local
npm run dev:local

# SIT環境
npm run start:sit
npm run dev:sit
```

### 方法3: 手動設置環境變量
```bash
# 本地環境
export NODE_ENV=local
node server.js

# SIT環境
export NODE_ENV=sit
node server.js
```

## 🔄 **環境切換**

### 使用切換工具
```bash
./switch_env.sh
```

### 手動切換
```bash
# 切換到本地
export NODE_ENV=local

# 切換到SIT
export NODE_ENV=sit
```

## 📁 **配置文件結構**

```
familyCost/
├── config.js          # 主配置文件
├── env.local          # 本地環境變量
├── env.sit            # SIT環境變量
├── start_local.sh     # 本地啟動腳本
├── start_sit.sh       # SIT啟動腳本
├── switch_env.sh      # 環境切換工具
└── package.json       # npm腳本配置
```

## 🧪 **測試環境**

### 健康檢查
```bash
# 本地環境
curl http://localhost:3001/api/health

# SIT環境
curl https://family-cost-sit.vercel.app/api/health
```

### API測試
```bash
# 本地環境
npm run test-api

# SIT環境
npm run test-api:sit
```

## 📊 **環境差異**

| 功能 | Local | SIT |
|------|-------|-----|
| 前端URL | http://localhost:8000 | https://family-cost-sit.vercel.app |
| 後端URL | http://localhost:3001 | https://family-cost-sit.vercel.app |
| GitHub分支 | main | sit |
| 日誌級別 | debug | info |
| 數據儲存 | 本地文件 | 雲端+本地備份 |

## 🔍 **環境檢測**

### 在代碼中檢測環境
```javascript
const { getEnvironment, getConfig } = require('./config');

const env = getEnvironment(); // 'local' 或 'sit'
const config = getConfig();   // 對應環境的配置

console.log(`當前環境: ${env}`);
console.log(`API地址: ${config.apiBase}`);
```

### 在API中返回環境信息
```javascript
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: environment,
        config: {
            name: config.name,
            frontendUrl: config.frontendUrl,
            backendUrl: config.backendUrl
        }
    });
});
```

## 🚀 **部署配置**

### Vercel部署
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
    "NODE_ENV": "sit"
  }
}
```

### 環境變量設置
在部署平台設置：
- `NODE_ENV=sit`
- `FRONTEND_URL=https://your-app.vercel.app`
- `BACKEND_URL=https://your-app.vercel.app`

## 🔧 **故障排除**

### 常見問題

#### 1. 環境變量未生效
```bash
# 檢查環境變量
echo $NODE_ENV

# 重新設置
export NODE_ENV=local
```

#### 2. 端口衝突
```bash
# 檢查端口使用
lsof -i :3001

# 殺死進程
kill -9 <PID>
```

#### 3. 配置文件錯誤
```bash
# 檢查配置文件
node -e "console.log(require('./config').getConfig())"
```

## 📚 **最佳實踐**

### 開發流程
1. **本地開發**: 使用 `local` 環境
2. **功能測試**: 使用 `sit` 環境
3. **生產部署**: 使用 `production` 環境

### 環境隔離
- ✅ 使用不同的GitHub分支
- ✅ 使用不同的數據庫/文件
- ✅ 使用不同的日誌級別
- ✅ 使用不同的功能開關

### 配置管理
- ✅ 環境變量優先於配置文件
- ✅ 敏感信息使用環境變量
- ✅ 提供默認配置
- ✅ 驗證配置有效性

---

**現在您可以輕鬆在local和sit環境之間切換！** 🎉
