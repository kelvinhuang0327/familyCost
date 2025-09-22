#!/bin/bash
# 本地環境啟動腳本

echo "🏠 啟動本地開發環境..."
echo "================================"

# 設置環境變量
export NODE_ENV=local

# 檢查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js"
    exit 1
fi

# 檢查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝，請先安裝 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 安裝依賴
echo "📦 安裝依賴..."
npm install

# 啟動後端服務
echo "🚀 啟動後端服務 (本地環境)..."
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && npm run start:local &
BACKEND_PID=$!

# 等待後端啟動
echo "⏳ 等待後端服務啟動..."
sleep 3

# 檢查後端是否啟動成功
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ 後端服務啟動成功"
else
    echo "❌ 後端服務啟動失敗"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 啟動前端服務
echo "🌐 啟動前端服務..."
python3 -m http.server 8000 &
FRONTEND_PID=$!

# 等待前端啟動
sleep 2

echo ""
echo "🎉 本地環境啟動完成！"
echo "================================"
echo "📱 前端應用: http://localhost:8000"
echo "🔧 後端API: http://localhost:3001"
echo "🔍 健康檢查: http://localhost:3001/api/health"
echo ""
echo "📋 可用命令:"
echo "  - 停止服務: kill $BACKEND_PID $FRONTEND_PID"
echo "  - 重啟後端: kill $BACKEND_PID && npm run start:local &"
echo "  - 查看日誌: tail -f server.log"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 等待用戶中斷
trap "echo ''; echo '🛑 停止服務...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# 保持腳本運行
wait
