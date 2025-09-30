#!/bin/bash

# GitHub Token 設置腳本
# 使用方法: ./scripts/set_token.sh your_token_here

if [ $# -eq 0 ]; then
    echo "❌ 請提供 GitHub Token"
    echo "使用方法: $0 <your_github_token>"
    echo "範例: $0 ghp_xxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

TOKEN=$1

echo "🔧 設置 GitHub Token..."

# 創建 .env 文件
cat > .env << EOF
# GitHub 配置
GITHUB_TOKEN=$TOKEN
GITHUB_OWNER=kelvinhuang0327
GITHUB_REPO=familyCost
GITHUB_BRANCH=main
EOF

echo "✅ .env 文件已創建"

echo "🔐 Token 已安全保存到 .env 文件（不會被 git 追蹤）"
echo "🚀 系統已簡化，僅使用環境變數管理 Token"
echo ""
echo "下一步："
echo "1. 運行: git add ."
echo "2. 運行: git commit -m '簡化 Token 管理，移除配置文件邏輯'"
echo "3. 運行: git push origin main"
