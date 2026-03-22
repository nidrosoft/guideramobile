/**
 * DESIGN SYSTEM — PROGRESS BAR
 *
 * Animated fill with accent color on dark track.
 * Supports label and percentage display.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { fontFamily } from '@/styles/typography';

interface DSProgressBarProps {
  progress: number; // 0-1
  label?: string;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export default function DSProgressBar({
  progress,
  label,
  showPercentage = false,
  height = 6,
  color,
  trackColor,
  style,
}: DSProgressBarProps) {
  const { colors } = useTheme();
  const fillColor = color ?? colors.primary;
  const bgTrackColor = trackColor ?? colors.bgElevated;
  const clamped = Math.max(0, Math.min(1, progress));
  const pct = Math.round(clamped * 100);

  return (
    <View style={[styles.wrapper, style]}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
          {showPercentage && <Text style={[styles.pct, { color: colors.textPrimary }]}>{pct}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: bgTrackColor, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              height,
              backgroundColor: fillColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
  },
  pct: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    // width set dynamically
  },
});
