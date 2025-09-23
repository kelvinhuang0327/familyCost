#!/bin/bash

# Vercel 部署腳本
echo "🚀 開始部署到 Vercel..."

# 檢查是否已安裝 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安裝 Vercel CLI..."
    npm install -g vercel
fi

# 檢查是否已登錄
if ! vercel whoami &> /dev/null; then
    echo "🔐 請先登錄 Vercel..."
    vercel login
fi

# 檢查 Git 狀態
echo "📋 檢查 Git 狀態..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️ 有未提交的變更，請先提交："
    git status
    read -p "是否繼續部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署取消"
        exit 1
    fi
fi

# 推送代碼到 GitHub
echo "📤 推送代碼到 GitHub..."
git add .
git commit -m "準備部署到 Vercel"
git push origin main

# 部署到 Vercel
echo "🚀 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo "🌐 您的應用現在可以在 Vercel 上訪問"
echo "📊 可以在 Vercel 儀表板查看部署狀態和日誌"
