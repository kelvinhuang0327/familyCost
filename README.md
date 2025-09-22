# 🏠 家庭收支管理系統

## 📁 目錄結構

```
familyCost/
├── data.json                    # 數據文件 (104筆記錄)
├── node_modules/                # Node.js依賴
├── package-lock.json           # 依賴鎖定文件
├── README.md                   # 本文件
├── PROJECT_SUMMARY.md          # 項目總結
├── index.html                  # 主應用程式
├── server.js                   # 後端服務
├── package.json                # 項目配置
├── start_services.sh           # 服務啟動腳本
├── .gitignore                  # Git忽略文件
├── doc/                        # 文檔目錄
│   ├── README.md               # 項目說明
│   ├── README_BACKUP.md        # 備份功能說明
│   ├── DATA_FLOW_GUIDE.md      # 數據流程指南
│   ├── SAFARI_FINAL_FIX.md     # Safari修復指南
│   ├── SAFARI_FETCH_FIX.md     # Safari Fetch修復
│   ├── SAFARI_FIX.md           # Safari修復說明
│   ├── SYNC_TROUBLESHOOTING.md # 同步故障排除
│   ├── MULTI_BROWSER_SYNC.md   # 多瀏覽器同步
│   ├── CACHE_FIX_GUIDE.md      # 緩存修復指南
│   ├── CACHE_CLEAR_FIX.md      # 緩存清除修復
│   └── *.xlsx                  # Excel備份文件
└── test/                       # 測試目錄
    ├── safari_*.html           # Safari測試頁面
    ├── test_sync.html          # 同步測試
    ├── test_sync.js            # 同步測試腳本
    ├── debug_sync.html         # 同步調試
    ├── sync_test.html          # 同步測試
    ├── test_cache_clear.html   # 緩存清除測試
    └── test_records_count.html # 記錄數量測試
```

## 🚀 快速開始

### 1. 啟動服務
```bash
./start_services.sh
```

### 2. 訪問應用
- 主應用：http://localhost:8000/index.html
- 後端API：http://localhost:3001

### 3. 測試功能
- Safari測試：http://localhost:8000/test/safari_simple_test.html
- 同步測試：http://localhost:8000/test/test_sync.html

## 📊 功能特色

### ✅ 已實現功能
- 📝 收支記錄管理
- 📊 數據統計分析
- 📅 日曆視圖
- 👥 成員管理
- 💾 本地存儲
- 🔄 跨瀏覽器同步
- ☁️ GitHub備份
- 🍎 Safari兼容

### 🔧 技術架構
- **前端**：HTML + CSS + JavaScript
- **後端**：Node.js + Express
- **數據**：JSON + localStorage
- **備份**：Git + GitHub
- **同步**：REST API

## 🎯 測試結果

### Safari兼容性測試 ✅
```
[下午2:54:09] HTTP狀態碼: 200
[下午2:54:09] ✅ Fetch成功
[下午2:54:09] 記錄數: 104
[下午2:54:10] 📡 測試XMLHttpRequest...
[下午2:54:10] ✅ XHR成功
[下午2:54:10] 記錄數: 104
```

### 數據統計
- 📊 總記錄數：104筆
- 💰 收入記錄：包含工資、房租等
- 💸 支出記錄：包含餐飲、交通、醫療等
- 👥 成員：Kelvin、Phuong、Ryan、家用

## 🔍 故障排除

### 常見問題
1. **Safari無法顯示數據**
   - 解決方案：使用 `test/safari_simple_test.html` 測試
   - 參考：`doc/SAFARI_FINAL_FIX.md`

2. **跨瀏覽器同步問題**
   - 解決方案：檢查後端服務是否運行
   - 參考：`doc/SYNC_TROUBLESHOOTING.md`

3. **數據不一致**
   - 解決方案：清除緩存並重新同步
   - 參考：`doc/CACHE_CLEAR_FIX.md`

## 📚 文檔說明

### 主要文檔
- `doc/README.md` - 項目詳細說明
- `doc/DATA_FLOW_GUIDE.md` - 數據流程指南
- `doc/SAFARI_FINAL_FIX.md` - Safari最終修復指南

### 測試文檔
- `test/safari_simple_test.html` - Safari基本測試
- `test/safari_data_test.html` - Safari數據測試
- `test/test_sync.html` - 同步功能測試

## 🎉 項目狀態

### ✅ 已完成
- [x] 基本收支管理功能
- [x] 跨瀏覽器數據同步
- [x] Safari兼容性修復
- [x] GitHub自動備份
- [x] 目錄結構整理
- [x] 完整測試套件

### 🔄 進行中
- [ ] GitHub認證設置
- [ ] 性能優化
- [ ] 用戶體驗改善

## 📞 支持

如有問題，請參考：
1. `doc/` 目錄下的相關文檔
2. `test/` 目錄下的測試頁面
3. 控制台日誌輸出

---

**最後更新**：2025-09-22  
**版本**：v1.0  
**狀態**：✅ 生產就緒
