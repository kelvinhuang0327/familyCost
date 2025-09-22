#!/bin/bash

# 家庭收支管理系統啟動腳本

echo "🚀 啟動家庭收支管理系統..."

# 設置Node.js環境
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 檢查Node.js是否安裝
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 檢查依賴是否安裝
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴..."
    npm install
fi

# 啟動後端服務
echo "🔧 啟動後端備份服務..."
node server.js &
BACKUP_PID=$!

# 等待後端服務啟動
sleep 3

# 檢查後端服務是否正常
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ 後端服務已啟動 (PID: $BACKUP_PID)"
else
    echo "❌ 後端服務啟動失敗"
    kill $BACKUP_PID 2>/dev/null
    exit 1
fi

# 啟動前端服務
echo "🌐 啟動前端服務..."
python3 -m http.server 8000 &
FRONTEND_PID=$!

# 等待前端服務啟動
sleep 2

echo ""
echo "🎉 系統啟動完成！"
echo "📱 主應用: http://localhost:8000/index.html"
echo "🔧 後端API: http://localhost:3001"
echo "🧪 Safari測試: http://localhost:8000/test/safari_simple_test.html"
echo ""
echo "📋 可用功能:"
echo "   • 自動備份到GitHub (需要Git認證)"
echo "   • 本地備份 (無需認證)"
echo "   • 數據同步和還原"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 等待用戶中斷
trap 'echo ""; echo "🛑 正在停止服務..."; kill $BACKUP_PID $FRONTEND_PID 2>/dev/null; echo "✅ 服務已停止"; exit 0' INT

# 保持腳本運行
wait
