import AsyncStorage from '@react-native-async-storage/async-storage';
import { claudeApiService } from './claude-api-service';

// Types
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

export interface ProcessTranscriptResponse {
  highPriorityTasks: Task[];
  mediumPriorityTasks: Task[];
}

class TaskService {
  // Task cache
  private highPriorityTasks: Task[] = [];
  private mediumPriorityTasks: Task[] = [];
  private completedTasks: Task[] = [];
  
  constructor() {
    // Load tasks from storage on initialization
    this.loadTasks();
  }
  
  /**
   * Load tasks from local storage
   */
  private async loadTasks(): Promise<void> {
    try {
      // Load high priority tasks
      const highPriorityString = await AsyncStorage.getItem('@janaru_high_priority_tasks');
      if (highPriorityString) {
        this.highPriorityTasks = JSON.parse(highPriorityString);
      }
      
      // Load medium priority tasks
      const mediumPriorityString = await AsyncStorage.getItem('@janaru_medium_priority_tasks');
      if (mediumPriorityString) {
        this.mediumPriorityTasks = JSON.parse(mediumPriorityString);
      }
      
      // Load completed tasks
      const completedString = await AsyncStorage.getItem('@janaru_completed_tasks');
      if (completedString) {
        this.completedTasks = JSON.parse(completedString);
      }
      
    } catch (error) {
      console.error('Failed to load tasks from storage', error);
    }
  }
  
  /**
   * Process a transcript to extract and prioritize tasks
   */
  public async processTranscript(transcript: string, recordingId: string): Promise<ProcessTranscriptResponse> {
    try {
      // Use the mock service for demo purposes
      const response = await claudeApiService.mockProcessTranscript(transcript, recordingId);
      
      // Update local cache
      this.highPriorityTasks = [...this.highPriorityTasks, ...response.highPriorityTasks];
      this.mediumPriorityTasks = [...this.mediumPriorityTasks, ...response.mediumPriorityTasks];
      
      // Save to storage
      await this.saveTasks();
      
      return response;
      
    } catch (error) {
      console.error('Failed to process transcript', error);
      throw new Error('Failed to extract tasks from transcript');
    }
  }
  
  /**
   * Save tasks to local storage
   */
  private async saveTasks(): Promise<void> {
    try {
      // Save high priority tasks
      await AsyncStorage.setItem('@janaru_high_priority_tasks', JSON.stringify(this.highPriorityTasks));
      
      // Save medium priority tasks
      await AsyncStorage.setItem('@janaru_medium_priority_tasks', JSON.stringify(this.mediumPriorityTasks));
      
      // Save completed tasks
      await AsyncStorage.setItem('@janaru_completed_tasks', JSON.stringify(this.completedTasks));
      
    } catch (error) {
      console.error('Failed to save tasks to storage', error);
    }
  }
  
  /**
   * Get all tasks grouped by priority
   */
  public getAllTasks(): {
    highPriorityTasks: Task[];
    mediumPriorityTasks: Task[];
    completedTasks: Task[];
  } {
    return {
      highPriorityTasks: this.highPriorityTasks,
      mediumPriorityTasks: this.mediumPriorityTasks,
      completedTasks: this.completedTasks
    };
  }
}

// Export a singleton instance
export const taskService = new TaskService();
export default taskService;