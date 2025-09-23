#!/usr/bin/env node
// 版本更新腳本

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 獲取當前時間
function getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 獲取Git commit hash
function getCommitHash() {
    try {
        const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
        return hash;
    } catch (error) {
        console.log('⚠️ 無法獲取Git commit hash:', error.message);
        return '';
    }
}

// 更新版本信息
function updateVersion() {
    const timestamp = getCurrentTimestamp();
    const commitHash = getCommitHash();
    const buildTime = new Date().toISOString();
    
    const versionInfo = {
        version: timestamp,
        buildTime: buildTime,
        commitHash: commitHash,
        description: "家庭收支管理平台版本信息"
    };
    
    const versionFile = path.join(__dirname, '../data/version.json');
    
    try {
        fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));
        console.log('✅ 版本信息已更新:');
        console.log(`   版本號: ${timestamp}`);
        console.log(`   Commit: ${commitHash || 'N/A'}`);
        console.log(`   時間: ${buildTime}`);
        return timestamp;
    } catch (error) {
        console.error('❌ 更新版本信息失敗:', error.message);
        return null;
    }
}

// 主函數
function main() {
    console.log('🔄 更新版本信息...');
    const newVersion = updateVersion();
    
    if (newVersion) {
        console.log('🎉 版本更新完成！');
        return 0;
    } else {
        console.log('❌ 版本更新失敗！');
        return 1;
    }
}

// 如果直接運行此腳本
if (require.main === module) {
    process.exit(main());
}

module.exports = { updateVersion, getCurrentTimestamp, getCommitHash };
