const fs = require('fs');
const path = require('path');

// 轉換日期格式從 2025-09-21 到 2025/9/21
function convertDateFormat(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return dateString;
    }
    
    // 檢查是否已經是目標格式
    if (dateString.includes('/')) {
        return dateString;
    }
    
    // 轉換 2025-09-21 到 2025/9/21
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parts[0];
        const month = parseInt(parts[1], 10); // 移除前導零
        const day = parseInt(parts[2], 10);   // 移除前導零
        return `${year}/${month}/${day}`;
    }
    
    return dateString;
}

// 轉換數據文件
function convertDataFile() {
    const dataPath = path.join(__dirname, '../data/data.json');
    
    try {
        console.log('🔄 開始轉換日期格式...');
        
        // 讀取數據文件
        const dataContent = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(dataContent);
        
        if (data.records && Array.isArray(data.records)) {
            let convertedCount = 0;
            
            // 轉換每筆記錄的日期格式
            data.records.forEach(record => {
                if (record.date) {
                    const oldDate = record.date;
                    const newDate = convertDateFormat(oldDate);
                    if (oldDate !== newDate) {
                        record.date = newDate;
                        convertedCount++;
                    }
                }
            });
            
            // 寫回文件
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
            
            console.log(`✅ 日期格式轉換完成！`);
            console.log(`📊 轉換了 ${convertedCount} 筆記錄的日期格式`);
            console.log(`📁 數據文件已更新: ${dataPath}`);
            
            // 顯示前幾筆轉換後的記錄
            console.log('📋 轉換後的記錄範例:');
            data.records.slice(0, 3).forEach(record => {
                console.log(`   ${record.member}: ${record.description} - ${record.date}`);
            });
            
        } else {
            console.log('⚠️ 數據文件格式不正確');
        }
        
    } catch (error) {
        console.error('❌ 轉換日期格式失敗:', error.message);
    }
}

// 執行轉換
convertDataFile();
