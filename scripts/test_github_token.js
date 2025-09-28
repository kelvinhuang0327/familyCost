#!/usr/bin/env node

const GitHubDataManager = require('../app/backend/github_data_manager');
const GitHubTokenManager = require('../app/backend/github_token_manager');

async function testGitHubToken() {
    console.log('🧪 GitHub Token 測試工具');
    console.log('==============================');
    
    try {
        const tokenManager = new GitHubTokenManager();
        const githubDataManager = new GitHubDataManager(tokenManager);
        
        // 檢查 Token
        console.log('🔍 檢查 Token 狀態...');
        const token = await githubDataManager.getValidToken();
        
        if (!token) {
            console.log('❌ 未找到 GitHub Token');
            console.log('');
            console.log('📋 設置步驟：');
            console.log('1. 設置環境變數：export GITHUB_TOKEN="your_token_here"');
            console.log('2. 或者在 Render 控制台設置 GITHUB_TOKEN 環境變數');
            console.log('3. GitHub Token 獲取地址：https://github.com/settings/tokens/new');
            return;
        }
        
        console.log('✅ 找到 GitHub Token');
        console.log('🔑 Token 前幾位:', token.substring(0, 10) + '...');
        
        // 測試 GitHub API 連接
        console.log('');
        console.log('🌐 測試 GitHub API 連接...');
        const data = await githubDataManager.getDataFromGitHub();
        console.log('✅ GitHub API 連接成功');
        console.log('📊 當前 GitHub 資料筆數:', data.length);
        
        // 顯示最新幾筆資料
        if (data.length > 0) {
            console.log('');
            console.log('📝 最新 3 筆資料：');
            data.slice(-3).forEach((record, index) => {
                console.log(`${index + 1}. ${record.date || 'N/A'} - ${record.description || 'N/A'} - ${record.amount || 'N/A'}`);
            });
        }
        
        console.log('');
        console.log('🎉 Token 測試完成，一切正常！');
        
    } catch (error) {
        console.error('❌ Token 測試失敗:', error.message);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.log('');
            console.log('🔧 可能的解決方案：');
            console.log('1. Token 可能已過期，請重新生成');
            console.log('2. Token 權限不足，請確保有 repo 或 contents 權限');
            console.log('3. 檢查 Token 格式是否正確（應以 ghp_ 開頭）');
        } else if (error.message.includes('404')) {
            console.log('');
            console.log('🔧 可能的解決方案：');
            console.log('1. 倉庫不存在或無權限訪問');
            console.log('2. 檔案路徑不正確');
        }
    }
}

testGitHubToken();
