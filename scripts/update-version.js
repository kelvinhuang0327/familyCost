#!/usr/bin/env node

// 自動更新版本號腳本
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function updateVersion() {
    try {
        // 使用當前時間而不是commit時間
        const now = new Date();
        const commitHash = execSync('git log -1 --format="%h"', { encoding: 'utf8' }).trim();
        
        // 格式化當前時間：YYYY-MM-DD HH:MM:SS
        const versionTime = now.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '-');
        
        // 轉換為ISO格式用於buildTime
        const isoTime = now.toISOString();
        
        const versionData = {
            version: versionTime,
            buildTime: isoTime,
            commitHash: commitHash,
            description: "家庭收支管理平台版本信息 - 使用當前時間自動更新版本號"
        };
        
        // 寫入版本文件
        const versionPath = path.join(__dirname, '..', 'data', 'version.json');
        fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
        
        console.log(`✅ 版本號已更新: ${versionTime}`);
        console.log(`🕐 使用當前時間: ${now.toLocaleString('zh-TW')}`);
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
