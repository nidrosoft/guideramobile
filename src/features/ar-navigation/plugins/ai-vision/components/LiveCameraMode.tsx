/**
 * LIVE CAMERA MODE
 *
 * Real-time camera AI translation.
 * Captures frames at 1fps, sends to Gemini for analysis,
 * shows floating translation overlay + optional TTS audio.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import { VolumeHigh, VolumeCross, Microphone2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { CloseCircle } from 'iconsax-react-native';
import TranslationOverlay from './TranslationOverlay';
import LanguagePicker from './LanguagePicker';
import { useFrameAnalysis } from '../hooks/useFrameAnalysis';
import { speak, stopSpeaking } from '../services/tts.service';

interface LiveCameraModeProps {
  userLanguage: string;
  onLanguageChange: (lang: string) => void;
  onClose?: () => void;
  onVoiceSettings?: () => void;
}

export default function LiveCameraMode({ userLanguage, onLanguageChange, onClose, onVoiceSettings }: LiveCameraModeProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const { isActive, isProcessing, currentResult, error, start, stop } = useFrameAnalysis();
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false); // AI only analyzes when user asks
  const [hasGreeted, setHasGreeted] = useState(false);
  const lastSpokenRef = useRef<string>('');
  const isMutedRef = useRef(false); // ref for mute state inside async callbacks

  // Keep mute ref in sync with state
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Welcome greeting on first open (with user's name if available)
  useEffect(() => {
    if (hasGreeted) return;
    setHasGreeted(true);
    const timer = setTimeout(async () => {
      if (isMutedRef.current) return;
      try {
        // Try to get user's first name for personalized greeting
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const profileStr = await AsyncStorage.getItem('@guidera_profile_cache');
        let name = '';
        if (profileStr) {
          try { name = JSON.parse(profileStr)?.first_name || ''; } catch {}
        }
        const greeting = name
          ? `Hey ${name}! I'm your AI travel companion. Point your camera at anything — a sign, a landmark, a menu — and tap the "What's this?" button when you want me to take a look.`
          : `Hey there! I'm your AI travel companion. Point your camera at anything interesting and tap "What's this?" when you want me to tell you about it.`;
        await speak(greeting, { language: 'en', rate: 1.05 });
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Camera ready — but DON'T auto-start analysis (passive mode)
  const handleCameraReady = useCallback(() => {
    // Camera is ready but we wait for user to tap "What's this?"
  }, []);

  // User taps "What's this?" — take ONE snapshot and analyze it
  const handleAskAI = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsListening(true);

    // Take a single snapshot and analyze it
    if (!isActive) {
      start(cameraRef.current, userLanguage);
    }

    // Auto-stop after one analysis cycle (3 seconds max)
    setTimeout(() => {
      stop();
      setIsListening(false);
    }, 4000);
  }, [isActive, isProcessing, start, stop, userLanguage]);

  // Speak result when new analysis arrives (only if not muted)
  useEffect(() => {
    if (
      !isMutedRef.current &&
      isListening &&
      currentResult?.hasText &&
      currentResult.translation &&
      currentResult.translation !== lastSpokenRef.current
    ) {
      lastSpokenRef.current = currentResult.translation;
      speak(currentResult.translation, {
        language: userLanguage,
        rate: 1.05,
      }).catch(() => {});
    }
  }, [currentResult, isListening, userLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      stopSpeaking();
    };
  }, [stop]);

  const toggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    if (newMuted) {
      stopSpeaking();
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={handleCameraReady}
      />

      {/* Top controls — live indicator, language picker, close */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, isListening && styles.liveDotActive]} />
          <Text style={styles.liveText}>
            {isListening ? 'LOOKING...' : isProcessing ? 'THINKING...' : 'READY'}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <LanguagePicker selectedLanguage={userLanguage} onSelect={onLanguageChange} />

        {onClose && (
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton}>
            <CloseCircle size={32} color="rgba(255,255,255,0.85)" variant="Bold" />
          </TouchableOpacity>
        )}
      </View>

      {/* Translation overlay — shows result when available */}
      <TranslationOverlay result={currentResult} isProcessing={isProcessing} />

      {/* "What's this?" — main CTA button in center */}
      <View style={styles.askContainer}>
        <TouchableOpacity
          style={[styles.askButton, isListening && styles.askButtonActive]}
          onPress={handleAskAI}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.askButtonText}>Analyzing...</Text>
          ) : (
            <Text style={styles.askButtonText}>What's this?</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom controls (above mode selector) */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute} activeOpacity={0.7}>
          {isMuted ? (
            <VolumeCross size={24} color="#FFFFFF" variant="Bold" />
          ) : (
            <VolumeHigh size={24} color="#3FC39E" variant="Bold" />
          )}
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {onVoiceSettings && (
          <TouchableOpacity style={styles.controlButton} onPress={onVoiceSettings} activeOpacity={0.7}>
            <Microphone2 size={24} color="rgba(255,255,255,0.7)" variant="Bold" />
            <Text style={styles.controlLabel}>Voice</Text>
          </TouchableOpacity>
        )}

        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            Point at anything, then tap above
          </Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  liveDotActive: {
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  controlLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  hintContainer: {
    flex: 1,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 170,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239,68,68,0.9)',
    borderRadius: 12,
    padding: 12,
    zIndex: 100,
  },
  errorText: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // "What's this?" CTA button
  askContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  askButton: {
    backgroundColor: 'rgba(63,195,158,0.9)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#3FC39E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  askButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.9)',
    shadowColor: '#EF4444',
  },
  askButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
