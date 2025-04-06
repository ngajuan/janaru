import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Random from 'expo-random';
import { Platform } from 'react-native';
import { SECURE_STORAGE_KEYS } from '../config';

// Key for encryption - will be generated and stored securely
const ENCRYPTION_KEY_ID = 'janaru_encryption_key';

/**
 * Initialize encryption by ensuring we have a key
 */
export async function initializeEncryption(): Promise<void> {
  try {
    // Check if we already have an encryption key
    const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
    if (!existingKey) {
      // Generate a new random key
      const randomBytes = await Random.getRandomBytesAsync(32);
      const key = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Store the key in secure storage
      await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, key);
    }
  } catch (error) {
    console.error('Failed to initialize encryption', error);
    throw new Error('Could not initialize encryption');
  }
}

/**
 * Get the encryption key
 */
async function getEncryptionKey(): Promise<string> {
  try {
    const key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
    if (!key) {
      // Initialize if key doesn't exist
      await initializeEncryption();
      return await SecureStore.getItemAsync(ENCRYPTION_KEY_ID) || '';
    }
    return key;
  } catch (error) {
    console.error('Failed to get encryption key', error);
    throw new Error('Could not access encryption key');
  }
}

/**
 * Generate a device-specific salt
 */
async function getDeviceSalt(): Promise<string> {
  try {
    // Try to get existing salt
    const existingSalt = await SecureStore.getItemAsync('janaru_device_salt');
    if (existingSalt) {
      return existingSalt;
    }
    
    // Generate device-specific info for salt
    const deviceInfo = [
      Platform.OS,
      Platform.Version,
      await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Platform.OS + Platform.Version + Date.now().toString()
      )
    ].join('_');
    
    // Hash the device info to create a salt
    const salt = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      deviceInfo
    );
    
    // Store the salt for future use
    await SecureStore.setItemAsync('janaru_device_salt', salt);
    
    return salt;
  } catch (error) {
    console.error('Failed to generate device salt', error);
    // Fallback to a simple salt if needed
    return 'janaru_salt_' + Platform.OS;
  }
}

/**
 * Encrypt a string using the app's encryption key
 */
export async function encrypt(data: string): Promise<string> {
  try {
    if (!data) return '';
    
    // Get the encryption key and salt
    const key = await getEncryptionKey();
    const salt = await getDeviceSalt();
    
    // Generate a random IV (Initialization Vector)
    const randomBytes = await Random.getRandomBytesAsync(16);
    const iv = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Hash the key with the salt to create the actual encryption key
    const encryptionKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + salt
    );
    
    // Simple XOR encryption (for demo only)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i);
      const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
      const ivChar = iv.charCodeAt(i % iv.length);
      const encryptedChar = charCode ^ keyChar ^ ivChar;
      encrypted += String.fromCharCode(encryptedChar);
    }
    
    // Convert to base64 and prepend the IV for decryption later
    const base64Data = Buffer.from(encrypted, 'utf-8').toString('base64');
    return iv + ':' + base64Data;
    
  } catch (error) {
    console.error('Encryption failed', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string using the app's encryption key
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    if (!encryptedData) return '';
    
    // Split the IV and encrypted data
    const [iv, base64Data] = encryptedData.split(':');
    if (!iv || !base64Data) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Get the encryption key and salt
    const key = await getEncryptionKey();
    const salt = await getDeviceSalt();
    
    // Hash the key with the salt to create the actual encryption key
    const encryptionKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + salt
    );
    
    // Convert from base64
    const encrypted = Buffer.from(base64Data, 'base64').toString('utf-8');
    
    // Simple XOR decryption (for demo only)
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i);
      const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
      const ivChar = iv.charCodeAt(i % iv.length);
      const decryptedChar = charCode ^ keyChar ^ ivChar;
      decrypted += String.fromCharCode(decryptedChar);
    }
    
    return decrypted;
    
  } catch (error) {
    console.error('Decryption failed', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a secure random ID
 */
export function generateSecureId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  return `${prefix}_${timestamp}_${random}`;
}