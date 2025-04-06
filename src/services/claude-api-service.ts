import axios from 'axios';
import { SecureKeyStorage, SECURE_STORAGE_KEYS, ENV, MOCK_ENABLED } from '../config';

// Types
export interface ClaudeRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  customPrompt?: boolean;
}

export interface TaskResponse {
  highPriorityTasks: Task[];
  mediumPriorityTasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium';
  date: string | null;
  time: string | null;
  duration: number; // in minutes
  completed: boolean;
  recordingId: string;
  subTasks?: SubTask[];
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

class ClaudeApiService {
  // No API key stored in class property - fetch from secure storage when needed
  
  /**
   * Set the Claude API key securely
   */
  public async setApiKey(apiKey: string): Promise<void> {
    try {
      await SecureKeyStorage.storeKey(SECURE_STORAGE_KEYS.CLAUDE_API_KEY, apiKey);
    } catch (error) {
      console.error('Failed to save Claude API key', error);
      throw new Error('Failed to save API key');
    }
  }
  
  /**
   * Validate that the API key exists, without retrieving it
   */
  public async validateApiKeyExists(): Promise<boolean> {
    try {
      const apiKey = await SecureKeyStorage.getKey(SECURE_STORAGE_KEYS.CLAUDE_API_KEY);
      return apiKey !== null && apiKey.length > 0;
    } catch (error) {
      console.error('Failed to validate API key', error);
      return false;
    }
  }
  
  // More methods would go here...

  /**
   * Mock implementation for testing without actual API calls
   */
  public async mockProcessTranscript(transcript: string, recordingId: string): Promise<TaskResponse> {
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate unique IDs using a more secure method
    const generateSecureId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Return mock data
    return {
      highPriorityTasks: [
        {
          id: generateSecureId('task'),
          title: 'File your taxes',
          priority: 'high',
          date: '2025-04-07',
          time: '18:00',
          duration: 120, // 2 hours
          completed: false,
          recordingId
        },
        {
          id: generateSecureId('task'),
          title: 'Take your dog to the doctor',
          priority: 'high',
          date: '2025-04-09',
          time: '18:00',
          duration: 60, // 1 hour
          completed: false,
          recordingId
        }
      ],
      mediumPriorityTasks: [
        {
          id: generateSecureId('task'),
          title: 'Dispose of cut trees/yard waste',
          priority: 'medium',
          date: null,
          time: null,
          duration: 120, // 2 hours
          completed: false,
          recordingId,
          subTasks: [
            {
              id: generateSecureId('subtask'),
              title: 'Research disposal options',
              completed: false
            },
            {
              id: generateSecureId('subtask'),
              title: 'Schedule actual disposal',
              completed: false
            }
          ]
        }
      ]
    };
  }
}

// Export a singleton instance
export const claudeApiService = new ClaudeApiService();
export default claudeApiService;