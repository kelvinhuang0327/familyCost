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
const BackupManager = require('./app/backend/backup_manager');
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

// 初始化Token管理器和備份管理器
const tokenManager = new TokenManager();
const backupManager = new BackupManager();

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

// 備份到GitHub的API
app.post('/api/backup', async (req, res) => {
    try {
        const { records, timestamp, count } = req.body;
        
        console.log(`📦 收到備份請求: ${count}筆記錄`);
        
        // 檢查數據完整性
        const integrityCheck = await backupManager.checkDataIntegrity(records);
        if (!integrityCheck.valid) {
            console.log('⚠️ 數據完整性檢查失敗:', integrityCheck.issues);
            return res.status(400).json({
                success: false,
                message: `數據完整性檢查失敗: ${integrityCheck.issues.join(', ')}`,
                issues: integrityCheck.issues
            });
        }
        
        // 使用新的備份管理器創建完整備份
        const backupResult = await backupManager.createFullBackup(records, {
            lastUpdated: timestamp,
            description: "家庭收支記錄資料"
        });
        
        res.json({
            success: true,
            message: `成功備份${count}筆記錄`,
            timestamp: timestamp,
            backupResult: backupResult
        });
        
    } catch (error) {
        console.error('❌ 備份失敗:', error);
        res.status(500).json({
            success: false,
            message: `備份失敗: ${error.message}`,
            error: error.message
        });
    }
});

// 從GitHub還原的API
app.get('/api/restore', async (req, res) => {
    try {
        console.log('🔍 檢查GitHub上的最新數據...');
        
        // 獲取最新變更
        try {
            await execAsync('git fetch origin');
            console.log('📥 已獲取遠端更新');
        } catch (fetchError) {
            console.log('⚠️ Git fetch 失敗，嘗試重新配置遠端:', fetchError.message);
            // 檢查遠端是否存在
            try {
                const { stdout: remoteList } = await execAsync('git remote -v');
                console.log('📋 當前遠端配置:', remoteList);
                if (!remoteList.includes('origin')) {
                    console.log('⚠️ origin 遠端不存在，創建遠端');
                    await execAsync('git remote add origin https://github.com/kelvinhuang0327/familyCost.git');
                }
            } catch (remoteError) {
                console.log('⚠️ 無法檢查遠端配置，創建遠端');
                await execAsync('git remote add origin https://github.com/kelvinhuang0327/familyCost.git');
            }
            await execAsync('git fetch origin');
            console.log('✅ 已重新配置並獲取遠端更新');
        }
        
        // 檢查是否有新的提交
        const { stdout } = await execAsync('git log HEAD..origin/main --oneline');
        
        if (stdout.trim()) {
            console.log('🔄 發現GitHub上有新數據，正在同步...');
            console.log('新提交:', stdout.trim());
            
            // 拉取最新變更
            try {
                await execAsync('git pull origin main');
                console.log('✅ 已同步最新數據');
            } catch (pullError) {
                console.log('⚠️ Git pull 失敗，嘗試重新配置遠端:', pullError.message);
                // 檢查遠端是否存在
                try {
                    const { stdout: remoteList } = await execAsync('git remote -v');
                    console.log('📋 當前遠端配置:', remoteList);
                    if (!remoteList.includes('origin')) {
                        console.log('⚠️ origin 遠端不存在，創建遠端');
                        await execAsync('git remote add origin https://github.com/kelvinhuang0327/familyCost.git');
                    }
                } catch (remoteError) {
                    console.log('⚠️ 無法檢查遠端配置，創建遠端');
                    await execAsync('git remote add origin https://github.com/kelvinhuang0327/familyCost.git');
                }
                await execAsync('git pull origin main');
                console.log('✅ 重新配置後同步成功');
            }
            
            res.json({
                success: true,
                hasNewData: true,
                message: '成功從GitHub同步數據',
                newCommits: stdout.trim().split('\n')
            });
        } else {
            console.log('📊 GitHub數據已是最新');
            
            res.json({
                success: true,
                hasNewData: false,
                message: 'GitHub數據已是最新'
            });
        }
        
    } catch (error) {
        console.error('❌ 還原檢查失敗:', error);
        res.status(500).json({
            success: false,
            message: `還原檢查失敗: ${error.message}`,
            error: error.message
        });
    }
});

// 獲取Git狀態
app.get('/api/git-status', async (req, res) => {
    try {
        const { stdout: status } = await execAsync('git status --porcelain');
        const { stdout: log } = await execAsync('git log --oneline -5');
        
        res.json({
            success: true,
            status: status.trim(),
            recentCommits: log.trim().split('\n'),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ 獲取Git狀態失敗:', error);
        res.status(500).json({
            success: false,
            message: `獲取Git狀態失敗: ${error.message}`,
            error: error.message
        });
    }
});

// 手動同步API
app.post('/api/sync', async (req, res) => {
    try {
        console.log('🔄 開始手動同步...');
        
        // 拉取最新變更
        await execAsync('git pull origin main');
        console.log('📥 已拉取最新變更');
        
        // 添加所有變更
        await execAsync('git add .');
        
        // 提交變更
        const commitMessage = `手動同步 - ${new Date().toLocaleString('zh-TW')}`;
        await execAsync(`git commit -m "${commitMessage}"`);
        
        // 推送到GitHub
        try {
            await execAsync('git push origin main');
            console.log('🚀 手動同步已推送到GitHub');
        } catch (pushError) {
            console.log('⚠️ Git推送失敗，嘗試重新配置遠端:', pushError.message);
            // 檢查遠端是否存在
            try {
                const { stdout: remoteList } = await execAsync('git remote -v');
                console.log('📋 當前遠端配置:', remoteList);
                if (!remoteList.includes('origin')) {
                    console.log('⚠️ origin 遠端不存在，創建遠端');
                    await execAsync('git remote add origin https://github.com/kelvinhuang0327/familyCost.git');
                }
            } catch (remoteError) {
                console.log('⚠️ 無法檢查遠端配置，創建遠端');
                await execAsync('git remote add origin https://github.com/kelvinhuang0327/familyCost.git');
            }
            try {
                await execAsync('git push origin main');
                console.log('🚀 重新配置後推送成功');
            } catch (retryError) {
                console.log('❌ 重新配置後推送仍然失敗:', retryError.message);
                console.log('📝 本地同步已完成，但GitHub推送失敗');
            }
        }
        
        res.json({
            success: true,
            message: '手動同步成功',
            commitMessage: commitMessage
        });
        
    } catch (error) {
        console.error('❌ 手動同步失敗:', error);
        res.status(500).json({
            success: false,
            message: `手動同步失敗: ${error.message}`,
            error: error.message
        });
    }
});

// Token管理API
app.post('/api/token/save', async (req, res) => {
    try {
        console.log('🔍 [API] POST /api/token/save 開始處理...');
        const { token } = req.body;
        console.log('🔍 [API] 收到Token長度:', token ? token.length : 'null');
        console.log('🔍 [API] Token前綴:', token ? token.substring(0, 10) + '...' : 'null');
        
        if (!token) {
            console.log('❌ [API] Token為空');
            return res.status(400).json({ success: false, message: 'Token不能為空' });
        }

        const cleanToken = token.trim();
        console.log('🔍 [API] 清理後Token長度:', cleanToken.length);
        
        if (!/^[\x00-\x7F]+$/.test(cleanToken)) {
            console.log('❌ [API] Token包含非ASCII字符');
            return res.status(400).json({ success: false, message: 'Token包含非ASCII字符，請檢查輸入' });
        }
        if (cleanToken.length < 20 || cleanToken.length > 100) {
            console.log('❌ [API] Token長度不正確:', cleanToken.length);
            return res.status(400).json({ success: false, message: 'Token長度不正確，GitHub Token通常為40個字符' });
        }

        console.log('🔍 [API] 開始驗證Token...');
        const validation = await tokenManager.validateToken(cleanToken);
        console.log('🔍 [API] Token驗證結果:', validation);
        
        if (!validation.valid) {
            console.log('❌ [API] Token驗證失敗:', validation.error);
            return res.status(400).json({ success: false, message: `Token無效: ${validation.error}` });
        }

        console.log('✅ [API] Token驗證成功，開始儲存...');
        tokenManager.saveToken(cleanToken);
        tokenManager.setGitRemote(cleanToken);
        
        const response = { success: true, message: `Token已儲存，用戶: ${validation.user}`, user: validation.user };
        console.log('✅ [API] Token儲存成功，返回響應:', response);
        res.json(response);
    } catch (error) {
        console.error('❌ [API] Token儲存失敗:', error);
        console.error('❌ [API] 錯誤堆疊:', error.stack);
        res.status(500).json({ success: false, message: `Token儲存失敗: ${error.message}`, error: error.message });
    }
});

app.get('/api/token/status', async (req, res) => {
    try {
        console.log('🔍 [API] GET /api/token/status 開始處理...');
        const hasToken = tokenManager.hasToken();
        console.log('🔍 [API] hasToken結果:', hasToken);
        
        const tokenInfo = hasToken ? await tokenManager.getTokenInfo() : null;
        console.log('🔍 [API] tokenInfo結果:', tokenInfo);
        
        const response = { success: true, hasToken, tokenInfo };
        console.log('✅ [API] Token狀態檢查完成，返回響應:', response);
        res.json(response);
    } catch (error) {
        console.error('❌ [API] Token狀態檢查失敗:', error);
        console.error('❌ [API] 錯誤堆疊:', error.stack);
        res.status(500).json({ success: false, message: `Token狀態檢查失敗: ${error.message}`, error: error.message });
    }
});

app.delete('/api/token', (req, res) => {
    try {
        tokenManager.deleteToken();
        res.json({ success: true, message: 'Token已刪除' });
    } catch (error) {
        console.error('❌ Token刪除失敗:', error);
        res.status(500).json({ success: false, message: `Token刪除失敗: ${error.message}`, error: error.message });
    }
});

// 備份管理API
app.get('/api/backup/list', async (req, res) => {
    try {
        const backups = await backupManager.getBackupList();
        res.json({ success: true, backups: backups });
    } catch (error) {
        console.error('❌ 獲取備份列表失敗:', error);
        res.status(500).json({ success: false, message: `獲取備份列表失敗: ${error.message}` });
    }
});

app.get('/api/backup/stats', async (req, res) => {
    try {
        const stats = await backupManager.getBackupStats();
        res.json({ success: true, stats: stats });
    } catch (error) {
        console.error('❌ 獲取備份統計失敗:', error);
        res.status(500).json({ success: false, message: `獲取備份統計失敗: ${error.message}` });
    }
});

app.post('/api/backup/create', async (req, res) => {
    try {
        const { records, metadata } = req.body;
        
        // 檢查數據完整性
        const integrityCheck = await backupManager.checkDataIntegrity(records);
        if (!integrityCheck.valid) {
            return res.status(400).json({
                success: false,
                message: `數據完整性檢查失敗: ${integrityCheck.issues.join(', ')}`,
                issues: integrityCheck.issues
            });
        }
        
        const result = await backupManager.createFullBackup(records, metadata);
        res.json({ success: true, result: result });
    } catch (error) {
        console.error('❌ 創建備份失敗:', error);
        res.status(500).json({ success: false, message: `創建備份失敗: ${error.message}` });
    }
});

app.post('/api/backup/restore/:backupFileName', async (req, res) => {
    try {
        const { backupFileName } = req.params;
        const result = await backupManager.restoreFromBackup(backupFileName);
        res.json({ success: true, result: result });
    } catch (error) {
        console.error('❌ 從備份恢復失敗:', error);
        res.status(500).json({ success: false, message: `從備份恢復失敗: ${error.message}` });
    }
});

app.post('/api/backup/check-integrity', async (req, res) => {
    try {
        const { records } = req.body;
        const result = await backupManager.checkDataIntegrity(records);
        res.json({ success: true, result: result });
    } catch (error) {
        console.error('❌ 數據完整性檢查失敗:', error);
        res.status(500).json({ success: false, message: `數據完整性檢查失敗: ${error.message}` });
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
            'POST /api/backup',
            'GET /api/restore',
            'GET /api/git-status',
            'POST /api/sync'
        ]
    });
});

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
    console.log(`📁 備份目錄: ${path.join(__dirname, 'data/backups')}`);
    console.log('📋 可用API:');
    console.log('   GET  /api/health     - 健康檢查');
    console.log('   POST /api/backup     - 備份到GitHub');
    console.log('   GET  /api/restore    - 從GitHub還原');
    console.log('   GET  /api/git-status - 獲取Git狀態');
    console.log('   POST /api/sync       - 手動同步');
    console.log('   POST /api/token/save - 儲存GitHub Token');
    console.log('   GET  /api/token/status - 檢查Token狀態');
    console.log('   DELETE /api/token    - 刪除Token');
    console.log('   POST /api/excel/compare - Excel資料比對');
    console.log('   POST /api/excel/import - 匯入Excel資料');
    console.log('   GET  /api/backup/list - 獲取備份列表');
    console.log('   GET  /api/backup/stats - 獲取備份統計');
    console.log('   POST /api/backup/create - 創建備份');
    console.log('   POST /api/backup/restore/:fileName - 從備份恢復');
    console.log('   POST /api/backup/check-integrity - 檢查數據完整性');
    
    // 啟動自動備份機制
    backupManager.startAutoBackup();
    console.log('🔄 自動備份機制已啟動 (間隔: 5分鐘)');
    
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
