#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const GitHubDataManager = require('../app/backend/github_data_manager');
const GitHubTokenManager = require('../app/backend/github_token_manager');

async function diagnoseSync() {
    console.log('🔍 同步問題診斷工具');
    console.log('==============================');
    
    try {
        // 1. 檢查本地資料
        console.log('📊 1. 檢查本地資料...');
        const dataPath = path.join(__dirname, '../data/data.json');
        const localData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const localRecords = Array.isArray(localData) ? localData : localData.records;
        console.log(`✅ 本地資料筆數: ${localRecords.length}`);
        
        if (localRecords.length > 0) {
            const latest = localRecords[localRecords.length - 1];
            console.log(`📅 最新資料: ${latest.date} - ${latest.description}`);
        }
        
        // 2. 檢查 Token 狀態
        console.log('\n🔑 2. 檢查 Token 狀態...');
        const tokenManager = new GitHubTokenManager();
        const githubDataManager = new GitHubDataManager(tokenManager);
        const token = await githubDataManager.getValidToken();
        
        if (token) {
            console.log('✅ Token 已設置');
            console.log(`🔑 Token 前幾位: ${token.substring(0, 10)}...`);
            
            // 3. 檢查 GitHub 資料
            console.log('\n🌐 3. 檢查 GitHub 資料...');
            try {
                const githubData = await githubDataManager.getDataFromGitHub();
                console.log(`📊 GitHub 資料筆數: ${githubData.length}`);
                
                if (githubData.length > 0) {
                    const latest = githubData[githubData.length - 1];
                    console.log(`📅 GitHub 最新資料: ${latest.date} - ${latest.description}`);
                }
                
                // 4. 比較差異
                console.log('\n📈 4. 資料比較...');
                if (localRecords.length !== githubData.length) {
                    console.log(`⚠️ 資料筆數不一致: 本地 ${localRecords.length} vs GitHub ${githubData.length}`);
                    console.log(`📊 差異: ${localRecords.length - githubData.length} 筆`);
                    
                    if (localRecords.length > githubData.length) {
                        console.log('💡 本地資料較新，需要同步到 GitHub');
                    } else {
                        console.log('💡 GitHub 資料較新，需要從 GitHub 同步');
                    }
                } else {
                    console.log('✅ 本地和 GitHub 資料筆數一致');
                }
                
            } catch (error) {
                console.log(`❌ GitHub 資料獲取失敗: ${error.message}`);
            }
            
        } else {
            console.log('❌ Token 未設置');
            console.log('\n🔧 解決方案:');
            console.log('1. 在 Render 控制台設置 GITHUB_TOKEN 環境變數');
            console.log('2. 或者在本地設置: export GITHUB_TOKEN="your_token_here"');
            console.log('3. GitHub Token 獲取地址: https://github.com/settings/tokens/new');
        }
        
        // 5. 檢查環境變數
        console.log('\n🌍 5. 檢查環境變數...');
        const envToken = process.env.GITHUB_TOKEN;
        if (envToken) {
            console.log('✅ 環境變數 GITHUB_TOKEN 已設置');
        } else {
            console.log('❌ 環境變數 GITHUB_TOKEN 未設置');
        }
        
        console.log('\n🎯 診斷完成！');
        
    } catch (error) {
        console.error('❌ 診斷失敗:', error.message);
    }
}

diagnoseSync();
