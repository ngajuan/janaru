import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { recordingService } from '../services/recording-service';

const RecordingScreen = () => {
  const navigation = useNavigation();
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [complete, setComplete] = useState(false);
  const [audioLevels, setAudioLevels] = useState([]);
  
  // Timer ref
  const timerRef = React.useRef(null);
  const levelsRef = React.useRef(null);
  
  // Start recording simulation on mount
  useEffect(() => {
    startRecordingSimulation();
    
    // Cleanup on unmount
    return () => {
      stopRecordingSimulation();
    };
  }, []);
  
  // Start recording simulation
  const startRecordingSimulation = () => {
    setRecording(true);
    setDuration(0);
    setComplete(false);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    
    // Simulate audio levels
    levelsRef.current = setInterval(() => {
      const newLevel = Math.floor(Math.random() * 80) + 10;
      setAudioLevels(prev => [...prev, newLevel].slice(-50));
    }, 100);
  };
  
  // Stop recording simulation
  const stopRecordingSimulation = () => {
    setRecording(false);
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Clear audio levels
    if (levelsRef.current) {
      clearInterval(levelsRef.current);
      levelsRef.current = null;
    }
    
    // Set complete
    setComplete(true);
  };
  
  // Handle record button press
  const handleRecordPress = () => {
    if (recording) {
      stopRecordingSimulation();
    } else {
      startRecordingSimulation();
    }
  };
  
  // Handle done button press
  const handleDonePress = async () => {
    // Create a mock recording entry
    const mockRecording = {
      id: `rec_${Date.now()}`,
      title: 'Vent from Washington Heights',
      date: new Date().toISOString(),
      audioUri: 'file:///mock/recording.m4a',
      transcript: null,
      duration: duration,
      processed: false,
    };
    
    // Add to recordings service
    const recordingId = await recordingService.addRecording(mockRecording);
    
    // Navigate to transcript screen
    navigation.navigate('Transcript', { recordingId });
  };
  
  // Format duration
  const formatDuration = (seconds) => {
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
        {recording ? (
          <TouchableOpacity style={styles.stopButton} onPress={handleRecordPress}>
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.recordButton} onPress={handleRecordPress}>
            <View style={styles.recordIcon} />
          </TouchableOpacity>
        )}
        
        {/* Show Done button when recording is complete */}
        {complete && (
          <TouchableOpacity style={styles.doneButton} onPress={handleDonePress}>
            <Text style={styles.doneButtonText}>Done</Text>
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
    marginBottom: 20,
  },
  stopButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  doneButton: {
    backgroundColor: '#f5827a',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RecordingScreen;