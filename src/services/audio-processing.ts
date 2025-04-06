// src/services/audio-processing.ts
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useRef, useEffect, useState } from 'react';

/**
 * Audio Recording Service - Hook for audio recording functionality
 */
export function useAudioRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const levelMonitorRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start recording function
  const startRecording = async () => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error('Audio recording permissions not granted');
      }
      
      // Configure audio mode for voice recording quality
      // Fix: Use the correct enum values from Audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        // Fix: Use the correct enum value
        interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
      });
      
      // Create and prepare the recording object
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      
      // Start the recording
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
      monitorAudioLevels();
      
    } catch (error) {
      console.error('Failed to start recording', error);
      // Handle error - show user a notification
    }
  };
  
  // Function to monitor audio levels for visualization
  const monitorAudioLevels = () => {
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
      monitorAudioLevels(recording);
      
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
export function useSpeechToText() {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  
  // Start transcription process
  const startTranscription = async (audioUri: string) => {
    setIsTranscribing(true);
    setTranscriptionError(null);
    
    try {
      // For demo purposes, simulate transcription with a timeout
      // In production, replace with actual speech-to-text API call
      
      setTimeout(() => {
        // Simulate successful transcription
        const mockTranscript = "I am going to start talking about a lot of things. What I need you to do is make all of the things that I'm talking about actionable for me. And prioritize them accordingly. Starting now. So I need to do my taxes. I need to throw away the the small batches of batches of trees, my family and I cut up find somewhere to dispose of that. I need to go buy some clothes for next week. Plan some time for my vacation time as I need some time to get away and be alone, since I'm I'm feeling kind of burnt out from work. I need to help my mom get her driver's license. Need to take, my dog to a doctor etcetera. Find time for me based off my calendar of 6 pm edt.";
        
        setTranscript(mockTranscript);
        setIsTranscribing(false);
      }, 2000);  // Simulate 2 second processing time
      
    } catch (error) {
      console.error('Transcription failed', error);
      setTranscriptionError((error as Error).message);
      setIsTranscribing(false);
    }
  };
  
  // Function to edit transcript
  const updateTranscript = (newText: string) => {
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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  
  const positionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load sound from URI
  const loadSound = async (audioUri: string) => {
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
              clearInterval(positionTimerRef.current!);
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