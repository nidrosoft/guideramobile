/**
 * AUDIO PLAYER BAR
 *
 * Prominent play/pause bar for generated order audio.
 * Shows loading state while TTS is generating, then play/pause controls.
 * Theme-aware: supports light and dark mode.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, Pause, VolumeHigh } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onPlay: () => void;
  onStop: () => void;
  localLanguage: string;
}

export default function AudioPlayerBar({
  isPlaying,
  isLoading = false,
  onPlay,
  onStop,
  localLanguage,
}: AudioPlayerBarProps) {
  const { isDark } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  const getTitle = () => {
    if (isLoading) return 'Preparing audio...';
    if (isPlaying) return 'Playing your order...';
    return 'Tap to play your order';
  };

  const getSubtitle = () => {
    if (isLoading) return 'Generating natural voice — just a moment';
    if (isPlaying) return 'Show your phone to the waiter';
    return 'The waiter will hear it in their language';
  };

  const textColor = isDark ? '#FFFFFF' : 'rgba(0,0,0,0.9)';
  const subtitleColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  return (
    <View style={[styles.container, !isDark && styles.containerLight]}>
      <View style={[styles.iconContainer, !isDark && styles.iconContainerLight]}>
        {isLoading ? (
          <ActivityIndicator color="#3FC39E" size="small" />
        ) : (
          <VolumeHigh size={24} color="#3FC39E" variant="Bold" />
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: textColor }]}>
          {getTitle()}
        </Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          {getSubtitle()}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.playButton,
          isPlaying && styles.playButtonActive,
          isLoading && styles.playButtonLoading,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : isPlaying ? (
          <Pause size={28} color="#FFFFFF" variant="Bold" />
        ) : (
          <Play size={28} color="#FFFFFF" variant="Bold" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(63,195,158,0.12)',
    borderRadius: 20,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(63,195,158,0.3)',
  },
  containerLight: {
    backgroundColor: 'rgba(63,195,158,0.08)',
    borderColor: 'rgba(63,195,158,0.25)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(63,195,158,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerLight: {
    backgroundColor: 'rgba(63,195,158,0.10)',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3FC39E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: '#EF4444',
  },
  playButtonLoading: {
    backgroundColor: 'rgba(63,195,158,0.5)',
  },
});
