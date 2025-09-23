// 環境配置管理
const config = {
    // 本地開發環境
    local: {
        name: 'local',
        port: 3001,
        frontendUrl: 'http://localhost:8000',
        backendUrl: 'http://localhost:3001',
        apiBase: 'http://localhost:3001/api',
        github: {
            repo: 'kelvinhuang0327/familyCost',
            branch: 'main'
        },
        features: {
            autoSync: true,
            tokenManagement: true,
            dataHealthCheck: true,
            safariCompatibility: true
        },
        logging: {
            level: 'debug',
            console: true
        }
    },

    // SIT測試環境
    sit: {
        name: 'sit',
        port: process.env.PORT || 3001,
        frontendUrl: process.env.FRONTEND_URL || 'https://family-cost-sit.vercel.app',
        backendUrl: process.env.BACKEND_URL || 'https://family-cost-sit.vercel.app',
        apiBase: process.env.API_BASE || 'https://family-cost-sit.vercel.app/api',
        github: {
            repo: 'kelvinhuang0327/familyCost',
            branch: 'sit'
        },
        features: {
            autoSync: true,
            tokenManagement: true,
            dataHealthCheck: true,
            safariCompatibility: true
        },
        logging: {
            level: 'info',
            console: true
        }
    }
};

// 獲取當前環境
function getEnvironment() {
    return process.env.NODE_ENV || 'local';
}

// 獲取當前配置
function getConfig() {
    const env = getEnvironment();
    return config[env] || config.local;
}

// 導出配置
module.exports = {
    config,
    getEnvironment,
    getConfig
};
