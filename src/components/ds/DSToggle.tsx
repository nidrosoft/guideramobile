/**
 * DESIGN SYSTEM — TOGGLE
 *
 * Sizes: sm, md, lg
 * Active: accent bg + white thumb. Inactive: bgElevated bg + gray thumb.
 * Animated with LayoutAnimation.
 */

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ToggleSize = 'sm' | 'md' | 'lg';

interface DSToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: ToggleSize;
  disabled?: boolean;
}

const SIZE_CONFIG = {
  sm: { trackW: 36, trackH: 20, thumb: 14 },
  md: { trackW: 44, trackH: 24, thumb: 18 },
  lg: { trackW: 52, trackH: 28, thumb: 22 },
};

export default function DSToggle({
  value,
  onValueChange,
  size = 'md',
  disabled = false,
}: DSToggleProps) {
  const config = SIZE_CONFIG[size];
  const thumbOffset = value ? config.trackW - config.thumb - 4 : 2;

  const handlePress = useCallback(() => {
    if (disabled) return;
    LayoutAnimation.configureNext(
      LayoutAnimation.create(250, 'easeInEaseOut', 'opacity')
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(!value);
  }, [disabled, value, onValueChange]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.track,
        {
          width: config.trackW,
          height: config.trackH,
          borderRadius: config.trackH / 2,
          backgroundColor: value ? colors.primary : colors.bgElevated,
        },
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            width: config.thumb,
            height: config.thumb,
            borderRadius: config.thumb / 2,
            transform: [{ translateX: thumbOffset }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
  },
  thumb: {
    backgroundColor: colors.bgElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
