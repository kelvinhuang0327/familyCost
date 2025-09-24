#!/usr/bin/env node

// 家庭收支管理平台 - 主服務器文件
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');

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
const { getConfig, getEnvironment } = require('./app/config/config');

const app = express();

// 獲取環境配置
const config = getConfig();
const environment = getEnvironment();
const PORT = process.env.PORT || config.port;

// 初始化Token管理器
const tokenManager = new TokenManager();

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
        
        // 更新data.json
        const dataJsonPath = path.join(__dirname, 'data/data.json');
        const data = {
            records: records,
            metadata: {
                lastUpdated: timestamp,
                version: "1.0",
                description: "家庭收支記錄資料",
                recordCount: count
            }
        };
        
        await fs.writeFile(dataJsonPath, JSON.stringify(data, null, 2), 'utf8');
        console.log('✅ data.json 已更新');
        
        // Git操作
        try {
            // 檢查Git狀態
            const { stdout: status } = await execAsync('git status --porcelain');
            if (!status.trim()) {
                console.log('📝 沒有變更需要提交');
                return res.json({
                    success: true,
                    message: '數據已是最新，無需備份',
                    timestamp: timestamp
                });
            }
            
            // 添加變更
            await execAsync('git add data/data.json');
            console.log('📁 已添加 data.json 到暫存區');
            
            // 提交變更
            const commitMessage = `自動備份 - ${new Date().toLocaleString('zh-TW')} (${count}筆記錄)`;
            await execAsync(`git commit -m "${commitMessage}"`);
            console.log('💾 已提交變更');
            
            // 推送到GitHub
            try {
                await execAsync('git push origin main');
                console.log('🚀 已推送到GitHub');
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
                    console.log('📝 本地備份已完成，但GitHub推送失敗');
                }
            }
            
            res.json({
                success: true,
                message: `成功備份${count}筆記錄到GitHub`,
                timestamp: timestamp,
                commitMessage: commitMessage
            });
            
        } catch (gitError) {
            console.error('❌ Git操作失敗:', gitError);
            res.status(500).json({
                success: false,
                message: `Git操作失敗: ${gitError.message}`,
                error: gitError.message
            });
        }
        
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
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: 'Token不能為空' });
        }

        const cleanToken = token.trim();
        if (!/^[\x00-\x7F]+$/.test(cleanToken)) {
            return res.status(400).json({ success: false, message: 'Token包含非ASCII字符，請檢查輸入' });
        }
        if (cleanToken.length < 20 || cleanToken.length > 100) {
            return res.status(400).json({ success: false, message: 'Token長度不正確，GitHub Token通常為40個字符' });
        }

        console.log('🔍 開始驗證Token...');
        const validation = await tokenManager.validateToken(cleanToken);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: `Token無效: ${validation.error}` });
        }

        console.log('✅ Token驗證成功，開始儲存...');
        tokenManager.saveToken(cleanToken);
        tokenManager.setGitRemote(cleanToken);
        res.json({ success: true, message: `Token已儲存，用戶: ${validation.user}`, user: validation.user });
    } catch (error) {
        console.error('❌ Token儲存失敗:', error);
        res.status(500).json({ success: false, message: `Token儲存失敗: ${error.message}`, error: error.message });
    }
});

app.get('/api/token/status', async (req, res) => {
    try {
        const hasToken = tokenManager.hasToken();
        const tokenInfo = hasToken ? await tokenManager.getTokenInfo() : null;
        res.json({ success: true, hasToken, tokenInfo });
    } catch (error) {
        console.error('❌ Token狀態檢查失敗:', error);
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
    console.log('📋 可用API:');
    console.log('   GET  /api/health     - 健康檢查');
    console.log('   POST /api/backup     - 備份到GitHub');
    console.log('   GET  /api/restore    - 從GitHub還原');
    console.log('   GET  /api/git-status - 獲取Git狀態');
    console.log('   POST /api/sync       - 手動同步');
    console.log('   POST /api/token/save - 儲存GitHub Token');
    console.log('   GET  /api/token/status - 檢查Token狀態');
    console.log('   DELETE /api/token    - 刪除Token');
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
