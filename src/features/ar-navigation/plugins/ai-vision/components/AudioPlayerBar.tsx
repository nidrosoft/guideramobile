/**
 * AUDIO PLAYER BAR
 *
 * Prominent play/pause bar for generated order audio.
 * Shows "Tap to play your order to the waiter" with a large play button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause, VolumeHigh } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  localLanguage: string;
}

export default function AudioPlayerBar({
  isPlaying,
  onPlay,
  onStop,
  localLanguage,
}: AudioPlayerBarProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <VolumeHigh size={24} color="#3FC39E" variant="Bold" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {isPlaying ? 'Playing your order...' : 'Tap to play your order'}
        </Text>
        <Text style={styles.subtitle}>
          {isPlaying ? 'Show your phone to the waiter' : 'The waiter will hear it in their language'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playButtonActive]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {isPlaying ? (
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
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(63,195,158,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
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
});
