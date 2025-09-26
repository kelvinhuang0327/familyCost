// GitHub Token 管理模組 - 支持存儲在 GitHub 上
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

class GitHubTokenManager {
    constructor() {
        // 使用相對於項目根目錄的路徑，並確保目錄存在
        const backendDir = path.join(process.cwd(), 'app', 'backend');
        
        // 確保後端目錄存在
        if (!fs.existsSync(backendDir)) {
            fs.mkdirSync(backendDir, { recursive: true });
        }
        
        this.tokenFile = path.join(backendDir, '.github_token');
        this.keyFile = path.join(backendDir, '.github_key');
        this.backupTokenFile = path.join(backendDir, '.github_token_backup');
        this.algorithm = 'aes-256-gcm';
        
        // GitHub 配置
        this.owner = 'kelvinhuang0327';
        this.repo = 'familyCost';
        this.branch = 'main';
        this.tokenPath = 'app/backend/.github_token_encrypted';
        
        console.log('🔍 GitHubTokenManager 初始化:');
        console.log('🔍 工作目錄:', process.cwd());
        console.log('🔍 後端目錄:', backendDir);
        console.log('🔍 Token檔案路徑:', this.tokenFile);
        console.log('🔍 密鑰檔案路徑:', this.keyFile);
        console.log('🔍 備份檔案路徑:', this.backupTokenFile);
        console.log('🔍 GitHub Token路徑:', this.tokenPath);
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

    // 從 GitHub 獲取加密的 Token
    async getTokenFromGitHub() {
        try {
            console.log('🔍 [GitHub] 開始從 GitHub 獲取加密 Token...');
            
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.tokenPath}?ref=${this.branch}`;
            
            const response = await this.makeGitHubRequest(url);
            
            if (response.content) {
                // 解碼 base64 內容
                const content = Buffer.from(response.content, 'base64').toString('utf8');
                const encryptedData = JSON.parse(content);
                
                console.log('✅ [GitHub] 成功從 GitHub 獲取加密 Token');
                
                // 解密 Token
                const token = this.decryptToken(encryptedData);
                return token;
            } else {
                console.log('⚠️ [GitHub] 未找到加密 Token 文件');
                return null;
            }
        } catch (error) {
            console.error('❌ [GitHub] 從 GitHub 獲取 Token 失敗:', error.message);
            return null;
        }
    }

    // 保存加密的 Token 到 GitHub
    async saveTokenToGitHub(token) {
        try {
            console.log('💾 [GitHub] 開始保存加密 Token 到 GitHub...');
            
            // 先獲取當前文件的 SHA
            const currentFile = await this.getCurrentTokenFileInfo();
            
            // 加密 Token
            const encryptedData = this.encryptToken(token);
            const content = JSON.stringify(encryptedData, null, 2);
            const encodedContent = Buffer.from(content).toString('base64');
            
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.tokenPath}`;
            
            const payload = {
                message: `更新 GitHub Token - ${new Date().toLocaleString('zh-TW')}`,
                content: encodedContent,
                branch: this.branch
            };
            
            if (currentFile && currentFile.sha) {
                payload.sha = currentFile.sha;
            }
            
            const response = await this.makeGitHubRequest(url, 'PUT', payload);
            
            console.log('✅ [GitHub] 成功保存加密 Token 到 GitHub');
            return { success: true, commit: response.commit };
            
        } catch (error) {
            console.error('❌ [GitHub] 保存 Token 到 GitHub 失敗:', error.message);
            throw error;
        }
    }

    // 獲取當前 Token 文件信息
    async getCurrentTokenFileInfo() {
        try {
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.tokenPath}?ref=${this.branch}`;
            return await this.makeGitHubRequest(url);
        } catch (error) {
            console.log('⚠️ [GitHub] 獲取 Token 文件信息失敗，可能是新文件');
            return null;
        }
    }

    // 發送 GitHub API 請求
    async makeGitHubRequest(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                method: method,
                headers: {
                    'User-Agent': 'familyCost-app',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };

            if (data) {
                options.headers['Content-Type'] = 'application/json';
            }

            const req = https.request(url, options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            const parsed = JSON.parse(responseData);
                            resolve(parsed);
                        } else {
                            reject(new Error(`GitHub API 錯誤: ${res.statusCode} - ${responseData}`));
                        }
                    } catch (error) {
                        reject(new Error(`解析響應失敗: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // 儲存token (優先保存到 GitHub，然後本地備份)
    async saveToken(token) {
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

            // 先保存到 GitHub
            try {
                await this.saveTokenToGitHub(cleanToken);
                console.log('✅ [saveToken] Token已保存到 GitHub');
            } catch (githubError) {
                console.log('⚠️ [saveToken] GitHub保存失敗，繼續本地保存:', githubError.message);
            }

            // 本地備份
            console.log('🔍 [saveToken] 開始本地備份...');
            const encryptedData = this.encryptToken(cleanToken);
            console.log('🔍 [saveToken] Token加密完成');
            
            console.log('🔍 [saveToken] 寫入本地檔案:', this.tokenFile);
            fs.writeFileSync(this.tokenFile, JSON.stringify(encryptedData));
            
            // 創建備份檔案
            console.log('🔍 [saveToken] 創建備份檔案:', this.backupTokenFile);
            fs.writeFileSync(this.backupTokenFile, JSON.stringify(encryptedData));
            
            // 設置文件權限為只有用戶可讀寫
            fs.chmodSync(this.tokenFile, 0o600);
            fs.chmodSync(this.backupTokenFile, 0o600);
            
            console.log('✅ [saveToken] Token已安全儲存並備份');
            return true;
        } catch (error) {
            console.error('❌ [saveToken] Token儲存失敗:', error.message);
            console.error('❌ [saveToken] 錯誤堆疊:', error.stack);
            throw error;
        }
    }

    // 讀取token (優先從 GitHub 獲取，然後本地備份)
    async loadToken() {
        try {
            console.log('🔍 [loadToken] 開始讀取Token...');
            
            // 先嘗試從 GitHub 獲取
            try {
                const githubToken = await this.getTokenFromGitHub();
                if (githubToken) {
                    console.log('✅ [loadToken] 成功從 GitHub 獲取 Token');
                    return githubToken;
                }
            } catch (githubError) {
                console.log('⚠️ [loadToken] GitHub獲取失敗，嘗試本地文件:', githubError.message);
            }
            
            // 回退到本地文件
            console.log('🔍 [loadToken] Token檔案路徑:', this.tokenFile);
            console.log('🔍 [loadToken] 備份檔案路徑:', this.backupTokenFile);
            console.log('🔍 [loadToken] 主檔案是否存在:', fs.existsSync(this.tokenFile));
            console.log('🔍 [loadToken] 備份檔案是否存在:', fs.existsSync(this.backupTokenFile));
            
            let tokenFileToUse = null;
            let encryptedData = null;
            
            // 優先使用主檔案
            if (fs.existsSync(this.tokenFile)) {
                console.log('🔍 [loadToken] 使用主檔案讀取Token...');
                tokenFileToUse = this.tokenFile;
                encryptedData = JSON.parse(fs.readFileSync(this.tokenFile, 'utf8'));
            } else if (fs.existsSync(this.backupTokenFile)) {
                console.log('⚠️ [loadToken] 主檔案不存在，嘗試從備份檔案恢復...');
                tokenFileToUse = this.backupTokenFile;
                encryptedData = JSON.parse(fs.readFileSync(this.backupTokenFile, 'utf8'));
                
                // 嘗試恢復主檔案
                try {
                    fs.writeFileSync(this.tokenFile, JSON.stringify(encryptedData));
                    fs.chmodSync(this.tokenFile, 0o600);
                    console.log('✅ [loadToken] 已從備份檔案恢復主檔案');
                } catch (restoreError) {
                    console.log('⚠️ [loadToken] 恢復主檔案失敗，但繼續使用備份檔案');
                }
            } else {
                console.log('❌ [loadToken] Token檔案和備份檔案都不存在');
                return null;
            }

            console.log('🔍 [loadToken] 加密數據讀取完成，來源:', tokenFileToUse);
            
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
    async deleteToken() {
        try {
            let deletedCount = 0;
            
            // 嘗試從 GitHub 刪除
            try {
                const currentFile = await this.getCurrentTokenFileInfo();
                if (currentFile && currentFile.sha) {
                    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.tokenPath}`;
                    const payload = {
                        message: `刪除 GitHub Token - ${new Date().toLocaleString('zh-TW')}`,
                        sha: currentFile.sha,
                        branch: this.branch
                    };
                    
                    await this.makeGitHubRequest(url, 'DELETE', payload);
                    console.log('✅ GitHub Token 已刪除');
                }
            } catch (githubError) {
                console.log('⚠️ GitHub Token 刪除失敗:', githubError.message);
            }
            
            // 刪除本地文件
            if (fs.existsSync(this.tokenFile)) {
                fs.unlinkSync(this.tokenFile);
                console.log('✅ 主Token檔案已刪除');
                deletedCount++;
            }
            
            if (fs.existsSync(this.backupTokenFile)) {
                fs.unlinkSync(this.backupTokenFile);
                console.log('✅ 備份Token檔案已刪除');
                deletedCount++;
            }
            
            if (fs.existsSync(this.keyFile)) {
                fs.unlinkSync(this.keyFile);
                console.log('✅ 加密密鑰已刪除');
                deletedCount++;
            }
            
            if (deletedCount > 0) {
                console.log(`✅ 共刪除了 ${deletedCount} 個Token相關檔案`);
            } else {
                console.log('ℹ️ 沒有找到Token相關檔案需要刪除');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Token刪除失敗:', error.message);
            throw error;
        }
    }

    // 檢查token是否存在
    async hasToken() {
        console.log('🔍 [hasToken] 檢查Token是否存在...');
        
        // 先檢查 GitHub
        try {
            const githubToken = await this.getTokenFromGitHub();
            if (githubToken) {
                console.log('✅ [hasToken] GitHub Token 存在');
                return true;
            }
        } catch (error) {
            console.log('⚠️ [hasToken] GitHub Token 檢查失敗:', error.message);
        }
        
        // 檢查本地文件
        console.log('🔍 [hasToken] Token檔案路徑:', this.tokenFile);
        console.log('🔍 [hasToken] 備份檔案路徑:', this.backupTokenFile);
        
        const mainExists = fs.existsSync(this.tokenFile);
        const backupExists = fs.existsSync(this.backupTokenFile);
        const exists = mainExists || backupExists;
        
        console.log('🔍 [hasToken] 主檔案存在:', mainExists);
        console.log('🔍 [hasToken] 備份檔案存在:', backupExists);
        console.log('🔍 [hasToken] Token存在:', exists);
        
        return exists;
    }

    // 獲取token信息
    async getTokenInfo() {
        try {
            console.log('🔍 [getTokenInfo] 開始獲取Token信息...');
            const token = await this.loadToken();
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

module.exports = GitHubTokenManager;
