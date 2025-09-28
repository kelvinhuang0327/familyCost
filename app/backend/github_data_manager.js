const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const ConfigManager = require('./config_manager');

class GitHubDataManager {
    constructor(tokenManager = null) {
        this.owner = 'kelvinhuang0327';
        this.repo = 'familyCost';
        this.branch = 'main';
        this.dataPath = 'data/data.json';
        this.tokenManager = tokenManager;
        this.token = process.env.GITHUB_TOKEN || '';
        this.configManager = new ConfigManager();
        
        if (!this.token && !this.tokenManager) {
            console.warn('⚠️ GITHUB_TOKEN 環境變數和 TokenManager 都未設置，將使用本地文件存儲');
        }
    }

    // 獲取有效的 Token
    async getValidToken() {
        // 優先使用環境變數
        if (this.token) {
            console.log('✅ 使用環境變數中的 Token');
            return this.token;
        }
        
        // 檢查環境變數
        if (process.env.GITHUB_TOKEN) {
            console.log('✅ 使用 process.env.GITHUB_TOKEN');
            return process.env.GITHUB_TOKEN;
        }
        
        // 嘗試從配置管理器獲取
        try {
            const configToken = await this.configManager.getGitHubToken();
            if (configToken) {
                console.log('✅ 從配置檔獲取到 Token');
                return configToken;
            }
        } catch (error) {
            console.log('⚠️ 從配置檔獲取 Token 失敗:', error.message);
        }
        
        // 嘗試從 TokenManager 獲取
        if (this.tokenManager) {
            try {
                const token = await this.tokenManager.loadToken();
                if (token) {
                    console.log('✅ 從 TokenManager 獲取到 Token');
                    return token;
                }
            } catch (error) {
                console.log('⚠️ 從 TokenManager 獲取 Token 失敗:', error.message);
            }
        }
        
        console.log('❌ 未找到有效的 GitHub Token');
        return null;
    }

    // 從 GitHub 獲取數據
    async getDataFromGitHub() {
        const token = await this.getValidToken();
        if (!token) {
            return await this.getDataFromLocal();
        }

        try {
            console.log('🔍 [GitHub] 開始從 GitHub 獲取數據...');
            
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataPath}?ref=${this.branch}`;
            
            const response = await this.makeGitHubRequest(url);
            
            if (response.content) {
                // 解碼 base64 內容
                const content = Buffer.from(response.content, 'base64').toString('utf8');
                const parsedData = JSON.parse(content);
                
                console.log('✅ [GitHub] 成功從 GitHub 獲取數據');
                
                // 處理不同的JSON格式
                if (Array.isArray(parsedData)) {
                    return parsedData;
                } else if (parsedData && Array.isArray(parsedData.records)) {
                    return parsedData.records;
                } else {
                    console.log('⚠️ [GitHub] JSON格式不正確，使用空數組');
                    return [];
                }
            } else {
                console.log('⚠️ [GitHub] 未找到數據文件，使用空數組');
                return [];
            }
        } catch (error) {
            console.error('❌ [GitHub] 從 GitHub 獲取數據失敗:', error.message);
            console.log('🔄 [GitHub] 回退到本地文件...');
            return await this.getDataFromLocal();
        }
    }

    // 保存數據到 GitHub
    async saveDataToGitHub(records) {
        const token = await this.getValidToken();
        if (!token) {
            console.log('⚠️ 未找到有效的 GitHub Token，回退到本地存儲');
            return await this.saveDataToLocal(records);
        }

        try {
            console.log('💾 [GitHub] 開始保存數據到 GitHub...');
            
            // 先獲取當前文件的 SHA
            const currentFile = await this.getCurrentFileInfo();
            
            const data = { records: records };
            const content = JSON.stringify(data, null, 2);
            const encodedContent = Buffer.from(content).toString('base64');
            
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataPath}`;
            
            const payload = {
                message: `更新數據 - ${new Date().toLocaleString('zh-TW')}`,
                content: encodedContent,
                branch: this.branch
            };
            
            if (currentFile && currentFile.sha) {
                payload.sha = currentFile.sha;
            }
            
            const response = await this.makeGitHubRequest(url, 'PUT', payload);
            
            console.log('✅ [GitHub] 成功保存數據到 GitHub');
            return { success: true, commit: response.commit };
            
        } catch (error) {
            console.error('❌ [GitHub] 保存數據到 GitHub 失敗:', error.message);
            console.log('🔄 [GitHub] 回退到本地文件...');
            return await this.saveDataToLocal(records);
        }
    }

    // 獲取當前文件信息
    async getCurrentFileInfo() {
        try {
            const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.dataPath}?ref=${this.branch}`;
            return await this.makeGitHubRequest(url);
        } catch (error) {
            console.log('⚠️ [GitHub] 獲取文件信息失敗，可能是新文件');
            return null;
        }
    }

    // 發送 GitHub API 請求
    async makeGitHubRequest(url, method = 'GET', data = null) {
        const token = await this.getValidToken();
        if (!token) {
            throw new Error('無法獲取有效的 GitHub Token');
        }
        
        return new Promise((resolve, reject) => {
            const options = {
                method: method,
                headers: {
                    'Authorization': `token ${token}`,
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

    // 本地文件備份方法
    async getDataFromLocal() {
        try {
            console.log('🔍 [Local] 從本地文件獲取數據...');
            const dataPath = path.join(__dirname, '../../data/data.json');
            const dataContent = await fs.readFile(dataPath, 'utf8');
            const parsedData = JSON.parse(dataContent);
            
            if (Array.isArray(parsedData)) {
                return parsedData;
            } else if (parsedData && Array.isArray(parsedData.records)) {
                return parsedData.records;
            } else {
                return [];
            }
        } catch (error) {
            console.log('⚠️ [Local] 本地文件不存在或讀取失敗:', error.message);
            return [];
        }
    }

    async saveDataToLocal(records) {
        try {
            console.log('💾 [Local] 保存數據到本地文件...');
            const dataPath = path.join(__dirname, '../../data/data.json');
            const data = { records: records };
            await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
            console.log('✅ [Local] 成功保存數據到本地文件');
            return { success: true };
        } catch (error) {
            console.error('❌ [Local] 保存數據到本地文件失敗:', error.message);
            throw error;
        }
    }
}

module.exports = GitHubDataManager;
