#!/usr/bin/env node

// 測試 GitHub 數據管理器
const GitHubDataManager = require('./app/backend/github_data_manager');

async function testGitHubDataManager() {
    console.log('🧪 開始測試 GitHub 數據管理器...');
    
    const githubDataManager = new GitHubDataManager();
    
    try {
        // 測試獲取數據
        console.log('📥 測試獲取數據...');
        const records = await githubDataManager.getDataFromGitHub();
        console.log(`✅ 成功獲取 ${records.length} 筆記錄`);
        
        if (records.length > 0) {
            console.log('📋 前3筆記錄:');
            records.slice(0, 3).forEach((record, index) => {
                console.log(`  ${index + 1}. ${record.member} - ${record.description} - $${record.amount}`);
            });
        }
        
        // 測試保存數據（添加一個測試記錄）
        console.log('\n💾 測試保存數據...');
        const testRecord = {
            id: 'test_' + Date.now(),
            member: 'Test',
            type: 'expense',
            amount: 100,
            mainCategory: '測試',
            subCategory: '現金',
            description: 'GitHub數據管理器測試',
            date: new Date().toISOString().split('T')[0]
        };
        
        const newRecords = [...records, testRecord];
        const saveResult = await githubDataManager.saveDataToGitHub(newRecords);
        console.log('✅ 成功保存數據:', saveResult);
        
        // 再次獲取數據驗證
        console.log('\n🔄 驗證數據保存...');
        const updatedRecords = await githubDataManager.getDataFromGitHub();
        console.log(`✅ 驗證成功，現在有 ${updatedRecords.length} 筆記錄`);
        
        // 移除測試記錄
        console.log('\n🗑️ 清理測試記錄...');
        const cleanedRecords = updatedRecords.filter(r => r.id !== testRecord.id);
        await githubDataManager.saveDataToGitHub(cleanedRecords);
        console.log('✅ 測試記錄已清理');
        
        console.log('\n🎉 GitHub 數據管理器測試完成！');
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
        console.error('詳細錯誤:', error);
    }
}

// 運行測試
testGitHubDataManager();
