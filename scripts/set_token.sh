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

# 更新 github_config.json（清空 token，因為會從環境變數讀取）
cat > app/config/github_config.json << EOF
{
  "github_token": "",
  "owner": "kelvinhuang0327",
  "repo": "familyCost",
  "branch": "main",
  "data_path": "data/data.json",
  "last_updated": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "description": "GitHub 配置設定檔"
}
EOF

echo "✅ github_config.json 已更新"
echo "🔐 Token 已安全保存到 .env 文件（不會被 git 追蹤）"
echo "📝 您可以提交 github_config.json 到 git"
echo ""
echo "下一步："
echo "1. 運行: git add app/config/github_config.json"
echo "2. 運行: git commit -m '更新配置文件'"
echo "3. 運行: git push origin main"
