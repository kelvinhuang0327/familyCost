#!/usr/bin/env node

// 數據清理腳本 - 統一描述格式
const fs = require('fs').promises;
const path = require('path');

async function cleanData() {
    try {
        console.log('🧹 開始清理數據...');
        
        // 讀取原始數據
        const dataPath = path.join(__dirname, '../data/data.json');
        const dataContent = await fs.readFile(dataPath, 'utf8');
        const data = JSON.parse(dataContent);
        
        console.log(`📊 原始記錄數: ${data.records.length}`);
        
        // 備份原始數據
        const backupPath = path.join(__dirname, '../data/data_backup.json');
        await fs.writeFile(backupPath, dataContent, 'utf8');
        console.log('💾 已備份原始數據到 data_backup.json');
        
        let cleanedCount = 0;
        let skippedCount = 0;
        
        // 清理每筆記錄
        for (const record of data.records) {
            if (!record.description) {
                skippedCount++;
                continue;
            }
            
            // 檢查是否需要清理
            const needsCleaning = !record.description.includes('-') && record.mainCategory;
            
            if (needsCleaning) {
                // 將格式從 "描述" 改為 "主類別-描述"
                const oldDescription = record.description;
                record.description = `${record.mainCategory}-${oldDescription}`;
                cleanedCount++;
                
                console.log(`🔄 清理記錄 ${record.id}: "${oldDescription}" → "${record.description}"`);
            } else {
                skippedCount++;
            }
        }
        
        // 保存清理後的數據
        await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
        
        console.log('✅ 數據清理完成！');
        console.log(`📈 統計結果:`);
        console.log(`   - 總記錄數: ${data.records.length}`);
        console.log(`   - 已清理: ${cleanedCount} 筆`);
        console.log(`   - 跳過: ${skippedCount} 筆`);
        console.log(`   - 備份文件: data_backup.json`);
        
    } catch (error) {
        console.error('❌ 數據清理失敗:', error);
        process.exit(1);
    }
}

// 執行清理
cleanData();
