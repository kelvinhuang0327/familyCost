#!/usr/bin/env node
// 版本號碼顯示腳本

const fs = require('fs');
const path = require('path');

function showVersion() {
    try {
        const versionFile = path.join(__dirname, '../data/version.json');
        
        if (fs.existsSync(versionFile)) {
            const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
            console.log('📋 當前版本信息:');
            console.log(`   版本號: ${versionData.version}`);
            console.log(`   建構時間: ${versionData.buildTime}`);
            console.log(`   Commit: ${versionData.commitHash || 'N/A'}`);
            console.log(`   描述: ${versionData.description}`);
        } else {
            console.log('⚠️ 版本檔案不存在');
        }
    } catch (error) {
        console.error('❌ 讀取版本信息失敗:', error.message);
    }
}

// 如果直接運行此腳本
if (require.main === module) {
    showVersion();
}

module.exports = { showVersion };
