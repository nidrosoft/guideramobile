/**
 * LIVE CAMERA MODE
 *
 * Real-time camera AI translation.
 * Captures frames at 1fps, sends to Gemini for analysis,
 * shows floating translation overlay + optional TTS audio.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
}

export default function LiveCameraMode({ userLanguage, onLanguageChange, onClose }: LiveCameraModeProps) {
  const cameraRef = useRef<any>(null);
  const { isActive, isProcessing, currentResult, error, start, stop } = useFrameAnalysis();
  const [isMuted, setIsMuted] = useState(false);
  const lastSpokenRef = useRef<string>('');

  // Start frame analysis when camera is ready
  const handleCameraReady = useCallback(() => {
    if (cameraRef.current && !isActive) {
      start(cameraRef.current, userLanguage);
    }
  }, [isActive, start, userLanguage]);

  // Restart analysis when language changes
  useEffect(() => {
    if (isActive && cameraRef.current) {
      stop();
      const timer = setTimeout(() => {
        if (cameraRef.current) {
          start(cameraRef.current, userLanguage);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [userLanguage]);

  // Speak translation when new result arrives (if not muted)
  useEffect(() => {
    if (
      !isMuted &&
      currentResult?.hasText &&
      currentResult.translation &&
      currentResult.translation !== lastSpokenRef.current
    ) {
      lastSpokenRef.current = currentResult.translation;
      speak(currentResult.translation, {
        language: userLanguage,
        rate: 0.9,
      }).catch(() => {});
    }
  }, [currentResult, isMuted, userLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      stopSpeaking();
    };
  }, [stop]);

  const toggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(prev => !prev);
    if (!isMuted) {
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

      {/* Top controls — close, live indicator, language picker all inline */}
      <View style={styles.topBar}>
        {/* Live indicator */}
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, isActive && styles.liveDotActive]} />
          <Text style={styles.liveText}>
            {isActive ? 'LIVE' : 'STARTING...'}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Language picker */}
        <LanguagePicker
          selectedLanguage={userLanguage}
          onSelect={onLanguageChange}
        />

        {/* Close button — inline next to language picker */}
        {onClose && (
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton}>
            <CloseCircle size={32} color="rgba(255,255,255,0.85)" variant="Bold" />
          </TouchableOpacity>
        )}
      </View>

      {/* Translation overlay */}
      <TranslationOverlay result={currentResult} isProcessing={isProcessing} />

      {/* Bottom controls (above mode selector) */}
      <View style={styles.bottomControls}>
        {/* Mute toggle */}
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute} activeOpacity={0.7}>
          {isMuted ? (
            <VolumeCross size={24} color="#FFFFFF" variant="Bold" />
          ) : (
            <VolumeHigh size={24} color="#3FC39E" variant="Bold" />
          )}
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            Point your camera at signs, menus, or text
          </Text>
        </View>
      </View>

      {/* Error display */}
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
});
