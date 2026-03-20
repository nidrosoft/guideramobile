/**
 * TTS SERVICE
 *
 * Text-to-Speech using Google Cloud TTS (Neural2 voices) via the google-api-proxy
 * edge function. Falls back to expo-speech if the API call fails.
 * 
 * Google Neural2 voices sound natural and human-like, supporting 28+ languages
 * with male/female selection.
 */

import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_GENDER_KEY = '@guidera_tts_voice_gender';
let _currentSound: Audio.Sound | null = null;

// Language code to Google TTS locale mapping
const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en-US', fr: 'fr-FR', es: 'es-ES', de: 'de-DE', it: 'it-IT',
  pt: 'pt-BR', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', hi: 'hi-IN',
  ar: 'ar-XA', ru: 'ru-RU', nl: 'nl-NL', pl: 'pl-PL', sv: 'sv-SE',
  tr: 'tr-TR', th: 'th-TH', vi: 'vi-VN', el: 'el-GR', id: 'id-ID',
  da: 'da-DK', fi: 'fi-FI', nb: 'nb-NO', ms: 'id-ID', uk: 'ru-RU',
  cs: 'de-DE', he: 'ar-XA',
};

export interface TTSOptions {
  language: string;
  rate?: number;
  pitch?: number;
  voiceGender?: 'MALE' | 'FEMALE';
  onDone?: () => void;
  onError?: (error: any) => void;
}

/**
 * Get user's preferred voice gender (persisted to AsyncStorage).
 */
export async function getVoiceGender(): Promise<'MALE' | 'FEMALE'> {
  try {
    const saved = await AsyncStorage.getItem(VOICE_GENDER_KEY);
    if (saved === 'MALE' || saved === 'FEMALE') return saved;
  } catch {}
  return 'FEMALE'; // Default
}

/**
 * Set user's preferred voice gender.
 */
export async function setVoiceGender(gender: 'MALE' | 'FEMALE'): Promise<void> {
  try {
    await AsyncStorage.setItem(VOICE_GENDER_KEY, gender);
  } catch {}
}

/**
 * Speak text using Google Cloud TTS (natural Neural2 voices).
 * Falls back to expo-speech if the API call fails.
 */
export async function speak(text: string, options: TTSOptions): Promise<void> {
  if (!text.trim()) return;

  await stopSpeaking();

  const gender = options.voiceGender || await getVoiceGender();
  const locale = LANG_TO_LOCALE[options.language] || `${options.language}-${options.language.toUpperCase()}`;

  try {
    // Call dedicated TTS edge function (OpenAI primary, ElevenLabs fallback)
    const response = await fetch(`${supabaseUrl}/functions/v1/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        text,
        language: locale,
        voiceGender: gender,
        speed: options.rate ?? 1.0,
      }),
    });

    const data = await response.json();

    if (data.audioContent) {
      // Play the MP3 audio using expo-av
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true, // This overrides the silent mode switch!
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${data.audioContent}` },
        { shouldPlay: true, volume: 1.0, rate: options.rate ?? 1.0 },
      );

      _currentSound = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          _currentSound = null;
          options.onDone?.();
        }
      });

      return;
    }

    // If API returned an error, fall through to expo-speech fallback
    throw new Error(data.error || 'No audio returned');
  } catch (err) {
    // Fallback to expo-speech (robotic but works offline)
    if (__DEV__) console.warn('[TTS] Google Cloud TTS failed, falling back to expo-speech:', err);

    return new Promise<void>((resolve, reject) => {
      try {
        Speech.speak(text, {
          language: options.language,
          rate: options.rate ?? 0.9,
          pitch: options.pitch ?? 1.0,
          volume: 1.0,
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

/**
 * Stop any currently playing speech.
 */
export async function stopSpeaking(): Promise<void> {
  // Stop Google Cloud TTS audio
  if (_currentSound) {
    try {
      await _currentSound.stopAsync();
      await _currentSound.unloadAsync();
    } catch {}
    _currentSound = null;
  }
  // Also stop expo-speech fallback
  try {
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) Speech.stop();
  } catch {}
}

/**
 * Check if TTS is currently speaking.
 */
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
