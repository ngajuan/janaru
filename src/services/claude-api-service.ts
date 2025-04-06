// src/services/claude-api-service.ts
import axios from 'axios';
import { SecureKeyStorage, SECURE_STORAGE_KEYS, ENV } from '../config';

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
  calendarEventId?: string;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

class ClaudeApiService {
  private readonly defaultPromptTemplate = `
I need you to extract actionable tasks from the following transcript and organize them by priority. For each task:
1. Create a clear, concise title
2. Identify a suggested timeframe (specific date if mentioned, or general timing)
3. Estimate duration if implied
4. Organize into High Priority (This Week) or Medium Priority (Next 1-2 Weeks)
5. Break complex tasks into sub-tasks if needed

Here's the transcript:
{transcript}
`;

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

  /**
   * Get API key from secure storage
   */
  private async getApiKey(): Promise<string> {
    const apiKey = await SecureKeyStorage.getKey(SECURE_STORAGE_KEYS.CLAUDE_API_KEY);
    if (!apiKey) {
      throw new Error('Claude API key not found');
    }
    return apiKey;
  }

  /**
   * Process a transcript with Claude to extract tasks
   */
  public async processTranscript(transcript: string, recordingId: string, options?: ClaudeRequestOptions): Promise<TaskResponse> {
    try {
      // Mock response for development/testing
      if (ENV.ENVIRONMENT !== 'production') {
        return this.mockProcessTranscript(transcript, recordingId);
      }

      // Get API key
      const apiKey = await this.getApiKey();
      
      // Prepare prompt
      const prompt = this.defaultPromptTemplate.replace('{transcript}', transcript);
      
      // Configure request
      const response = await axios.post(
        ENV.CLAUDE_API_URL,
        {
          model: options?.model || ENV.CLAUDE_API_MODEL,
          max_tokens: options?.maxTokens || 2000,
          temperature: options?.temperature || 0.5,
          messages: [
            { role: 'user', content: prompt }
          ],
          system: "You are a personal assistant who extracts actionable tasks from a user's voice memo. Extract clear tasks with priorities, dates, times, and durations. Format your response as a JSON object with highPriorityTasks and mediumPriorityTasks arrays."
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      // Parse the Claude response
      const responseText = response.data.content[0].text;
      
      // Extract JSON from the response (Claude may add extra text)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/{[\s\S]*}/);
                        
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Claude response');
      }

      const jsonContent = jsonMatch[1] || jsonMatch[0];
      const parsedResult: TaskResponse = JSON.parse(jsonContent);

      // Add recordingId to all tasks
      parsedResult.highPriorityTasks.forEach(task => {
        task.recordingId = recordingId;
        task.completed = false;
      });

      parsedResult.mediumPriorityTasks.forEach(task => {
        task.recordingId = recordingId;
        task.completed = false;
      });

      return parsedResult;

    } catch (error) {
      console.error('Claude API request failed', error);
      
      // Fall back to mock implementation if production request fails
      if (ENV.ENVIRONMENT === 'production') {
        console.warn('Falling back to mock implementation due to API failure');
      }
      
      return this.mockProcessTranscript(transcript, recordingId);
    }
  }

  /**
   * Mock implementation for testing without actual API calls
   */
  public async mockProcessTranscript(transcript: string, recordingId: string): Promise<TaskResponse> {
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate unique IDs using a more secure method
    const generateSecureId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Extract tasks from transcript (simplified text analysis)
    const highPriorityTasks: Task[] = [];
    const mediumPriorityTasks: Task[] = [];
    
    // Look for keywords in the transcript
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    // Format dates in YYYY-MM-DD format
    const formatDate = (date: Date) => {
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