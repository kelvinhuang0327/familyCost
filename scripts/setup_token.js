#!/usr/bin/env node

const readline = require('readline');
const GitHubTokenManager = require('../app/backend/github_token_manager');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setupToken() {
    console.log('🔧 GitHub Token 設置工具');
    console.log('==============================');
    console.log('');
    console.log('📋 請按照以下步驟獲取 GitHub Token：');
    console.log('1. 前往：https://github.com/settings/tokens/new');
    console.log('2. 選擇權限：repo (完整倉庫訪問權限)');
    console.log('3. 複製生成的 Token（以 ghp_ 開頭）');
    console.log('');
    
    rl.question('請輸入你的 GitHub Token: ', async (token) => {
        try {
            if (!token || !token.trim()) {
                console.log('❌ Token 不能為空');
                rl.close();
                return;
            }
            
            const cleanToken = token.trim();
            
            // 驗證 Token 格式
            if (!cleanToken.startsWith('ghp_') || cleanToken.length < 40) {
                console.log('❌ Token 格式不正確，GitHub Personal Access Token 應以 ghp_ 開頭');
                rl.close();
                return;
            }
            
            console.log('🔍 正在設置 Token...');
            
            const tokenManager = new GitHubTokenManager();
            await tokenManager.saveToken(cleanToken);
            
            console.log('✅ Token 設置成功！');
            console.log('');
            console.log('🧪 測試 Token...');
            
            // 測試 Token
            const loadedToken = await tokenManager.loadToken();
            if (loadedToken) {
                console.log('✅ Token 測試成功！');
                console.log(`🔑 Token 前幾位: ${loadedToken.substring(0, 10)}...`);
                console.log('');
                console.log('🎉 設置完成！現在你可以使用同步功能了。');
            } else {
                console.log('❌ Token 測試失敗');
            }
            
        } catch (error) {
            console.error('❌ 設置失敗:', error.message);
        }
        
        rl.close();
    });
}

setupToken();
