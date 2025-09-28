const ConfigManager = require('../app/backend/config_manager');

async function quickSetToken() {
    console.log('🔧 快速設置 GitHub Token');
    console.log('==============================');
    
    // 你的 Token - 請替換為實際的 Token
    const token = 'YOUR_GITHUB_TOKEN_HERE';
    
    try {
        const configManager = new ConfigManager();
        
        console.log('🔍 正在設置 Token...');
        await configManager.updateConfig({ github_token: token });
        console.log('✅ Token 設置成功！');
        
        console.log('\n🔍 檢查 Token 狀態...');
        const tokenStatus = await configManager.checkTokenStatus();
        console.log('Token 狀態:', tokenStatus);
        
    } catch (error) {
        console.error('❌ 設置 Token 失敗:', error.message);
    }
}

// 執行
quickSetToken();
