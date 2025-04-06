import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Types
export interface Recording {
  id: string;
  title: string;
  date: string;
  audioUri: string;
  transcript: string | null;
  duration: number;
  processed: boolean;
  fileSize?: number;
}

class RecordingService {
  private recordings: Recording[] = [];
  
  constructor() {
    // Load recordings from storage on initialization
    this.loadRecordings();
  }
  
  /**
   * Load recordings from local storage
   */
  private async loadRecordings(): Promise<void> {
    try {
      const recordingsString = await AsyncStorage.getItem('@janaru_recordings');
      if (recordingsString) {
        this.recordings = JSON.parse(recordingsString);
      }
    } catch (error) {
      console.error('Failed to load recordings from storage', error);
    }
  }
  
  /**
   * Save recordings to local storage
   */
  private async saveRecordings(): Promise<void> {
    try {
      await AsyncStorage.setItem('@janaru_recordings', JSON.stringify(this.recordings));
    } catch (error) {
      console.error('Failed to save recordings to storage', error);
    }
  }
  
  /**
   * Add a new recording
   */
  public async addRecording(recording: Recording): Promise<string> {
    // Generate ID if not provided
    if (!recording.id) {
      recording.id = `rec_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }
    
    // Add to array
    this.recordings.push(recording);
    
    // Save changes
    await this.saveRecordings();
    
    return recording.id;
  }
  
  /**
   * Get all recordings
   */
  public getRecordings(): Recording[] {
    // Sort by date (newest first)
    return [...this.recordings].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }
  
  /**
   * Get a recording by ID
   */
  public getRecordingById(id: string): Recording | undefined {
    return this.recordings.find(recording => recording.id === id);
  }
  
  /**
   * Update a recording's transcript
   */
  public async updateRecordingTranscript(id: string, transcript: string): Promise<void> {
    const recording = this.recordings.find(rec => rec.id === id);
    if (!recording) {
      throw new Error('Recording not found');
    }
    
    recording.transcript = transcript;
    
    // Save changes
    await this.saveRecordings();
  }
  
  /**
   * Mark a recording as processed
   */
  public async markRecordingAsProcessed(id: string): Promise<void> {
    const recording = this.recordings.find(rec => rec.id === id);
    if (!recording) {
      throw new Error('Recording not found');
    }
    
    recording.processed = true;
    
    // Save changes
    await this.saveRecordings();
  }
  
  /**
   * Add mock recordings for demo
   */
  public async addMockRecordings(): Promise<void> {
    // Check if we already have recordings
    if (this.recordings.length > 0) {
      return;
    }
    
    const mockRecordings: Recording[] = [
      {
        id: 'rec_1',
        title: 'Vent from Washington Heights',
        date: '2025-03-21T10:30:00.000Z',
        audioUri: 'file:///mock/recording1.m4a', // Mock URI
        transcript: "I am going to start talking about a lot of things. What I need you to do is make all of the things that I'm talking about actionable for me. And prioritize them accordingly. Starting now. So I need to do my taxes. I need to throw away the the small batches of batches of trees, my family and I cut up find somewhere to dispose of that. I need to go buy some clothes for next week. Plan some time for my vacation time as I need some time to get away and be alone, since I'm I'm feeling kind of burnt out from work. I need to help my mom get her driver's license. Need to take, my dog to a doctor etcetera. Find time for me based off my calendar of 6 pm edt.",
        duration: 32,
        processed: true
      },
      {
        id: 'rec_2',
        title: 'Vent from Washington Heights',
        date: '2025-03-21T15:45:00.000Z',
        audioUri: 'file:///mock/recording2.m4a', // Mock URI
        transcript: null,
        duration: 18,
        processed: false
      }
    ];
    
    // Add mock recordings
    this.recordings = [...this.recordings, ...mockRecordings];
    
    // Save changes
    await this.saveRecordings();
  }
}

// Export a singleton instance
export const recordingService = new RecordingService();
export default recordingService;