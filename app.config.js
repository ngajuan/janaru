import 'dotenv/config';

export default ({ config }) => {
  // Default configuration for development
  const defaultConfig = {
    environment: 'development',
    claudeApiUrl: 'https://api.anthropic.com/v1/messages',
    claudeApiModel: 'claude-3-haiku-20240307',
    openaiApiUrl: 'https://api.openai.com/v1',
    googleWebClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID_PLACEHOLDER',
    logLevel: 'info'
  };

  // Get configuration from environment variables
  const envConfig = {
    environment: process.env.ENVIRONMENT || defaultConfig.environment,
    claudeApiUrl: process.env.CLAUDE_API_URL || defaultConfig.claudeApiUrl,
    claudeApiModel: process.env.CLAUDE_API_MODEL || defaultConfig.claudeApiModel,
    openaiApiUrl: process.env.OPENAI_API_URL || defaultConfig.openaiApiUrl,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || defaultConfig.googleWebClientId,
    logLevel: process.env.LOG_LEVEL || defaultConfig.logLevel
  };

  // Validate that no production build uses default credentials
  if (envConfig.environment === 'production') {
    // Log warnings for missing configuration
    if (envConfig.googleWebClientId === defaultConfig.googleWebClientId) {
      console.warn('WARNING: Using placeholder Google Web Client ID in production!');
    }

    // Check if API URLs are using defaults
    if (envConfig.claudeApiUrl === defaultConfig.claudeApiUrl) {
      console.warn('WARNING: Using default Claude API URL in production!');
    }

    if (envConfig.openaiApiUrl === defaultConfig.openaiApiUrl) {
      console.warn('WARNING: Using default OpenAI API URL in production!');
    }
  }

  return {
    ...config,
    extra: {
      ...config.extra,
      ...envConfig,
    },
  };
};