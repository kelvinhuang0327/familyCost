#!/usr/bin/env node

// 家庭收支管理平台 - 主服務器文件
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');
const GitHubDataManager = require('./app/backend/github_data_manager');

// 生成唯一ID的函數
function generateUniqueId() {
    // 使用更可靠的ID生成方式：時間戳 + 隨機數 + 計數器
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = (generateUniqueId.counter = (generateUniqueId.counter || 0) + 1);
    return `${timestamp}_${random}_${counter}`;
}

// 載入配置模組
const { getConfig, getEnvironment } = require('./app/config/config');

// 已移除的模組：
// const GitHubTokenManager = require('./app/backend/github_token_manager'); // 已移除
// const BackupManager = require('./app/backend/backup_manager'); // 已移除
// const DatabaseManager = require('./app/backend/database'); // 已移除

const app = express();

// 配置 multer 用於檔案上傳
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 確保 uploads 目錄存在
        const uploadDir = 'uploads';
        if (!require('fs').existsSync(uploadDir)) {
            require('fs').mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        console.log('🔍 [multer] 檢查檔案:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            fieldname: file.fieldname
        });
        
        // 檢查檔案副檔名
        const isExcelFile = file.originalname.match(/\.(xlsx|xls)$/i);
        
        // 檢查 MIME 類型 (放寬檢查)
        const isValidMimeType = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                               file.mimetype === 'application/vnd.ms-excel' ||
                               file.mimetype === 'application/octet-stream' ||
                               file.mimetype === '';
        
        if (isExcelFile && isValidMimeType) {
            console.log('✅ [multer] 檔案通過驗證');
            cb(null, true);
        } else {
            console.log('❌ [multer] 檔案驗證失敗:', {
                isExcelFile: isExcelFile,
                isValidMimeType: isValidMimeType
            });
            cb(new Error('只允許上傳 Excel 檔案 (.xlsx, .xls)'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB 限制
    }
});

// 獲取環境配置
const config = getConfig();
const environment = getEnvironment();
const PORT = process.env.PORT || config.port;

// 初始化 GitHub 數據管理器（不再需要 TokenManager）
const githubDataManager = new GitHubDataManager();

// 啟動時檢查 Token 狀態
async function initializeToken() {
    try {
        console.log('🔍 啟動時檢查 GitHub Token...');
        
        if (process.env.GITHUB_TOKEN) {
            console.log('✅ 環境變數中已設置 Token');
            console.log('🔍 Token 前綴:', process.env.GITHUB_TOKEN.substring(0, 10) + '...');
        } else {
            console.log('⚠️ 環境變數中沒有 Token，請在 Render Dashboard 中設置 GITHUB_TOKEN');
        }
    } catch (error) {
        console.log('⚠️ 檢查 Token 失敗:', error.message);
    }
}

// 啟動時檢查本地數據文件
async function checkLocalDataOnStartup() {
    try {
        console.log('🔍 啟動時檢查本地數據文件...');
        
        const dataPath = path.join(__dirname, 'data', 'data.json');
        
        // 檢查本地文件是否存在
        if (fs.existsSync(dataPath)) {
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            const records = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);
            console.log('✅ 本地文件存在，包含', records.length, '筆記錄');
        } else {
            console.log('📝 本地文件不存在，將創建空文件');
            // 創建空的數據文件
            const emptyData = { records: [] };
            await fs.writeFile(dataPath, JSON.stringify(emptyData, null, 2), 'utf8');
            console.log('✅ 已創建空的本地數據文件');
        }
    } catch (error) {
        console.log('⚠️ 檢查本地數據文件失敗:', error.message);
    }
}

// 執行初始化
initializeToken().then(() => {
    return checkLocalDataOnStartup();
}).then(() => {
    console.log('✅ 啟動初始化完成');
}).catch(error => {
    console.error('❌ 啟動初始化失敗:', error);
});

// 數據庫管理器已移除，系統現在只使用 JSON 文件存儲
console.log('✅ 系統使用 JSON 文件存儲模式');
let dbManager = null; // 保持變數以兼容現有代碼

// 檢測成員標題行
function detectMemberTitle(row) {
    const keys = Object.keys(row);
    
    // 檢查是否只有一個非空值，且該值為已知成員名稱
    const nonEmptyValues = keys.filter(key => row[key] && row[key].toString().trim() !== '');
    
    if (nonEmptyValues.length === 1) {
        const value = row[nonEmptyValues[0]].toString().trim();
        const knownMembers = ['Kelvin', 'Phuong', 'Ryan', '家用'];
        
        if (knownMembers.includes(value)) {
            console.log('🔍 [detectMemberTitle] 檢測到成員標題:', value);
            return value;
        }
    }
    
    return null;
}

// Excel 資料處理函數 (舊格式 - Google Sheets)
function processExcelData(excelData) {
    const processedData = [];
    let currentMember = null;
    
    excelData.forEach((row, index) => {
        try {
            // 檢查是否為成員標題行（如 "Kelvin", "Phuong"）
            const memberTitle = detectMemberTitle(row);
            if (memberTitle) {
                currentMember = memberTitle;
                console.log('🔍 [processExcelData] 檢測到成員:', currentMember);
                return;
            }
            
            // 處理數據行
            const processedRow = processExcelRow(row, currentMember);
            if (processedRow) {
                processedData.push(processedRow);
            }
        } catch (error) {
            console.error(`❌ [processExcelData] 處理第 ${index + 1} 行失敗:`, error, row);
        }
    });
    
    console.log('🔍 [processExcelData] 處理完成，有效記錄數:', processedData.length);
    return processedData;
}

// Excel 資料處理函數 (新格式 - 標準Excel格式)
function processExcelDataNewFormat(excelData) {
    const processedData = [];
    let skippedRows = 0;
    let processedRows = 0;
    
    console.log('🔍 [processExcelDataNewFormat] 開始處理，總行數:', excelData.length);
    
    excelData.forEach((row, index) => {
        try {
            // 智能檢測標題行（第一行）
            if (index === 0) {
                // 檢查第一行是否為標題行（包含中文欄位名稱）
                const keys = Object.keys(row);
                const values = Object.values(row);
                const hasChineseHeaders = values.some(value => 
                    typeof value === 'string' && 
                    (value.includes('成員') || value.includes('金額') || value.includes('類別') || 
                     value.includes('主類別') || value.includes('付款方式') || value.includes('描述') || value.includes('日期'))
                );
                
                if (hasChineseHeaders) {
                    console.log('🔍 [processExcelDataNewFormat] 檢測到標題行，跳過:', row);
                    skippedRows++;
                    return;
                } else {
                    console.log('🔍 [processExcelDataNewFormat] 第一行不是標題行，處理為數據:', row);
                }
            }
            
            // 處理所有數據行（包括空行）
            const processedRow = processExcelRowNewFormat(row, index + 1);
            if (processedRow) {
                processedData.push(processedRow);
                processedRows++;
            } else {
                console.log(`⚠️ [processExcelDataNewFormat] 第 ${index + 1} 行處理失敗，跳過:`, row);
                skippedRows++;
            }
        } catch (error) {
            console.error(`❌ [processExcelDataNewFormat] 處理第 ${index + 1} 行失敗:`, error, row);
            skippedRows++;
        }
    });
    
    console.log('🔍 [processExcelDataNewFormat] 處理完成:');
    console.log('  - 總行數:', excelData.length);
    console.log('  - 有效記錄數:', processedData.length);
    console.log('  - 跳過行數:', skippedRows);
    console.log('  - 處理行數:', processedRows);
    
    return processedData;
}

// 處理單行 Excel 資料
function processExcelRow(row, currentMember = null) {
    try {
        // 根據圖片格式，Excel有以下欄位：
        // 成員, 金額, 主類別, 子類別, 描述, 日期
        
        // 嘗試不同的欄位名稱組合
        let date, description, amount, member, mainCategory, subCategory, type;
        
        // 成員欄位
        if (row['成員'] || row['member'] || row['Member'] || row['MEMBER']) {
            member = row['成員'] || row['member'] || row['Member'] || row['MEMBER'];
        }
        
        // 金額欄位
        if (row['金額'] || row['amount'] || row['Amount'] || row['AMOUNT']) {
            amount = row['金額'] || row['amount'] || row['Amount'] || row['AMOUNT'];
        }
        
        // 主類別欄位
        if (row['主類別'] || row['mainCategory'] || row['MainCategory'] || row['MAINCATEGORY']) {
            mainCategory = row['主類別'] || row['mainCategory'] || row['MainCategory'] || row['MAINCATEGORY'];
        }
        
        // 子類別欄位
        if (row['子類別'] || row['subCategory'] || row['SubCategory'] || row['SUBCATEGORY']) {
            subCategory = row['子類別'] || row['subCategory'] || row['SubCategory'] || row['SUBCATEGORY'];
        }
        
        // 描述欄位
        if (row['描述'] || row['description'] || row['Description'] || row['DESCRIPTION']) {
            description = row['描述'] || row['description'] || row['Description'] || row['DESCRIPTION'];
        }
        
        // 日期欄位
        if (row['日期'] || row['date'] || row['Date'] || row['DATE']) {
            date = row['日期'] || row['date'] || row['Date'] || row['DATE'];
            console.log('🔍 [processExcelRow] 找到日期欄位:', date, '類型:', typeof date);
        }
        
        // 類型欄位 (收入/支出)
        if (row['類型'] || row['type'] || row['Type'] || row['TYPE']) {
            type = row['類型'] || row['type'] || row['Type'] || row['TYPE'];
        }
        
        // 根據圖片格式：成員 | 金額 | 主類別 | 子類別 | 描述 | 日期
        const keys = Object.keys(row);
        if (keys.length >= 6) {
            // 按順序提取：第1欄=成員，第2欄=金額，第3欄=主類別，第4欄=子類別，第5欄=描述，第6欄=日期
            member = row[keys[0]] || currentMember || '未知';
            amount = row[keys[1]];
            mainCategory = row[keys[2]];
            subCategory = row[keys[3]];
            description = row[keys[4]];
            date = row[keys[5]];
            
            console.log('🔍 [processExcelRow] 按順序提取 (6欄格式):', {
                member: member,
                amount: amount,
                mainCategory: mainCategory,
                subCategory: subCategory,
                description: description,
                date: date,
                keys: keys
            });
        } else if (keys.length >= 4) {
            // 如果只有4欄，假設格式是：成員, 金額, 描述, 日期
            member = row[keys[0]] || currentMember || '未知';
            amount = row[keys[1]];
            description = row[keys[2]];
            date = row[keys[3]];
            
            console.log('🔍 [processExcelRow] 推測格式 (4欄格式):', {
                member: member,
                amount: amount,
                description: description,
                date: date,
                keys: keys
            });
        }
        
        // 處理日期格式 (M/D -> YYYY-MM-DD)
        if (date) {
            console.log('🔍 [processExcelRow] 處理日期前:', date, '類型:', typeof date);
            date = formatDate(date);
            console.log('🔍 [processExcelRow] 處理日期後:', date);
        }
        
        // 處理金額格式
        if (amount !== undefined && amount !== null) {
            console.log('🔍 [processExcelRow] 處理金額前:', amount, '類型:', typeof amount);
            
            // 移除千分位逗號和貨幣符號
            if (typeof amount === 'string') {
                amount = amount.replace(/,/g, ''); // 移除千分位逗號
                amount = amount.replace(/\$/g, ''); // 移除美元符號
                amount = amount.replace(/NT\$/g, ''); // 移除台幣符號
                amount = amount.replace(/¥/g, ''); // 移除日圓符號
                amount = amount.replace(/€/g, ''); // 移除歐元符號
                amount = amount.replace(/£/g, ''); // 移除英鎊符號
                amount = amount.trim(); // 移除前後空白
            }
            
            // 轉換為數字
            const parsedAmount = parseFloat(amount);
            
            // 檢查是否為有效數字
            if (isNaN(parsedAmount)) {
                console.log('⚠️ [processExcelRow] 金額解析失敗:', amount, '-> NaN');
                amount = 0; // 設為0
            } else {
                amount = parsedAmount;
            }
            
            // 如果沒有類型欄位，根據金額正負判斷
            if (!type) {
                type = amount >= 0 ? '收入' : '支出';
            }
            
            console.log('🔍 [processExcelRow] 處理金額後:', {
                amount: amount,
                type: type,
                isNegative: amount < 0
            });
        }
        
        // 驗證必要欄位
        if (!date || amount === undefined || amount === null) {
            console.log('⚠️ [processExcelRow] 跳過不完整的記錄:', { date, amount, member, currentMember });
            return null;
        }
        
        // 如果沒有成員信息，跳過這行
        if (!member || member === '未知') {
            console.log('⚠️ [processExcelRow] 跳過無成員信息記錄:', { date, amount, member, currentMember });
            return null;
        }
        
        // 如果沒有主類別，嘗試從描述中解析
        if (!mainCategory && description && description.includes('-')) {
            const parts = description.split('-');
            if (parts.length >= 2) {
                mainCategory = parts[0].trim();
                description = parts.slice(1).join('-').trim();
            }
        }
        
        // 如果沒有子類別，設為默認值
        if (!subCategory) {
            subCategory = '信用卡'; // 默認子類別
        }
        
        // 如果沒有描述，使用主類別作為描述
        if (!description) {
            description = mainCategory || '其他';
        }
        
        console.log('🔍 [processExcelRow] 最終數據:', {
            date: date,
            member: member,
            amount: amount,
            mainCategory: mainCategory,
            subCategory: subCategory,
            description: description,
            type: type
        });
        
        return {
            date: date,
            member: member || '未知',
            amount: amount,
            mainCategory: mainCategory || '其他',
            subCategory: subCategory || '信用卡',
            description: description || mainCategory || '其他',
            type: type || (amount >= 0 ? '收入' : '支出'),
            paymentMethod: '信用卡' // 預設付款方式
        };
        
    } catch (error) {
        console.error('❌ [processExcelRow] 處理行資料失敗:', error, row);
        return null;
    }
}

// 處理單行 Excel 資料 (新格式 - 7欄格式)
function processExcelRowNewFormat(row, rowNumber = 0) {
    try {
        console.log(`🔍 [processExcelRowNewFormat] 處理第 ${rowNumber} 行:`, row);
        
        // 根據圖片格式，Excel有以下欄位：
        // 成員, 金額, 類別, 主類別, 付款方式, 描述, 日期
        
        // 嘗試不同的欄位名稱組合
        let date, description, amount, member, mainCategory, subCategory, type, paymentMethod;
        
        // 成員欄位
        if (row['成員'] || row['member'] || row['Member'] || row['MEMBER']) {
            member = row['成員'] || row['member'] || row['Member'] || row['MEMBER'];
        }
        
        // 金額欄位
        if (row['金額'] || row['amount'] || row['Amount'] || row['AMOUNT']) {
            amount = row['金額'] || row['amount'] || row['Amount'] || row['AMOUNT'];
        }
        
        // 主類別欄位
        if (row['主類別'] || row['mainCategory'] || row['MainCategory'] || row['MAINCATEGORY']) {
            mainCategory = row['主類別'] || row['mainCategory'] || row['MainCategory'] || row['MAINCATEGORY'];
        }
        
        // 子類別欄位
        if (row['子類別'] || row['subCategory'] || row['SubCategory'] || row['SUBCATEGORY']) {
            subCategory = row['子類別'] || row['subCategory'] || row['SubCategory'] || row['SUBCATEGORY'];
        }
        
        // 描述欄位
        if (row['描述'] || row['description'] || row['Description'] || row['DESCRIPTION']) {
            description = row['描述'] || row['description'] || row['Description'] || row['DESCRIPTION'];
        }
        
        // 日期欄位
        if (row['日期'] || row['date'] || row['Date'] || row['DATE']) {
            date = row['日期'] || row['date'] || row['Date'] || row['DATE'];
            console.log('🔍 [processExcelRowNewFormat] 找到日期欄位:', date, '類型:', typeof date);
        }
        
        // 類型欄位 (收入/支出)
        if (row['類型'] || row['type'] || row['Type'] || row['TYPE']) {
            type = row['類型'] || row['type'] || row['Type'] || row['TYPE'];
        }
        
        // 根據圖片格式：成員 | 金額 | 類別 | 主類別 | 付款方式 | 描述 | 日期
        const keys = Object.keys(row);
        if (keys.length >= 7) {
            // 按順序提取：第1欄=成員，第2欄=金額，第3欄=類別，第4欄=主類別，第5欄=付款方式，第6欄=描述，第7欄=日期
            member = row[keys[0]] || '未知';
            amount = row[keys[1]];
            type = row[keys[2]] || '支出'; // 類別欄位
            mainCategory = row[keys[3]];
            paymentMethod = row[keys[4]];
            description = row[keys[5]];
            date = row[keys[6]];
            
            console.log('🔍 [processExcelRowNewFormat] 按順序提取 (7欄格式):', {
                member: member,
                amount: amount,
                type: type,
                mainCategory: mainCategory,
                paymentMethod: paymentMethod,
                description: description,
                date: date,
                keys: keys
            });
        } else if (keys.length >= 6) {
            // 兼容6欄格式：成員 | 金額 | 主類別 | 子類別 | 描述 | 日期
            member = row[keys[0]] || '未知';
            amount = row[keys[1]];
            mainCategory = row[keys[2]];
            subCategory = row[keys[3]];
            description = row[keys[4]];
            date = row[keys[5]];
            
            console.log('🔍 [processExcelRowNewFormat] 按順序提取 (6欄格式):', {
                member: member,
                amount: amount,
                mainCategory: mainCategory,
                subCategory: subCategory,
                description: description,
                date: date,
                keys: keys
            });
        } else if (keys.length >= 4) {
            // 如果只有4欄，假設格式是：成員, 金額, 描述, 日期
            member = row[keys[0]] || '未知';
            amount = row[keys[1]];
            description = row[keys[2]];
            date = row[keys[3]];
            
            console.log('🔍 [processExcelRowNewFormat] 推測格式 (4欄格式):', {
                member: member,
                amount: amount,
                description: description,
                date: date,
                keys: keys
            });
        }
        
        // 處理日期格式 (M/D -> YYYY-MM-DD)
        if (date) {
            console.log('🔍 [processExcelRowNewFormat] 處理日期前:', date, '類型:', typeof date);
            date = formatDate(date);
            console.log('🔍 [processExcelRowNewFormat] 處理日期後:', date);
        }
        
        // 處理金額格式
        if (amount !== undefined && amount !== null) {
            console.log(`🔍 [processExcelRowNewFormat] 第 ${rowNumber} 行處理金額前:`, amount, '類型:', typeof amount);
            
            // 移除千分位逗號和貨幣符號
            if (typeof amount === 'string') {
                console.log(`🔍 [processExcelRowNewFormat] 第 ${rowNumber} 行原始金額字串:`, amount);
                
                // 移除所有貨幣符號和逗號
                amount = amount.replace(/[$,¥￥€£]/g, ''); // 移除所有貨幣符號
                amount = amount.replace(/,/g, ''); // 移除千分位逗號
                amount = amount.replace(/NT\$/g, ''); // 移除台幣符號
                amount = amount.trim(); // 移除前後空白
                
                // 處理多餘的負號（如：-$-100）
                amount = amount.replace(/^-+\$*-+/, ''); // 移除開頭的多餘負號和貨幣符號
                amount = amount.replace(/\$-+/, ''); // 移除貨幣符號後的多餘負號
                
                console.log(`🔍 [processExcelRowNewFormat] 第 ${rowNumber} 行清理後金額字串:`, amount);
            }
            
            // 轉換為數字
            const parsedAmount = parseFloat(amount);
            
            // 檢查是否為有效數字
            if (isNaN(parsedAmount)) {
                console.log(`⚠️ [processExcelRowNewFormat] 第 ${rowNumber} 行金額解析失敗:`, amount, '-> NaN');
                amount = 0; // 設為0
            } else {
                amount = parsedAmount;
            }
            
            // 金額都是正數，支出/收入由類別欄位決定
            // 如果沒有類型欄位，預設為支出
            if (!type) {
                type = '支出';
            }
            
            console.log(`🔍 [processExcelRowNewFormat] 第 ${rowNumber} 行處理金額後:`, {
                amount: amount,
                type: type,
                note: '金額保持正數，支出/收入由類別欄位決定'
            });
        }
        
        // 驗證必要欄位 - 允許空值，但需要基本結構
        if (date === undefined && amount === undefined && member === undefined) {
            console.log(`⚠️ [processExcelRowNewFormat] 第 ${rowNumber} 行完全空白，跳過`);
            return null;
        }
        
        // 如果完全沒有成員信息，設為默認值
        if (!member) {
            member = '未知';
        }
        
        // 如果沒有主類別，嘗試從描述中解析
        if (!mainCategory && description && description.includes('-')) {
            const parts = description.split('-');
            if (parts.length >= 2) {
                mainCategory = parts[0].trim();
                description = parts.slice(1).join('-').trim();
            }
        }
        
        // 如果沒有子類別，設為默認值
        if (!subCategory) {
            subCategory = '信用卡'; // 默認子類別
        }
        
        // 如果沒有描述，使用主類別作為描述
        if (!description) {
            description = mainCategory || '其他';
        }
        
        console.log(`🔍 [processExcelRowNewFormat] 第 ${rowNumber} 行最終數據:`, {
            date: date,
            member: member,
            amount: amount,
            mainCategory: mainCategory,
            subCategory: subCategory,
            description: description,
            type: type
        });
        
        // 生成唯一ID
        const id = generateUniqueId();
        
        // 根據類別欄位確定收入或支出類型
        const recordType = (type === '收入') ? 'income' : 'expense';
        
        // 金額保持正數，通過type字段區分收入/支出
        const finalAmount = amount || 0;
        
        const processedRecord = {
            id: id,
            date: date || '',
            member: member || '未知',
            amount: finalAmount,
            mainCategory: mainCategory || '其他',
            subCategory: subCategory || '信用卡',
            description: description || mainCategory || '其他',
            type: recordType
        };
        
        console.log(`✅ [processExcelRowNewFormat] 第 ${rowNumber} 行成功處理記錄:`, processedRecord);
        return processedRecord;
        
    } catch (error) {
        console.error('❌ [processExcelRowNewFormat] 處理行資料失敗:', error, row);
        return null;
    }
}

// 日期格式轉換函數
function formatDate(dateStr) {
    try {
        console.log('🔍 [formatDate] 處理日期:', dateStr, '類型:', typeof dateStr);
        
        // 處理 Excel 序列號格式 (如 45908)
        if (typeof dateStr === 'number' || (typeof dateStr === 'string' && /^\d+$/.test(dateStr))) {
            const serialNumber = typeof dateStr === 'string' ? parseInt(dateStr) : dateStr;
            console.log('🔍 [formatDate] Excel 序列號:', serialNumber);
            
            // Excel 序列號轉換 (1900年1月1日為基準，但Excel有1900閏年錯誤)
            // Excel 序列號 1 = 1900-01-01，但Excel錯誤地認為1900是閏年
            const excelEpoch = new Date(1899, 11, 30); // 1899-12-30
            const date = new Date(excelEpoch.getTime() + serialNumber * 24 * 60 * 60 * 1000);
            
            if (!isNaN(date.getTime())) {
                const formatted = date.toISOString().split('T')[0];
                console.log('🔍 [formatDate] Excel 序列號轉換結果:', formatted);
                return formatted;
            }
        }
        
        // 處理 M/D 格式 (如 9/1, 9/23, 9/21)
        if (typeof dateStr === 'string' && dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 2) {
                const month = parts[0].padStart(2, '0');
                const day = parts[1].padStart(2, '0');
                const currentYear = new Date().getFullYear();
                const formatted = `${currentYear}-${month}-${day}`;
                
                console.log('🔍 [formatDate] M/D 格式解析:', { 
                    original: dateStr, 
                    month, 
                    day, 
                    currentYear, 
                    formatted 
                });
                
                return formatted;
            }
        }
        
        // 處理標準日期格式
        if (typeof dateStr === 'string') {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const formatted = date.toISOString().split('T')[0];
                console.log('🔍 [formatDate] 標準日期轉換結果:', formatted);
                return formatted;
            }
        }
        
        console.log('⚠️ [formatDate] 無法轉換日期:', dateStr);
        return dateStr;
    } catch (error) {
        console.error('❌ [formatDate] 日期轉換失敗:', error, dateStr);
        return dateStr;
    }
}

// 環境信息
console.log(`🌍 環境: ${environment.toUpperCase()}`);
console.log(`🔧 配置: ${config.name}`);
console.log(`📡 端口: ${PORT}`);
console.log(`🔗 前端URL: ${config.frontendUrl}`);
console.log(`🔗 後端URL: ${config.backendUrl}`);

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'app/frontend')));
app.use('/data', express.static(path.join(__dirname, 'data')));

const execAsync = util.promisify(exec);

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('❌ 服務器錯誤:', err);
    res.status(500).json({
        success: false,
        message: '服務器內部錯誤',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// 健康檢查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'family-cost-backup-service',
        version: '2025-09-25 18:10:00',
        environment: environment,
        dbStatus: 'JSON 文件存儲模式',
        testMessage: '這是測試消息 - 確認部署更新',
        config: {
            name: config.name,
            frontendUrl: config.frontendUrl,
            backendUrl: config.backendUrl,
            features: config.features
        }
    });
});

// 備份到GitHub的API - 已移除

// 從GitHub還原的API - 已移除

// Git狀態API已移除 - 備份功能已移除

// 手動同步API已移除 - 備份功能已移除

// Token管理API已移除 - 備份功能已移除

// 備份管理API - 已移除

// 更新版本號API
app.post('/api/version/update', async (req, res) => {
    try {
        console.log('🔄 開始更新版本號...');
        
        const now = new Date();
        const versionString = now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');

        const versionData = {
            version: versionString,
            buildTime: now.toISOString(),
            commitHash: req.body.commitHash || 'unknown',
            description: req.body.description || "自動更新版本號"
        };

        // 更新版本號檔案
        const versionPath = path.join(__dirname, 'data', 'version.json');
        await fs.writeFile(versionPath, JSON.stringify(versionData, null, 2), 'utf8');
        
        console.log('✅ 版本號已更新:', versionString);
        console.log('📁 版本檔案路徑:', versionPath);
        
        res.json({
            success: true,
            message: '版本號更新成功',
            data: {
                version: versionString,
                buildTime: now.toISOString(),
                description: versionData.description
            }
        });
        
    } catch (error) {
        console.error('❌ 版本號更新失敗:', error);
        res.status(500).json({
            success: false,
            message: `版本號更新失敗: ${error.message}`,
            error: error.message
        });
    }
});

// 測試 API - 檢查資料格式
app.get('/api/debug/data-format', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'data.json');
        const dataContent = await fs.readFile(dataPath, 'utf8');
        const parsedData = JSON.parse(dataContent);
        
        let systemData = [];
        if (Array.isArray(parsedData)) {
            systemData = parsedData;
        } else if (parsedData && Array.isArray(parsedData.records)) {
            systemData = parsedData.records;
        }
        
        res.json({
            success: true,
            data: {
                originalFormat: typeof parsedData,
                isArray: Array.isArray(parsedData),
                hasRecords: parsedData && parsedData.records ? true : false,
                recordsCount: systemData.length,
                systemDataType: Array.isArray(systemData) ? 'Array' : typeof systemData,
                sampleRecord: systemData[0] || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Excel 資料比對和匯入 API
app.post('/api/excel/compare', (req, res, next) => {
    upload.single('excelFile')(req, res, (err) => {
        if (err) {
            console.log('❌ [multer] 檔案上傳錯誤:', err.message);
            return res.status(400).json({ 
                success: false, 
                message: `檔案上傳失敗: ${err.message}`,
                error: err.message 
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('🔍 [API] POST /api/excel/compare 開始處理...');
        console.log('🔍 [API] 請求標頭:', req.headers);
        console.log('🔍 [API] 請求檔案:', req.file);
        
        if (!req.file) {
            console.log('❌ [API] 沒有上傳檔案');
            return res.status(400).json({ success: false, message: '請選擇要上傳的 Excel 檔案' });
        }

        console.log('🔍 [API] 上傳的檔案:', req.file.filename);
        
        // 讀取 Excel 檔案
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 使用選項來正確處理日期
        const excelData = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,  // 返回原始值，我們自己處理日期
            defval: ''  // 空值默認
        });
        
        console.log('🔍 [API] Excel 原始資料筆數:', excelData.length);
        console.log('🔍 [API] Excel 原始資料範例:', excelData.slice(0, 5));
        
        // 獲取格式參數
        const format = req.body.format || 'googlesheets';
        console.log('🔍 [API] 匯入格式:', format);
        
        // 詳細分析每一行的內容
        excelData.forEach((row, index) => {
            const keys = Object.keys(row);
            const nonEmptyValues = keys.filter(key => row[key] && row[key].toString().trim() !== '');
            console.log(`🔍 [API] 第 ${index + 1} 行:`, {
                keys: keys,
                nonEmptyValues: nonEmptyValues,
                values: nonEmptyValues.map(key => ({ [key]: row[key] }))
            });
        });
        
        // 根據格式處理 Excel 資料
        console.log('🔍 [API] 開始處理Excel資料，格式:', format);
        const processedData = format === 'excel' ? processExcelDataNewFormat(excelData) : processExcelData(excelData);
        console.log('🔍 [API] 處理後資料筆數:', processedData.length);
        console.log('🔍 [API] 處理後資料類型:', Array.isArray(processedData) ? 'Array' : typeof processedData);
        
        // 檢查處理後的資料是否有問題
        if (!Array.isArray(processedData)) {
            console.error('❌ [API] 處理後的資料不是數組:', processedData);
            return res.status(500).json({ 
                success: false, 
                message: 'Excel 資料處理失敗：處理結果不是有效數組',
                error: 'Invalid processed data format'
            });
        }
        
        // 檢查是否有有效記錄
        const validRecords = processedData.filter(record => record && record.id && record.date);
        console.log('🔍 [API] 有效記錄數:', validRecords.length);
        
        if (validRecords.length === 0) {
            console.log('⚠️ [API] 沒有有效記錄，可能所有記錄都被跳過');
        }
        
        // 按成員分組統計
        const memberStats = {};
        processedData.forEach(record => {
            const member = record.member || '未知';
            memberStats[member] = (memberStats[member] || 0) + 1;
        });
        console.log('🔍 [API] 按成員統計:', memberStats);
        console.log('🔍 [API] 處理後資料範例:', processedData.slice(0, 3));
        
        // 從本地文件讀取系統現有資料
        let systemData = [];
        
        try {
            console.log('🔍 [API] 從本地文件讀取系統資料...');
            const dataPath = path.join(__dirname, 'data', 'data.json');
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            systemData = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);
            console.log('✅ [API] 從本地文件讀取了', systemData.length, '筆記錄');
        } catch (error) {
            console.log('⚠️ [API] 從本地文件讀取失敗:', error.message);
            systemData = [];
        }
        
        console.log('🔍 [API] 系統現有資料筆數:', systemData.length);
        console.log('🔍 [API] systemData 類型:', Array.isArray(systemData) ? 'Array' : typeof systemData);
        
        // 比對資料，找出多餘的記錄
        const newRecords = [];
        const duplicateRecords = [];
        
        // 確保 systemData 是數組
        if (!Array.isArray(systemData)) {
            console.log('❌ [API] systemData 不是數組，強制轉換為空數組');
            systemData = [];
        }
        
        // 確保 processedData 也是數組
        if (!Array.isArray(processedData)) {
            console.log('❌ [API] processedData 不是數組，強制轉換為空數組');
            processedData = [];
        }
        
        for (const excelRecord of processedData) {
            // 檢查是否已存在（比較：成員 + 日期 + 主類別 + 金額數值）
            // 注意：不再比較 description 和 subCategory
            const isDuplicate = systemData.some(systemRecord => {
                if (!systemRecord) return false;
                
                // 比較成員
                const memberMatch = systemRecord.member === excelRecord.member;
                
                // 比較日期
                const dateMatch = systemRecord.date === excelRecord.date;
                
                // 比較金額數值（忽略正負號）
                const amountMatch = Math.abs(systemRecord.amount) === Math.abs(excelRecord.amount);
                
                // 比較主類別
                let systemMainCategory = '';
                
                // 優先使用 mainCategory 欄位
                if (systemRecord.mainCategory) {
                    systemMainCategory = systemRecord.mainCategory;
                } else if (systemRecord.description && systemRecord.description.includes('-')) {
                    // 如果沒有 mainCategory，從描述中提取
                    systemMainCategory = systemRecord.description.split('-')[0].trim();
                }
                
                const mainCategoryMatch = systemMainCategory === excelRecord.mainCategory;
                
                // 不再比較描述和subCategory
                const isMatch = memberMatch && dateMatch && amountMatch && mainCategoryMatch;
                
                // 詳細的比對日誌（每10筆記錄顯示一次）
                if (processedData.indexOf(excelRecord) % 10 === 0) {
                    console.log('🔍 [API] 比對過程:', {
                        excel: {
                            member: excelRecord.member,
                            date: excelRecord.date,
                            mainCategory: excelRecord.mainCategory,
                            amount: excelRecord.amount
                        },
                        system: {
                            member: systemRecord.member,
                            date: systemRecord.date,
                            mainCategory: systemMainCategory,
                            amount: systemRecord.amount
                        },
                        matches: {
                            member: memberMatch,
                            date: dateMatch,
                            amount: amountMatch,
                            mainCategory: mainCategoryMatch,
                            overall: isMatch
                        }
                    });
                }
                
                // 顯示比對不一致的詳細原因
                if (!isMatch && (memberMatch || dateMatch || amountMatch || mainCategoryMatch)) {
                    console.log('⚠️ [API] 比對不一致:', {
                        excel: {
                            member: excelRecord.member,
                            date: excelRecord.date,
                            mainCategory: excelRecord.mainCategory,
                            amount: excelRecord.amount
                        },
                        system: {
                            member: systemRecord.member,
                            date: systemRecord.date,
                            mainCategory: systemMainCategory,
                            amount: systemRecord.amount
                        },
                        differences: {
                            member: memberMatch ? '✅' : `❌ (Excel: ${excelRecord.member} vs System: ${systemRecord.member})`,
                            date: dateMatch ? '✅' : `❌ (Excel: ${excelRecord.date} vs System: ${systemRecord.date})`,
                            amount: amountMatch ? '✅' : `❌ (Excel: ${excelRecord.amount} vs System: ${systemRecord.amount})`,
                            mainCategory: mainCategoryMatch ? '✅' : `❌ (Excel: ${excelRecord.mainCategory} vs System: ${systemMainCategory})`
                        }
                    });
                }
                
                if (isMatch) {
                    console.log('🔍 [API] 找到重複記錄:', {
                        excel: {
                            member: excelRecord.member,
                            date: excelRecord.date,
                            mainCategory: excelRecord.mainCategory,
                            amount: excelRecord.amount
                        },
                        system: {
                            member: systemRecord.member,
                            date: systemRecord.date,
                            mainCategory: systemMainCategory,
                            amount: systemRecord.amount
                        }
                    });
                }
                
                return isMatch;
            });
            
            if (isDuplicate) {
                duplicateRecords.push(excelRecord);
            } else {
                newRecords.push(excelRecord);
            }
        }
        
        console.log('🔍 [API] 新增記錄數:', newRecords.length);
        console.log('🔍 [API] 重複記錄數:', duplicateRecords.length);
        
        // 清理上傳的檔案
        require('fs').unlinkSync(req.file.path);
        
        res.json({
            success: true,
            message: 'Excel 資料比對完成',
            data: {
                totalExcelRecords: processedData.length,
                systemRecords: systemData.length,
                newRecords: newRecords.length,
                duplicateRecords: duplicateRecords.length,
                newRecordsData: newRecords,
                duplicateRecordsData: duplicateRecords
            }
        });
        
    } catch (error) {
        console.error('❌ [API] Excel 比對失敗:', error);
        console.error('❌ [API] 錯誤堆疊:', error.stack);
        
        // 清理上傳的檔案
        if (req.file && require('fs').existsSync(req.file.path)) {
            require('fs').unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            success: false, 
            message: `Excel 比對失敗: ${error.message}`, 
            error: error.message 
        });
    }
});

// 匯入新記錄到系統
app.post('/api/excel/import', async (req, res) => {
    try {
        console.log('🔍 [API] POST /api/excel/import 開始處理...');
        
        const { records } = req.body;
        
        if (!records || !Array.isArray(records)) {
            console.log('❌ [API] 沒有提供要匯入的記錄');
            return res.status(400).json({ success: false, message: '請提供要匯入的記錄' });
        }
        
        console.log('🔍 [API] 要匯入的記錄數:', records.length);
        
        // 讀取系統現有資料
        const dataPath = path.join(__dirname, 'data', 'data.json');
        let systemData = [];
        
        try {
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            
            // 確保 systemData 是數組
            if (Array.isArray(parsedData)) {
                systemData = parsedData;
            } else if (parsedData && Array.isArray(parsedData.records)) {
                systemData = parsedData.records;
            } else {
                console.log('⚠️ [API] 系統資料格式不正確，使用空數組');
                systemData = [];
            }
        } catch (error) {
            console.log('⚠️ [API] 系統資料檔案不存在，將創建新檔案:', error.message);
            systemData = [];
        }
        
        // 添加新記錄
        const importedRecords = [];
        for (const record of records) {
            // 為新記錄添加 ID
            const newRecord = {
                ...record,
                id: Date.now() + Math.random().toString(36).substr(2, 9)
            };
            systemData.push(newRecord);
            importedRecords.push(newRecord);
        }
        
        // 儲存更新後的資料，保持原有格式
        const dataToSave = { records: systemData };
        await fs.writeFile(dataPath, JSON.stringify(dataToSave, null, 2));
        
        console.log('✅ [API] 成功匯入', importedRecords.length, '筆記錄');
        
        res.json({
            success: true,
            message: `成功匯入 ${importedRecords.length} 筆記錄`,
            data: {
                importedCount: importedRecords.length,
                totalRecords: systemData.length,
                importedRecords: importedRecords
            }
        });
        
    } catch (error) {
        console.error('❌ [API] 匯入失敗:', error);
        console.error('❌ [API] 錯誤堆疊:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: `匯入失敗: ${error.message}`, 
            error: error.message 
        });
    }
});

// 404處理器將在最後定義

// 清除所有數據 API - 已移除（使用SQLite API替代）

// ==================== SQLite 數據庫 API 端點 ====================

// 測試端點 - 確認部署狀態
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API端點正常',
        timestamp: new Date().toISOString(),
        version: '2025-09-25 17:50:00'
    });
});

// 獲取所有記錄
app.get('/api/records', async (req, res) => {
    try {
        console.log('🔍 [API] 開始獲取記錄...');
        
        // 從本地文件獲取數據
        const dataPath = path.join(__dirname, 'data', 'data.json');
        const dataContent = await fs.readFile(dataPath, 'utf8');
        const parsedData = JSON.parse(dataContent);
        const records = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);
        
        console.log('✅ [API] 成功獲取記錄:', records.length, '筆');
        
        res.json({
            success: true,
            records: records,
            count: records.length
        });
    } catch (error) {
        console.error('❌ [API] 獲取記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取記錄失敗: ' + error.message,
            error: error.message
        });
    }
});

// 獲取統計數據（已移除，統計功能在前端實現）
// app.get('/api/records/stats', ...) - 已移除

// 添加記錄
app.post('/api/records', async (req, res) => {
    try {
        const record = req.body;
        
        // 生成唯一ID
        if (!record.id) {
            record.id = generateUniqueId();
        }
        
        // 獲取現有數據（優先從本地文件讀取，避免覆蓋新資料）
        let existingRecords;
        try {
            const dataPath = path.join(__dirname, 'data', 'data.json');
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            existingRecords = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);
            console.log('✅ 從本地文件讀取現有資料:', existingRecords.length, '筆');
        } catch (error) {
            console.log('⚠️ 本地文件讀取失敗:', error.message);
            existingRecords = [];
        }
        
        // 添加新記錄
        existingRecords.push(record);
        
        // 僅保存到本地文件（不自動同步到 GitHub）
        await githubDataManager.saveDataToLocal(existingRecords);
        
        console.log('✅ 記錄已添加:', record.id);
        console.log('💾 已保存到本地文件，等待手動同步到 GitHub');
        
        res.json({
            success: true,
            message: '記錄添加成功，已保存到本地文件',
            record: record
        });
    } catch (error) {
        console.error('❌ 添加記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '添加記錄失敗',
            error: error.message
        });
    }
});

// 更新記錄
app.put('/api/records/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;
        
        // 獲取現有數據（優先從本地文件讀取，避免覆蓋新資料）
        let existingRecords;
        try {
            const dataPath = path.join(__dirname, 'data', 'data.json');
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            existingRecords = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);
            console.log('✅ 從本地文件讀取現有資料:', existingRecords.length, '筆');
        } catch (error) {
            console.log('⚠️ 本地文件讀取失敗:', error.message);
            existingRecords = [];
        }
        
        // 查找並更新記錄
        const recordIndex = existingRecords.findIndex(record => record.id === id);
        if (recordIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '記錄不存在'
            });
        }
        
        // 更新記錄
        existingRecords[recordIndex] = { ...existingRecords[recordIndex], ...updates };
        
        // 僅保存到本地文件（不自動同步到 GitHub）
        await githubDataManager.saveDataToLocal(existingRecords);
        
        console.log('✅ 記錄更新成功:', id);
        console.log('💾 已保存到本地文件，等待手動同步到 GitHub');
        
        res.json({
            success: true,
            message: '記錄更新成功，已保存到本地文件',
            record: existingRecords[recordIndex]
        });
    } catch (error) {
        console.error('❌ 更新記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '更新記錄失敗',
            error: error.message
        });
    }
});

// 清空所有記錄 (必須在 /api/records/:id 之前)
app.delete('/api/records/clear', async (req, res) => {
    try {
        console.log('🗑️ [API] 收到清除所有記錄的請求');
        
        // 獲取現有數據以獲取記錄數量
        let existingRecords;
        try {
            const dataPath = path.join(__dirname, 'data', 'data.json');
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            existingRecords = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);
        } catch (error) {
            existingRecords = [];
        }
        
        const recordCount = existingRecords.length;
        console.log(`📊 [API] 當前記錄數量: ${recordCount}`);
        
        // 僅保存空數組到本地文件（不自動同步到 GitHub）
        await githubDataManager.saveDataToLocal([]);
        
        console.log('✅ 所有記錄已清空，已保存到本地文件');
        
        res.json({
            success: true,
            message: `成功清空所有記錄，刪除了 ${recordCount} 筆記錄，已保存到本地文件`,
            changes: recordCount
        });
    } catch (error) {
        console.error('❌ 清空記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '清空記錄失敗',
            error: error.message
        });
    }
});

// 刪除記錄
app.delete('/api/records/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // 獲取現有數據（優先從本地文件讀取，避免覆蓋新資料）
        let existingRecords;
        try {
            const dataPath = path.join(__dirname, 'data', 'data.json');
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            existingRecords = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);
            console.log('✅ 從本地文件讀取現有資料:', existingRecords.length, '筆');
        } catch (error) {
            console.log('⚠️ 本地文件讀取失敗:', error.message);
            existingRecords = [];
        }
        
        // 查找並刪除記錄
        const originalLength = existingRecords.length;
        const filteredRecords = existingRecords.filter(record => record.id !== id);
        const newLength = filteredRecords.length;
        
        if (originalLength === newLength) {
            return res.status(404).json({
                success: false,
                message: '記錄不存在'
            });
        }
        
        // 僅保存到本地文件（不自動同步到 GitHub）
        await githubDataManager.saveDataToLocal(filteredRecords);
        
        console.log('✅ 記錄已刪除:', id);
        console.log('💾 已保存到本地文件，等待手動同步到 GitHub');
        
        res.json({
            success: true,
            message: '記錄刪除成功，已保存到本地文件',
            changes: originalLength - newLength
        });
    } catch (error) {
        console.error('❌ 刪除記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '刪除記錄失敗',
            error: error.message
        });
    }
});

// 批量刪除記錄
app.delete('/api/records', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請提供要刪除的記錄ID列表'
            });
        }
        
        // 獲取現有數據（優先從本地文件讀取，避免覆蓋新資料）
        let existingRecords;
        try {
            const dataPath = path.join(__dirname, 'data', 'data.json');
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            existingRecords = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);
            console.log('✅ 從本地文件讀取現有資料:', existingRecords.length, '筆');
        } catch (error) {
            console.log('⚠️ 本地文件讀取失敗:', error.message);
            existingRecords = [];
        }
        
        // 批量刪除記錄
        const originalLength = existingRecords.length;
        const filteredRecords = existingRecords.filter(record => !ids.includes(record.id));
        const newLength = filteredRecords.length;
        const deletedCount = originalLength - newLength;
        
        if (deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: '沒有找到要刪除的記錄'
            });
        }
        
        // 僅保存到本地文件（不自動同步到 GitHub）
        await githubDataManager.saveDataToLocal(filteredRecords);
        
        console.log('✅ 批量刪除完成:', deletedCount, '筆記錄');
        console.log('💾 已保存到本地文件，等待手動同步到 GitHub');
        
        res.json({
            success: true,
            message: `成功刪除 ${deletedCount} 筆記錄，已保存到本地文件`,
            count: deletedCount
        });
    } catch (error) {
        console.error('❌ 批量刪除失敗:', error);
        res.status(500).json({
            success: false,
            message: '批量刪除失敗',
            error: error.message
        });
    }
});


// 檢查數據完整性（已移除，數據完整性由 JSON 文件保證）
// app.get('/api/records/integrity', ...) - 已移除

// 簡化的 Token 狀態檢查 API
app.get('/api/github/token/status', async (req, res) => {
    try {
        const hasToken = !!process.env.GITHUB_TOKEN;
        const tokenPreview = hasToken ? process.env.GITHUB_TOKEN.substring(0, 10) + '...' : null;
        
        res.json({
            success: true,
            hasToken: hasToken,
            tokenPreview: tokenPreview,
            tokenSource: hasToken ? 'environment' : null,
            message: hasToken ? 'Token 已設置（環境變數）' : 'Token 未設置'
        });
    } catch (error) {
        console.error('❌ 檢查 Token 狀態失敗:', error);
        res.status(500).json({
            success: false,
            message: `檢查 Token 狀態失敗: ${error.message}`
        });
    }
});


// 手動同步到 GitHub 的 API
app.post('/api/github/sync', async (req, res) => {
    try {
        console.log('🔄 [API] 收到手動同步到 GitHub 的請求');
        
        // 獲取現有數據（優先從本地文件讀取，確保同步最新資料）
        let existingRecords;
        try {
            const dataPath = path.join(__dirname, 'data', 'data.json');
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            existingRecords = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);
            console.log('✅ 從本地文件讀取資料進行同步:', existingRecords.length, '筆');
        } catch (error) {
            console.log('⚠️ 本地文件讀取失敗:', error.message);
            existingRecords = [];
        }
        
        console.log(`📊 [API] 準備同步 ${existingRecords.length} 筆記錄到 GitHub`);
        
        // 檢查 Token 狀態
        const token = await githubDataManager.getValidToken();
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'GitHub Token 未設置，無法同步到 GitHub。請先設置 Token。'
            });
        }
        console.log('✅ GitHub Token 已設置，開始同步...');
        
        // 保存到 GitHub
        const result = await githubDataManager.saveDataToGitHub(existingRecords);
        
        console.log('✅ [API] 成功同步到 GitHub');
        
        res.json({
            success: true,
            message: `成功同步 ${existingRecords.length} 筆記錄到 GitHub`,
            data: {
                recordCount: existingRecords.length,
                result: result
            }
        });
        
    } catch (error) {
        console.error('❌ [API] 同步到 GitHub 失敗:', error);
        res.status(500).json({
            success: false,
            message: `同步失敗: ${error.message}`
        });
    }
});

// 數據遷移端點
app.post('/api/migrate', async (req, res) => {
    try {
        const DataMigrator = require('./app/backend/migrate');
        const migrator = new DataMigrator();
        
        const result = await migrator.migrateFromJson();
        res.json(result);
    } catch (error) {
        console.error('❌ 數據遷移失敗:', error);
        res.status(500).json({
            success: false,
            message: '數據遷移失敗',
            error: error.message
        });
    }
});

// 測試清除數據API是否存在 - 已移除

// 靜態文件服務 - 數據文件
app.get('/data/*', (req, res) => {
    const filePath = path.join(__dirname, req.path);
    console.log('📁 請求數據文件:', filePath);
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('❌ 發送數據文件失敗:', err);
            res.status(404).json({
                success: false,
                message: '找不到數據文件',
                error: err.message,
                path: filePath
            });
        } else {
            console.log('✅ 數據文件發送成功:', req.path);
        }
    });
});

// 對於非API和非數據文件請求，返回index.html（SPA路由）
app.get('*', (req, res) => {
    // 跳過 API 和數據文件請求
    if (req.path.startsWith('/api/') || req.path.startsWith('/data/')) {
        return res.status(404).json({
            success: false,
            message: 'API或數據文件不存在',
            path: req.path
        });
    }
    
    const indexPath = path.join(__dirname, 'app/frontend/index.html');
    console.log('🔍 嘗試發送 index.html:', indexPath);
    console.log('🔍 當前目錄:', __dirname);
    console.log('🔍 請求路徑:', req.path);
    
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('❌ 發送 index.html 失敗:', err);
            res.status(404).json({
                success: false,
                message: '找不到 index.html',
                error: err.message,
                path: indexPath,
                dirname: __dirname
            });
        } else {
            console.log('✅ index.html 發送成功');
        }
    });
});

// 啟動服務器
app.listen(PORT, () => {
    console.log('🚀 家庭收支備份服務已啟動');
    console.log(`📡 服務地址: http://localhost:${PORT}`);
    console.log(`📁 工作目錄: ${__dirname}`);
    console.log(`📁 前端目錄: ${path.join(__dirname, 'app/frontend')}`);
    console.log(`📁 數據目錄: ${path.join(__dirname, 'data')}`);
    console.log('📋 可用API:');
    console.log('   GET  /api/health     - 健康檢查');
    console.log('   POST /api/version/update - 更新版本號');
    console.log('   POST /api/excel/compare - Excel資料比對');
    console.log('   POST /api/excel/import - 匯入Excel資料');
    console.log('   GET  /api/records    - 獲取所有記錄');
    console.log('   GET  /api/records/stats - 獲取統計數據');
    console.log('   POST /api/records    - 新增記錄');
    console.log('   PUT  /api/records/:id - 更新記錄');
    console.log('   DELETE /api/records/:id - 刪除記錄');
    console.log('   DELETE /api/records/clear - 清除所有記錄');
    
    console.log('按 Ctrl+C 停止服務');
});

// 優雅關閉
process.on('SIGINT', () => {
    console.log('\n🛑 正在關閉服務...');
    process.exit(0);
});

// 404處理 - 僅處理API請求（必須在所有API路由之後）
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API端點不存在',
        availableEndpoints: [
            'GET /api/health',
            'POST /api/version/update',
            'POST /api/excel/compare',
            'POST /api/excel/import',
            'GET /api/test',
            'GET /api/records',
            'GET /api/records/stats',
            'POST /api/records',
            'PUT /api/records/:id',
            'DELETE /api/records/:id',
            'DELETE /api/records',
            'DELETE /api/records/clear',
            'GET /api/records/integrity',
            'POST /api/migrate'
        ]
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 正在關閉服務...');
    process.exit(0);
});

