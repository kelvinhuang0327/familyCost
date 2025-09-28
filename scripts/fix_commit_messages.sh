#!/bin/bash

echo "🔧 修復提交主旨格式，添加版本號..."

# 設置版本號
VERSION="2025-09-28 13:32:00"

# 修改最新的提交（已經修改過了）
echo "✅ 最新提交已修改"

# 修改前一個提交
git commit --amend -m "版本 2025-09-28 13:21:10 - 修復 Token 持久化和同步問題：

1. 修復 Token 重新整理後消失的問題：
   - 新增本地文件持久化存儲 Token
   - 修改 getValidToken 方法優先從本地文件讀取

2. 修復同步後資料未更新的問題：
   - 在同步前檢查 Token 狀態
   - 添加詳細的錯誤提示和日誌

3. 更新 Render 配置：
   - 在 render.yaml 中添加 GITHUB_TOKEN 環境變數配置

4. 新增輔助工具：
   - scripts/set_github_token.sh: Token 設置指南
   - scripts/test_github_token.js: Token 測試工具" HEAD~1

echo "✅ 提交主旨修復完成"
