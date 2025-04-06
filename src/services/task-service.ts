// src/services/task-service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { claudeApiService } from './claude-api-service';
import { googleCalendarService } from './google-calendar-service';
import { logger } from '../config';
import { generateSecureId } from '../utils/encryption';

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
      
      logger.info('Tasks loaded from storage', {
        highPriority: this.highPriorityTasks.length,
        mediumPriority: this.mediumPriorityTasks.length,
        completed: this.completedTasks.length
      });
    } catch (error) {
      logger.error('Failed to load tasks from storage', error);
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
      
      logger.debug('Tasks saved to storage');
    } catch (error) {
      logger.error('Failed to save tasks to storage', error);
    }
  }
  
  /**
   * Process a transcript to extract and prioritize tasks
   */
  public async processTranscript(transcript: string, recordingId: string): Promise<ProcessTranscriptResponse> {
    try {
      logger.info('Processing transcript', { recordingId, transcriptLength: transcript.length });
      
      // Use Claude API to extract tasks
      const response = await claudeApiService.processTranscript(transcript, recordingId);
      
      // Ensure all tasks have IDs and completed status
      response.highPriorityTasks.forEach(task => {
        if (!task.id) task.id = generateSecureId('task');
        task.completed = false;
        
        // Ensure all subtasks have IDs
        if (task.subTasks) {
          task.subTasks.forEach(subTask => {
            if (!subTask.id) subTask.id = generateSecureId('subtask');
            subTask.completed = false;
          });
        }
      });
      
      response.mediumPriorityTasks.forEach(task => {
        if (!task.id) task.id = generateSecureId('task');
        task.completed = false;
        
        // Ensure all subtasks have IDs
        if (task.subTasks) {
          task.subTasks.forEach(subTask => {
            if (!subTask.id) subTask.id = generateSecureId('subtask');
            subTask.completed = false;
          });
        }
      });
      
      // Remove any existing tasks for this recording to prevent duplicates
      this.highPriorityTasks = this.highPriorityTasks.filter(task => task.recordingId !== recordingId);
      this.mediumPriorityTasks = this.mediumPriorityTasks.filter(task => task.recordingId !== recordingId);
      
      // Add the new tasks
      this.highPriorityTasks = [...this.highPriorityTasks, ...response.highPriorityTasks];
      this.mediumPriorityTasks = [...this.mediumPriorityTasks, ...response.mediumPriorityTasks];
      
      // Save to storage
      await this.saveTasks();
      
      logger.info('Transcript processed successfully', {
        highPriorityTasks: response.highPriorityTasks.length,
        mediumPriorityTasks: response.mediumPriorityTasks.length
      });
      
      return response;
    } catch (error) {
      logger.error('Failed to process transcript', error);
      throw new Error('Failed to extract tasks from transcript');
    }
  }
  
  /**
   * Add a single task
   */
  public async addTask(task: Task): Promise<string> {
    // Generate ID if not provided
    if (!task.id) {
      task.id = generateSecureId('task');
    }
    
    // Ensure completed status
    task.completed = task.completed || false;
    
    // Add to appropriate array based on priority
    if (task.priority === 'high') {
      this.highPriorityTasks.push(task);
    } else {
      this.mediumPriorityTasks.push(task);
    }
    
    // Save changes
    await this.saveTasks();
    
    return task.id;
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
  
  /**
   * Get tasks for a specific recording
   */
  public getTasksByRecordingId(recordingId: string): {
    highPriorityTasks: Task[];
    mediumPriorityTasks: Task[];
    completedTasks: Task[];
  } {
    return {
      highPriorityTasks: this.highPriorityTasks.filter(task => task.recordingId === recordingId),
      mediumPriorityTasks: this.mediumPriorityTasks.filter(task => task.recordingId === recordingId),
      completedTasks: this.completedTasks.filter(task => task.recordingId === recordingId)
    };
  }
  
  /**
   * Get a task by ID
   */
  public getTaskById(taskId: string): Task | null {
    // Check in high priority tasks
    let task = this.highPriorityTasks.find(t => t.id === taskId);
    if (task) return task;
    
    // Check in medium priority tasks
    task = this.mediumPriorityTasks.find(t => t.id === taskId);
    if (task) return task;
    
    // Check in completed tasks
    task = this.completedTasks.find(t => t.id === taskId);
    if (task) return task;
    
    return null;
  }
  
  /**
   * Update a task
   */
  public async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    let task = this.getTaskById(taskId);
    if (!task) return null;
    
    // Apply updates
    Object.assign(task, updates);
    
    // Save changes
    await this.saveTasks();
    
    return task;
  }
  
  /**
   * Mark a task as completed
   */
  public async markTaskAsCompleted(taskId: string): Promise<void> {
    try {
      // Find the task
      const task = this.getTaskById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Mark as completed
      task.completed = true;
      
      // Move from active lists to completed list
      if (task.priority === 'high') {
        this.highPriorityTasks = this.highPriorityTasks.filter(t => t.id !== taskId);
      } else {
        this.mediumPriorityTasks = this.mediumPriorityTasks.filter(t => t.id !== taskId);
      }
      
      this.completedTasks.push(task);
      
      // Save changes
      await this.saveTasks();
      
      logger.info('Task marked as completed', { taskId });
    } catch (error) {
      logger.error('Failed to mark task as completed', { taskId, error });
      throw error;
    }
  }
  
  /**
   * Add a task to Google Calendar
   */
  public async addTaskToCalendar(taskId: string): Promise<string | null> {
    try {
      // Find the task
      const task = this.getTaskById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Check if task already has a calendar event
      if (task.calendarEventId) {
        logger.info('Task already has a calendar event', { taskId, calendarEventId: task.calendarEventId });
        return task.calendarEventId;
      }
      
      // Add to Google Calendar
      const calendarEventId = await googleCalendarService.createEventForTask(task);
      
      if (calendarEventId) {
        // Update task with calendar event ID
        await this.updateTaskWithCalendarEvent(taskId, calendarEventId);
        logger.info('Task added to calendar', { taskId, calendarEventId });
      }
      
      return calendarEventId;
    } catch (error) {
      logger.error('Failed to add task to calendar', { taskId, error });
      throw error;
    }
  }
  
  /**
   * Update a task with Google Calendar event ID
   */
  public async updateTaskWithCalendarEvent(taskId: string, calendarEventId: string): Promise<void> {
    try {
      // Find the task
      const task = this.getTaskById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Update the task
      task.calendarEventId = calendarEventId;
      
      // Save changes
      await this.saveTasks();
      
      logger.info('Task updated with calendar event', { taskId, calendarEventId });
    } catch (error) {
      logger.error('Failed to update task with calendar event', { taskId, error });
      throw error;
    }
  }
  
  /**
   * Delete a task
   */
  public async deleteTask(taskId: string): Promise<void> {
    try {
      // Remove from all task lists
      this.highPriorityTasks = this.highPriorityTasks.filter(task => task.id !== taskId);
      this.mediumPriorityTasks = this.mediumPriorityTasks.filter(task => task.id !== taskId);
      this.completedTasks = this.completedTasks.filter(task => task.id !== taskId);
      
      // Save changes
      await this.saveTasks();
      
      logger.info('Task deleted', { taskId });
    } catch (error) {
      logger.error('Failed to delete task', { taskId, error });
      throw error;
    }
  }
  
  /**
   * Clear all tasks
   */
  public async clearAllTasks(): Promise<void> {
    try {
      this.highPriorityTasks = [];
      this.mediumPriorityTasks = [];
      this.completedTasks = [];
      
      await this.saveTasks();
      
      logger.info('All tasks cleared');
    } catch (error) {
      logger.error('Failed to clear all tasks', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const taskService = new TaskService();
export default taskService;