#!/bin/bash

# GitHub Token 設置腳本
echo "🔧 GitHub Token 設置工具"
echo "================================"

# 檢查是否已設置環境變數
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ 環境變數 GITHUB_TOKEN 已設置"
    echo "🔑 Token 前幾位: ${GITHUB_TOKEN:0:10}..."
    echo ""
    echo "📋 設置方式："
    echo "1. 在 Render 控制台設置環境變數 GITHUB_TOKEN"
    echo "2. 或者在本地設置：export GITHUB_TOKEN='your_token_here'"
    echo ""
    echo "🔗 GitHub Token 獲取地址："
    echo "https://github.com/settings/tokens/new"
    echo ""
    echo "📝 Token 權限需要："
    echo "- repo (完整倉庫訪問權限)"
    echo "- 或者至少 contents (讀取和寫入倉庫內容)"
else
    echo "❌ 環境變數 GITHUB_TOKEN 未設置"
    echo ""
    echo "📋 設置步驟："
    echo "1. 前往 GitHub 創建 Personal Access Token："
    echo "   https://github.com/settings/tokens/new"
    echo ""
    echo "2. 選擇權限："
    echo "   - repo (完整倉庫訪問權限)"
    echo "   - 或者至少 contents (讀取和寫入倉庫內容)"
    echo ""
    echo "3. 複製生成的 Token（以 ghp_ 開頭）"
    echo ""
    echo "4. 設置環境變數："
    echo "   export GITHUB_TOKEN='your_token_here'"
    echo ""
    echo "5. 或者在 Render 控制台設置環境變數："
    echo "   - 進入 Render Dashboard"
    echo "   - 選擇你的服務"
    echo "   - 進入 Environment 頁面"
    echo "   - 添加 GITHUB_TOKEN 環境變數"
fi

echo ""
echo "🧪 測試 Token："
echo "運行以下命令測試 Token 是否有效："
echo "node scripts/test_github_token.js"
