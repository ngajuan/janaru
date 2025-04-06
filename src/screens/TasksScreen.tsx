// src/screens/TasksScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { taskService } from '../services/task-service';
import { recordingService } from '../services/recording-service';
import { googleCalendarService } from '../services/google-calendar-service';
import { useAudioPlayback } from '../services/audio-processing';
import { logger } from '../config';

const TasksScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { recordingId } = route.params || {};
  
  const [tasks, setTasks] = useState({
    highPriorityTasks: [],
    mediumPriorityTasks: [],
    completedTasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [processingTaskId, setProcessingTaskId] = useState(null);
  const [recording, setRecording] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const { loadSound, playSound, pauseSound, isPlaying } = useAudioPlayback();
  
  // Load tasks when screen mounts or when recordingId changes
  useEffect(() => {
    loadTasks();
  }, [recordingId]);
  
  // Load recording info
  useEffect(() => {
    if (recordingId) {
      const rec = recordingService.getRecordingById(recordingId);
      if (rec) {
        setRecording(rec);
      }
    }
  }, [recordingId]);
  
  // Load tasks - either all tasks or tasks for specific recording
  const loadTasks = async () => {
    setLoading(true);
    
    try {
      // Get recording if specified
      if (recordingId) {
        const recording = recordingService.getRecordingById(recordingId);
        
        if (recording && recording.transcript) {
          // Check if recording is already processed
          if (!recording.processed) {
            // Process the transcript to extract tasks
            await taskService.processTranscript(recording.transcript, recordingId);
            
            // Mark recording as processed
            await recordingService.markRecordingAsProcessed(recordingId);
          }
          
          // Get tasks for this recording
          const recordingTasks = taskService.getTasksByRecordingId(recordingId);
          setTasks(recordingTasks);
        } else {
          // No transcript or recording not found
          setTasks({
            highPriorityTasks: [],
            mediumPriorityTasks: [],
            completedTasks: [],
          });
        }
      } else {
        // Get all tasks if no recordingId specified
        const allTasks = taskService.getAllTasks();
        setTasks(allTasks);
      }
    } catch (error) {
      logger.error('Failed to load tasks', error);
      Alert.alert(
        'Error Loading Tasks',
        'Something went wrong while loading your tasks. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Handle playing recording audio
  const handlePlayRecording = async () => {
    if (!recording) return;
    
    try {
      if (isPlaying) {
        await pauseSound();
      } else {
        // If first time playing, load the sound
        if (!playingAudio) {
          const success = await loadSound(recording.audioUri);
          if (success) {
            setPlayingAudio(true);
          } else {
            throw new Error('Failed to load audio');
          }
        }
        await playSound();
      }
    } catch (error) {
      logger.error('Error playing recording', error);
      Alert.alert(
        'Playback Error',
        'Could not play the recording. The file may be missing or corrupted.'
      );
    }
  };
  
  // Mark task as complete
  const handleMarkAsComplete = async (taskId) => {
    try {
      setProcessingTaskId(taskId);
      await taskService.markTaskAsCompleted(taskId);
      
      // Refresh tasks
      if (recordingId) {
        const recordingTasks = taskService.getTasksByRecordingId(recordingId);
        setTasks(recordingTasks);
      } else {
        const allTasks = taskService.getAllTasks();
        setTasks(allTasks);
      }
    } catch (error) {
      logger.error('Failed to mark task as completed', error);
      Alert.alert(
        'Error',
        'Failed to mark task as completed. Please try again.'
      );
    } finally {
      setProcessingTaskId(null);
    }
  };
  
  // Add task to Google Calendar
  const handlePushToCalendar = async (taskId) => {
    try {
      setProcessingTaskId(taskId);
      
      // Check if Google is connected
      const isGoogleConnected = await googleCalendarService.isSignedIn();
      
      if (!isGoogleConnected) {
        // Ask user to connect to Google
        Alert.alert(
          'Google Calendar Not Connected',
          'Would you like to connect to Google Calendar now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Connect', 
              onPress: async () => {
                const success = await googleCalendarService.signIn();
                if (success) {
                  // Try again after successful sign-in
                  handlePushToCalendar(taskId);
                } else {
                  Alert.alert(
                    'Connection Failed',
                    'Could not connect to Google Calendar. Please try again in Settings.'
                  );
                }
              }
            }
          ]
        );
        setProcessingTaskId(null);
        return;
      }
      
      // Add task to calendar
      const calendarEventId = await taskService.addTaskToCalendar(taskId);
      
      if (calendarEventId) {
        // Refresh tasks
        if (recordingId) {
          const recordingTasks = taskService.getTasksByRecordingId(recordingId);
          setTasks(recordingTasks);
        } else {
          const allTasks = taskService.getAllTasks();
          setTasks(allTasks);
        }
        
        // Show success message
        Alert.alert(
          'Success',
          'Task has been added to your Google Calendar.'
        );
      } else {
        throw new Error('Failed to create calendar event');
      }
    } catch (error) {
      logger.error('Failed to push task to calendar', error);
      Alert.alert(
        'Calendar Error',
        'Failed to add task to calendar. Please try again.'
      );
    } finally {
      setProcessingTaskId(null);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };
  
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `(${mins}min)`;
    } else if (mins === 0) {
      return `(${hours}hr)`;
    } else {
      return `(${hours}.${Math.floor(mins / 6)}hr)`;
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#005e46" />
          <Text style={styles.loadingText}>Processing tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        
        {recording && (
          <TouchableOpacity 
            style={[
              styles.recordingButton, 
              isPlaying ? styles.recordingButtonActive : null
            ]} 
            onPress={handlePlayRecording}
          >
            <Text style={[
              styles.recordingButtonText,
              isPlaying ? styles.recordingButtonTextActive : null
            ]}>
              {isPlaying ? 'Pause' : 'Play Recording'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={styles.content}>
        {/* High Priority Tasks */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>High Priority (Do This Week)</Text>
          
          {tasks.highPriorityTasks.length === 0 ? (
            <Text style={styles.emptyText}>No high priority tasks</Text>
          ) : (
            tasks.highPriorityTasks.map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDateTime}>
                    {task.date ? `${formatDate(task.date)}` : ''}
                    {task.time ? ` at ${formatTime(task.time)}` : ''}
                    {task.duration ? ` ${formatDuration(task.duration)}` : ''}
                  </Text>
                  
                  {/* Subtasks if any */}
                  {task.subTasks && task.subTasks.length > 0 && (
                    <View style={styles.subtasksContainer}>
                      {task.subTasks.map(subtask => (
                        <Text key={subtask.id} style={styles.subtaskText}>
                          • {subtask.title}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                
                {processingTaskId === task.id ? (
                  <View style={styles.buttonContainer}>
                    <ActivityIndicator size="small" color="#005e46" />
                  </View>
                ) : task.calendarEventId ? (
                  <TouchableOpacity 
                    style={styles.completedButton}
                    onPress={() => handleMarkAsComplete(task.id)}
                  >
                    <Text style={styles.completedButtonText}>✓</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.pushButton}
                    onPress={() => handlePushToCalendar(task.id)}
                  >
                    <Text style={styles.pushButtonText}>Push</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
        
        {/* Medium Priority Tasks */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Medium Priority (Next 1-2 weeks)</Text>
          
          {tasks.mediumPriorityTasks.length === 0 ? (
            <Text style={styles.emptyText}>No medium priority tasks</Text>
          ) : (
            tasks.mediumPriorityTasks.map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDateTime}>
                    {task.date ? `${formatDate(task.date)}` : ''}
                    {task.time ? ` at ${formatTime(task.time)}` : ''}
                    {task.duration ? ` ${formatDuration(task.duration)}` : ''}
                  </Text>
                  
                  {/* Subtasks if any */}
                  {task.subTasks && task.subTasks.length > 0 && (
                    <View style={styles.subtasksContainer}>
                      {task.subTasks.map(subtask => (
                        <Text key={subtask.id} style={styles.subtaskText}>
                          • {subtask.title}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                
                {processingTaskId === task.id ? (
                  <View style={styles.buttonContainer}>
                    <ActivityIndicator size="small" color="#005e46" />
                  </View>
                ) : task.calendarEventId ? (
                  <TouchableOpacity 
                    style={styles.completedButton}
                    onPress={() => handleMarkAsComplete(task.id)}
                  >
                    <Text style={styles.completedButtonText}>✓</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.pushButton}
                    onPress={() => handlePushToCalendar(task.id)}
                  >
                    <Text style={styles.pushButtonText}>Push</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
        
        {/* Completed Tasks Section */}
        {tasks.completedTasks.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Completed Tasks</Text>
            
            {tasks.completedTasks.map(task => (
              <View key={task.id} style={[styles.taskCard, styles.taskCardCompleted]}>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, styles.taskTitleCompleted]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskDateTime}>
                    {task.date ? `${formatDate(task.date)}` : ''}
                    {task.time ? ` at ${formatTime(task.time)}` : ''}
                  </Text>
                </View>
                
                <View style={styles.completedTag}>
                  <Text style={styles.completedTagText}>Done</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d6ceb9',
  },
  backButton: {
    fontSize: 16,
    color: '#005e46',
  },
  recordingButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#005e46',
  },
  recordingButtonActive: {
    backgroundColor: '#005e46',
  },
  recordingButtonText: {
    fontSize: 14,
    color: '#005e46',
  },
  recordingButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  taskCardCompleted: {
    backgroundColor: '#f0f0f0',
    borderLeftWidth: 4,
    borderLeftColor: '#005e46',
  },
  taskContent: {
    flex: 1,
    padding: 16,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#666666',
  },
  taskDateTime: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  subtasksContainer: {
    marginTop: 8,
  },
  subtaskText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  buttonContainer: {
    padding: 16,
    marginRight: 8,
  },
  pushButton: {
    backgroundColor: '#005e46',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
    borderRadius: 4,
  },
  pushButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  completedButton: {
    backgroundColor: '#005e46',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  completedButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  completedTag: {
    backgroundColor: '#005e46',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 16,
  },
  completedTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TasksScreen;