import 'dotenv/config';

export default ({ config }) => {
  // Default configuration for development
  const defaultConfig = {
    environment: 'development',
    claudeApiUrl: 'https://api.anthropic.com/v1/messages',
    claudeApiModel: 'claude-3-haiku-20240307',
    googleWebClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID_PLACEHOLDER',
  };

  // Get configuration from environment variables
  const envConfig = {
    environment: process.env.ENVIRONMENT || defaultConfig.environment,
    claudeApiUrl: process.env.CLAUDE_API_URL || defaultConfig.claudeApiUrl,
    claudeApiModel: process.env.CLAUDE_API_MODEL || defaultConfig.claudeApiModel,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || defaultConfig.googleWebClientId,
  };

  // Validate that no production build uses default credentials
  if (envConfig.environment === 'production') {
    // Log warnings for missing configuration
    if (envConfig.googleWebClientId === defaultConfig.googleWebClientId) {
      console.warn('WARNING: Using placeholder Google Web Client ID in production!');
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