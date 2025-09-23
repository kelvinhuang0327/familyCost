#!/usr/bin/env node

// 家庭收支管理平台 - 服務器入口文件
// 重定向到實際的服務器文件

const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 啟動家庭收支服務...');
console.log('📁 當前目錄:', process.cwd());
console.log('📁 重定向到:', path.join(__dirname, 'backend/server.js'));

// 啟動實際的服務器
const serverPath = path.join(__dirname, 'backend/server.js');
const child = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: process.env
});

child.on('error', (error) => {
    console.error('❌ 服務器啟動失敗:', error);
    process.exit(1);
});

child.on('exit', (code) => {
    console.log(`🛑 服務器退出，代碼: ${code}`);
    process.exit(code);
});

// 優雅關閉
process.on('SIGINT', () => {
    console.log('\n🛑 正在關閉服務...');
    child.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 正在關閉服務...');
    child.kill('SIGTERM');
});
