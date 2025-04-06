// src/screens/TranscriptScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  ActivityIndicator, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ProgressBarAndroid,
  ProgressViewIOS
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSpeechToText } from '../services/audio-processing';
import { recordingService } from '../services/recording-service';
import { logger } from '../config';

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
    transcriptionError,
    progressPercentage,
    updateTranscript, 
    startTranscription 
  } = useSpeechToText();
  
  // Handle back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isTranscribing) {
          // Show confirmation dialog when transcribing
          Alert.alert(
            'Transcription in Progress',
            'Are you sure you want to cancel the transcription process?',
            [
              { text: 'Stay', style: 'cancel', onPress: () => {} },
              { 
                text: 'Cancel Transcription', 
                style: 'destructive', 
                onPress: () => navigation.goBack() 
              },
            ]
          );
          return true; // Prevent default behavior
        }
        
        if (isEditing && transcript) {
          // Save edits before navigating back
          setIsEditing(false);
          if (recording) {
            recordingService.updateRecordingTranscript(recording.id, transcript)
              .then(() => navigation.goBack())
              .catch(error => {
                logger.error('Failed to save transcript before navigation', error);
                navigation.goBack();
              });
          } else {
            navigation.goBack();
          }
          return true; // Prevent default behavior
        }
        
        return false; // Let default behavior happen
      };
      
      // Add back button listener
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [isTranscribing, isEditing, transcript, recording, navigation])
  );
  
  useEffect(() => {
    // Load recording details
    const loadRecording = async () => {
      try {
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
          } else {
            logger.error('Recording not found', { recordingId });
            Alert.alert(
              'Error',
              'Recording not found.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        } else {
          // No recording ID provided
          logger.error('No recordingId provided to TranscriptScreen');
          Alert.alert(
            'Error',
            'No recording specified.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } catch (error) {
        logger.error('Failed to load recording or start transcription', error);
        Alert.alert(
          'Error',
          'Failed to load recording or start transcription.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    };
    
    loadRecording();
  }, [recordingId]);
  
  // Handle editing the transcript
  const handleEditToggle = () => {
    if (isEditing && recording) {
      // Save the edited transcript
      recordingService.updateRecordingTranscript(recording.id, transcript)
        .then(() => {
          setIsEditing(false);
          logger.info('Transcript saved successfully');
        })
        .catch(error => {
          logger.error('Failed to save transcript', error);
          Alert.alert(
            'Error',
            'Failed to save transcript. Please try again.'
          );
        });
    } else {
      setIsEditing(true);
    }
  };
  
  // Handle transcript text changes
  const handleTranscriptChange = (text) => {
    updateTranscript(text);
  };
  
  // Process transcript to extract tasks
  const handleProcessTranscript = async () => {
    if (!recording || !transcript) {
      Alert.alert('Error', 'No transcript available to process.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Update the transcript in the recording
      await recordingService.updateRecordingTranscript(recording.id, transcript);
      
      // Mark recording as processed
      await recordingService.markRecordingAsProcessed(recording.id);
      
      // Navigate to tasks screen
      navigation.navigate('Tasks', { recordingId: recording.id });
      
    } catch (error) {
      logger.error('Failed to process transcript', error);
      Alert.alert(
        'Processing Error',
        'Failed to process transcript. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Transcribing state - show progress
  if (isTranscribing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                'Transcription in Progress',
                'Are you sure you want to cancel the transcription process?',
                [
                  { text: 'Stay', style: 'cancel', onPress: () => {} },
                  { 
                    text: 'Cancel Transcription', 
                    style: 'destructive', 
                    onPress: () => navigation.goBack() 
                  },
                ]
              );
            }}
          >
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#005e46" />
          <Text style={styles.transcribingText}>Transcribing your recording...</Text>
          
          <View style={styles.progressContainer}>
            {Platform.OS === 'android' ? (
              <ProgressBarAndroid
                styleAttr="Horizontal"
                indeterminate={progressPercentage === 0}
                progress={progressPercentage / 100}
                color="#005e46"
              />
            ) : (
              <ProgressViewIOS
                progress={progressPercentage / 100}
                progressTintColor="#005e46"
              />
            )}
            <Text style={styles.progressText}>{progressPercentage}%</Text>
          </View>
          
          {transcript && (
            <View style={styles.partialTranscriptContainer}>
              <Text style={styles.partialTranscriptTitle}>Partial Transcript:</Text>
              <ScrollView style={styles.partialTranscriptScroll}>
                <Text style={styles.partialTranscriptText}>{transcript}</Text>
              </ScrollView>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }
  
  // Show transcription error
  if (transcriptionError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.centeredContainer}>
          <Text style={styles.errorTitle}>Transcription Error</Text>
          <Text style={styles.errorText}>{transcriptionError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => recording && startTranscription(recording.audioUri)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Normal state - show transcript
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={handleEditToggle}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
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
                placeholder="Transcript is empty. Type or try recording again."
              />
            ) : (
              <TouchableOpacity onPress={handleEditToggle}>
                <Text style={styles.transcriptText}>
                  {transcript || 'No transcript available. Tap to edit manually.'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {!isEditing && (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.processButton} 
                onPress={handleProcessTranscript}
                disabled={isProcessing || !transcript}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Process with Janaru</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#005e46',
  },
  editButtonText: {
    fontSize: 14,
    color: '#005e46',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  transcribingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  progressContainer: {
    width: '80%',
    marginTop: 20,
    alignItems: 'center',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  partialTranscriptContainer: {
    marginTop: 30,
    width: '90%',
    maxHeight: '60%',
  },
  partialTranscriptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  partialTranscriptScroll: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  partialTranscriptText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5827a',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#005e46',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    minHeight: 200,
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
    minHeight: 200,
  },
  buttonsContainer: {
    alignItems: 'center',
    marginBottom: 24,
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