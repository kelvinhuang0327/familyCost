// 增強版備份管理器
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class BackupManager {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data');
        this.backupDir = path.join(process.cwd(), 'data', 'backups');
        this.dataFile = path.join(this.dataDir, 'data.json');
        this.maxBackups = 50; // 保留最近50個備份
        this.backupInterval = 5 * 60 * 1000; // 5分鐘自動備份
        this.lastBackupTime = null;
        this.isBackupInProgress = false;
        
        // 確保備份目錄存在
        this.ensureBackupDir();
    }

    // 確保備份目錄存在
    async ensureBackupDir() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log('✅ 備份目錄已確保存在:', this.backupDir);
        } catch (error) {
            console.error('❌ 創建備份目錄失敗:', error);
        }
    }

    // 生成備份檔案名
    generateBackupFileName() {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        return `backup_${timestamp}.json`;
    }

    // 創建本地備份
    async createLocalBackup(records, metadata = {}) {
        try {
            if (this.isBackupInProgress) {
                console.log('⚠️ 備份正在進行中，跳過此次備份');
                return null;
            }

            this.isBackupInProgress = true;
            console.log('🔄 開始創建本地備份...');

            const backupData = {
                records: records,
                metadata: {
                    ...metadata,
                    backupTime: new Date().toISOString(),
                    recordCount: records ? records.length : 0,
                    version: "2.0"
                }
            };

            const backupFileName = this.generateBackupFileName();
            const backupPath = path.join(this.backupDir, backupFileName);

            await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
            
            // 設置檔案權限
            await fs.chmod(backupPath, 0o644);

            console.log('✅ 本地備份已創建:', backupFileName);
            
            // 清理舊備份
            await this.cleanupOldBackups();
            
            this.lastBackupTime = new Date();
            this.isBackupInProgress = false;
            
            return backupPath;
        } catch (error) {
            console.error('❌ 創建本地備份失敗:', error);
            this.isBackupInProgress = false;
            throw error;
        }
    }

    // 清理舊備份
    async cleanupOldBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
                .sort()
                .reverse(); // 最新的在前

            if (backupFiles.length > this.maxBackups) {
                const filesToDelete = backupFiles.slice(this.maxBackups);
                console.log(`🧹 清理 ${filesToDelete.length} 個舊備份檔案`);
                
                for (const file of filesToDelete) {
                    const filePath = path.join(this.backupDir, file);
                    await fs.unlink(filePath);
                    console.log('🗑️ 已刪除舊備份:', file);
                }
            }
        } catch (error) {
            console.error('❌ 清理舊備份失敗:', error);
        }
    }

    // 創建Git備份
    async createGitBackup(records, metadata = {}) {
        try {
            console.log('🔄 開始創建Git備份...');

            // 更新data.json
            const dataToSave = {
                records: records,
                metadata: {
                    ...metadata,
                    lastUpdated: new Date().toISOString(),
                    version: "1.0",
                    description: "家庭收支記錄資料",
                    recordCount: records ? records.length : 0
                }
            };

            await fs.writeFile(this.dataFile, JSON.stringify(dataToSave, null, 2));

            // Git操作
            const { stdout: status } = await execAsync('git status --porcelain');
            if (!status.trim()) {
                console.log('📝 沒有變更需要提交');
                return { success: true, message: '數據已是最新，無需備份' };
            }

            // 添加變更
            await execAsync('git add data/data.json');
            console.log('📁 已添加 data.json 到暫存區');

            // 提交變更
            const commitMessage = `自動備份 - ${new Date().toLocaleString('zh-TW')} (${records ? records.length : 0}筆記錄)`;
            await execAsync(`git commit -m "${commitMessage}"`);
            console.log('💾 已提交變更');

            // 推送到GitHub
            try {
                await execAsync('git push origin main');
                console.log('🚀 已推送到GitHub');
            } catch (pushError) {
                console.log('⚠️ Git推送失敗，嘗試重新配置遠端:', pushError.message);
                // 重新配置遠端
                try {
                    await execAsync('git remote add origin https://github.com/kelvinhuang0327/familyCost.git');
                } catch (remoteError) {
                    // 遠端可能已存在，忽略錯誤
                }
                try {
                    await execAsync('git push origin main');
                    console.log('🚀 重新配置後推送成功');
                } catch (retryError) {
                    console.log('❌ 重新配置後推送仍然失敗:', retryError.message);
                    throw retryError;
                }
            }

            return {
                success: true,
                message: `成功備份${records ? records.length : 0}筆記錄到GitHub`,
                commitMessage: commitMessage
            };

        } catch (error) {
            console.error('❌ Git備份失敗:', error);
            throw error;
        }
    }

    // 創建完整備份（本地+Git）
    async createFullBackup(records, metadata = {}) {
        try {
            console.log('🔄 開始創建完整備份...');

            // 創建本地備份
            const localBackupPath = await this.createLocalBackup(records, metadata);
            
            // 創建Git備份
            const gitResult = await this.createGitBackup(records, metadata);

            console.log('✅ 完整備份已完成');
            return {
                success: true,
                localBackup: localBackupPath,
                gitBackup: gitResult,
                message: '完整備份成功'
            };

        } catch (error) {
            console.error('❌ 完整備份失敗:', error);
            throw error;
        }
    }

    // 檢查數據完整性
    async checkDataIntegrity(records) {
        try {
            console.log('🔍 開始檢查數據完整性...');

            if (!records || !Array.isArray(records)) {
                return { valid: false, error: '記錄數據格式不正確' };
            }

            const issues = [];
            const recordIds = new Set();

            for (let i = 0; i < records.length; i++) {
                const record = records[i];
                
                // 檢查必要欄位
                if (!record.id) {
                    issues.push(`記錄 ${i + 1}: 缺少ID`);
                } else if (recordIds.has(record.id)) {
                    issues.push(`記錄 ${i + 1}: ID重複 (${record.id})`);
                } else {
                    recordIds.add(record.id);
                }

                if (!record.member) {
                    issues.push(`記錄 ${i + 1}: 缺少成員`);
                }

                if (!record.date) {
                    issues.push(`記錄 ${i + 1}: 缺少日期`);
                }

                if (record.amount === undefined || record.amount === null) {
                    issues.push(`記錄 ${i + 1}: 缺少金額`);
                }

                if (!record.type) {
                    issues.push(`記錄 ${i + 1}: 缺少類型`);
                }
            }

            const isValid = issues.length === 0;
            console.log(`🔍 數據完整性檢查完成: ${isValid ? '通過' : '發現問題'}`);
            
            if (!isValid) {
                console.log('⚠️ 發現的問題:', issues);
            }

            return {
                valid: isValid,
                issues: issues,
                recordCount: records.length,
                uniqueIds: recordIds.size
            };

        } catch (error) {
            console.error('❌ 數據完整性檢查失敗:', error);
            return { valid: false, error: error.message };
        }
    }

    // 獲取備份列表
    async getBackupList() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = require('fs').statSync(filePath);
                    return {
                        fileName: file,
                        filePath: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => b.created - a.created); // 最新的在前

            return backupFiles;
        } catch (error) {
            console.error('❌ 獲取備份列表失敗:', error);
            return [];
        }
    }

    // 從備份恢復
    async restoreFromBackup(backupFileName) {
        try {
            console.log('🔄 開始從備份恢復...');

            const backupPath = path.join(this.backupDir, backupFileName);
            const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

            // 檢查備份數據完整性
            const integrityCheck = await this.checkDataIntegrity(backupData.records);
            if (!integrityCheck.valid) {
                throw new Error(`備份數據不完整: ${integrityCheck.issues.join(', ')}`);
            }

            // 恢復數據
            const dataToSave = {
                records: backupData.records,
                metadata: {
                    ...backupData.metadata,
                    restoredFrom: backupFileName,
                    restoredAt: new Date().toISOString()
                }
            };

            await fs.writeFile(this.dataFile, JSON.stringify(dataToSave, null, 2));
            console.log('✅ 數據已從備份恢復:', backupFileName);

            return {
                success: true,
                message: `成功從 ${backupFileName} 恢復數據`,
                recordCount: backupData.records.length
            };

        } catch (error) {
            console.error('❌ 從備份恢復失敗:', error);
            throw error;
        }
    }

    // 啟動自動備份
    startAutoBackup() {
        console.log('🔄 啟動自動備份機制 (間隔: 5分鐘)');
        
        setInterval(async () => {
            try {
                // 讀取當前數據
                const dataContent = await fs.readFile(this.dataFile, 'utf8');
                const data = JSON.parse(dataContent);
                
                if (data.records && data.records.length > 0) {
                    // 檢查是否需要備份（數據有變化）
                    const currentRecordCount = data.records.length;
                    const lastBackupRecordCount = this.lastBackupRecordCount || 0;
                    
                    if (currentRecordCount !== lastBackupRecordCount) {
                        console.log(`🔄 檢測到數據變化 (${lastBackupRecordCount} → ${currentRecordCount})，觸發自動備份`);
                        await this.createFullBackup(data.records, data.metadata);
                        this.lastBackupRecordCount = currentRecordCount;
                    }
                }
            } catch (error) {
                console.error('❌ 自動備份失敗:', error);
            }
        }, this.backupInterval);
    }

    // 獲取備份統計
    async getBackupStats() {
        try {
            const backups = await this.getBackupList();
            const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
            
            return {
                totalBackups: backups.length,
                totalSize: totalSize,
                oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
                newestBackup: backups.length > 0 ? backups[0].created : null,
                lastBackupTime: this.lastBackupTime
            };
        } catch (error) {
            console.error('❌ 獲取備份統計失敗:', error);
            return null;
        }
    }
}

module.exports = BackupManager;
