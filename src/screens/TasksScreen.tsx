import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { taskService } from '../services/task-service';
import { recordingService } from '../services/recording-service';
import { useAudioPlayback } from '../services/audio-processing';

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
  const [recording, setRecording] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const { loadSound, playSound, pauseSound, isPlaying } = useAudioPlayback();
  
  useEffect(() => {
    // Load tasks for this recording
    const loadTasks = async () => {
      setLoading(true);
      
      try {
        if (recordingId) {
          // In a real implementation, we'd get tasks by recording ID
          // For demo, use mock data and process transcript
          const recording = recordingService.getRecordingById(recordingId);
          
          if (recording && recording.transcript) {
            // Process the transcript to extract tasks
            await taskService.processTranscript(recording.transcript, recordingId);
          }
        }
        
        // Get all tasks
        const allTasks = taskService.getAllTasks();
        setTasks(allTasks);
        
      } catch (error) {
        console.error('Failed to load tasks', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTasks();
  }, [recordingId]);
  
  useEffect(() => {
    if (recordingId) {
      const rec = recordingService.getRecordingById(recordingId);
      if (rec) {
        setRecording(rec);
      }
    }
  }, [recordingId]);
  
  const handlePlayRecording = async () => {
    if (!recording) return;
    
    if (isPlaying) {
      await pauseSound();
      setPlayingAudio(false);
    } else {
      // If first time playing, load the sound
      if (!playingAudio) {
        await loadSound(recording.audioUri);
        setPlayingAudio(true);
      }
      await playSound();
    }
  };
  
  const handleMarkAsComplete = async (taskId) => {
    try {
      await taskService.markTaskAsCompleted(taskId);
      
      // Refresh tasks
      const allTasks = taskService.getAllTasks();
      setTasks(allTasks);
      
    } catch (error) {
      console.error('Failed to mark task as completed', error);
    }
  };
  
  const handlePushToCalendar = async (taskId) => {
    // For demo purposes, just mark the task as having a calendar event
    try {
      const mockEventId = `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      await taskService.updateTaskWithCalendarEvent(taskId, mockEventId);
      
      // Refresh tasks
      const allTasks = taskService.getAllTasks();
      setTasks(allTasks);
      
    } catch (error) {
      console.error('Failed to push task to calendar', error);
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
        
        <TouchableOpacity 
          style={[
            styles.recordingButton, 
            isPlaying ? styles.recordingButtonActive : null
          ]} 
          onPress={handlePlayRecording}
        >
          <Text style={styles.recordingButtonText}>
            {isPlaying ? 'Pause' : 'Play Recording'}
          </Text>
        </TouchableOpacity>
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
                
                {task.calendarEventId ? (
                  <TouchableOpacity style={styles.completedButton}>
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
                
                {task.calendarEventId ? (
                  <TouchableOpacity style={styles.completedButton}>
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
    borderColor: '#f5f0e7',
  },
  recordingButtonText: {
    fontSize: 14,
    color: '#005e46',
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
});

export default TasksScreen;