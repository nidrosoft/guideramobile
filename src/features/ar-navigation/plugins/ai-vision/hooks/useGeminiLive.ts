import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { cacheDirectory, writeAsStringAsync, deleteAsync, EncodingType } from 'expo-file-system/legacy';
// Safe import: react-native-live-audio-stream requires a native dev build.
// In Expo Go it doesn't exist, so we gracefully degrade to text-only input.
let LiveAudioStream: any = null;
try {
  LiveAudioStream = require('react-native-live-audio-stream').default;
} catch {
  if (__DEV__) console.warn('[useGeminiLive] react-native-live-audio-stream not available (Expo Go?). Voice input disabled — use text input instead.');
}
import { GeminiLiveSession } from '../services/geminiLive.service';
import { getVoiceName } from '../services/tts.service';

// ─── Types ───────────────────────────────────────────────────

export interface ConversationEntry {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface UseGeminiLiveReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  streamingText: string;
  conversations: ConversationEntry[];
  error: string | null;
  connect: (userLanguage: string) => Promise<void>;
  disconnect: () => void;
  toggleMic: (shouldMute?: boolean) => Promise<void>;
  interruptAI: () => void;
  sendVideoFrame: (base64Jpeg: string) => void;
  sendText: (text: string) => void;
  clearConversations: () => void;
}

// ─── PCM → WAV Conversion ───────────────────────────────────

async function pcmChunksToWavFile(base64Chunks: string[], sampleRate = 24000): Promise<string | null> {
  if (base64Chunks.length === 0) return null;

  const byteArrays: Uint8Array[] = [];
  let totalLength = 0;

  for (const chunk of base64Chunks) {
    if (!chunk || chunk.length < 4) continue;
    try {
      const binaryString = atob(chunk);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      byteArrays.push(bytes);
      totalLength += bytes.length;
    } catch (e) {
      if (__DEV__) console.warn('[pcmChunksToWavFile] Bad base64 chunk, skipping');
    }
  }

  if (totalLength === 0) return null;

  const allPcmBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of byteArrays) {
    allPcmBytes.set(arr, offset);
    offset += arr.length;
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = allPcmBytes.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const wavBuffer = new ArrayBuffer(fileSize);
  const view = new DataView(wavBuffer);

  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(wavBuffer);
  wavBytes.set(allPcmBytes, headerSize);

  let binary = '';
  const CHUNK_SIZE = 8192;
  for (let i = 0; i < wavBytes.length; i += CHUNK_SIZE) {
    const slice = wavBytes.subarray(i, Math.min(i + CHUNK_SIZE, wavBytes.length));
    for (let j = 0; j < slice.length; j++) {
      binary += String.fromCharCode(slice[j]);
    }
  }
  const wavBase64 = btoa(binary);

  const tempUri = `${cacheDirectory}gemini-live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.wav`;
  await writeAsStringAsync(tempUri, wavBase64, { encoding: EncodingType.Base64 });
  return tempUri;
}

// ─── Playback Queue Manager ───────────────────────────────

class AudioPlayerQueue {
  private queue: string[] = [];
  private isPlaying = false;
  private currentSound: Audio.Sound | null = null;
  private nextSound: Audio.Sound | null = null;
  private nextUri: string | null = null;
  private stopRequested = false;

  async enqueueChunk(wavUri: string, onPlayStart: () => void, onQueueEmpty: () => void) {
    if (this.stopRequested) return;
    this.queue.push(wavUri);
    // Pre-load next sound while current is playing
    if (this.isPlaying && !this.nextSound && this.queue.length === 1) {
      this.preloadNext();
    }
    if (!this.isPlaying) {
      await this.processQueue(onPlayStart, onQueueEmpty);
    }
  }

  private async preloadNext(): Promise<void> {
    if (this.stopRequested || this.queue.length === 0 || this.nextSound) return;
    const uri = this.queue[0]; // peek, don't remove yet
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, volume: 1.0 }
      );
      if (this.stopRequested) {
        sound.unloadAsync().catch(() => {});
        return;
      }
      this.nextSound = sound;
      this.nextUri = uri;
    } catch {
      this.nextSound = null;
      this.nextUri = null;
    }
  }

  private async processQueue(onPlayStart: () => void, onQueueEmpty: () => void): Promise<void> {
    if (this.queue.length === 0 || this.stopRequested) {
      this.isPlaying = false;
      onQueueEmpty();
      return;
    }
    
    this.isPlaying = true;
    onPlayStart();

    const uri = this.queue.shift();
    if (!uri) return this.processQueue(onPlayStart, onQueueEmpty);

    try {
      let sound: Audio.Sound;

      // Use pre-loaded sound if it matches
      if (this.nextSound && this.nextUri === uri) {
        sound = this.nextSound;
        this.nextSound = null;
        this.nextUri = null;
        await sound.playAsync();
      } else {
        // Discard stale preload if any
        if (this.nextSound) {
          this.nextSound.unloadAsync().catch(() => {});
          this.nextSound = null;
          this.nextUri = null;
        }
        const result = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, volume: 1.0 }
        );
        sound = result.sound;
      }

      this.currentSound = sound;

      // Start pre-loading the next chunk while this one plays
      this.preloadNext();
      
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          deleteAsync(uri, { idempotent: true }).catch(() => {});
          this.currentSound = null;
          this.processQueue(onPlayStart, onQueueEmpty);
        }
      });
    } catch (e) {
      if (__DEV__) console.warn('[AudioPlayerQueue] Playback chunk error:', e);
      this.processQueue(onPlayStart, onQueueEmpty);
    }
  }

  async stop() {
    this.stopRequested = true;
    this.queue = [];
    if (this.nextSound) {
      try { await this.nextSound.unloadAsync(); } catch {}
      this.nextSound = null;
      this.nextUri = null;
    }
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch {}
      this.currentSound = null;
    }
    this.isPlaying = false;
    this.stopRequested = false;
  }
}

// ─── Hook ────────────────────────────────────────────────────

export function useGeminiLive(): UseGeminiLiveReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const isMutedRef = useRef(false);
  const hasGreetedRef = useRef(false);
  const aiSpeakingRef = useRef(false); // true while AI audio is being received/played

  // PCM stream buffers
  const audioPcmAccumulator = useRef<string[]>([]);
  const currentAiTranscript = useRef('');
  // Buffered transcript text — only flushed to UI once audio starts playing
  const pendingTranscript = useRef('');
  const audioPlaybackStarted = useRef(false);
  
  // Custom playback queue mechanism
  const playbackQueueRef = useRef(new AudioPlayerQueue());
  const MIN_CHUNKS_PER_PLAY = 20; // ~0.8-1s of audio per WAV — balanced between latency and smoothness

  // ─── Audio Session Setup ─────────────────────────────────

  const configureAudioSession = useCallback(async (forPlayback = false) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: !forPlayback,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
    } catch (err) {
      if (__DEV__) console.warn('[useGeminiLive] Audio session error:', err);
    }
  }, []);

  // ─── Speech Recognition (PCM Recording) ──────────────────────

  const doStartListening = useCallback(async () => {
    if (isMutedRef.current) return;
    if (!LiveAudioStream) {
      if (__DEV__) console.warn('[useGeminiLive] No native audio stream available — use text input');
      return;
    }
    
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      if (__DEV__) console.warn('[useGeminiLive] Microphone permission not granted');
      return;
    }

    await configureAudioSession();
    
    // LiveAudioStream initialization
    try {
      LiveAudioStream.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        bufferSize: 4096,
        wavFile: 'temp.wav',
      });

      LiveAudioStream.on('data', (base64Data: string) => {
        if (sessionRef.current?.isConnected()) {
          sessionRef.current.sendAudio(base64Data);
        }
      });

      LiveAudioStream.start();
      setIsRecording(true);
      if (__DEV__) console.log('[useGeminiLive] PCM Audio stream started');
    } catch (err) {
      if (__DEV__) console.warn('[useGeminiLive] Failed starting PCM input stream:', err);
    }
  }, [configureAudioSession]);

  const doStopListening = useCallback(() => {
    if (!LiveAudioStream) return;
    try {
      LiveAudioStream.stop();
      setIsRecording(false);
      if (__DEV__) console.log('[useGeminiLive] PCM Audio stream stopped');
    } catch (err) {
      if (__DEV__) console.warn('[useGeminiLive] Failed stopping stream:', err);
    }
  }, []);

  // ─── Audio Playback ──────────────────────────────────────

  const flushPlaybackChunks = useCallback(async (force = false) => {
    // Check if we have enough chunks to make a fluid wav file buffer
    if (!force && audioPcmAccumulator.current.length < MIN_CHUNKS_PER_PLAY) return;

    if (audioPcmAccumulator.current.length === 0) return;

    const chunks = [...audioPcmAccumulator.current];
    audioPcmAccumulator.current = [];

    try {
      const wavUri = await pcmChunksToWavFile(chunks, 24000);
      if (!wavUri) return;

      playbackQueueRef.current.enqueueChunk(
        wavUri,
        () => {
          setIsSpeaking(true);
          // Audio started — flush any buffered transcript to the UI
          if (!audioPlaybackStarted.current) {
            audioPlaybackStarted.current = true;
          }
          if (pendingTranscript.current) {
            currentAiTranscript.current += pendingTranscript.current;
            setStreamingText(currentAiTranscript.current);
            pendingTranscript.current = '';
          }
        },
        () => {
          // Queue is empty — AI finished speaking
          setIsSpeaking(false);
          aiSpeakingRef.current = false;
          // Resume mic if not muted
          if (!isMutedRef.current) {
            if (__DEV__) console.log('[useGeminiLive] AI done speaking, resuming mic');
            doStartListening();
          }
        }
      );
    } catch (err) {
      if (__DEV__) console.warn('[useGeminiLive] Audio flush error:', err);
    }
  }, []);

  const stopPlayback = useCallback(async () => {
    audioPcmAccumulator.current = [];
    await playbackQueueRef.current.stop();
    setIsSpeaking(false);
  }, []);

  // ─── Session Setup & Handlers ────────────────────────────

  const addConversation = useCallback((role: 'user' | 'ai', text: string) => {
    if (!text.trim()) return;
    setConversations((prev) => [
      ...prev,
      { role, text: text.trim(), timestamp: Date.now() },
    ]);
  }, []);

  const connect = useCallback(async (userLanguage: string) => {
    setIsConnecting(true);
    setError(null);

    // Stop existing recordings & playbacks if reconnecting
    doStopListening();
    await stopPlayback();

    try {
      const voiceName = await getVoiceName();
      
      const session = new GeminiLiveSession({
        voiceName,
        userLanguage,
        onAudioData: (base64Audio: string) => {
          // Pause mic on FIRST audio chunk to prevent echo feedback
          if (!aiSpeakingRef.current) {
            aiSpeakingRef.current = true;
            doStopListening();
            // Switch to playback mode so audio routes through main speaker (not earpiece)
            configureAudioSession(true);
            if (__DEV__) console.log('[useGeminiLive] AI started speaking, pausing mic, switching to speaker');
          }
          // Accumulate audio chunks
          audioPcmAccumulator.current.push(base64Audio);
          // Try to play immediately if we have enough buffered
          flushPlaybackChunks();
        },
        onTranscription: (text: string, isUser: boolean) => {
          if (!isUser) {
            // Buffer transcript until audio playback actually starts
            if (audioPlaybackStarted.current) {
              currentAiTranscript.current += text;
              setStreamingText(currentAiTranscript.current);
            } else {
              pendingTranscript.current += text;
            }
          } else {
            // Live transcription of the user's speech!
          }
        },
        onTurnComplete: () => {
          // Flush any pending transcript that never got shown
          if (pendingTranscript.current) {
            currentAiTranscript.current += pendingTranscript.current;
            pendingTranscript.current = '';
          }
          // Finalize AI transcription
          if (currentAiTranscript.current.trim()) {
            addConversation('ai', currentAiTranscript.current);
            currentAiTranscript.current = '';
          }
          setStreamingText('');
          audioPlaybackStarted.current = false;
          // Flush any remaining tiny audio buffers
          flushPlaybackChunks(true);
        },
        onInterrupted: () => {
          // Handle user barge-in! Cut the AI off immediately.
          stopPlayback();
          if (pendingTranscript.current) {
            currentAiTranscript.current += pendingTranscript.current;
            pendingTranscript.current = '';
          }
          if (currentAiTranscript.current.trim()) {
            addConversation('ai', currentAiTranscript.current + ' [interrupted]');
            currentAiTranscript.current = '';
          }
          setStreamingText('');
          audioPlaybackStarted.current = false;
          audioPcmAccumulator.current = [];
        },
        onError: (errMsg: string) => {
          if (__DEV__) console.error('[useGeminiLive] Session error:', errMsg);
          setError(errMsg);
        },
        onConnectionChange: (connected: boolean) => {
          setIsConnected(connected);
          setIsConnecting(false);
          if (connected) {
            setError(null);
            
            // Start the mic streams
            doStartListening();

            if (!hasGreetedRef.current) {
              hasGreetedRef.current = true;
              setTimeout(() => {
                if (sessionRef.current?.isConnected()) {
                  sessionRef.current.sendText('Greet the user in 1-2 short sentences. Say hi, your name is Meena, and invite them to point their camera at anything or ask you a travel question. Do NOT describe anything you see — the camera may not be active yet. Keep it brief and warm. Stop after the greeting — wait for the user to respond.');
                }
              }, 100);
            }
          }
        },
      });

      sessionRef.current = session;
      await session.connect();
    } catch (err: any) {
      if (__DEV__) console.error('[useGeminiLive] Connect error:', err);
      setIsConnecting(false);
      setError(err.message || 'Failed to connect');
    }
  }, [addConversation, flushPlaybackChunks, stopPlayback, doStartListening, doStopListening, configureAudioSession]);

  const disconnect = useCallback(async () => {
    doStopListening();
    await stopPlayback();

    sessionRef.current?.disconnect();
    sessionRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);

    if (currentAiTranscript.current.trim()) {
      addConversation('ai', currentAiTranscript.current);
      currentAiTranscript.current = '';
    }
  }, [doStopListening, stopPlayback, addConversation]);

  const toggleMic = useCallback(async (shouldMute?: boolean) => {
    // Accept explicit mute state from the component — avoids desync
    // when mic is auto-paused during AI speech (isRecording=false but user wants to mute)
    const mute = shouldMute !== undefined ? shouldMute : !isMutedRef.current;

    if (mute) {
      // Mute: stop listening, don't interrupt AI playback
      isMutedRef.current = true;
      if (isRecording) doStopListening();
    } else {
      // Unmute: resume mic only if AI is not currently speaking
      isMutedRef.current = false;
      if (!aiSpeakingRef.current && !isRecording) {
        doStartListening();
      }
    }
  }, [isRecording, doStopListening, doStartListening]);

  // Manual barge-in: user taps to interrupt AI while it's speaking
  const interruptAI = useCallback(async () => {
    if (!aiSpeakingRef.current) return; // Nothing to interrupt

    if (__DEV__) console.log('[useGeminiLive] User barge-in: interrupting AI');

    // Save partial transcript
    if (currentAiTranscript.current.trim()) {
      addConversation('ai', currentAiTranscript.current + ' [muted]');
      currentAiTranscript.current = '';
    }
    setStreamingText('');

    // Stop playback and reset AI speaking state
    await stopPlayback();
    aiSpeakingRef.current = false;
    audioPcmAccumulator.current = [];

    // Resume mic so user can speak
    if (!isMutedRef.current) {
      doStartListening();
    }
  }, [addConversation, stopPlayback, doStartListening]);

  const sendVideoFrame = useCallback((base64Jpeg: string) => {
    sessionRef.current?.sendVideoFrame(base64Jpeg);
  }, []);

  const sendText = useCallback((text: string) => {
    if (!text.trim()) return;
    addConversation('user', text);
    if (sessionRef.current?.isConnected()) {
      sessionRef.current.sendText(text);
    }
  }, [addConversation]);

  const clearConversations = useCallback(() => {
    setConversations([]);
    setStreamingText('');
    currentAiTranscript.current = '';
  }, []);

  useEffect(() => {
    return () => {
      doStopListening();
      stopPlayback();
      sessionRef.current?.disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    isRecording,
    isSpeaking,
    streamingText,
    conversations,
    error,
    connect,
    disconnect,
    toggleMic,
    interruptAI,
    sendVideoFrame,
    sendText,
    clearConversations,
  };
}
