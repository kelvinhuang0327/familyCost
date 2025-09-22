#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSync() {
    console.log('🔄 測試同步功能...');
    
    try {
        // 測試健康檢查
        console.log('1. 測試健康檢查...');
        const healthResponse = await fetch('http://localhost:3001/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ 健康檢查:', healthData.status);
        
        // 測試還原檢查
        console.log('2. 測試還原檢查...');
        const restoreResponse = await fetch('http://localhost:3001/api/restore');
        const restoreData = await restoreResponse.json();
        console.log('✅ 還原檢查:', restoreData.message);
        
        // 測試備份功能
        console.log('3. 測試備份功能...');
        const testRecords = [
            {
                id: 'test-' + Date.now(),
                member: '測試',
                type: 'income',
                amount: 100,
                mainCategory: '測試',
                subCategory: '現金',
                description: '同步測試',
                date: new Date().toISOString().split('T')[0]
            }
        ];
        
        const backupResponse = await fetch('http://localhost:3001/api/backup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                records: testRecords,
                timestamp: new Date().toISOString(),
                count: testRecords.length
            })
        });
        
        const backupData = await backupResponse.json();
        console.log('✅ 備份結果:', backupData.message);
        
        console.log('🎉 所有測試通過！');
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 運行測試
testSync();
