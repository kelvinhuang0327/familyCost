const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const TokenManager = require('./token_manager');
const { getConfig, getEnvironment } = require('./config');

const app = express();

// 獲取環境配置
const config = getConfig();
const environment = getEnvironment();
const PORT = config.port;

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
app.use(express.static('.'));

const execAsync = util.promisify(exec);

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
        const dataJsonPath = path.join(__dirname, 'data.json');
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
            await execAsync('git add data.json');
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
                console.log('⚠️ Git推送失敗:', pushError.message);
                // 如果推送失敗，仍然返回成功，因為本地備份已完成
                console.log('📝 本地備份已完成，但GitHub推送失敗');
            }
            
            res.json({
                success: true,
                message: `成功備份${count}筆記錄到GitHub`,
                timestamp: timestamp,
                commitMessage: commitMessage
            });
            
        } catch (gitError) {
            console.warn('⚠️ Git操作失敗:', gitError.message);
            
            res.json({
                success: false,
                message: `本地備份成功，但GitHub同步失敗: ${gitError.message}`,
                timestamp: timestamp,
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
        await execAsync('git fetch origin');
        console.log('📥 已獲取遠端更新');
        
        // 檢查是否有新的提交
        const { stdout } = await execAsync('git log HEAD..origin/main --oneline');
        
        if (stdout.trim()) {
            console.log('🔄 發現GitHub上有新數據，正在同步...');
            console.log('新提交:', stdout.trim());
            
            // 拉取最新變更
            await execAsync('git pull origin main');
            console.log('✅ 已同步最新數據');
            
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
            hasChanges: status.trim().length > 0
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `獲取Git狀態失敗: ${error.message}`,
            error: error.message
        });
    }
});

// Token管理API
app.post('/api/token/save', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token不能為空'
            });
        }

        // 驗證token有效性
        const validation = await tokenManager.validateToken(token);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: `Token無效: ${validation.error}`
            });
        }

        // 儲存token
        tokenManager.saveToken(token);
        
        // 設置Git遠程URL
        tokenManager.setGitRemote(token);

        res.json({
            success: true,
            message: `Token已儲存，用戶: ${validation.user}`,
            user: validation.user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Token儲存失敗: ${error.message}`,
            error: error.message
        });
    }
});

app.get('/api/token/status', async (req, res) => {
    try {
        const hasToken = tokenManager.hasToken();
        let tokenInfo = null;

        if (hasToken) {
            const token = tokenManager.loadToken();
            if (token) {
                const validation = await tokenManager.validateToken(token);
                tokenInfo = {
                    exists: true,
                    valid: validation.valid,
                    user: validation.user || null,
                    error: validation.error || null
                };
            }
        }

        res.json({
            success: true,
            hasToken: hasToken,
            tokenInfo: tokenInfo
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Token狀態檢查失敗: ${error.message}`,
            error: error.message
        });
    }
});

app.delete('/api/token', async (req, res) => {
    try {
        tokenManager.deleteToken();
        
        // 重置Git遠程URL
        const { execSync } = require('child_process');
        execSync('git remote set-url origin https://github.com/kelvinhuang0327/familyCost.git', { stdio: 'pipe' });

        res.json({
            success: true,
            message: 'Token已刪除'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Token刪除失敗: ${error.message}`,
            error: error.message
        });
    }
});

// 手動同步
app.post('/api/sync', async (req, res) => {
    try {
        console.log('🔄 手動同步到GitHub...');
        
        // 檢查是否有變更
        const { stdout: status } = await execAsync('git status --porcelain');
        if (!status.trim()) {
            return res.json({
                success: true,
                message: '沒有變更需要同步'
            });
        }
        
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
            console.log('⚠️ Git推送失敗:', pushError.message);
            console.log('📝 本地同步已完成，但GitHub推送失敗');
        }
        
        res.json({
            success: true,
            message: '手動同步成功',
            commitMessage: commitMessage
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `手動同步失敗: ${error.message}`,
            error: error.message
        });
    }
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
    console.error('❌ 服務器錯誤:', error);
    res.status(500).json({
        success: false,
        message: '服務器內部錯誤',
        error: error.message
    });
});

// 404處理
app.use((req, res) => {
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

// 啟動服務器
app.listen(PORT, () => {
    console.log('🚀 家庭收支備份服務已啟動');
    console.log(`📡 服務地址: http://localhost:${PORT}`);
    console.log(`📁 工作目錄: ${__dirname}`);
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