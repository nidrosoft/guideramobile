/**
 * MODE SELECTOR
 *
 * Bottom tab switcher between the 4 vision modes.
 * Animated indicator slides between tabs.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, Camera, Receipt21, VolumeHigh, Microphone2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import type { VisionMode } from '../types/aiVision.types';

interface ModeSelectorProps {
  activeMode: VisionMode;
  onModeChange: (mode: VisionMode) => void;
  onVoiceSettings?: () => void;
}

const MODES: { id: VisionMode; label: string; icon: (color: string) => React.ReactNode }[] = [
  {
    id: 'live',
    label: 'Live',
    icon: (c) => <Eye size={20} color={c} variant="Bold" />,
  },
  {
    id: 'snapshot',
    label: 'Translate',
    icon: (c) => <Camera size={20} color={c} variant="Bold" />,
  },
  {
    id: 'menu-scan',
    label: 'Menu',
    icon: (c) => <Receipt21 size={20} color={c} variant="Bold" />,
  },
  {
    id: 'order-builder',
    label: 'Order',
    icon: (c) => <VolumeHigh size={20} color={c} variant="Bold" />,
  },
];

const ACTIVE_COLOR = '#3FC39E';
const INACTIVE_COLOR = 'rgba(255,255,255,0.5)';

export default function ModeSelector({ activeMode, onModeChange, onVoiceSettings }: ModeSelectorProps) {
  const handlePress = (mode: VisionMode) => {
    if (mode === activeMode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onModeChange(mode);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handlePress(mode.id)}
              activeOpacity={0.7}
            >
              {mode.icon(isActive ? ACTIVE_COLOR : INACTIVE_COLOR)}
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Voice settings button */}
        {onVoiceSettings && (
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onVoiceSettings();
            }}
            activeOpacity={0.7}
          >
            <Microphone2 size={18} color={INACTIVE_COLOR} variant="Bold" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 28,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 24,
  },
  tabActive: {
    backgroundColor: 'rgba(63,195,158,0.15)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: INACTIVE_COLOR,
  },
  labelActive: {
    color: ACTIVE_COLOR,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
