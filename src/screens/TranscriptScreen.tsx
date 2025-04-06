import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSpeechToText } from '../services/audio-processing';
import { recordingService } from '../services/recording-service';

const TranscriptScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { recordingId } = route.params || {};
  
  const [recording, setRecording] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { 
    transcript, 
    isTranscribing, 
    updateTranscript, 
    startTranscription 
  } = useSpeechToText();
  
  useEffect(() => {
    // Load recording details
    const loadRecording = async () => {
      if (recordingId) {
        const rec = recordingService.getRecordingById(recordingId);
        if (rec) {
          setRecording(rec);
          
          if (rec.transcript) {
            // If already has transcript, use it
            updateTranscript(rec.transcript);
          } else {
            // Otherwise start transcription
            startTranscription(rec.audioUri);
          }
        }
      } else {
        // For demo, use a mock recording
        const mockRecordings = recordingService.getRecordings();
        if (mockRecordings.length > 0) {
          const rec = mockRecordings[0];
          setRecording(rec);
          updateTranscript(rec.transcript || '');
        }
      }
    };
    
    loadRecording();
  }, [recordingId]);
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    
    if (isEditing && recording) {
      // Save the edited transcript
      recordingService.updateRecordingTranscript(recording.id, transcript);
    }
  };
  
  const handleTranscriptChange = (text) => {
    updateTranscript(text);
  };
  
  const handleProcessTranscript = async () => {
    if (!recording || !transcript) return;
    
    setIsProcessing(true);
    
    try {
      // Mark recording as processed
      await recordingService.markRecordingAsProcessed(recording.id);
      
      // Navigate to tasks screen
      navigation.navigate('Tasks', { recordingId: recording.id });
      
    } catch (error) {
      console.error('Failed to process transcript', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isTranscribing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#005e46" />
          <Text style={styles.transcribingText}>Transcribing your recording...</Text>
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
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.transcriptContainer}>
          {isEditing ? (
            <TextInput
              style={styles.transcriptInput}
              multiline
              value={transcript}
              onChangeText={handleTranscriptChange}
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={handleEditToggle}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.buttonsContainer}>
          {isEditing ? (
            <TouchableOpacity style={styles.saveButton} onPress={handleEditToggle}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.processButton} 
              onPress={handleProcessTranscript}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Process with Janaru</Text>
              )}
            </TouchableOpacity>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d6ceb9',
  },
  backButton: {
    fontSize: 16,
    color: '#005e46',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcribingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  transcriptContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  transcriptInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    padding: 0,
  },
  buttonsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#005e46',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  processButton: {
    backgroundColor: '#005e46',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TranscriptScreen;