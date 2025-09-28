#!/usr/bin/env node

const readline = require('readline');
const GitHubDataManager = require('../app/backend/github_data_manager');
const GitHubTokenManager = require('../app/backend/github_token_manager');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function setTokenAndTest() {
    console.log('🔧 GitHub Token 設置和測試工具');
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
            
            console.log('🔍 正在測試 Token...');
            
            // 設置環境變數
            process.env.GITHUB_TOKEN = cleanToken;
            
            // 測試 Token
            const githubDataManager = new GitHubDataManager();
            const testToken = await githubDataManager.getValidToken();
            
            if (testToken) {
                console.log('✅ Token 設置成功！');
                console.log(`🔑 Token 前幾位: ${testToken.substring(0, 10)}...`);
                
                // 測試 GitHub API 連接
                console.log('🌐 測試 GitHub API 連接...');
                try {
                    const data = await githubDataManager.getDataFromGitHub();
                    console.log('✅ GitHub API 連接成功');
                    console.log(`📊 當前 GitHub 資料筆數: ${data.length}`);
                    
                    // 測試保存數據
                    console.log('💾 測試保存數據到 GitHub...');
                    const result = await githubDataManager.saveDataToGitHub(data);
                    console.log('✅ 數據保存測試成功');
                    console.log('📝 提交信息:', result.commit.message);
                    
                    console.log('');
                    console.log('🎉 所有測試通過！Token 設置成功！');
                    console.log('');
                    console.log('📋 接下來的步驟：');
                    console.log('1. 在 Render 控制台設置環境變數 GITHUB_TOKEN');
                    console.log('2. 或者運行: export GITHUB_TOKEN="' + cleanToken + '"');
                    console.log('3. 然後就可以使用同步功能了');
                    
                } catch (error) {
                    console.log('❌ GitHub API 測試失敗:', error.message);
                }
                
            } else {
                console.log('❌ Token 設置失敗');
            }
            
        } catch (error) {
            console.error('❌ 設置失敗:', error.message);
        }
        
        rl.close();
    });
}

setTokenAndTest();
