import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Environment variables (should be configured in app.json under "extra")
export const ENV = {
  ENVIRONMENT: Constants.expoConfig?.extra?.environment || 'development',
  CLAUDE_API_URL: Constants.expoConfig?.extra?.claudeApiUrl || 'https://api.anthropic.com/v1/messages',
  CLAUDE_API_MODEL: Constants.expoConfig?.extra?.claudeApiModel || 'claude-3-haiku-20240307',
  GOOGLE_WEB_CLIENT_ID: Constants.expoConfig?.extra?.googleWebClientId || '',
};

// Secure key storage
export const SecureKeyStorage = {
  // Store a sensitive key in secure storage
  async storeKey(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Failed to store secure key: ${key}`, error);
      throw new Error('Could not securely store API key');
    }
  },

  // Retrieve a sensitive key from secure storage
  async getKey(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to retrieve secure key: ${key}`, error);
      return null;
    }
  },

  // Delete a sensitive key from secure storage
  async deleteKey(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to delete secure key: ${key}`, error);
    }
  },
};

// Constants for secure storage keys
export const SECURE_STORAGE_KEYS = {
  CLAUDE_API_KEY: 'janaru_claude_api_key',
  GOOGLE_REFRESH_TOKEN: 'janaru_google_refresh_token',
  USER_AUTH_TOKEN: 'janaru_user_auth_token',
};

// For development/testing only - mock API responses
export const MOCK_ENABLED = ENV.ENVIRONMENT !== 'production';