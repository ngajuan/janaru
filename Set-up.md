# Janaru App - Setup and Installation Guide

Janaru is a voice-to-task application that helps you transform voice recordings into actionable tasks using AI assistance and Google Calendar integration.

## Prerequisites

- Node.js (v16.x or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- API Keys:
  - [Claude API key](https://console.anthropic.com/)
  - [OpenAI API key](https://platform.openai.com/api-keys) (for Whisper transcription)
  - [Google Cloud Platform](https://console.cloud.google.com/) credentials

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/janaru-app.git
   cd janaru-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or using yarn
   yarn install
   ```

3. Create an environment variables file by copying the template:
   ```bash
   cp .env.template .env
   ```

4. Set up your API keys (see API Keys Setup section below)

5. Start the development server:
   ```bash
   npm start
   # or using yarn
   yarn start
   ```

6. Use the Expo Go app on your mobile device to scan the QR code, or press 'a' to run on an Android emulator or 'i' for iOS simulator.

## API Keys Setup

### 1. Claude API

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to the API Keys section
4. Create a new API key (make sure to copy it, as it won't be shown again)
5. Add it to your `.env` file as `CLAUDE_API_KEY`

### 2. OpenAI API (for Whisper transcription)

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new secret key (make sure to copy it, as it won't be shown again)
5. Add it to your `.env` file as `OPENAI_API_KEY`

### 3. Google Cloud Platform Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "Dashboard"
4. Enable the following APIs:
   - Google Calendar API
   - Google Sign-In API
5. Go to "APIs & Services" > "Credentials"
6. Create OAuth 2.0 Client IDs:
   - For Android: Use your package name as the bundle ID
   - For iOS: Use your bundle identifier
   - For Web: Add authorized JavaScript origins and redirect URIs
7. Add the Web Client ID to your `.env` file as `GOOGLE_WEB_CLIENT_ID`

## Environment Variables

Edit the `.env` file and add your API keys and configuration:

```
# Environment (development, production)
ENVIRONMENT=development

# Claude API Configuration
CLAUDE_API_URL=https://api.anthropic.com/v1/messages
CLAUDE_API_MODEL=claude-3-haiku-20240307
CLAUDE_API_KEY=your-claude-api-key-here

# OpenAI API Configuration (for Whisper transcription)
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_API_KEY=your-openai-api-key-here

# Google Authentication
GOOGLE_WEB_CLIENT_ID=your-google-web-client-id-here

# Logging Level (debug, info, warn, error)
LOG_LEVEL=info
```

## Running in Production

1. Update the `.env` file:
   ```
   ENVIRONMENT=production
   ```

2. Build the app for production:
   ```bash
   expo build:android
   # or
   expo build:ios
   ```

## Troubleshooting

### API Connection Issues

If you experience issues connecting to APIs:

1. Verify your API keys are correct
2. Check that your environment variables are properly set
3. Ensure you're not hitting rate limits on the APIs
4. Check your network connection

### Google Sign-In Issues

If Google Sign-In is not working:

1. Verify your Google Cloud Console configuration
2. Ensure the OAuth consent screen is properly configured
3. Check that you're using the correct Client ID for each platform
4. Make sure the Google Sign-In API is enabled in your GCP project

### Voice Recording Issues

If voice recording is not working:

1. Ensure your app has microphone permissions
2. Check that your device's microphone is working correctly
3. Try using headphones with a microphone instead of the device's built-in microphone

## Support

If you encounter any issues, please open an issue on the GitHub repository or contact the maintainers directly.

## License

This project is licensed under the MIT License - see the LICENSE file for details.