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
        this.tokenFile = path.join(__dirname, '.github_token');
        this.keyFile = path.join(__dirname, '.github_key');
        this.algorithm = 'aes-256-gcm';
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
            
            // 使用 GCM 模式加密
            const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv);
            cipher.setAAD(Buffer.from('github-token', 'utf8'));
            
            let encrypted = cipher.update(token, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            const encryptedData = {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: 'aes-256-gcm'
            };
            
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
            const authTag = Buffer.from(encryptedData.authTag, 'hex');
            
            // 使用 GCM 模式解密
            const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv);
            decipher.setAAD(Buffer.from('github-token', 'utf8'));
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('❌ Token解密失敗:', error.message);
            throw error;
        }
    }

    // 儲存token
    saveToken(token) {
        try {
            if (!token || token.trim() === '') {
                throw new Error('Token不能為空');
            }

            // 驗證token格式 (GitHub token通常是40個字符的十六進制字符串)
            if (!/^[a-f0-9]{40}$/i.test(token.trim())) {
                console.log('⚠️ 警告: Token格式可能不正確');
            }

            const encryptedData = this.encryptToken(token.trim());
            fs.writeFileSync(this.tokenFile, JSON.stringify(encryptedData));
            
            // 設置文件權限為只有用戶可讀寫
            fs.chmodSync(this.tokenFile, 0o600);
            
            console.log('✅ Token已安全儲存');
            return true;
        } catch (error) {
            console.error('❌ Token儲存失敗:', error.message);
            throw error;
        }
    }

    // 讀取token
    loadToken() {
        try {
            if (!fs.existsSync(this.tokenFile)) {
                return null;
            }

            const encryptedData = JSON.parse(fs.readFileSync(this.tokenFile, 'utf8'));
            const token = this.decryptToken(encryptedData);
            
            console.log('✅ Token已載入');
            return token;
        } catch (error) {
            console.error('❌ Token載入失敗:', error.message);
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
        return fs.existsSync(this.tokenFile);
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
