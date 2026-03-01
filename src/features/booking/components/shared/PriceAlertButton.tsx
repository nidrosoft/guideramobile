/**
 * PRICE ALERT BUTTON
 *
 * Toggle button that lets users set/remove price alerts on a route.
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

interface PriceAlertButtonProps {
  hasAlert: boolean;
  onToggle: () => void | Promise<void>;
  compact?: boolean;
}

export default function PriceAlertButton({
  hasAlert,
  onToggle,
  compact = false,
}: PriceAlertButtonProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      await onToggle();
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactButton,
          {
            backgroundColor: hasAlert ? '#3FC39E20' : colors.bgCard,
            borderColor: hasAlert ? '#3FC39E' : colors.borderSubtle,
          },
        ]}
        onPress={handlePress}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Ionicons
          name={hasAlert ? 'notifications' : 'notifications-outline'}
          size={18}
          color={hasAlert ? '#3FC39E' : colors.textSecondary}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: hasAlert ? '#3FC39E15' : colors.bgCard,
          borderColor: hasAlert ? '#3FC39E' : colors.borderSubtle,
        },
      ]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <Ionicons
        name={hasAlert ? 'notifications' : 'notifications-outline'}
        size={18}
        color={hasAlert ? '#3FC39E' : colors.textSecondary}
      />
      <Text
        style={[
          styles.label,
          { color: hasAlert ? '#3FC39E' : colors.textPrimary },
        ]}
      >
        {hasAlert ? 'Alert Set' : 'Set Price Alert'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  compactButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  label: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
  },
});
