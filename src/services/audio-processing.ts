// src/services/audio-processing.ts
import { Audio } from 'expo-av';
import { useRef, useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { ENV, SecureKeyStorage, SECURE_STORAGE_KEYS } from '../config';

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
      const { granted } = await Audio.requestPermissionsAsync();
      
      if (!granted) {
        console.error('Audio recording permissions not granted');
        throw new Error('Microphone permissions required');
      }
      
      // Configure audio mode
      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Create and prepare the recording object
      console.log('Creating recording...');
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
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
      if (newRecording.getStatusAsync) {
        startAudioLevelMonitoring(newRecording);
      } else {
        // Fallback to simulated audio levels
        startSimulatedAudioLevelMonitoring();
      }
      
    } catch (error) {
      console.error('Failed to start recording', error);
      throw error;
    }
  };
  
  // Function to monitor real audio levels for visualization
  const startAudioLevelMonitoring = (rec) => {
    levelMonitorRef.current = setInterval(async () => {
      try {
        const status = await rec.getStatusAsync();
        if (status.isRecording) {
          // On some devices/platforms, metering is available
          const level = status.metering ? status.metering * 100 : Math.floor(Math.random() * 80) + 10;
          setAudioLevels(prev => [...prev, level].slice(-50)); // Keep last 50 samples
        }
      } catch (error) {
        console.warn('Error monitoring audio levels, switching to simulation', error);
        clearInterval(levelMonitorRef.current);
        startSimulatedAudioLevelMonitoring();
      }
    }, 100); // Sample every 100ms
  };
  
  // Simulated audio levels for visualization
  const startSimulatedAudioLevelMonitoring = () => {
    levelMonitorRef.current = setInterval(() => {
      // Generate random audio levels between 10 and 90
      const randomLevel = Math.floor(Math.random() * 80) + 10;
      setAudioLevels(prev => [...prev, randomLevel].slice(-50)); // Keep last 50 samples
    }, 100); // Sample every 100ms
  };
  
  // Stop recording function
  const stopRecording = async () => {
    if (!recording) return null;
    
    try {
      // Stop the recording
      await recording.stopAndUnloadAsync();
      
      // Get the recorded URI
      const uri = recording.getURI();
      
      // Clear timers
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      if (levelMonitorRef.current) {
        clearInterval(levelMonitorRef.current);
        levelMonitorRef.current = null;
      }
      
      // Get file info
      if (uri) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        setAudioUri(uri);
        
        // Reset recording state
        setIsRecording(false);
        setRecording(null);
        
        return {
          uri,
          duration,
          size: fileInfo.size || 0,
        };
      }
      
      throw new Error('Recording failed - no audio file created');
      
    } catch (error) {
      console.error('Failed to stop recording', error);
      setIsRecording(false);
      setRecording(null);
      throw error;
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
      throw error;
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
      if (recording.getStatusAsync) {
        startAudioLevelMonitoring(recording);
      } else {
        startSimulatedAudioLevelMonitoring();
      }
      
      // Update state
      setIsRecording(true);
      
    } catch (error) {
      console.error('Failed to resume recording', error);
      throw error;
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
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  // Whisper API transcription
  const transcribeWithWhisperAPI = async (audioUri) => {
    try {
      // Get API key from secure storage (using your OpenAI key)
      const apiKey = await SecureKeyStorage.getKey(SECURE_STORAGE_KEYS.OPENAI_API_KEY);
      if (!apiKey) {
        throw new Error('OpenAI API key not found for transcription');
      }
      
      // Create form data with the audio file
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'json');
      
      // Send to Whisper API
      setProgressPercentage(30);
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );
      
      setProgressPercentage(90);
      
      if (response.data && response.data.text) {
        return response.data.text;
      } else {
        throw new Error('Transcription failed - no text returned');
      }
      
    } catch (error) {
      console.error('Whisper API transcription failed', error);
      throw error;
    }
  };
  
  // Simulate transcription (for demo/development)
  const simulateTranscription = async () => {
    const finalTranscript = "I need to file my taxes by Monday. I should take my dog to the vet on Wednesday. I also need to help my mom get her driver's license this weekend. I'm feeling burnt out from work and should plan a vacation soon. I need to dispose of some yard waste next week. Everything needs to be scheduled after 6 PM because of my work.";
    
    // Simulate progressive transcription
    let partialTranscript = '';
    const words = finalTranscript.split(' ');
    
    // Progress updates
    const totalSteps = words.length / 3;
    let currentStep = 0;
    
    // Show words appearing gradually
    for (let i = 0; i < words.length; i += 3) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Delay for realism
      partialTranscript = words.slice(0, i + 3).join(' ');
      setTranscript(partialTranscript);
      
      // Update progress
      currentStep++;
      setProgressPercentage(Math.min(90, (currentStep / totalSteps) * 90));
    }
    
    return finalTranscript;
  };
  
  // Start transcription process
  const startTranscription = async (audioUri) => {
    setIsTranscribing(true);
    setTranscriptionError(null);
    setProgressPercentage(0);
    
    try {
      console.log('Starting transcription for:', audioUri);
      
      let transcriptionText;
      
      // Check environment and audio file existence
      if (ENV.ENVIRONMENT === 'production' && audioUri && !audioUri.startsWith('file:///mock/')) {
        // Use real Whisper API
        transcriptionText = await transcribeWithWhisperAPI(audioUri);
      } else {
        // Use simulated transcription for development or mock audio
        console.log('Using simulated transcription');
        transcriptionText = await simulateTranscription();
      }
      
      // Set the final transcript
      setTranscript(transcriptionText);
      setProgressPercentage(100);
      setIsTranscribing(false);
      
      return transcriptionText;
      
    } catch (error) {
      console.error('Transcription failed', error);
      setTranscriptionError(error.message);
      setIsTranscribing(false);
      throw error;
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
    progressPercentage,
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
      
      // Check if this is a mock URI
      if (audioUri.startsWith('file:///mock/')) {
        setPlaybackDuration(30000); // Mock 30 second duration
        setPlaybackPosition(0);
        
        // Create a dummy sound object for mock URIs
        const dummySound = {
          async playAsync() {
            setIsPlaying(true);
            
            // Simulate playback position updates
            positionTimerRef.current = setInterval(() => {
              setPlaybackPosition((prev) => {
                const newPos = prev + 100;
                if (newPos >= 30000) {
                  clearInterval(positionTimerRef.current);
                  setIsPlaying(false);
                  return 0;
                }
                return newPos;
              });
            }, 100);
            
            return { isPlaying: true };
          },
          async pauseAsync() {
            setIsPlaying(false);
            if (positionTimerRef.current) {
              clearInterval(positionTimerRef.current);
            }
            return { isPlaying: false };
          },
          async getStatusAsync() {
            return {
              isLoaded: true,
              positionMillis: playbackPosition,
              durationMillis: 30000,
              isPlaying: isPlaying,
              didJustFinish: playbackPosition >= 30000,
            };
          },
          async unloadAsync() {
            if (positionTimerRef.current) {
              clearInterval(positionTimerRef.current);
            }
            setPlaybackPosition(0);
            setIsPlaying(false);
          },
        };
        
        setSound(dummySound);
        return true;
      }
      
      // Load the audio file for real URIs
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
      
      // Start position tracking for real sounds
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