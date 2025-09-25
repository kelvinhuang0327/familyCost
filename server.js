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

// 添加錯誤處理
try {
    const TokenManager = require('./app/backend/token_manager');
    const { getConfig, getEnvironment } = require('./app/config/config');
    
    console.log('✅ 所有模組載入成功');
} catch (error) {
    console.error('❌ 模組載入失敗:', error);
    process.exit(1);
}

const TokenManager = require('./app/backend/token_manager');
// const BackupManager = require('./app/backend/backup_manager'); // 已移除
const DatabaseManager = require('./app/backend/database');
const { getConfig, getEnvironment } = require('./app/config/config');

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

// 初始化Token管理器和數據庫管理器
const tokenManager = new TokenManager();
// const backupManager = new BackupManager(); // 已移除
const dbManager = new DatabaseManager();

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

// Excel 資料處理函數
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

// 處理單行 Excel 資料
function processExcelRow(row, currentMember = null) {
    try {
        // 根據圖片格式，假設 Excel 有以下欄位：
        // 日期, 描述, 金額, 成員 (或類似的欄位名)
        
        // 嘗試不同的欄位名稱組合
        let date, description, amount, member, type;
        
        // 日期欄位
        if (row['日期'] || row['date'] || row['Date'] || row['DATE']) {
            date = row['日期'] || row['date'] || row['Date'] || row['DATE'];
            console.log('🔍 [processExcelRow] 找到日期欄位:', date, '類型:', typeof date);
        }
        
        // 描述欄位
        if (row['描述'] || row['description'] || row['Description'] || row['DESCRIPTION']) {
            description = row['描述'] || row['description'] || row['Description'] || row['DESCRIPTION'];
        }
        
        // 金額欄位
        if (row['金額'] || row['amount'] || row['Amount'] || row['AMOUNT']) {
            amount = row['金額'] || row['amount'] || row['Amount'] || row['AMOUNT'];
        }
        
        // 成員欄位
        if (row['成員'] || row['member'] || row['Member'] || row['MEMBER']) {
            member = row['成員'] || row['member'] || row['Member'] || row['MEMBER'];
        }
        
        // 類型欄位 (收入/支出)
        if (row['類型'] || row['type'] || row['Type'] || row['TYPE']) {
            type = row['類型'] || row['type'] || row['Type'] || row['TYPE'];
        }
        
        // 根據圖片格式：日期 | 描述 | 金額 | 成員
        const keys = Object.keys(row);
        if (keys.length >= 4) {
            // 按順序提取：第1欄=日期，第2欄=描述，第3欄=金額，第4欄=成員
            date = row[keys[0]];
            description = row[keys[1]];
            amount = row[keys[2]];
            member = row[keys[3]] || currentMember || '未知';
            
            console.log('🔍 [processExcelRow] 按順序提取 (4欄格式):', {
                date: date,
                description: description,
                amount: amount,
                member: member,
                keys: keys
            });
        } else if (keys.length >= 3) {
            // 如果只有3欄，假設格式是：日期, 描述, 金額
            date = row[keys[0]];
            description = row[keys[1]];
            amount = row[keys[2]];
            // 使用當前成員（從標題行檢測）
            member = currentMember || '未知';
            
            console.log('🔍 [processExcelRow] 推測格式 (3欄格式):', {
                date: date,
                description: description,
                amount: amount,
                member: member,
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
            amount = parseFloat(amount);
            
            // 如果沒有類型欄位，根據金額正負判斷
            if (!type) {
                type = amount >= 0 ? '收入' : '支出';
            }
            
            console.log('🔍 [processExcelRow] 處理金額後:', {
                amount: amount,
                type: type
            });
        }
        
        // 驗證必要欄位
        if (!date || !description || amount === undefined || amount === null) {
            console.log('⚠️ [processExcelRow] 跳過不完整的記錄:', { date, description, amount, member, currentMember });
            return null;
        }
        
        // 如果沒有成員信息，跳過這行
        if (!member || member === '未知') {
            console.log('⚠️ [processExcelRow] 跳過無成員信息記錄:', { date, description, amount, member, currentMember });
            return null;
        }
        
        // 解析描述格式：主類別-描述
        let mainCategory = '';
        let subDescription = description;
        
        if (description && description.includes('-')) {
            const parts = description.split('-');
            if (parts.length >= 2) {
                mainCategory = parts[0].trim();
                subDescription = parts.slice(1).join('-').trim();
            }
        }
        
        console.log('🔍 [processExcelRow] 描述解析:', {
            original: description,
            mainCategory: mainCategory,
            subDescription: subDescription
        });
        
        return {
            date: date,
            description: description,
            mainCategory: mainCategory,
            subDescription: subDescription,
            amount: amount,
            member: member || '未知',
            type: type || (amount >= 0 ? '收入' : '支出'),
            subCategory: '信用卡', // Excel預設subCategory為信用卡
            paymentMethod: '信用卡' // 預設付款方式
        };
        
    } catch (error) {
        console.error('❌ [processExcelRow] 處理行資料失敗:', error, row);
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
        version: '1.0.0',
        environment: environment,
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
        
        // 處理 Excel 資料格式
        const processedData = processExcelData(excelData);
        console.log('🔍 [API] 處理後資料筆數:', processedData.length);
        console.log('🔍 [API] 處理後資料類型:', Array.isArray(processedData) ? 'Array' : typeof processedData);
        
        // 按成員分組統計
        const memberStats = {};
        processedData.forEach(record => {
            const member = record.member || '未知';
            memberStats[member] = (memberStats[member] || 0) + 1;
        });
        console.log('🔍 [API] 按成員統計:', memberStats);
        console.log('🔍 [API] 處理後資料範例:', processedData.slice(0, 3));
        
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
            } else if (parsedData && typeof parsedData === 'object') {
                // 如果是對象，嘗試轉換為數組
                systemData = Object.values(parsedData).filter(item => 
                    item && typeof item === 'object' && item.date
                );
            } else {
                console.log('⚠️ [API] 系統資料格式不正確，使用空數組');
                systemData = [];
            }
        } catch (error) {
            console.log('⚠️ [API] 系統資料檔案不存在或為空:', error.message);
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

// 404處理 - 僅處理API請求
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API端點不存在',
        availableEndpoints: [
            'GET /api/health',
            'POST /api/version/update',
            'POST /api/excel/compare',
            'POST /api/excel/import',
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

// 清除所有數據 API - 已移除（使用SQLite API替代）

// ==================== SQLite 數據庫 API 端點 ====================

// 獲取所有記錄
app.get('/api/records', (req, res) => {
    try {
        const records = dbManager.getAllRecords();
        res.json({
            success: true,
            records: records,
            count: records.length
        });
    } catch (error) {
        console.error('❌ 獲取記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取記錄失敗',
            error: error.message
        });
    }
});

// 獲取統計數據
app.get('/api/records/stats', (req, res) => {
    try {
        const stats = dbManager.getStatistics();
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('❌ 獲取統計數據失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取統計數據失敗',
            error: error.message
        });
    }
});

// 添加記錄
app.post('/api/records', (req, res) => {
    try {
        const record = req.body;
        
        // 生成唯一ID
        if (!record.id) {
            record.id = Date.now() + Math.random().toString(36).substr(2, 9);
        }
        
        const result = dbManager.insertRecord(record);
        if (result.success) {
            res.json({
                success: true,
                message: '記錄添加成功',
                record: record
            });
        } else {
            res.status(400).json({
                success: false,
                message: '記錄添加失敗',
                error: result.error
            });
        }
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
app.put('/api/records/:id', (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;
        
        const result = dbManager.updateRecord(id, updates);
        if (result.success) {
            res.json({
                success: true,
                message: '記錄更新成功',
                changes: result.changes
            });
        } else {
            res.status(400).json({
                success: false,
                message: '記錄更新失敗',
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ 更新記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '更新記錄失敗',
            error: error.message
        });
    }
});

// 刪除記錄
app.delete('/api/records/:id', (req, res) => {
    try {
        const id = req.params.id;
        
        const result = dbManager.deleteRecord(id);
        if (result.success) {
            res.json({
                success: true,
                message: '記錄刪除成功',
                changes: result.changes
            });
        } else {
            res.status(400).json({
                success: false,
                message: '記錄刪除失敗',
                error: result.error
            });
        }
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
app.delete('/api/records', (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請提供要刪除的記錄ID列表'
            });
        }
        
        const result = dbManager.deleteRecords(ids);
        if (result.success) {
            res.json({
                success: true,
                message: `成功刪除 ${result.count} 筆記錄`,
                count: result.count
            });
        } else {
            res.status(400).json({
                success: false,
                message: '批量刪除失敗',
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ 批量刪除失敗:', error);
        res.status(500).json({
            success: false,
            message: '批量刪除失敗',
            error: error.message
        });
    }
});

// 清空所有記錄
app.delete('/api/records/clear', (req, res) => {
    try {
        const result = dbManager.clearAllRecords();
        if (result.success) {
            res.json({
                success: true,
                message: `成功清空所有記錄，刪除了 ${result.changes} 筆記錄`,
                changes: result.changes
            });
        } else {
            res.status(400).json({
                success: false,
                message: '清空記錄失敗',
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ 清空記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '清空記錄失敗',
            error: error.message
        });
    }
});

// 檢查數據完整性
app.get('/api/records/integrity', (req, res) => {
    try {
        const integrityCheck = dbManager.checkDataIntegrity();
        res.json({
            success: true,
            integrity: integrityCheck
        });
    } catch (error) {
        console.error('❌ 數據完整性檢查失敗:', error);
        res.status(500).json({
            success: false,
            message: '數據完整性檢查失敗',
            error: error.message
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

process.on('SIGTERM', () => {
    console.log('\n🛑 正在關閉服務...');
    process.exit(0);
});
