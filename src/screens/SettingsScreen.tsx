// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Switch, 
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SecureKeyStorage, SECURE_STORAGE_KEYS, logger } from '../config';
import { googleCalendarService } from '../services/google-calendar-service';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // API key states
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [claudeKeyHidden, setClaudeKeyHidden] = useState(true);
  const [openaiKeyHidden, setOpenaiKeyHidden] = useState(true);
  const [claudeSaved, setClaudeSaved] = useState(false);
  const [openaiSaved, setOpenaiSaved] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  
  useEffect(() => {
    // Check if Google account is connected
    const checkGoogleConnection = async () => {
      try {
        const isConnected = await googleCalendarService.isSignedIn();
        setGoogleConnected(isConnected);
        
        if (isConnected) {
          const email = await googleCalendarService.getUserEmail();
          setGoogleEmail(email || '');
        }
      } catch (error) {
        logger.error('Error checking Google connection', error);
      }
    };
    
    // Check if API keys exist
    const checkApiKeys = async () => {
      try {
        setLoadingKeys(true);
        
        // Check for Claude API key
        const claudeKey = await SecureKeyStorage.getKey(SECURE_STORAGE_KEYS.CLAUDE_API_KEY);
        if (claudeKey) {
          setClaudeApiKey('••••••••••••••••••••••••••••••');
          setClaudeSaved(true);
        }
        
        // Check for OpenAI API key
        const openaiKey = await SecureKeyStorage.getKey(SECURE_STORAGE_KEYS.OPENAI_API_KEY);
        if (openaiKey) {
          setOpenaiApiKey('••••••••••••••••••••••••••••••');
          setOpenaiSaved(true);
        }
      } catch (error) {
        logger.error('Error checking API keys', error);
      } finally {
        setLoadingKeys(false);
      }
    };
    
    checkGoogleConnection();
    checkApiKeys();
  }, []);
  
  const handleGoogleConnect = async () => {
    setLoading(true);
    
    try {
      const success = await googleCalendarService.signIn();
      if (success) {
        setGoogleConnected(true);
        const email = await googleCalendarService.getUserEmail();
        setGoogleEmail(email || '');
      } else {
        Alert.alert('Connection Failed', 'Could not connect to Google. Please try again.');
      }
    } catch (error) {
      logger.error('Error connecting to Google', error);
      Alert.alert('Connection Error', 'An error occurred while connecting to Google.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleDisconnect = async () => {
    setLoading(true);
    
    try {
      const success = await googleCalendarService.signOut();
      if (success) {
        setGoogleConnected(false);
        setGoogleEmail('');
      } else {
        Alert.alert('Disconnection Failed', 'Could not disconnect from Google. Please try again.');
      }
    } catch (error) {
      logger.error('Error disconnecting from Google', error);
      Alert.alert('Disconnection Error', 'An error occurred while disconnecting from Google.');
    } finally {
      setLoading(false);
    }
  };
  
  const saveClaudeApiKey = async () => {
    if (!claudeApiKey || claudeApiKey === '••••••••••••••••••••••••••••••') {
      Alert.alert('Invalid Key', 'Please enter a valid Claude API key.');
      return;
    }
    
    try {
      await SecureKeyStorage.storeKey(SECURE_STORAGE_KEYS.CLAUDE_API_KEY, claudeApiKey);
      setClaudeSaved(true);
      setClaudeKeyHidden(true);
      // Mask the key after saving
      setClaudeApiKey('••••••••••••••••••••••••••••••');
      Alert.alert('Success', 'Claude API key saved successfully.');
    } catch (error) {
      logger.error('Error saving Claude API key', error);
      Alert.alert('Error', 'Failed to save Claude API key. Please try again.');
    }
  };
  
  const saveOpenaiApiKey = async () => {
    if (!openaiApiKey || openaiApiKey === '••••••••••••••••••••••••••••••') {
      Alert.alert('Invalid Key', 'Please enter a valid OpenAI API key.');
      return;
    }
    
    try {
      await SecureKeyStorage.storeKey(SECURE_STORAGE_KEYS.OPENAI_API_KEY, openaiApiKey);
      setOpenaiSaved(true);
      setOpenaiKeyHidden(true);
      // Mask the key after saving
      setOpenaiApiKey('••••••••••••••••••••••••••••••');
      Alert.alert('Success', 'OpenAI API key saved successfully.');
    } catch (error) {
      logger.error('Error saving OpenAI API key', error);
      Alert.alert('Error', 'Failed to save OpenAI API key. Please try again.');
    }
  };
  
  const clearClaudeApiKey = async () => {
    try {
      await SecureKeyStorage.deleteKey(SECURE_STORAGE_KEYS.CLAUDE_API_KEY);
      setClaudeApiKey('');
      setClaudeSaved(false);
      Alert.alert('Success', 'Claude API key removed.');
    } catch (error) {
      logger.error('Error clearing Claude API key', error);
      Alert.alert('Error', 'Failed to remove Claude API key.');
    }
  };
  
  const clearOpenaiApiKey = async () => {
    try {
      await SecureKeyStorage.deleteKey(SECURE_STORAGE_KEYS.OPENAI_API_KEY);
      setOpenaiApiKey('');
      setOpenaiSaved(false);
      Alert.alert('Success', 'OpenAI API key removed.');
    } catch (error) {
      logger.error('Error clearing OpenAI API key', error);
      Alert.alert('Error', 'Failed to remove OpenAI API key.');
    }
  };
  
  const handleChangeClaudeKey = (text) => {
    // If user starts typing, clear the masked key
    if (claudeSaved && claudeApiKey === '••••••••••••••••••••••••••••••' && text !== '') {
      setClaudeApiKey('');
    } else {
      setClaudeApiKey(text);
    }
  };
  
  const handleChangeOpenaiKey = (text) => {
    // If user starts typing, clear the masked key
    if (openaiSaved && openaiApiKey === '••••••••••••••••••••••••••••••' && text !== '') {
      setOpenaiApiKey('');
    } else {
      setOpenaiApiKey(text);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        
        <ScrollView style={styles.content}>
          {/* API Keys Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API Keys</Text>
            
            {loadingKeys ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#005e46" />
              </View>
            ) : (
              <>
                <View style={styles.apiKeyContainer}>
                  <Text style={styles.apiKeyLabel}>Claude API Key</Text>
                  <View style={styles.apiKeyInputContainer}>
                    <TextInput
                      style={styles.apiKeyInput}
                      value={claudeApiKey}
                      onChangeText={handleChangeClaudeKey}
                      placeholder="Enter Claude API Key"
                      secureTextEntry={claudeKeyHidden}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.visibilityToggle}
                      onPress={() => setClaudeKeyHidden(!claudeKeyHidden)}
                    >
                      <Text>{claudeKeyHidden ? '👁️' : '🔒'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.apiKeyButtonsContainer}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={saveClaudeApiKey}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                    {claudeSaved && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearClaudeApiKey}
                      >
                        <Text style={styles.clearButtonText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.apiKeyHelp}>
                    Get your Claude API key from https://console.anthropic.com
                  </Text>
                </View>
                
                <View style={styles.apiKeyContainer}>
                  <Text style={styles.apiKeyLabel}>OpenAI API Key (for Whisper)</Text>
                  <View style={styles.apiKeyInputContainer}>
                    <TextInput
                      style={styles.apiKeyInput}
                      value={openaiApiKey}
                      onChangeText={handleChangeOpenaiKey}
                      placeholder="Enter OpenAI API Key"
                      secureTextEntry={openaiKeyHidden}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.visibilityToggle}
                      onPress={() => setOpenaiKeyHidden(!openaiKeyHidden)}
                    >
                      <Text>{openaiKeyHidden ? '👁️' : '🔒'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.apiKeyButtonsContainer}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={saveOpenaiApiKey}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                    {openaiSaved && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearOpenaiApiKey}
                      >
                        <Text style={styles.clearButtonText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.apiKeyHelp}>
                    Get your OpenAI API key from https://platform.openai.com/api-keys
                  </Text>
                </View>
              </>
            )}
          </View>
          
          {/* Connected Accounts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            
            <View style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Google Calendar</Text>
                
                {loading ? (
                  <ActivityIndicator size="small" color="#005e46" />
                ) : googleConnected ? (
                  <View>
                    <Text style={styles.accountEmail}>{googleEmail}</Text>
                    <TouchableOpacity onPress={handleGoogleDisconnect}>
                      <Text style={styles.disconnectText}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.connectButton} onPress={handleGoogleConnect}>
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          
          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Enable Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#d6ceb9", true: "#005e46" }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Dark Mode</Text>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: "#d6ceb9", true: "#005e46" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
          
          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            
            <TouchableOpacity style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Privacy Policy</Text>
              <Text style={styles.linkText}>View</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Terms of Service</Text>
              <Text style={styles.linkText}>View</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d6ceb9',
  },
  backButton: {
    fontSize: 16,
    color: '#005e46',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005e46',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  apiKeyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  apiKeyLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  apiKeyInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d6ceb9',
    borderRadius: 4,
    marginBottom: 8,
  },
  apiKeyInput: {
    flex: 1,
    padding: 8,
    fontSize: 14,
  },
  visibilityToggle: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiKeyButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#005e46',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#f5827a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  apiKeyHelp: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontSize: 16,
    color: '#333333',
  },
  accountEmail: {
    fontSize: 14,
    color: '#666666',
  },
  disconnectText: {
    fontSize: 14,
    color: 'red',
    marginTop: 4,
  },
  connectButton: {
    backgroundColor: '#005e46',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  connectButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333333',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#333333',
  },
  aboutValue: {
    fontSize: 14,
    color: '#666666',
  },
  linkText: {
    fontSize: 14,
    color: '#005e46',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;