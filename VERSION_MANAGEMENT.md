# 📋 版本管理指南

## 🎯 **版本號格式**

版本號使用commit時間的格式：`YYYY-MM-DD-HH-MM-SS`

### 範例
- `2025-09-22-15-59-01` - 2025年9月22日 15:59:01
- `2025-09-22-16-30-45` - 2025年9月22日 16:30:45

## 🔧 **自動化機制**

### Git Hook
- **Pre-commit Hook**: 每次commit前自動更新版本號
- **自動添加**: 版本文件自動添加到commit中
- **無需手動**: 開發者無需手動更新版本號

### 手動更新
```bash
# 手動更新版本號
npm run version:update

# 查看當前版本
npm run version:show
```

## 📁 **相關文件**

### 核心文件
- `version.json` - 版本信息文件
- `update_version.js` - 版本更新腳本
- `pre-commit` - Git hook腳本

### 配置文件
- `.git/hooks/pre-commit` - 安裝的Git hook
- `package.json` - npm腳本配置

## 🚀 **使用方式**

### 自動更新（推薦）
```bash
# 正常commit，版本號會自動更新
git add .
git commit -m "更新功能"
# 版本號會自動更新為當前時間
```

### 手動更新
```bash
# 手動更新版本號
node update_version.js

# 或使用npm腳本
npm run version:update
```

### 查看版本
```bash
# 查看版本文件
cat version.json

# 或使用npm腳本
npm run version:show
```

## 📊 **版本信息結構**

```json
{
  "version": "2025-09-22-15-59-01",
  "buildTime": "2025-09-22T07:59:01.748Z",
  "commitHash": "c8ec5b6",
  "description": "家庭收支管理平台版本信息"
}
```

### 字段說明
- **version**: 版本號（時間格式）
- **buildTime**: 建構時間（ISO格式）
- **commitHash**: Git commit hash
- **description**: 版本描述

## 🎨 **前端顯示**

### 位置
- 總覽頁左上角
- 美觀的版本信息卡片

### 功能
- ✅ 實時載入版本號
- ✅ 懸停顯示詳細信息
- ✅ 響應式設計
- ✅ 自動更新

### 樣式特點
- 半透明背景
- 毛玻璃效果
- 等寬字體顯示版本號
- 漸變背景

## 🔍 **故障排除**

### 常見問題

#### 1. Git Hook未生效
```bash
# 檢查hook是否存在
ls -la .git/hooks/pre-commit

# 重新安裝hook
cp pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

#### 2. 版本號未更新
```bash
# 手動運行更新腳本
node update_version.js

# 檢查版本文件
cat version.json
```

#### 3. 前端版本號不顯示
```bash
# 檢查版本文件是否存在
ls -la version.json

# 檢查網絡請求
# 打開瀏覽器開發者工具查看Console
```

## 📈 **版本歷史**

### 版本追蹤
- 每次commit都會生成新的版本號
- 版本號包含精確的時間信息
- 可以通過Git歷史查看版本變更

### 版本比較
```bash
# 查看版本變更歷史
git log --oneline

# 查看特定版本的版本信息
git show <commit-hash>:version.json
```

## 🎯 **最佳實踐**

### 開發流程
1. **開發功能** - 正常開發
2. **提交代碼** - `git commit`（自動更新版本）
3. **推送代碼** - `git push`
4. **查看版本** - 前端自動顯示

### 版本管理
- ✅ 每次commit自動更新
- ✅ 版本號包含時間信息
- ✅ 前端實時顯示
- ✅ 詳細的版本信息

### 部署流程
- ✅ 版本號隨代碼一起部署
- ✅ 生產環境顯示正確版本
- ✅ 便於問題追蹤和回滾

---

**現在每次commit都會自動更新版本號，前端會實時顯示！** 🎉
