# 💰 家庭收支管理平台

一個現代化的家庭財務管理應用，支持多設備同步和雲端備份。

## 📁 項目結構

```
familyCost/
├── src/                          # 源代碼目錄
│   ├── frontend/                 # 前端文件
│   │   └── index.html            # 主應用界面
│   ├── backend/                  # 後端文件
│   │   ├── server.js             # Express 服務器
│   │   └── token_manager.js      # GitHub Token 管理
│   └── config/                   # 配置文件
│       ├── config.js             # 環境配置
│       ├── env.local             # 本地環境配置
│       ├── env.sit               # SIT環境配置
│       ├── vercel.json           # Vercel 部署配置
│       └── render.yaml            # Render 部署配置
├── assets/                       # 資源文件
│   ├── data/                     # 數據文件
│   │   ├── data.json             # 主要數據存儲
│   │   └── version.json          # 版本信息
│   └── keys/                     # 密鑰文件
│       └── .github_key           # GitHub 密鑰
├── docs/                         # 文檔目錄
│   ├── deployment/               # 部署文檔
│   │   ├── vercel_deployment_guide.md
│   │   └── render_deployment_guide.md
│   ├── guides/                   # 使用指南
│   │   ├── ENVIRONMENT_GUIDE.md
│   │   ├── VERSION_MANAGEMENT.md
│   │   └── github_token_guide.md
│   └── troubleshooting/          # 故障排除
├── tools/                        # 工具目錄
│   ├── scripts/                  # 腳本文件
│   │   ├── start_services.sh     # 啟動服務
│   │   ├── update_version.js     # 版本更新
│   │   ├── pre-commit            # Git 鉤子
│   │   └── deploy_to_vercel.sh   # Vercel 部署
│   └── test/                     # 測試文件
│       ├── environment_checker.html
│       ├── token_format_checker.html
│       └── safari_force_refresh.html
├── package.json                  # 項目配置
└── README.md                     # 項目說明
```

## 🚀 快速開始

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動本地服務
npm run local
```

### 雲端部署

#### Vercel 部署
```bash
# 使用 Vercel CLI
npm install -g vercel
vercel login
vercel --prod
```

#### Render 部署
```bash
# 直接推送到 GitHub，Render 會自動部署
git push origin main
```

## 🌍 環境配置

- **local**: 本地開發環境
- **sit**: GitHub Pages 環境（僅前端）
- **vercel**: Vercel 雲端環境
- **render**: Render 雲端環境

## 📊 功能特性

- ✅ 收支記錄管理
- ✅ 多設備數據同步
- ✅ GitHub 自動備份
- ✅ 版本管理
- ✅ 安全 Token 存儲
- ✅ 跨瀏覽器兼容

## 🔧 技術棧

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **後端**: Node.js, Express.js
- **數據存儲**: JSON, localStorage, GitHub
- **部署**: Vercel, Render, GitHub Pages

## 📝 更新日誌

查看 `assets/data/version.json` 獲取最新版本信息。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 許可證

MIT License
