/**
 * TRANSLATION OVERLAY
 *
 * Floating text overlay on the live camera view.
 * Shows translated text with a subtle glass background.
 * Animates in/out when new translations arrive.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LanguageSquare } from 'iconsax-react-native';
import { getLanguageName, getLanguageFlag } from '../constants/translatorConfig';
import type { LiveFrameResult } from '../types/aiVision.types';

interface TranslationOverlayProps {
  result: LiveFrameResult | null;
  isProcessing: boolean;
}

export default function TranslationOverlay({ result, isProcessing }: TranslationOverlayProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (result?.hasText && result.translation) {
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [result]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!result?.hasText || !result.translation) {
    // Show processing indicator
    if (isProcessing) {
      return (
        <View style={styles.processingContainer}>
          <View style={styles.processingDot} />
          <Text style={styles.processingText}>Scanning...</Text>
        </View>
      );
    }
    return null;
  }

  return (
    <Animated.View style={[styles.container, animStyle]}>
      {/* Language badge */}
      {result.sourceLanguage && (
        <View style={styles.languageBadge}>
          <LanguageSquare size={14} color="#3FC39E" variant="Bold" />
          <Text style={styles.languageText}>
            {getLanguageFlag(result.sourceLanguage)} {getLanguageName(result.sourceLanguage)}
          </Text>
        </View>
      )}

      {/* Translation text */}
      <Text style={styles.translationText}>{result.translation}</Text>

      {/* Explanation (if any) */}
      {result.explanation && (
        <Text style={styles.explanationText}>{result.explanation}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(63,195,158,0.3)',
    zIndex: 50,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  translationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  explanationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    lineHeight: 20,
  },
  processingContainer: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 50,
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3FC39E',
  },
  processingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});
