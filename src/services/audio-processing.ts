// src/services/audio-processing.ts
import { Audio } from 'expo-av';
import { useRef, useEffect, useState } from 'react';

/**
 * Audio Recording Service - Hook for audio recording functionality
 */
export function useAudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUri, setAudioUri] = useState(null);
  const [audioLevels, setAudioLevels] = useState([]);
  
  const durationTimerRef = useRef(null);
  const levelMonitorRef = useRef(null);
  
  // Start recording function
  const startRecording = async () => {
    try {
      // Request permissions
      console.log('Requesting permissions...');
      await Audio.requestPermissionsAsync();
      
      // Configure audio mode - using simplified version
      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Create and prepare the recording object
      console.log('Creating recording...');
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      
      // Start the recording
      console.log('Starting recording...');
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      setAudioLevels([]);
      
      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Start audio level monitoring (for visualization)
      startAudioLevelMonitoring();
      
    } catch (error) {
      console.error('Failed to start recording', error);
      // Handle error - show user a notification
    }
  };
  
  // Function to monitor audio levels for visualization
  const startAudioLevelMonitoring = () => {
    // For demo, simulate audio levels
    levelMonitorRef.current = setInterval(() => {
      // Generate random audio levels between 10 and 90
      const randomLevel = Math.floor(Math.random() * 80) + 10;
      setAudioLevels(prev => [...prev, randomLevel].slice(-50)); // Keep last 50 samples
    }, 100); // Sample every 100ms
  };
  
  // Stop recording function
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      // Stop the recording
      await recording.stopAndUnloadAsync();
      
      // Get the recorded URI
      const uri = recording.getURI();
      if (uri) {
        setAudioUri(uri);
      }
      
      // Clear timers
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (levelMonitorRef.current) {
        clearInterval(levelMonitorRef.current);
      }
      
      // Reset recording state
      setIsRecording(false);
      setRecording(null);
      
    } catch (error) {
      console.error('Failed to stop recording', error);
      // Handle error - show user a notification
    }
  };
  
  // Pause recording function
  const pauseRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.pauseAsync();
      
      // Pause duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      
      // Pause audio level monitoring
      if (levelMonitorRef.current) {
        clearInterval(levelMonitorRef.current);
      }
      
      // Update state
      setIsRecording(false);
      
    } catch (error) {
      console.error('Failed to pause recording', error);
      // Handle error
    }
  };
  
  // Resume recording function
  const resumeRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.startAsync();
      
      // Resume duration timer
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Resume audio level monitoring
      startAudioLevelMonitoring();
      
      // Update state
      setIsRecording(true);
      
    } catch (error) {
      console.error('Failed to resume recording', error);
      // Handle error
    }
  };
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (levelMonitorRef.current) {
        clearInterval(levelMonitorRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);
  
  return {
    isRecording,
    duration,
    audioUri,
    audioLevels,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}

/**
 * Speech-to-Text Service - Hook for transcription functionality
 */
// In src/services/audio-processing.ts, update the useSpeechToText function:

export function useSpeechToText() {
    const [transcript, setTranscript] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionError, setTranscriptionError] = useState(null);
    
    // Start transcription process
    const startTranscription = async (audioUri) => {
      setIsTranscribing(true);
      setTranscriptionError(null);
      
      try {
        console.log('Starting transcription for:', audioUri);
        
        // Simulate a more realistic transcription experience
        // In a real implementation, this would call a real speech-to-text API
        
        // Simulate progressive transcription (like it's analyzing parts of the audio)
        const finalTranscript = "I need to file my taxes by Monday. I should take my dog to the vet on Wednesday. I also need to help my mom get her driver's license this weekend. I'm feeling burnt out from work and should plan a vacation soon. I need to dispose of some yard waste next week. Everything needs to be scheduled after 6 PM because of my work.";
        
        // Simulate progressive transcription
        let partialTranscript = '';
        const words = finalTranscript.split(' ');
        
        // Show words appearing gradually
        for (let i = 0; i < words.length; i += 3) {
          await new Promise(resolve => setTimeout(resolve, 300)); // Delay for realism
          partialTranscript = words.slice(0, i + 3).join(' ');
          setTranscript(partialTranscript);
        }
        
        // Set the final transcript
        setTranscript(finalTranscript);
        setIsTranscribing(false);
        
      } catch (error) {
        console.error('Transcription failed', error);
        setTranscriptionError(error.message);
        setIsTranscribing(false);
      }
    };
    
    // Function to edit transcript
    const updateTranscript = (newText) => {
      setTranscript(newText);
    };
    
    return {
      transcript,
      isTranscribing,
      transcriptionError,
      startTranscription,
      updateTranscript,
    };
  }

/**
 * Audio Playback Service - Hook for audio playback functionality
 */
export function useAudioPlayback() {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  
  const positionTimerRef = useRef(null);
  
  // Load sound from URI
  const loadSound = async (audioUri) => {
    try {
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Load the audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      
      // Get sound status to retrieve duration
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setPlaybackDuration(status.durationMillis || 0);
      }
      setPlaybackPosition(0);
      
      // Set as current sound
      setSound(newSound);
      
      return true;
    } catch (error) {
      console.error('Failed to load sound', error);
      return false;
    }
  };
  
  // Start playback
  const playSound = async () => {
    if (!sound) return;
    
    try {
      await sound.playAsync();
      setIsPlaying(true);
      
      // Start position tracking
      positionTimerRef.current = setInterval(async () => {
        if (sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis);
            
            // If playback has finished
            if (status.didJustFinish) {
              clearInterval(positionTimerRef.current);
              setIsPlaying(false);
              setPlaybackPosition(0);
            }
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to play sound', error);
    }
  };
  
  // Pause playback
  const pauseSound = async () => {
    if (!sound) return;
    
    try {
      await sound.pauseAsync();
      setIsPlaying(false);
      
      // Stop position tracking
      if (positionTimerRef.current) {
        clearInterval(positionTimerRef.current);
      }
      
    } catch (error) {
      console.error('Failed to pause sound', error);
    }
  };
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (positionTimerRef.current) {
        clearInterval(positionTimerRef.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  return {
    isPlaying,
    playbackPosition,
    playbackDuration,
    loadSound,
    playSound,
    pauseSound,
  };
}