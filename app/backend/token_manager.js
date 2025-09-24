// GitHub Token 管理模組
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 動態導入 fetch (Node.js 18+ 或 node-fetch)
let fetch;
try {
    fetch = globalThis.fetch;
} catch (error) {
    try {
        fetch = require('node-fetch');
    } catch (fetchError) {
        console.error('❌ 無法載入 fetch API');
        throw fetchError;
    }
}

class TokenManager {
    constructor() {
        // 使用相對於項目根目錄的路徑
        this.tokenFile = path.join(process.cwd(), 'app', 'backend', '.github_token');
        this.keyFile = path.join(process.cwd(), 'app', 'backend', '.github_key');
        this.algorithm = 'aes-256-gcm';
        
        console.log('🔍 TokenManager 初始化:');
        console.log('🔍 工作目錄:', process.cwd());
        console.log('🔍 Token檔案路徑:', this.tokenFile);
        console.log('🔍 密鑰檔案路徑:', this.keyFile);
    }

    // 生成或讀取加密密鑰
    getOrCreateKey() {
        try {
            if (fs.existsSync(this.keyFile)) {
                return fs.readFileSync(this.keyFile);
            } else {
                const key = crypto.randomBytes(32);
                fs.writeFileSync(this.keyFile, key);
                // 設置文件權限為只有用戶可讀寫
                fs.chmodSync(this.keyFile, 0o600);
                return key;
            }
        } catch (error) {
            console.error('❌ 無法處理加密密鑰:', error.message);
            throw error;
        }
    }

    // 加密token
    encryptToken(token) {
        try {
            const key = this.getOrCreateKey();
            const iv = crypto.randomBytes(16);
            
            // 嘗試使用 GCM 模式，如果失敗則使用 CBC 模式
            let cipher, encryptedData;
            
            try {
                // 使用 GCM 模式加密
                cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
                cipher.setAAD(Buffer.from('github-token', 'utf8'));
                
                let encrypted = cipher.update(token, 'utf8', 'hex');
                encrypted += cipher.final('hex');
                
                const authTag = cipher.getAuthTag();
                
                encryptedData = {
                    encrypted: encrypted,
                    iv: iv.toString('hex'),
                    authTag: authTag.toString('hex'),
                    algorithm: 'aes-256-gcm'
                };
            } catch (gcmError) {
                console.log('⚠️ GCM模式不可用，使用CBC模式');
                
                // 使用 CBC 模式加密
                cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
                let encrypted = cipher.update(token, 'utf8', 'hex');
                encrypted += cipher.final('hex');
                
                encryptedData = {
                    encrypted: encrypted,
                    iv: iv.toString('hex'),
                    algorithm: 'aes-256-cbc'
                };
            }
            
            return encryptedData;
        } catch (error) {
            console.error('❌ Token加密失敗:', error.message);
            throw error;
        }
    }

    // 解密token
    decryptToken(encryptedData) {
        try {
            const key = this.getOrCreateKey();
            const iv = Buffer.from(encryptedData.iv, 'hex');
            
            let decrypted;
            
            if (encryptedData.algorithm === 'aes-256-gcm') {
                try {
                    // 使用 GCM 模式解密
                    const authTag = Buffer.from(encryptedData.authTag, 'hex');
                    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
                    decipher.setAAD(Buffer.from('github-token', 'utf8'));
                    decipher.setAuthTag(authTag);
                    
                    decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
                    decrypted += decipher.final('utf8');
                } catch (gcmError) {
                    console.log('⚠️ GCM解密失敗，嘗試CBC模式');
                    throw gcmError;
                }
            } else {
                // 使用 CBC 模式解密
                const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
            }
            
            return decrypted;
        } catch (error) {
            console.error('❌ Token解密失敗:', error.message);
            throw error;
        }
    }

    // 儲存token
    saveToken(token) {
        try {
            console.log('🔍 [saveToken] 開始儲存Token...');
            console.log('🔍 [saveToken] 輸入Token長度:', token ? token.length : 'null');
            console.log('🔍 [saveToken] Token前綴:', token ? token.substring(0, 10) + '...' : 'null');
            
            if (!token || token.trim() === '') {
                console.log('❌ [saveToken] Token為空');
                throw new Error('Token不能為空');
            }

            const cleanToken = token.trim();
            console.log('🔍 [saveToken] 清理後Token長度:', cleanToken.length);
            
            // 驗證token格式 (GitHub Personal Access Token 以 ghp_ 開頭，長度約40+字符)
            if (!cleanToken.startsWith('ghp_') || cleanToken.length < 40) {
                console.log('⚠️ [saveToken] 警告: Token格式可能不正確，GitHub Personal Access Token 應以 ghp_ 開頭');
            }

            console.log('🔍 [saveToken] 開始加密Token...');
            const encryptedData = this.encryptToken(cleanToken);
            console.log('🔍 [saveToken] Token加密完成');
            
            console.log('🔍 [saveToken] 寫入檔案:', this.tokenFile);
            fs.writeFileSync(this.tokenFile, JSON.stringify(encryptedData));
            
            // 設置文件權限為只有用戶可讀寫
            fs.chmodSync(this.tokenFile, 0o600);
            
            console.log('✅ [saveToken] Token已安全儲存');
            return true;
        } catch (error) {
            console.error('❌ [saveToken] Token儲存失敗:', error.message);
            console.error('❌ [saveToken] 錯誤堆疊:', error.stack);
            throw error;
        }
    }

    // 讀取token
    loadToken() {
        try {
            console.log('🔍 [loadToken] 開始讀取Token...');
            console.log('🔍 [loadToken] Token檔案路徑:', this.tokenFile);
            console.log('🔍 [loadToken] 檔案是否存在:', fs.existsSync(this.tokenFile));
            
            if (!fs.existsSync(this.tokenFile)) {
                console.log('❌ [loadToken] Token檔案不存在');
                return null;
            }

            console.log('🔍 [loadToken] 讀取加密數據...');
            const encryptedData = JSON.parse(fs.readFileSync(this.tokenFile, 'utf8'));
            console.log('🔍 [loadToken] 加密數據讀取完成');
            
            console.log('🔍 [loadToken] 開始解密Token...');
            const token = this.decryptToken(encryptedData);
            console.log('🔍 [loadToken] Token解密完成，長度:', token ? token.length : 'null');
            
            console.log('✅ [loadToken] Token已載入');
            return token;
        } catch (error) {
            console.error('❌ [loadToken] Token載入失敗:', error.message);
            console.error('❌ [loadToken] 錯誤堆疊:', error.stack);
            return null;
        }
    }

    // 刪除token
    deleteToken() {
        try {
            if (fs.existsSync(this.tokenFile)) {
                fs.unlinkSync(this.tokenFile);
                console.log('✅ Token已刪除');
            }
            if (fs.existsSync(this.keyFile)) {
                fs.unlinkSync(this.keyFile);
                console.log('✅ 加密密鑰已刪除');
            }
            return true;
        } catch (error) {
            console.error('❌ Token刪除失敗:', error.message);
            throw error;
        }
    }

    // 檢查token是否存在
    hasToken() {
        console.log('🔍 [hasToken] 檢查Token是否存在...');
        console.log('🔍 [hasToken] Token檔案路徑:', this.tokenFile);
        const exists = fs.existsSync(this.tokenFile);
        console.log('🔍 [hasToken] Token檔案存在:', exists);
        return exists;
    }

    // 獲取token信息
    async getTokenInfo() {
        try {
            console.log('🔍 [getTokenInfo] 開始獲取Token信息...');
            const token = this.loadToken();
            if (!token) {
                console.log('❌ [getTokenInfo] Token不存在');
                return {
                    valid: false,
                    user: null,
                    error: 'Token不存在'
                };
            }
            
            console.log('🔍 [getTokenInfo] Token存在，開始驗證...');
            // 驗證token有效性
            const validation = await this.validateToken(token);
            console.log('🔍 [getTokenInfo] Token驗證結果:', validation);
            
            const result = {
                valid: validation.valid,
                user: validation.user || null,
                error: validation.error || null
            };
            console.log('🔍 [getTokenInfo] 返回結果:', result);
            return result;
        } catch (error) {
            console.error('❌ [getTokenInfo] 獲取Token信息失敗:', error.message);
            console.error('❌ [getTokenInfo] 錯誤堆疊:', error.stack);
            return {
                valid: false,
                user: null,
                error: error.message
            };
        }
    }

    // 驗證token有效性 (通過GitHub API)
    async validateToken(token) {
        try {
            // 清理和驗證token格式
            const cleanToken = token.trim();
            
            // 檢查token是否只包含ASCII字符
            if (!/^[\x00-\x7F]+$/.test(cleanToken)) {
                console.log('❌ Token包含非ASCII字符');
                return { valid: false, error: 'Token包含非ASCII字符' };
            }
            
            // 檢查token長度（GitHub Token 長度範圍：20-100 字符）
            if (cleanToken.length < 20 || cleanToken.length > 100) {
                console.log('❌ Token長度不正確，GitHub Token通常為40個字符');
                return { valid: false, error: 'Token長度不正確，GitHub Token通常為40個字符' };
            }
            
            console.log('🔍 開始驗證 Token...');
            console.log('🔍 Token 長度:', cleanToken.length);
            console.log('🔍 Token 前綴:', cleanToken.substring(0, 4));
            
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${cleanToken}`,
                    'User-Agent': 'familyCost-app',
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            console.log('🔍 GitHub API 響應狀態:', response.status);
            console.log('🔍 GitHub API 響應狀態文本:', response.statusText);

            if (response.ok) {
                const userData = await response.json();
                console.log(`✅ Token有效，用戶: ${userData.login}`);
                return { valid: true, user: userData.login };
            } else {
                const errorText = await response.text();
                console.log(`❌ Token無效: ${response.status} ${response.statusText}`);
                console.log(`❌ 錯誤詳情: ${errorText}`);
                return { valid: false, error: `${response.status} ${response.statusText}` };
            }
        } catch (error) {
            console.error('❌ Token驗證失敗:', error.message);
            return { valid: false, error: error.message };
        }
    }

    // 設置Git遠程URL
    setGitRemote(token) {
        try {
            const { execSync } = require('child_process');
            const remoteUrl = `https://${token}@github.com/kelvinhuang0327/familyCost.git`;
            execSync(`git remote set-url origin "${remoteUrl}"`, { stdio: 'pipe' });
            console.log('✅ Git遠程URL已設置');
            return true;
        } catch (error) {
            console.error('❌ Git遠程URL設置失敗:', error.message);
            throw error;
        }
    }
}

module.exports = TokenManager;
