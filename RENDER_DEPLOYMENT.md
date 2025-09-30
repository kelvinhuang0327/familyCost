# Render 部署指南

## 🔧 環境變數設置

### 方法 1：通過 Render Dashboard 設置（推薦）

1. **登入 Render Dashboard**
   - 前往 https://dashboard.render.com
   - 選擇您的 `family-cost` 服務

2. **設置環境變數**
   - 點擊左側菜單的 "Environment"
   - 添加以下環境變數：

| 變數名稱 | 值 | 說明 |
|---------|-----|------|
| `GITHUB_TOKEN` | `your_actual_token_here` | GitHub Personal Access Token |
| `GITHUB_OWNER` | `kelvinhuang0327` | GitHub 用戶名 |
| `GITHUB_REPO` | `familyCost` | 倉庫名稱 |
| `GITHUB_BRANCH` | `main` | 分支名稱 |

3. **保存並重新部署**
   - 點擊 "Save Changes"
   - Render 會自動重新部署服務

### 方法 2：通過 render.yaml 設置

render.yaml 文件已預配置環境變數結構：

```yaml
envVars:
  - key: GITHUB_TOKEN
    sync: false  # 需要在 Dashboard 中手動設置實際值
  - key: GITHUB_OWNER
    value: kelvinhuang0327
  - key: GITHUB_REPO
    value: familyCost
  - key: GITHUB_BRANCH
    value: main
```

## 🔒 安全注意事項

### ✅ **環境變數在 Render 中是安全的**
- **不會在重新部署時消失**
- **不會出現在代碼中**
- **只有服務本身可以訪問**
- **在 Render Dashboard 中加密存儲**

### 🚫 **不要做的事情**
- ❌ 不要將 token 直接寫在代碼中
- ❌ 不要將 token 提交到 git
- ❌ 不要將 token 寫在 render.yaml 中（除了結構）

## 🚀 部署流程

1. **設置環境變數**
   ```bash
   # 在 Render Dashboard 中設置 GITHUB_TOKEN
   ```

2. **推送代碼**
   ```bash
   git add .
   git commit -m "更新配置"
   git push origin main
   ```

3. **自動部署**
   - Render 會自動檢測到推送
   - 使用新的環境變數重新部署
   - 服務會自動重啟

## 🔍 驗證部署

部署完成後，可以通過以下方式驗證：

1. **檢查服務狀態**
   - 在 Render Dashboard 中查看服務狀態
   - 確認服務運行正常

2. **測試 GitHub 同步**
   - 在應用中添加一筆記錄
   - 檢查是否成功同步到 GitHub

3. **查看日誌**
   - 在 Render Dashboard 中查看服務日誌
   - 確認沒有環境變數相關錯誤

## 📞 故障排除

### 問題：GitHub 同步失敗
**解決方案：**
1. 檢查 Render Dashboard 中的環境變數是否正確設置
2. 確認 GITHUB_TOKEN 是否有效
3. 查看服務日誌中的錯誤信息

### 問題：服務啟動失敗
**解決方案：**
1. 檢查所有必需的環境變數是否已設置
2. 確認 render.yaml 配置正確
3. 查看構建日誌

## 💡 最佳實踐

1. **使用 Dashboard 設置敏感信息**：GITHUB_TOKEN 等敏感信息通過 Dashboard 設置
2. **使用 render.yaml 設置非敏感配置**：GITHUB_OWNER 等非敏感配置可以寫在 render.yaml 中
3. **定期檢查環境變數**：確保所有必需的環境變數都已正確設置
4. **監控服務日誌**：定期檢查服務日誌，及時發現問題
