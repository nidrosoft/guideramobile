/**
 * TTS SERVICE
 *
 * Text-to-Speech using expo-speech (FREE, on-device).
 * Supports 100+ languages on modern iOS/Android devices.
 * Falls back gracefully if a voice isn't available for the target language.
 */

import * as Speech from 'expo-speech';
import { TTS_VOICE_MAP } from '../constants/translatorConfig';

export interface TTSOptions {
  language: string;
  rate?: number;   // 0.5 - 2.0, default 0.9
  pitch?: number;  // 0.5 - 2.0, default 1.0
  onDone?: () => void;
  onError?: (error: any) => void;
}

/**
 * Speak text using the device's built-in TTS engine.
 * Automatically selects the best voice for the language.
 */
export async function speak(text: string, options: TTSOptions): Promise<void> {
  if (!text.trim()) return;

  // Stop any currently playing speech
  await stopSpeaking();

  const voiceId = TTS_VOICE_MAP[options.language] || options.language;

  return new Promise<void>((resolve, reject) => {
    Speech.speak(text, {
      language: voiceId,
      rate: options.rate ?? 0.9,
      pitch: options.pitch ?? 1.0,
      onDone: () => {
        options.onDone?.();
        resolve();
      },
      onError: (error) => {
        options.onError?.(error);
        reject(error);
      },
      onStopped: () => {
        resolve();
      },
    });
  });
}

/**
 * Stop any currently playing speech.
 */
export async function stopSpeaking(): Promise<void> {
  const isSpeaking = await Speech.isSpeakingAsync();
  if (isSpeaking) {
    Speech.stop();
  }
}

/**
 * Check if a specific language is available for TTS on this device.
 */
export async function isLanguageAvailable(languageCode: string): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const voiceId = TTS_VOICE_MAP[languageCode] || languageCode;
    return voices.some(
      v => v.language.startsWith(languageCode) || v.language === voiceId,
    );
  } catch {
    return false;
  }
}

/**
 * Check if TTS is currently speaking.
 */
export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
