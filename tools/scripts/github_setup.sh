#!/bin/bash
# GitHub認證設置腳本

echo "🔐 GitHub認證設置助手"
echo "================================"

# 檢查當前狀態
echo "📊 檢查當前Git配置..."
echo "遠程URL: $(git remote get-url origin)"
echo "用戶名: $(git config --global user.name)"
echo "郵箱: $(git config --global user.email)"
echo ""

# 檢查是否有未提交的變更
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 發現未提交的變更，正在提交..."
    git add .
    git commit -m "更新系統功能和優化 - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "✅ 變更已提交"
fi

echo ""
echo "請選擇認證方式："
echo "1) Personal Access Token (推薦)"
echo "2) SSH Key"
echo "3) GitHub CLI"
echo "4) 跳過設置，直接推送"
read -p "請輸入選項 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📝 Personal Access Token 設置"
        echo "================================"
        echo "請前往 GitHub → Settings → Developer settings → Personal access tokens"
        echo "創建token並確保有以下權限："
        echo "  ✅ repo (完整倉庫訪問)"
        echo "  ✅ workflow (更新GitHub Actions工作流程)"
        echo ""
        read -p "請輸入您的token: " token
        
        if [ -n "$token" ]; then
            git remote set-url origin https://$token@github.com/kelvinhuang0327/familyCost.git
            echo "✅ Token設置完成"
        else
            echo "❌ Token不能為空"
            exit 1
        fi
        ;;
    2)
        echo ""
        echo "🔑 SSH Key 設置"
        echo "================================"
        echo "生成SSH Key..."
        ssh-keygen -t ed25519 -C "kelvin@webcomm.com.tw" -f ~/.ssh/id_ed25519_github -N ""
        
        echo ""
        echo "📋 請複製以下公鑰到GitHub："
        echo "================================"
        cat ~/.ssh/id_ed25519_github.pub
        echo "================================"
        echo ""
        echo "前往 GitHub → Settings → SSH and GPG keys → New SSH key"
        echo "貼上上述公鑰並保存"
        echo ""
        read -p "按Enter繼續..."
        
        git remote set-url origin git@github.com:kelvinhuang0327/familyCost.git
        echo "✅ SSH設置完成"
        ;;
    3)
        echo ""
        echo "📦 GitHub CLI 設置"
        echo "================================"
        
        # 檢查是否已安裝GitHub CLI
        if ! command -v gh &> /dev/null; then
            echo "正在安裝GitHub CLI..."
            if command -v brew &> /dev/null; then
                brew install gh
            else
                echo "❌ 請手動安裝GitHub CLI: https://cli.github.com/"
                exit 1
            fi
        fi
        
        echo "登入GitHub..."
        gh auth login
        
        echo "設置Git認證..."
        gh auth setup-git
        
        echo "✅ GitHub CLI設置完成"
        ;;
    4)
        echo "⏭️ 跳過認證設置"
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
    echo "  - 遠程: $(git remote get-url origin)"
    echo "  - 最新提交: $(git log -1 --pretty=format:'%h - %s (%cr)')"
else
    echo ""
    echo "❌ 推送失敗"
    echo "================================"
    echo "請檢查："
    echo "  1. 認證設置是否正確"
    echo "  2. 網絡連接是否正常"
    echo "  3. GitHub倉庫權限是否足夠"
    echo ""
    echo "可以手動執行以下命令："
    echo "  git push origin main"
    echo ""
    echo "或查看詳細錯誤信息："
    echo "  git push origin main --verbose"
fi

echo ""
echo "📚 更多信息請查看: GITHUB_SETUP_GUIDE.md"
