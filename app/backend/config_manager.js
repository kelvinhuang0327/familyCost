// 配置管理器 - 管理 GitHub 設定檔
const fs = require('fs');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '../config/github_config.json');
        this.config = null;
    }

    // 讀取配置
    async loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configContent = fs.readFileSync(this.configPath, 'utf8');
                this.config = JSON.parse(configContent);
                console.log('✅ 配置檔載入成功');
                return this.config;
            } else {
                console.log('⚠️ 配置檔不存在，使用預設配置');
                this.config = this.getDefaultConfig();
                await this.saveConfig();
                return this.config;
            }
        } catch (error) {
            console.error('❌ 配置檔載入失敗:', error.message);
            this.config = this.getDefaultConfig();
            return this.config;
        }
    }

    // 保存配置
    async saveConfig() {
        try {
            // 確保配置目錄存在
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            // 更新最後修改時間
            this.config.last_updated = new Date().toISOString();
            
            // 保存配置
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            console.log('✅ 配置檔保存成功');
            return true;
        } catch (error) {
            console.error('❌ 配置檔保存失敗:', error.message);
            throw error;
        }
    }

    // 獲取 GitHub Token
    async getGitHubToken() {
        if (!this.config) {
            await this.loadConfig();
        }
        return this.config.github_token || null;
    }

    // 設置 GitHub Token
    async setGitHubToken(token) {
        if (!this.config) {
            await this.loadConfig();
        }
        
        // 驗證 Token 格式
        if (!token || !token.trim()) {
            throw new Error('Token 不能為空');
        }
        
        if (!token.startsWith('ghp_') || token.length < 40) {
            throw new Error('Token 格式不正確，GitHub Personal Access Token 應以 ghp_ 開頭');
        }

        this.config.github_token = token.trim();
        await this.saveConfig();
        console.log('✅ GitHub Token 已更新');
        return true;
    }

    // 獲取配置
    async getConfig() {
        if (!this.config) {
            await this.loadConfig();
        }
        return { ...this.config }; // 返回副本，避免直接修改
    }

    // 更新配置
    async updateConfig(updates) {
        if (!this.config) {
            await this.loadConfig();
        }
        
        // 合併更新
        this.config = { ...this.config, ...updates };
        await this.saveConfig();
        console.log('✅ 配置已更新');
        return this.config;
    }

    // 獲取預設配置
    getDefaultConfig() {
        return {
            github_token: "",
            owner: "kelvinhuang0327",
            repo: "familyCost",
            branch: "main",
            data_path: "data/data.json",
            last_updated: new Date().toISOString(),
            description: "GitHub 配置設定檔"
        };
    }

    // 檢查 Token 狀態
    async checkTokenStatus() {
        // 優先檢查環境變數
        const envToken = process.env.GITHUB_TOKEN;
        const configToken = await this.getGitHubToken();
        
        // 使用環境變數或配置文件中的 token
        const token = envToken || configToken;
        const tokenSource = envToken ? 'environment' : (configToken ? 'config' : null);
        
        return {
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 10) + '...' : null,
            tokenSource: tokenSource,
            lastUpdated: this.config ? this.config.last_updated : null,
            envTokenExists: !!envToken,
            configTokenExists: !!configToken
        };
    }
}

module.exports = ConfigManager;
