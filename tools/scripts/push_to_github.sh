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

# 檢查是否有儲存的Token
echo "🔍 檢查是否有儲存的Token..."
if curl -s http://localhost:3001/api/token/status | grep -q '"hasToken":true'; then
    echo "✅ 發現儲存的Token，正在驗證..."
    token_status=$(curl -s http://localhost:3001/api/token/status)
    if echo "$token_status" | grep -q '"valid":true'; then
        echo "✅ 儲存的Token有效，直接使用"
        echo "🚀 開始推送..."
        if git push origin main; then
            echo ""
            echo "🎉 成功推送到GitHub！"
            echo "================================"
            echo "✅ 使用儲存的Token推送成功"
            echo "✅ 代碼已推送到GitHub"
            echo ""
            echo "📊 推送統計："
            echo "  - 分支: main"
            echo "  - 遠程: $(git remote get-url origin | sed 's/\/\/.*@/\/\/***@/')"
            echo "  - 最新提交: $(git log -1 --pretty=format:'%h - %s (%cr)')"
            echo ""
            echo "🔗 GitHub倉庫: https://github.com/kelvinhuang0327/familyCost"
            exit 0
        else
            echo "❌ 推送失敗，可能需要更新Token"
        fi
    else
        echo "❌ 儲存的Token無效，需要重新設置"
    fi
else
    echo "⚠️ 未發現儲存的Token"
fi

echo ""
echo "請選擇認證方式："
echo "1) 使用Token管理界面 (推薦)"
echo "2) 手動輸入Token"
echo "3) 跳過推送"
read -p "請輸入選項 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🌐 正在打開Token管理界面..."
        echo "請在瀏覽器中完成Token設置："
        echo "  http://localhost:8000/token_manager.html"
        echo ""
        echo "設置完成後，請重新運行此腳本"
        exit 0
        ;;
    2)
        echo ""
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
        ;;
    3)
        echo "⏭️ 跳過推送"
        exit 0
        ;;
    *)
        echo "❌ 無效選項"
        exit 1
        ;;
esac

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
