// SQLite 數據庫管理器
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        // 確保數據目錄存在
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // 數據庫文件路徑
        this.dbPath = path.join(dataDir, 'family_cost.db');
        
        // 初始化數據庫
        this.init();
    }
    
    init() {
        try {
            // 創建數據庫連接
            this.db = new Database(this.dbPath);
            
            // 啟用外鍵約束
            this.db.pragma('foreign_keys = ON');
            
            // 創建表結構
            this.createTables();
            
            console.log('✅ SQLite數據庫初始化成功:', this.dbPath);
        } catch (error) {
            console.error('❌ SQLite數據庫初始化失敗:', error);
            throw error;
        }
    }
    
    createTables() {
        // 創建記錄表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS records (
                id TEXT PRIMARY KEY,
                member TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                amount REAL NOT NULL,
                mainCategory TEXT NOT NULL,
                subCategory TEXT,
                description TEXT,
                date TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 創建索引以提高查詢性能
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_records_member ON records(member);
            CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);
            CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
            CREATE INDEX IF NOT EXISTS idx_records_category ON records(mainCategory);
        `);
        
        console.log('✅ 數據庫表結構創建完成');
    }
    
    // 插入記錄
    insertRecord(record) {
        const stmt = this.db.prepare(`
            INSERT INTO records (id, member, type, amount, mainCategory, subCategory, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        try {
            const result = stmt.run(
                record.id,
                record.member,
                record.type,
                record.amount,
                record.mainCategory,
                record.subCategory || null,
                record.description || null,
                record.date
            );
            
            console.log('✅ 記錄插入成功:', record.id);
            return { success: true, id: record.id };
        } catch (error) {
            console.error('❌ 記錄插入失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 批量插入記錄
    insertRecords(records) {
        const stmt = this.db.prepare(`
            INSERT INTO records (id, member, type, amount, mainCategory, subCategory, description, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const insertMany = this.db.transaction((records) => {
            for (const record of records) {
                stmt.run(
                    record.id,
                    record.member,
                    record.type,
                    record.amount,
                    record.mainCategory,
                    record.subCategory || null,
                    record.description || null,
                    record.date
                );
            }
        });
        
        try {
            insertMany(records);
            console.log(`✅ 批量插入 ${records.length} 筆記錄成功`);
            return { success: true, count: records.length };
        } catch (error) {
            console.error('❌ 批量插入失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 獲取所有記錄
    getAllRecords() {
        try {
            const stmt = this.db.prepare('SELECT * FROM records ORDER BY date DESC, created_at DESC');
            const records = stmt.all();
            
            console.log(`✅ 獲取 ${records.length} 筆記錄`);
            return records;
        } catch (error) {
            console.error('❌ 獲取記錄失敗:', error);
            return [];
        }
    }
    
    // 根據ID獲取記錄
    getRecordById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM records WHERE id = ?');
            const record = stmt.get(id);
            return record;
        } catch (error) {
            console.error('❌ 獲取記錄失敗:', error);
            return null;
        }
    }
    
    // 更新記錄
    updateRecord(id, updates) {
        const fields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updates)) {
            if (key !== 'id' && key !== 'created_at') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }
        
        if (fields.length === 0) {
            return { success: false, error: '沒有可更新的字段' };
        }
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        const stmt = this.db.prepare(`
            UPDATE records 
            SET ${fields.join(', ')} 
            WHERE id = ?
        `);
        
        try {
            const result = stmt.run(...values);
            if (result.changes > 0) {
                console.log('✅ 記錄更新成功:', id);
                return { success: true, changes: result.changes };
            } else {
                return { success: false, error: '記錄不存在' };
            }
        } catch (error) {
            console.error('❌ 記錄更新失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 刪除記錄
    deleteRecord(id) {
        const stmt = this.db.prepare('DELETE FROM records WHERE id = ?');
        
        try {
            const result = stmt.run(id);
            if (result.changes > 0) {
                console.log('✅ 記錄刪除成功:', id);
                return { success: true, changes: result.changes };
            } else {
                return { success: false, error: '記錄不存在' };
            }
        } catch (error) {
            console.error('❌ 記錄刪除失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 批量刪除記錄
    deleteRecords(ids) {
        const stmt = this.db.prepare('DELETE FROM records WHERE id = ?');
        
        const deleteMany = this.db.transaction((ids) => {
            for (const id of ids) {
                stmt.run(id);
            }
        });
        
        try {
            deleteMany(ids);
            console.log(`✅ 批量刪除 ${ids.length} 筆記錄成功`);
            return { success: true, count: ids.length };
        } catch (error) {
            console.error('❌ 批量刪除失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 清空所有記錄
    clearAllRecords() {
        try {
            const stmt = this.db.prepare('DELETE FROM records');
            const result = stmt.run();
            
            console.log(`✅ 清空所有記錄成功，刪除了 ${result.changes} 筆記錄`);
            return { success: true, changes: result.changes };
        } catch (error) {
            console.error('❌ 清空記錄失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 獲取統計數據
    getStatistics() {
        try {
            // 總記錄數
            const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM records');
            const total = totalStmt.get().count;
            
            // 總收入
            const incomeStmt = this.db.prepare(`
                SELECT COALESCE(SUM(amount), 0) as total 
                FROM records 
                WHERE type = 'income'
            `);
            const totalIncome = incomeStmt.get().total;
            
            // 總支出
            const expenseStmt = this.db.prepare(`
                SELECT COALESCE(SUM(amount), 0) as total 
                FROM records 
                WHERE type = 'expense'
            `);
            const totalExpense = expenseStmt.get().total;
            
            // 按成員統計
            const memberStmt = this.db.prepare(`
                SELECT 
                    member,
                    type,
                    COUNT(*) as count,
                    COALESCE(SUM(amount), 0) as total
                FROM records 
                GROUP BY member, type
                ORDER BY member, type
            `);
            const memberStats = memberStmt.all();
            
            // 按類別統計
            const categoryStmt = this.db.prepare(`
                SELECT 
                    mainCategory,
                    type,
                    COUNT(*) as count,
                    COALESCE(SUM(amount), 0) as total
                FROM records 
                GROUP BY mainCategory, type
                ORDER BY mainCategory, type
            `);
            const categoryStats = categoryStmt.all();
            
            return {
                total,
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
                memberStats,
                categoryStats
            };
        } catch (error) {
            console.error('❌ 獲取統計數據失敗:', error);
            return {
                total: 0,
                totalIncome: 0,
                totalExpense: 0,
                balance: 0,
                memberStats: [],
                categoryStats: []
            };
        }
    }
    
    // 檢查數據完整性
    checkDataIntegrity() {
        try {
            const issues = [];
            
            // 檢查重複ID
            const duplicateStmt = this.db.prepare(`
                SELECT id, COUNT(*) as count 
                FROM records 
                GROUP BY id 
                HAVING COUNT(*) > 1
            `);
            const duplicates = duplicateStmt.all();
            if (duplicates.length > 0) {
                issues.push(`發現 ${duplicates.length} 個重複ID`);
            }
            
            // 檢查無效金額
            const invalidAmountStmt = this.db.prepare(`
                SELECT COUNT(*) as count 
                FROM records 
                WHERE amount IS NULL OR amount = 0
            `);
            const invalidAmounts = invalidAmountStmt.get().count;
            if (invalidAmounts > 0) {
                issues.push(`發現 ${invalidAmounts} 筆無效金額記錄`);
            }
            
            // 檢查無效日期
            const invalidDateStmt = this.db.prepare(`
                SELECT COUNT(*) as count 
                FROM records 
                WHERE date IS NULL OR date = ''
            `);
            const invalidDates = invalidDateStmt.get().count;
            if (invalidDates > 0) {
                issues.push(`發現 ${invalidDates} 筆無效日期記錄`);
            }
            
            return {
                valid: issues.length === 0,
                issues: issues
            };
        } catch (error) {
            console.error('❌ 數據完整性檢查失敗:', error);
            return {
                valid: false,
                issues: ['數據完整性檢查失敗: ' + error.message]
            };
        }
    }
    
    // 關閉數據庫連接
    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ 數據庫連接已關閉');
        }
    }
}

module.exports = DatabaseManager;
