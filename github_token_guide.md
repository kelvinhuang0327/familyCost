# GitHub Personal Access Token 創建指南

## 🔑 創建 GitHub Personal Access Token

### 步驟 1：登入 GitHub
1. 訪問 [github.com](https://github.com) 並登入
2. 點擊右上角頭像 → **Settings**

### 步驟 2：進入 Developer Settings
1. 左側選單滾動到底部
2. 點擊 **Developer settings**

### 步驟 3：創建 Token
1. 點擊 **Personal access tokens** → **Tokens (classic)**
2. 點擊 **Generate new token** → **Generate new token (classic)**

### 步驟 4：設定 Token
- **Note**: `家庭收支管理系統`
- **Expiration**: `90 days` (建議)
- **Select scopes**: 勾選以下權限
  - ✅ `repo` (完整倉庫存取)
  - ✅ `workflow` (GitHub Actions)

### 步驟 5：生成並複製
1. 點擊 **Generate token**
2. **立即複製 Token** (只顯示一次)
3. 格式類似：`ghp_xxxxxxxxxxxxxxxxxxxx`

## ⚠️ 重要提醒

- **Token 只顯示一次**，請立即複製保存
- **不要分享**給他人
- **定期更新** (建議 90 天)
- **格式檢查**：以 `ghp_` 開頭，40 個字符

## 🔧 在系統中使用

1. 訪問 **設定頁面**
2. 貼上 Token
3. 點擊 **儲存 Token**
4. 系統會自動驗證並加密儲存

## 🛡️ 安全說明

- Token 使用 AES-256 加密儲存
- 僅用於與 GitHub API 通訊
- 不會上傳到任何第三方服務
