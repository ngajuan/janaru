import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAudioRecorder } from '../services/audio-processing';
import { recordingService } from '../services/recording-service';

const RecordingScreen = () => {
  const navigation = useNavigation();
  const { 
    isRecording, 
    duration, 
    audioUri, 
    audioLevels, 
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording 
  } = useAudioRecorder();
  
  // Start recording when screen mounts
  useEffect(() => {
    startRecording();
    
    // Clean up when screen unmounts
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);
  
  const handleStopRecording = async () => {
    await stopRecording();
    
    if (audioUri) {
      // Create a new recording entry
      const newRecording = {
        id: `rec_${Date.now()}`,
        title: 'Vent from Washington Heights',
        date: new Date().toISOString(),
        audioUri,
        transcript: null,
        duration,
        processed: false,
      };
      
      // Add to recordings
      const recordingId = await recordingService.addRecording(newRecording);
      
      // Navigate to transcript screen
      navigation.navigate('Transcript', { recordingId });
    }
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#333333" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.audioLevelsContainer}>
        {audioLevels.map((level, index) => (
          <View
            key={index}
            style={[
              styles.audioLevelBar,
              { height: Math.max(3, level * 0.4) }
            ]}
          />
        ))}
      </View>
      
      <View style={styles.durationContainer}>
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
      </View>
      
      <View style={styles.controlsContainer}>
        {isRecording ? (
          <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.recordButton} onPress={resumeRecording}>
            <View style={styles.recordIcon} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333333',
  },
  header: {
    padding: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  audioLevelsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  audioLevelBar: {
    width: 3,
    marginHorizontal: 1,
    backgroundColor: '#f5827a',
    borderRadius: 1.5,
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  durationText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f5827a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  stopButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5827a',
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#f5827a',
  },
});

export default RecordingScreen;