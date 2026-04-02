/**
 * TTS SERVICE
 *
 * Text-to-Speech using Gemini TTS (30 HD voices, 70+ languages).
 * Falls back to expo-speech if the API call fails.
 *
 * Voice selection is by name (e.g. 'Kore', 'Puck', 'Sulafat') —
 * persisted to AsyncStorage.
 *
 * Audio session uses playAndRecord category so TTS works alongside
 * camera and speech recognition on iOS.
 */

import * as Speech from 'expo-speech';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_GEMINI_VOICE } from '../constants/translatorConfig';

const VOICE_NAME_KEY = '@guidera_tts_voice_name';
let _currentSound: Audio.Sound | null = null;

export interface TTSOptions {
  language: string;
  rate?: number;
  pitch?: number;
  voiceName?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

export async function getVoiceName(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(VOICE_NAME_KEY);
    if (saved) return saved;
  } catch {}
  return DEFAULT_GEMINI_VOICE;
}

export async function setVoiceName(voiceName: string): Promise<void> {
  try {
    await AsyncStorage.setItem(VOICE_NAME_KEY, voiceName);
  } catch {}
}

/**
 * Configure audio session for playback alongside recording (camera/mic).
 * Uses playAndRecord category so audio comes out of the speaker
 * even when the camera or speech recognition is active.
 */
async function configureAudioSession(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,  // false → routes to main speaker; true → earpiece
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    playThroughEarpieceAndroid: false,
  });
}

export async function speak(text: string, options: TTSOptions): Promise<void> {
  if (!text.trim()) return;

  await stopSpeaking();

  const voiceName = options.voiceName || await getVoiceName();

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        text,
        voiceName,
        language: options.language,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`TTS HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();

    if (data.audioContent) {
      await configureAudioSession();

      const audioFormat = data.audioFormat === 'wav' ? 'audio/wav' : 'audio/mp3';
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:${audioFormat};base64,${data.audioContent}` },
        { shouldPlay: true, volume: 1.0 },
      );

      _currentSound = sound;

      // Fire onStart immediately when sound starts playing
      options.onStart?.();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          _currentSound = null;
          options.onDone?.();
        }
      });

      return;
    }

    throw new Error(data.error || 'No audio returned');
  } catch (err) {
    if (__DEV__) console.warn('[TTS] Gemini TTS failed, falling back to expo-speech:', err);

    return new Promise<void>((resolve, reject) => {
      try {
        Speech.speak(text, {
          language: options.language,
          rate: options.rate ?? 0.9,
          pitch: options.pitch ?? 1.0,
          volume: 1.0,
          onStart: () => { options.onStart?.(); },
          onDone: () => { options.onDone?.(); resolve(); },
          onError: (error) => { options.onError?.(error); reject(error); },
          onStopped: () => resolve(),
        });
      } catch (speechErr) {
        options.onError?.(speechErr);
        reject(speechErr);
      }
    });
  }
}

export async function stopSpeaking(): Promise<void> {
  if (_currentSound) {
    try {
      await _currentSound.stopAsync();
      await _currentSound.unloadAsync();
    } catch {}
    _currentSound = null;
  }
  try {
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) Speech.stop();
  } catch {}
}

export async function isSpeaking(): Promise<boolean> {
  if (_currentSound) {
    try {
      const status = await _currentSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) return true;
    } catch {}
  }
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
