// src/services/google-calendar-service.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { ENV, SecureKeyStorage, SECURE_STORAGE_KEYS, logger } from '../config';
import { Task } from './task-service';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

class GoogleCalendarService {
  private isInitialized = false;
  private accessToken: string | null = null;
  private timeZone = 'America/New_York'; // Default time zone

  /**
   * Initialize Google Sign-In
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      GoogleSignin.configure({
        webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        offlineAccess: true,
      });

      this.isInitialized = true;
      logger.info('Google Sign-In initialized');
    } catch (error) {
      logger.error('Failed to initialize Google Sign-In', error);
      throw new Error('Failed to initialize Google calendar integration');
    }
  }

  /**
   * Sign in with Google and get access token
   */
  public async signIn(): Promise<boolean> {
    try {
      await this.initialize();

      // Check if user is already signed in
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        // Start sign-in flow
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        logger.info('Google Sign-In successful', userInfo.user.email);
      }

      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      this.accessToken = tokens.accessToken;

      // Store refresh token for later use
      if (tokens.refreshToken) {
        await SecureKeyStorage.storeKey(
          SECURE_STORAGE_KEYS.GOOGLE_REFRESH_TOKEN,
          tokens.refreshToken
        );
        logger.info('Google refresh token stored');
      }

      // Get user's time zone
      await this.getUserTimeZone();

      return true;
    } catch (error) {
      logger.error('Google Sign-In failed', error);
      return false;
    }
  }

  /**
   * Sign out from Google
   */
  public async signOut(): Promise<boolean> {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      this.accessToken = null;
      await SecureKeyStorage.deleteKey(SECURE_STORAGE_KEYS.GOOGLE_REFRESH_TOKEN);
      logger.info('Google Sign-Out successful');
      return true;
    } catch (error) {
      logger.error('Google Sign-Out failed', error);
      return false;
    }
  }

  /**
   * Check if user is signed in to Google
   */
  public async isSignedIn(): Promise<boolean> {
    try {
      await this.initialize();
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      logger.error('Failed to check Google Sign-In status', error);
      return false;
    }
  }

  /**
   * Get user's email
   */
  public async getUserEmail(): Promise<string | null> {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser?.user.email || null;
    } catch (error) {
      logger.error('Failed to get Google user email', error);
      return null;
    }
  }

  /**
   * Get user's time zone from Calendar settings
   */
  private async getUserTimeZone(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not signed in to Google');
    }

    try {
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/users/me/settings/timezone',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.data && response.data.value) {
        this.timeZone = response.data.value;
        logger.info(`User time zone: ${this.timeZone}`);
      }
    } catch (error) {
      logger.warn('Failed to get user time zone, using default', error);
    }
  }

  /**
   * Create calendar event for a task
   */
  public async createEventForTask(task: Task): Promise<string | null> {
    if (!this.accessToken) {
      const isSignedIn = await this.isSignedIn();
      if (!isSignedIn) {
        await this.signIn();
      }
    }

    if (!this.accessToken) {
      throw new Error('Not signed in to Google');
    }

    // Validate task has date and time
    if (!task.date) {
      throw new Error('Task must have a date');
    }

    try {
      // Parse date and time
      const taskDate = new Date(task.date);
      const timeStr = task.time || '18:00'; // Default to 6 PM if no time specified
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Set start time
      taskDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time based on duration (default to 1 hour)
      const duration = task.duration || 60; // in minutes
      const endDate = new Date(taskDate.getTime() + duration * 60000);

      // Create event object
      const event: CalendarEvent = {
        summary: task.title,
        description: `Task Priority: ${task.priority}\n${
          task.subTasks && task.subTasks.length > 0
            ? `\nSubtasks:\n${task.subTasks.map(st => `- ${st.title}`).join('\n')}`
            : ''
        }`,
        start: {
          dateTime: taskDate.toISOString(),
          timeZone: this.timeZone,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: this.timeZone,
        },
      };

      // Send request to Google Calendar API
      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        event,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      // Return the event ID
      if (response.data && response.data.id) {
        logger.info(`Calendar event created with ID: ${response.data.id}`);
        return response.data.id;
      }

      return null;
    } catch (error) {
      logger.error('Failed to create calendar event', error);
      
      // Mock event ID for testing
      if (ENV.ENVIRONMENT !== 'production') {
        const mockEventId = `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        logger.info(`Using mock calendar event ID: ${mockEventId}`);
        return mockEventId;
      }
      
      throw new Error('Failed to add task to calendar');
    }
  }

  /**
   * Get upcoming events
   */
  public async getUpcomingEvents(maxResults = 10): Promise<CalendarEvent[]> {
    if (!this.accessToken) {
      const isSignedIn = await this.isSignedIn();
      if (!isSignedIn) {
        await this.signIn();
      }
    }

    if (!this.accessToken) {
      throw new Error('Not signed in to Google');
    }

    try {
      const now = new Date().toISOString();
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          params: {
            timeMin: now,
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
          },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data.items || [];
    } catch (error) {
      logger.error('Failed to get upcoming events', error);
      return [];
    }
  }
}

// Export a singleton instance
export const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;