/**
 * VOICE SERVICE
 *
 * Premium turn-by-turn voice guidance using the SAME Gemini TTS
 * that powers AI Vision (Kore HD voice via /functions/v1/tts).
 *
 * Falls back to expo-speech only if the API call fails.
 *
 * Humanizes navigation instructions for a more natural experience:
 * "Turn left" → "In about 50 meters, turn left"
 */

import * as Speech from 'expo-speech';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_NAME_KEY = '@guidera_tts_voice_name';
const DEFAULT_VOICE = 'Kore'; // Same HD voice as AI Vision

let currentSound: Audio.Sound | null = null;

class VoiceService {
  private _enabled = true;
  private speaking = false;
  private queue: string[] = [];
  private processing = false;

  setEnabled(enabled: boolean) {
    this._enabled = enabled;
    if (!enabled) this.stop();
  }

  get isEnabled() {
    return this._enabled;
  }

  /**
   * Get the user's preferred voice name (same as AI Vision selection).
   */
  private async getVoiceName(): Promise<string> {
    try {
      const saved = await AsyncStorage.getItem(VOICE_NAME_KEY);
      if (saved) return saved;
    } catch {}
    return DEFAULT_VOICE;
  }

  /**
   * Humanize a navigation instruction to sound more natural.
   */
  private humanize(instruction: string, distanceMeters?: number): string {
    if (!instruction) return '';

    let text = instruction;

    // Add distance context
    if (distanceMeters && distanceMeters > 20) {
      if (distanceMeters >= 1000) {
        const km = (distanceMeters / 1000).toFixed(1);
        text = `In about ${km} kilometers, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
      } else {
        const rounded = Math.round(distanceMeters / 10) * 10;
        text = `In about ${rounded} meters, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
      }
    }

    // Make it more conversational
    text = text
      .replace(/Head (north|south|east|west)/i, 'Start heading $1')
      .replace(/Continue (on|along)/i, 'Keep going $1')
      .replace(/Turn sharp/i, 'Take a sharp turn')
      .replace(/Arrive at/i, "You've arrived at");

    return text;
  }

  /**
   * Speak text using Gemini TTS (same voice as AI Vision).
   * Falls back to expo-speech if API fails.
   */
  async speak(text: string, distanceMeters?: number) {
    if (!this._enabled || !text.trim()) return;

    const humanized = this.humanize(text, distanceMeters);
    this.queue.push(humanized);

    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const text = this.queue.shift()!;

    // Stop any current playback
    await this.stopCurrent();

    try {
      // Use the SAME Gemini TTS endpoint as AI Vision
      if (supabaseUrl) {
        const voiceName = await this.getVoiceName();
        const audio = await this.fetchGeminiTTS(text, voiceName);
        if (audio) {
          await this.playAudio(audio.audioContent, audio.audioFormat);
          this.processQueue();
          return;
        }
      }
    } catch (e) {
      if (__DEV__) console.warn('[VoiceNav] Gemini TTS failed, falling back:', e);
    }

    // Fallback: expo-speech
    this.speaking = true;
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.95,
      pitch: 1.0,
      onDone: () => {
        this.speaking = false;
        this.processQueue();
      },
      onError: () => {
        this.speaking = false;
        this.processQueue();
      },
    });
  }

  /**
   * Fetch Gemini TTS audio from the SAME edge function AI Vision uses.
   * Endpoint: /functions/v1/tts
   * Uses Kore (or user-selected) HD voice.
   */
  private async fetchGeminiTTS(
    text: string,
    voiceName: string
  ): Promise<{ audioContent: string; audioFormat: string } | null> {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          text,
          voiceName,
          language: 'en-US',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`TTS HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      if (data.audioContent) {
        return {
          audioContent: data.audioContent,
          audioFormat: data.audioFormat || 'wav',
        };
      }
      return null;
    } catch (e) {
      if (__DEV__) console.warn('[VoiceNav] TTS fetch error:', e);
      return null;
    }
  }

  /**
   * Play base64 audio using expo-av. Supports WAV (from Gemini TTS).
   */
  private async playAudio(base64Audio: string, format: string = 'wav'): Promise<void> {
    try {
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });

      // Create sound from data URI
      const mimeType = format === 'wav' ? 'audio/wav' : 'audio/mp3';
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:${mimeType};base64,${base64Audio}` },
        { shouldPlay: true, volume: 1.0 }
      );

      currentSound = sound;
      this.speaking = true;

      // Wait for playback to complete
      return new Promise((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            this.speaking = false;
            sound.unloadAsync().catch(() => {});
            currentSound = null;
            resolve();
          }
        });
      });
    } catch (e) {
      this.speaking = false;
      if (__DEV__) console.warn('[VoiceNav] Audio playback error:', e);
    }
  }

  private async stopCurrent() {
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch {}
      currentSound = null;
    }
    if (this.speaking) {
      try { await Speech.stop(); } catch {}
    }
    this.speaking = false;
  }

  async stop() {
    this.queue = [];
    await this.stopCurrent();
  }
}

export const voiceService = new VoiceService();
