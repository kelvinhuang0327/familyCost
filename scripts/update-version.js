#!/usr/bin/env node

// 自動更新版本號腳本
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function updateVersion() {
    try {
        // 獲取最新的commit時間
        const commitTime = execSync('git log -1 --format="%ci"', { encoding: 'utf8' }).trim();
        const commitHash = execSync('git log -1 --format="%h"', { encoding: 'utf8' }).trim();
        
        // 轉換時間格式：2025-09-25 17:38:59 +0800 -> 2025-09-25 17:38:59
        const versionTime = commitTime.split(' ').slice(0, 2).join(' ');
        
        // 轉換為ISO格式用於buildTime
        const isoTime = new Date(commitTime).toISOString();
        
        const versionData = {
            version: versionTime,
            buildTime: isoTime,
            commitHash: commitHash,
            description: "家庭收支管理平台版本信息 - 自動更新版本號"
        };
        
        // 寫入版本文件
        const versionPath = path.join(__dirname, '..', 'data', 'version.json');
        fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
        
        console.log(`✅ 版本號已更新: ${versionTime}`);
        console.log(`📝 Commit Hash: ${commitHash}`);
        console.log(`📁 文件路徑: ${versionPath}`);
        
    } catch (error) {
        console.error('❌ 更新版本號失敗:', error.message);
        process.exit(1);
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    updateVersion();
}

module.exports = { updateVersion };
