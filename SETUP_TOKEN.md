# 🔐 GitHub Token 設置指南

## ⚠️ 重要提醒
**絕對不要將 token 寫在代碼文件中！**

## 🎯 正確的設置方法

### 方法 1：Render Dashboard 設置（推薦）

1. **登入 Render Dashboard**
   - 前往：https://dashboard.render.com
   - 選擇您的 `family-cost` 服務

2. **設置環境變數**
   - 點擊左側菜單的 "Environment"
   - 點擊 "Add Environment Variable"
   - 設置以下變數：

```
Key: GITHUB_TOKEN
Value: your_github_token_here
```

3. **保存設置**
   - 點擊 "Save Changes"
   - Render 會自動重新部署服務

### 方法 2：本地測試設置

如果您想在本地測試，可以：

1. **創建 .env 文件**
```bash
cp env.example .env
```

2. **編輯 .env 文件**
```bash
# 編輯 .env 文件，將 your_token_here 替換為實際 token
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=kelvinhuang0327
GITHUB_REPO=familyCost
GITHUB_BRANCH=main
```

## 🔍 為什麼 render.yaml 中沒有 token 值？

render.yaml 中的配置：
```yaml
- key: GITHUB_TOKEN
  sync: false  # 這表示需要在 Dashboard 中手動設置
```

**sync: false** 的含義：
- ✅ 環境變數結構已預定義
- ✅ 但實際值需要在 Dashboard 中設置
- ✅ 確保 token 不會出現在代碼中

## 🚀 部署流程

1. **設置環境變數**（在 Render Dashboard 中）
2. **推送代碼**：
   ```bash
   git add .
   git commit -m "更新配置"
   git push origin main
   ```
3. **自動部署**：Render 會自動檢測並重新部署

## ✅ 驗證設置

部署完成後，可以通過以下方式驗證：

1. **檢查服務狀態**：確認服務運行正常
2. **測試同步功能**：在應用中添加記錄，檢查是否同步到 GitHub
3. **查看日誌**：在 Render Dashboard 中查看服務日誌

## 🔒 安全提醒

- ✅ Token 安全存儲在 Render 環境變數中
- ✅ 不會出現在代碼或 git 歷史中
- ✅ 只有您的服務可以訪問
- ✅ 重新部署時不會丟失

## 📞 如果遇到問題

1. **檢查 Dashboard 設置**：確認環境變數是否正確設置
2. **查看服務日誌**：檢查是否有錯誤信息
3. **測試 token 有效性**：確認 token 是否有效且有正確權限
