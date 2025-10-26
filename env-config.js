// LearnBridge AI - Environment Configuration Loader
// This file loads environment variables safely for client-side use

class EnvironmentConfig {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    async loadConfig() {
        try {
            // In a production environment, you would load this from a secure endpoint
            // For development, we'll use a local config approach
            
            // Check if running in a Node.js environment (for potential SSR)
            if (typeof process !== 'undefined' && process.env) {
                this.config = {
                    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
                    API_BASE_URL: process.env.API_BASE_URL || 'https://api.openai.com/v1',
                    APP_NAME: process.env.APP_NAME || 'LearnBridge AI',
                    VERSION: process.env.VERSION || '1.0.0',
                    ENVIRONMENT: process.env.ENVIRONMENT || 'development',
                    ENABLE_VOICE: process.env.ENABLE_VOICE !== 'false',
                    ENABLE_FILE_UPLOAD: process.env.ENABLE_FILE_UPLOAD !== 'false',
                    ENABLE_VOLUNTEER_MATCHING: process.env.ENABLE_VOLUNTEER_MATCHING !== 'false',
                    ENABLE_MULTILINGUAL: process.env.ENABLE_MULTILINGUAL !== 'false'
                };
            } else {
                // For client-side, load from a secure config endpoint or use defaults
                // In production, this should be loaded from your backend API
                await this.loadFromEnvFile();
            }
        } catch (error) {
            console.warn('Could not load environment configuration, using defaults');
            this.useDefaults();
        }
    }

    async loadFromEnvFile() {
        try {
            // This is a development-only approach
            // In production, environment variables should be injected by your build process
            const response = await fetch('./.env');
            if (response.ok) {
                const envText = await response.text();
                this.parseEnvFile(envText);
            } else {
                throw new Error('Could not load .env file');
            }
        } catch (error) {
            console.warn('Could not load .env file, using fallback configuration');
            this.useDefaults();
        }
    }

    parseEnvFile(envText) {
        const lines = envText.split('\n');
        const config = {};

        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=');
                config[key] = value;
            }
        });

        this.config = {
            OPENAI_API_KEY: config.OPENAI_API_KEY || 'your-openai-api-key-here',
            API_BASE_URL: config.API_BASE_URL || 'https://api.openai.com/v1',
            APP_NAME: config.APP_NAME || 'LearnBridge AI',
            VERSION: config.VERSION || '1.0.0',
            ENVIRONMENT: config.ENVIRONMENT || 'development',
            ENABLE_VOICE: config.ENABLE_VOICE !== 'false',
            ENABLE_FILE_UPLOAD: config.ENABLE_FILE_UPLOAD !== 'false',
            ENABLE_VOLUNTEER_MATCHING: config.ENABLE_VOLUNTEER_MATCHING !== 'false',
            ENABLE_MULTILINGUAL: config.ENABLE_MULTILINGUAL !== 'false'
        };
    }

    useDefaults() {
        this.config = {
            OPENAI_API_KEY: 'your-openai-api-key-here',
            API_BASE_URL: 'https://api.openai.com/v1',
            APP_NAME: 'LearnBridge AI',
            VERSION: '1.0.0',
            ENVIRONMENT: 'development',
            ENABLE_VOICE: true,
            ENABLE_FILE_UPLOAD: true,
            ENABLE_VOLUNTEER_MATCHING: true,
            ENABLE_MULTILINGUAL: true
        };
    }

    get(key) {
        return this.config[key];
    }

    getAll() {
        return { ...this.config };
    }

    isProduction() {
        return this.config.ENVIRONMENT === 'production';
    }

    isDevelopment() {
        return this.config.ENVIRONMENT === 'development';
    }
}

// Export for use in other modules
window.EnvironmentConfig = EnvironmentConfig;