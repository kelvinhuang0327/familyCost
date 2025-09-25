// 數據遷移腳本：從JSON文件遷移到SQLite
const fs = require('fs').promises;
const path = require('path');
const DatabaseManager = require('./database');

class DataMigrator {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.dataFile = path.join(process.cwd(), 'data', 'data.json');
    }
    
    async migrateFromJson() {
        try {
            console.log('🔄 開始數據遷移...');
            
            // 讀取現有JSON數據
            let jsonData = null;
            try {
                const data = await fs.readFile(this.dataFile, 'utf8');
                jsonData = JSON.parse(data);
                console.log('✅ JSON數據讀取成功');
            } catch (error) {
                console.log('⚠️ JSON文件不存在或為空，跳過遷移');
                return { success: true, message: '沒有需要遷移的數據' };
            }
            
            if (!jsonData.records || !Array.isArray(jsonData.records)) {
                console.log('⚠️ JSON數據格式不正確，跳過遷移');
                return { success: true, message: '沒有有效的記錄數據' };
            }
            
            const records = jsonData.records;
            console.log(`📊 發現 ${records.length} 筆記錄需要遷移`);
            
            // 檢查數據完整性
            const validRecords = [];
            const invalidRecords = [];
            
            for (const record of records) {
                if (this.validateRecord(record)) {
                    validRecords.push(record);
                } else {
                    invalidRecords.push(record);
                }
            }
            
            console.log(`✅ 有效記錄: ${validRecords.length} 筆`);
            if (invalidRecords.length > 0) {
                console.log(`⚠️ 無效記錄: ${invalidRecords.length} 筆`);
                console.log('無效記錄詳情:', invalidRecords);
            }
            
            // 清空現有數據庫記錄
            await this.dbManager.clearAllRecords();
            
            // 批量插入有效記錄
            if (validRecords.length > 0) {
                const result = this.dbManager.insertRecords(validRecords);
                if (result.success) {
                    console.log(`✅ 成功遷移 ${result.count} 筆記錄到SQLite`);
                } else {
                    throw new Error('數據插入失敗: ' + result.error);
                }
            }
            
            // 檢查遷移後的數據完整性
            const integrityCheck = this.dbManager.checkDataIntegrity();
            if (!integrityCheck.valid) {
                console.warn('⚠️ 遷移後數據完整性檢查發現問題:', integrityCheck.issues);
            }
            
            // 獲取統計數據
            const stats = this.dbManager.getStatistics();
            console.log('📊 遷移後統計數據:');
            console.log(`- 總記錄數: ${stats.total}`);
            console.log(`- 總收入: $${stats.totalIncome.toLocaleString()}`);
            console.log(`- 總支出: $${stats.totalExpense.toLocaleString()}`);
            console.log(`- 餘額: $${stats.balance.toLocaleString()}`);
            
            return {
                success: true,
                message: `成功遷移 ${validRecords.length} 筆記錄`,
                stats: stats,
                invalidRecords: invalidRecords.length
            };
            
        } catch (error) {
            console.error('❌ 數據遷移失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    validateRecord(record) {
        // 檢查必要字段
        const requiredFields = ['id', 'member', 'type', 'amount', 'mainCategory', 'date'];
        for (const field of requiredFields) {
            if (!record[field]) {
                console.warn(`⚠️ 記錄缺少必要字段 ${field}:`, record);
                return false;
            }
        }
        
        // 檢查類型
        if (!['income', 'expense'].includes(record.type)) {
            console.warn(`⚠️ 記錄類型無效: ${record.type}`, record);
            return false;
        }
        
        // 檢查金額
        if (typeof record.amount !== 'number' || isNaN(record.amount)) {
            console.warn(`⚠️ 記錄金額無效: ${record.amount}`, record);
            return false;
        }
        
        // 檢查日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
            console.warn(`⚠️ 記錄日期格式無效: ${record.date}`, record);
            return false;
        }
        
        return true;
    }
    
    async exportToJson() {
        try {
            console.log('🔄 開始導出數據到JSON...');
            
            const records = this.dbManager.getAllRecords();
            const data = {
                records: records,
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    version: "1.0",
                    description: "家庭收支記錄資料 (SQLite導出)",
                    recordCount: records.length,
                    source: "sqlite"
                }
            };
            
            await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ 成功導出 ${records.length} 筆記錄到JSON`);
            
            return {
                success: true,
                message: `成功導出 ${records.length} 筆記錄`,
                count: records.length
            };
            
        } catch (error) {
            console.error('❌ 數據導出失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async backupDatabase() {
        try {
            console.log('🔄 開始備份數據庫...');
            
            const backupDir = path.join(process.cwd(), 'data', 'backups');
            if (!require('fs').existsSync(backupDir)) {
                require('fs').mkdirSync(backupDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupDir, `family_cost_${timestamp}.db`);
            
            // 複製數據庫文件
            await fs.copyFile(this.dbManager.dbPath, backupFile);
            
            console.log(`✅ 數據庫備份成功: ${backupFile}`);
            
            return {
                success: true,
                message: '數據庫備份成功',
                backupFile: backupFile
            };
            
        } catch (error) {
            console.error('❌ 數據庫備份失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 如果直接運行此腳本，執行遷移
if (require.main === module) {
    const migrator = new DataMigrator();
    
    migrator.migrateFromJson()
        .then(result => {
            if (result.success) {
                console.log('✅ 數據遷移完成:', result.message);
                if (result.stats) {
                    console.log('📊 統計數據:', result.stats);
                }
            } else {
                console.error('❌ 數據遷移失敗:', result.error);
            }
        })
        .catch(error => {
            console.error('❌ 遷移過程發生錯誤:', error);
        })
        .finally(() => {
            migrator.dbManager.close();
        });
}

module.exports = DataMigrator;
