# 家庭財務管理系統 - API 接口文檔

## 📋 目錄
- [API 概述](#api-概述)
- [基礎配置](#基礎配置)
- [記錄管理 API](#記錄管理-api)
- [文件處理 API](#文件處理-api)
- [系統信息 API](#系統信息-api)
- [錯誤處理](#錯誤處理)
- [使用示例](#使用示例)

## 🎯 API 概述

家庭財務管理系統提供 RESTful API 接口，支援財務記錄的 CRUD 操作、文件上傳處理和系統信息查詢。

### 基礎 URL
- **本地開發**：`http://localhost:3000`
- **生產環境**：`https://familycost-1.onrender.com`

### 響應格式
所有 API 響應都使用 JSON 格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2025-10-07T18:00:00.000Z"
}
```

## ⚙️ 基礎配置

### 請求頭
```http
Content-Type: application/json
Accept: application/json
```

### 認證
- GitHub Token 通過環境變量 `GITHUB_TOKEN` 管理
- 無需用戶認證（本地使用）

## 📊 記錄管理 API

### 1. 獲取所有記錄
```http
GET /api/records
```

**響應示例**：
```json
{
  "success": true,
  "records": [
    {
      "id": "2025-10-07_001",
      "date": "2025/10/7",
      "member": "Kelvin",
      "type": "expense",
      "amount": 150,
      "mainCategory": "餐飲",
      "subCategory": "現金",
      "description": "午餐"
    }
  ]
}
```

### 2. 新增記錄
```http
POST /api/records
Content-Type: application/json
```

**請求體**：
```json
{
  "date": "2025/10/7",
  "member": "Kelvin",
  "type": "expense",
  "amount": 150,
  "mainCategory": "餐飲",
  "subCategory": "現金",
  "description": "午餐"
}
```

**響應示例**：
```json
{
  "success": true,
  "message": "記錄已成功添加",
  "record": {
    "id": "2025-10-07_001",
    "date": "2025/10/7",
    "member": "Kelvin",
    "type": "expense",
    "amount": 150,
    "mainCategory": "餐飲",
    "subCategory": "現金",
    "description": "午餐"
  }
}
```

### 3. 更新記錄
```http
PUT /api/records/:id
Content-Type: application/json
```

**請求體**：
```json
{
  "date": "2025/10/7",
  "member": "Kelvin",
  "type": "expense",
  "amount": 200,
  "mainCategory": "餐飲",
  "subCategory": "現金",
  "description": "晚餐"
}
```

**響應示例**：
```json
{
  "success": true,
  "message": "記錄已成功更新",
  "record": {
    "id": "2025-10-07_001",
    "date": "2025/10/7",
    "member": "Kelvin",
    "type": "expense",
    "amount": 200,
    "mainCategory": "餐飲",
    "subCategory": "現金",
    "description": "晚餐"
  }
}
```

### 4. 刪除記錄
```http
DELETE /api/records/:id
```

**響應示例**：
```json
{
  "success": true,
  "message": "記錄已成功刪除"
}
```

### 5. 清空所有記錄
```http
POST /api/records/clear
```

**響應示例**：
```json
{
  "success": true,
  "message": "所有記錄已清空"
}
```

## 📁 文件處理 API

### 1. Excel 文件上傳
```http
POST /api/upload
Content-Type: multipart/form-data
```

**請求參數**：
- `file`: Excel 文件 (.xlsx, .xls)

**響應示例**：
```json
{
  "success": true,
  "message": "文件上傳成功",
  "filename": "upload_2025-10-07.xlsx",
  "records": [
    {
      "date": "2025/10/7",
      "member": "Kelvin",
      "type": "expense",
      "amount": 150,
      "mainCategory": "餐飲",
      "subCategory": "現金",
      "description": "午餐"
    }
  ]
}
```

### 2. 數據匯出 (Excel)
```http
GET /api/export
```

**查詢參數**：
- `format`: 匯出格式 (excel, csv)
- `startDate`: 開始日期 (可選)
- `endDate`: 結束日期 (可選)

**響應**：返回 Excel 文件下載

## ℹ️ 系統信息 API

### 1. 獲取版本信息
```http
GET /api/version
```

**響應示例**：
```json
{
  "success": true,
  "version": "2025-10-07 18:00:00",
  "commitHash": "1f30286",
  "environment": "production",
  "apiBase": "https://familycost-1.onrender.com"
}
```

### 2. 獲取統計信息
```http
GET /api/stats
```

**響應示例**：
```json
{
  "success": true,
  "stats": {
    "totalRecords": 165,
    "totalIncome": 195028,
    "totalExpense": 168495,
    "balance": 26533,
    "memberStats": {
      "Kelvin": {
        "income": 1932,
        "expense": 19158,
        "balance": -17226
      }
    }
  }
}
```

## ❌ 錯誤處理

### 錯誤響應格式
```json
{
  "success": false,
  "message": "錯誤描述",
  "error": "詳細錯誤信息",
  "code": "ERROR_CODE",
  "timestamp": "2025-10-07T18:00:00.000Z"
}
```

### 常見錯誤碼
- `400`: 請求參數錯誤
- `404`: 記錄不存在
- `500`: 服務器內部錯誤
- `FILE_ERROR`: 文件處理錯誤
- `VALIDATION_ERROR`: 數據驗證錯誤

### 錯誤示例
```json
{
  "success": false,
  "message": "記錄不存在",
  "error": "Record with id 'invalid-id' not found",
  "code": "404",
  "timestamp": "2025-10-07T18:00:00.000Z"
}
```

## 💡 使用示例

### JavaScript 前端調用示例

#### 獲取記錄
```javascript
async function getRecords() {
  try {
    const response = await fetch('/api/records');
    const data = await response.json();
    
    if (data.success) {
      console.log('記錄數量:', data.records.length);
      return data.records;
    } else {
      console.error('獲取記錄失敗:', data.message);
    }
  } catch (error) {
    console.error('請求錯誤:', error);
  }
}
```

#### 新增記錄
```javascript
async function addRecord(recordData) {
  try {
    const response = await fetch('/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('記錄已添加:', data.record);
      return data.record;
    } else {
      console.error('添加記錄失敗:', data.message);
    }
  } catch (error) {
    console.error('請求錯誤:', error);
  }
}
```

#### 上傳 Excel 文件
```javascript
async function uploadExcel(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('文件上傳成功:', data.filename);
      console.log('解析記錄數:', data.records.length);
      return data.records;
    } else {
      console.error('文件上傳失敗:', data.message);
    }
  } catch (error) {
    console.error('上傳錯誤:', error);
  }
}
```

### cURL 命令示例

#### 獲取記錄
```bash
curl -X GET "https://familycost-1.onrender.com/api/records" \
  -H "Accept: application/json"
```

#### 新增記錄
```bash
curl -X POST "https://familycost-1.onrender.com/api/records" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025/10/7",
    "member": "Kelvin",
    "type": "expense",
    "amount": 150,
    "mainCategory": "餐飲",
    "subCategory": "現金",
    "description": "午餐"
  }'
```

#### 上傳文件
```bash
curl -X POST "https://familycost-1.onrender.com/api/upload" \
  -F "file=@/path/to/file.xlsx"
```

## 📝 數據模型

### 記錄對象結構
```typescript
interface Record {
  id: string;              // 唯一標識符
  date: string;            // 日期 (YYYY/M/D)
  member: string;          // 成員名稱
  type: 'income' | 'expense'; // 類型
  amount: number;          // 金額
  mainCategory: string;    // 主類別
  subCategory: string;     // 子類別
  description: string;     // 描述
}
```

### 統計對象結構
```typescript
interface Stats {
  totalRecords: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  memberStats: {
    [member: string]: {
      income: number;
      expense: number;
      balance: number;
    };
  };
}
```

## 🔧 開發工具

### API 測試工具
- **Postman**: 推薦用於 API 測試
- **Insomnia**: 輕量級 API 客戶端
- **curl**: 命令行工具

### 調試技巧
1. 檢查瀏覽器開發者工具的 Network 標籤
2. 查看服務器日誌輸出
3. 使用 API 測試工具驗證端點
4. 檢查環境變量配置

---

*最後更新：2025-10-07*
*版本：1.0.0*
