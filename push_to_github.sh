#!/bin/bash
# 簡化的GitHub推送腳本

echo "🚀 推送到GitHub"
echo "================================"

# 檢查是否有未提交的變更
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 發現未提交的變更，正在提交..."
    git add .
    git commit -m "更新系統功能 - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "✅ 變更已提交"
fi

echo ""
echo "🔐 GitHub認證設置"
echo "================================"
echo "請前往 GitHub → Settings → Developer settings → Personal access tokens"
echo "創建token並確保有以下權限："
echo "  ✅ repo (完整倉庫訪問)"
echo "  ✅ workflow (更新GitHub Actions工作流程)"
echo ""

read -p "請輸入您的GitHub Personal Access Token: " token

if [ -z "$token" ]; then
    echo "❌ Token不能為空"
    exit 1
fi

# 設置認證URL
echo "🔧 設置認證..."
git remote set-url origin https://$token@github.com/kelvinhuang0327/familyCost.git

echo ""
echo "🧪 測試推送..."
echo "================================"

# 嘗試推送
if git push origin main; then
    echo ""
    echo "🎉 成功推送到GitHub！"
    echo "================================"
    echo "✅ 認證設置成功"
    echo "✅ 代碼已推送到GitHub"
    echo "✅ 系統現在可以自動備份到GitHub"
    echo ""
    echo "📊 推送統計："
    echo "  - 分支: main"
    echo "  - 遠程: $(git remote get-url origin | sed 's/\/\/.*@/\/\/***@/')"
    echo "  - 最新提交: $(git log -1 --pretty=format:'%h - %s (%cr)')"
    echo ""
    echo "🔗 GitHub倉庫: https://github.com/kelvinhuang0327/familyCost"
else
    echo ""
    echo "❌ 推送失敗"
    echo "================================"
    echo "請檢查："
    echo "  1. Token是否正確"
    echo "  2. Token是否有足夠權限"
    echo "  3. 網絡連接是否正常"
    echo ""
    echo "可以手動執行以下命令："
    echo "  git push origin main"
fi
