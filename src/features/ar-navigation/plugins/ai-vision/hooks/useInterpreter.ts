/**
 * USE INTERPRETER HOOK
 *
 * Real-time interpreter mode using Gemini Live API.
 * The AI acts as a middleman between two speakers of different languages,
 * detecting which language is being spoken and translating in real-time.
 *
 * Reuses GeminiLiveSession with a specialized interpreter system prompt.
 * The transcript is split into "entries" with detected source/target language.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { cacheDirectory, writeAsStringAsync, deleteAsync, EncodingType } from 'expo-file-system/legacy';

let LiveAudioStream: any = null;
try {
  LiveAudioStream = require('react-native-live-audio-stream').default;
} catch {
  if (__DEV__) console.warn('[useInterpreter] react-native-live-audio-stream not available');
}

import { GeminiLiveSession } from '../services/geminiLive.service';
import { getVoiceName } from '../services/tts.service';
import { getLanguageName } from '../constants/translatorConfig';

// ─── Types ───────────────────────────────────────────────────

export interface InterpreterEntry {
  id: string;
  role: 'interpreter';
  originalText: string;
  translatedText: string;
  fromLang: string;
  toLang: string;
  timestamp: number;
}

export interface UseInterpreterReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  streamingText: string;
  entries: InterpreterEntry[];
  error: string | null;
  connect: (myLang: string, theirLang: string) => Promise<void>;
  disconnect: () => void;
  toggleMic: () => Promise<void>;
  interruptAI: () => void;
  clearEntries: () => void;
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
    } catch {
      // Skip bad chunk
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

  // RIFF header
  view.setUint32(0, 0x52494646, false);     // "RIFF"
  view.setUint32(4, fileSize - 8, true);
  view.setUint32(8, 0x57415645, false);      // "WAVE"
  // fmt chunk
  view.setUint32(12, 0x666d7420, false);     // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);               // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // data chunk
  view.setUint32(36, 0x64617461, false);     // "data"
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

  const tempUri = `${cacheDirectory}interpreter-${Date.now()}-${Math.random().toString(36).substr(2, 6)}.wav`;
  await writeAsStringAsync(tempUri, wavBase64, { encoding: EncodingType.Base64 });
  return tempUri;
}

// ─── Playback Queue ─────────────────────────────────────────

class AudioPlayerQueue {
  private queue: string[] = [];
  private isPlaying = false;
  private currentSound: Audio.Sound | null = null;
  private stopRequested = false;

  async enqueueChunk(wavUri: string, onPlayStart: () => void, onQueueEmpty: () => void) {
    if (this.stopRequested) return;
    this.queue.push(wavUri);
    if (!this.isPlaying) {
      await this.processQueue(onPlayStart, onQueueEmpty);
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
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0 },
      );
      this.currentSound = sound;

      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          deleteAsync(uri, { idempotent: true }).catch(() => {});
          this.currentSound = null;
          this.processQueue(onPlayStart, onQueueEmpty);
        }
      });
    } catch {
      this.processQueue(onPlayStart, onQueueEmpty);
    }
  }

  async stop() {
    this.stopRequested = true;
    this.queue = [];
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

export function useInterpreter(): UseInterpreterReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [entries, setEntries] = useState<InterpreterEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const isMutedRef = useRef(false);
  const aiSpeakingRef = useRef(false);
  const myLangRef = useRef('en');
  const theirLangRef = useRef('fr');

  // PCM stream
  const audioPcmAccumulator = useRef<string[]>([]);
  const currentAiTranscript = useRef('');
  const playbackQueueRef = useRef(new AudioPlayerQueue());
  const MIN_CHUNKS = 10;

  // ─── Audio ─────────────────────────────────────────────────

  const configureAudioSession = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
    } catch {}
  }, []);

  const doStartListening = useCallback(async () => {
    if (isMutedRef.current || !LiveAudioStream) return;

    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;

    await configureAudioSession();

    try {
      LiveAudioStream.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        bufferSize: 4096,
        wavFile: 'interpreter_temp.wav',
      });

      LiveAudioStream.on('data', (base64Data: string) => {
        if (sessionRef.current?.isConnected()) {
          sessionRef.current.sendAudio(base64Data);
        }
      });

      LiveAudioStream.start();
      setIsRecording(true);
    } catch {}
  }, [configureAudioSession]);

  const doStopListening = useCallback(() => {
    if (!LiveAudioStream) return;
    try {
      LiveAudioStream.stop();
      setIsRecording(false);
    } catch {}
  }, []);

  // ─── Audio Playback ───────────────────────────────────────

  const flushPlaybackChunks = useCallback(async (force = false) => {
    if (!force && audioPcmAccumulator.current.length < MIN_CHUNKS) return;
    if (audioPcmAccumulator.current.length === 0) return;

    const chunks = [...audioPcmAccumulator.current];
    audioPcmAccumulator.current = [];

    try {
      const wavUri = await pcmChunksToWavFile(chunks, 24000);
      if (!wavUri) return;

      playbackQueueRef.current.enqueueChunk(
        wavUri,
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          aiSpeakingRef.current = false;
          if (!isMutedRef.current) {
            doStartListening();
          }
        },
      );
    } catch {}
  }, []);

  const stopPlayback = useCallback(async () => {
    audioPcmAccumulator.current = [];
    await playbackQueueRef.current.stop();
    setIsSpeaking(false);
  }, []);

  // ─── Conversation Management ──────────────────────────────

  const addEntry = useCallback((text: string) => {
    if (!text.trim()) return;
    const myLang = myLangRef.current;
    const theirLang = theirLangRef.current;

    setEntries(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'interpreter',
        originalText: text,
        translatedText: '',
        fromLang: '?',
        toLang: '?',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // ─── Connect ──────────────────────────────────────────────

  const connect = useCallback(async (myLang: string, theirLang: string) => {
    setIsConnecting(true);
    setError(null);
    myLangRef.current = myLang;
    theirLangRef.current = theirLang;

    doStopListening();
    await stopPlayback();

    const myLangName = getLanguageName(myLang);
    const theirLangName = getLanguageName(theirLang);

    const interpreterPrompt = `You are a professional real-time interpreter. Your ONLY job is to translate speech between two people having a face-to-face conversation.

LANGUAGE PAIR:
- Person A (the phone owner) speaks: ${myLangName}
- Person B (the other person) speaks: ${theirLangName}

CORE RULES:
1. DETECT the language of each utterance automatically.
2. When you hear ${myLangName} → TRANSLATE and SPEAK the translation in ${theirLangName}.
3. When you hear ${theirLangName} → TRANSLATE and SPEAK the translation in ${myLangName}.
4. ONLY translate. Do NOT add commentary, explanations, opinions, or your own thoughts.
5. Preserve the TONE and INTENT of the speaker — formal stays formal, casual stays casual, emotional stays emotional.
6. If a word has no direct translation, use the closest natural equivalent and briefly note it ONLY if critical (e.g., a cultural concept).
7. Be FAST. Speed is critical in live conversation. Translate immediately, don't wait for perfect phrasing.
8. If you cannot understand what was said, say: "Could you please repeat that?" in BOTH languages.
9. For numbers, dates, addresses, and proper nouns — repeat them clearly in the target language.
10. Never break character. You are an invisible interpreter. No greetings, no small talk, no introductions unless translating someone else's.

IMPORTANT: You speak ONLY the translated output. Never speak the original language back. If someone says something in ${myLangName}, your next words MUST be in ${theirLangName}, and vice versa.

If both people are silent, stay silent. You speak ONLY when translating.

START: Wait for someone to speak. When they do, translate immediately.`;

    try {
      const voiceName = await getVoiceName();

      const session = new GeminiLiveSession({
        voiceName,
        userLanguage: myLang,
        systemInstruction: interpreterPrompt,
        onAudioData: (base64Audio: string) => {
          if (!aiSpeakingRef.current) {
            aiSpeakingRef.current = true;
            doStopListening();
          }
          audioPcmAccumulator.current.push(base64Audio);
          flushPlaybackChunks();
        },
        onTranscription: (text: string, isUser: boolean) => {
          if (!isUser) {
            currentAiTranscript.current += text;
            setStreamingText(currentAiTranscript.current);
          }
        },
        onTurnComplete: () => {
          if (currentAiTranscript.current.trim()) {
            addEntry(currentAiTranscript.current);
            currentAiTranscript.current = '';
          }
          setStreamingText('');
          flushPlaybackChunks(true);
        },
        onInterrupted: () => {
          stopPlayback();
          if (currentAiTranscript.current.trim()) {
            addEntry(currentAiTranscript.current);
            currentAiTranscript.current = '';
          }
          setStreamingText('');
          audioPcmAccumulator.current = [];
        },
        onError: (errMsg: string) => {
          if (__DEV__) console.error('[useInterpreter] Error:', errMsg);
          setError(errMsg);
        },
        onConnectionChange: (connected: boolean) => {
          setIsConnected(connected);
          setIsConnecting(false);
          if (connected) {
            setError(null);
            doStartListening();
          }
        },
      });

      sessionRef.current = session;
      await session.connect();
    } catch (err: any) {
      setIsConnecting(false);
      setError(err.message || 'Failed to connect');
    }
  }, [addEntry, flushPlaybackChunks, stopPlayback, doStartListening, doStopListening]);

  const disconnect = useCallback(async () => {
    doStopListening();
    await stopPlayback();
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
    setStreamingText('');
    currentAiTranscript.current = '';
    isMutedRef.current = false;
    aiSpeakingRef.current = false;
  }, [doStopListening, stopPlayback]);

  const toggleMic = useCallback(async () => {
    isMutedRef.current = !isMutedRef.current;
    if (isMutedRef.current) {
      doStopListening();
    } else if (!aiSpeakingRef.current) {
      doStartListening();
    }
  }, [doStartListening, doStopListening]);

  const interruptAI = useCallback(() => {
    stopPlayback();
    aiSpeakingRef.current = false;
    audioPcmAccumulator.current = [];
    if (currentAiTranscript.current.trim()) {
      addEntry(currentAiTranscript.current);
      currentAiTranscript.current = '';
    }
    setStreamingText('');
    if (!isMutedRef.current) {
      doStartListening();
    }
  }, [stopPlayback, addEntry, doStartListening]);

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      doStopListening();
      stopPlayback();
      if (sessionRef.current) {
        sessionRef.current.disconnect();
        sessionRef.current = null;
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    isRecording,
    isSpeaking,
    streamingText,
    entries,
    error,
    connect,
    disconnect,
    toggleMic,
    interruptAI,
    clearEntries,
  };
}
