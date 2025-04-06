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
  // In src/services/claude-api-service.ts, update the mockProcessTranscript function:

public async mockProcessTranscript(transcript: string, recordingId: string): Promise<TaskResponse> {
  // Simulate API processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate unique IDs using a more secure method
  const generateSecureId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  // Extract tasks from transcript (simplified text analysis)
  const highPriorityTasks = [];
  const mediumPriorityTasks = [];
  
  // Look for keywords in the transcript
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  // Format dates in YYYY-MM-DD format
  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  // Simple text analysis to extract tasks
  // Tax related tasks
  if (transcript.toLowerCase().includes('tax')) {
    highPriorityTasks.push({
      id: generateSecureId('task'),
      title: 'File your taxes',
      priority: 'high',
      date: formatDate(today),
      time: '18:00',
      duration: 120, // 2 hours
      completed: false,
      recordingId
    });
  }
  
  // Vet/doctor related tasks
  if (transcript.toLowerCase().includes('dog') && 
     (transcript.toLowerCase().includes('vet') || transcript.toLowerCase().includes('doctor'))) {
    highPriorityTasks.push({
      id: generateSecureId('task'),
      title: 'Take your dog to the vet',
      priority: 'high',
      date: formatDate(new Date(today.setDate(today.getDate() + 2))), // Two days from now
      time: '18:00',
      duration: 60, // 1 hour
      completed: false,
      recordingId
    });
  }
  
  // Driver's license
  if (transcript.toLowerCase().includes('driver') && transcript.toLowerCase().includes('license')) {
    highPriorityTasks.push({
      id: generateSecureId('task'),
      title: "Help with driver's license",
      priority: 'high',
      date: formatDate(new Date(today.setDate(today.getDate() + 5))), // Weekend
      time: '10:00',
      duration: 90, // 1.5 hours
      completed: false,
      recordingId
    });
  }
  
  // Yard waste
  if (transcript.toLowerCase().includes('yard') || 
      transcript.toLowerCase().includes('waste') || 
      transcript.toLowerCase().includes('dispose')) {
    mediumPriorityTasks.push({
      id: generateSecureId('task'),
      title: 'Dispose of yard waste',
      priority: 'medium',
      date: formatDate(nextWeek),
      time: null,
      duration: 60,
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
          title: 'Schedule pickup or dropoff',
          completed: false
        }
      ]
    });
  }
  
  // Vacation planning
  if (transcript.toLowerCase().includes('vacation') || 
      transcript.toLowerCase().includes('burnt out') || 
      transcript.toLowerCase().includes('burnout')) {
    mediumPriorityTasks.push({
      id: generateSecureId('task'),
      title: 'Plan vacation for burnout recovery',
      priority: 'medium',
      date: formatDate(new Date(nextWeek.setDate(nextWeek.getDate() + 7))),
      time: null,
      duration: 120,
      completed: false,
      recordingId,
      subTasks: [
        {
          id: generateSecureId('subtask'),
          title: 'Research destinations',
          completed: false
        },
        {
          id: generateSecureId('subtask'),
          title: 'Check available time off',
          completed: false
        }
      ]
    });
  }
  
  // Add default tasks if nothing was extracted
  if (highPriorityTasks.length === 0 && mediumPriorityTasks.length === 0) {
    highPriorityTasks.push({
      id: generateSecureId('task'),
      title: 'Review your priorities',
      priority: 'high',
      date: formatDate(today),
      time: '18:00',
      duration: 30,
      completed: false,
      recordingId
    });
  }
  
  return {
    highPriorityTasks,
    mediumPriorityTasks
  };
}
}

// Export a singleton instance
export const claudeApiService = new ClaudeApiService();
export default claudeApiService;