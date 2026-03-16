/**
 * VOICE SERVICE
 *
 * Wrapper around expo-speech for turn-by-turn voice guidance.
 * Speaks navigation instructions aloud as user approaches each maneuver.
 */

import * as Speech from 'expo-speech';

class VoiceService {
  private enabled = true;
  private speaking = false;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  get isEnabled() {
    return this.enabled;
  }

  async speak(text: string) {
    if (!this.enabled || !text.trim()) return;
    if (this.speaking) {
      await Speech.stop();
    }
    this.speaking = true;
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.95,
      pitch: 1.0,
      onDone: () => { this.speaking = false; },
      onError: () => { this.speaking = false; },
    });
  }

  async stop() {
    if (this.speaking) {
      await Speech.stop();
      this.speaking = false;
    }
  }
}

export const voiceService = new VoiceService();
