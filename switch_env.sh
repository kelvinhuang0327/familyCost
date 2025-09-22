#!/bin/bash
# 環境切換工具

echo "🔄 環境切換工具"
echo "================================"

# 檢查當前環境
if [ -n "$NODE_ENV" ]; then
    echo "當前環境: $NODE_ENV"
else
    echo "當前環境: 未設置 (默認為 local)"
fi

echo ""
echo "請選擇環境："
echo "1) local (本地開發)"
echo "2) sit (測試環境)"
echo "3) 查看環境信息"
echo "4) 退出"
echo ""

read -p "請輸入選項 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🏠 切換到本地環境..."
        export NODE_ENV=local
        echo "✅ 環境已切換為: local"
        echo ""
        echo "📋 可用命令:"
        echo "  - 啟動服務: ./start_local.sh"
        echo "  - 直接啟動: npm run start:local"
        echo "  - 開發模式: npm run dev:local"
        ;;
    2)
        echo ""
        echo "🧪 切換到SIT環境..."
        export NODE_ENV=sit
        echo "✅ 環境已切換為: sit"
        echo ""
        echo "📋 可用命令:"
        echo "  - 啟動服務: ./start_sit.sh"
        echo "  - 直接啟動: npm run start:sit"
        echo "  - 開發模式: npm run dev:sit"
        ;;
    3)
        echo ""
        echo "📊 環境信息"
        echo "================================"
        echo "當前環境: ${NODE_ENV:-local}"
        echo ""
        echo "🏠 Local 環境:"
        echo "  - 前端: http://localhost:8000"
        echo "  - 後端: http://localhost:3001"
        echo "  - API: http://localhost:3001/api"
        echo ""
        echo "🧪 SIT 環境:"
        echo "  - 前端: https://family-cost-sit.vercel.app"
        echo "  - 後端: https://family-cost-sit.vercel.app"
        echo "  - API: https://family-cost-sit.vercel.app/api"
        echo ""
        echo "📁 配置文件:"
        echo "  - 本地: env.local"
        echo "  - SIT: env.sit"
        echo "  - 主配置: config.js"
        ;;
    4)
        echo "👋 再見！"
        exit 0
        ;;
    *)
        echo "❌ 無效選項"
        exit 1
        ;;
esac

echo ""
echo "💡 提示: 環境變量只在當前會話中有效"
echo "   要永久設置，請在 ~/.bashrc 或 ~/.zshrc 中添加:"
echo "   export NODE_ENV=$NODE_ENV"
