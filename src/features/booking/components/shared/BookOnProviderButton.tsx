/**
 * BOOK ON PROVIDER BUTTON
 *
 * Primary CTA that redirects user to external booking platform.
 * Shows provider name, logo color, and opens browser/app.
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getProviderDisplayName, getProviderColor } from '@/services/deal';

interface BookOnProviderButtonProps {
  provider: string;
  onPress: () => void | Promise<void>;
  price?: string;
  disabled?: boolean;
}

export default function BookOnProviderButton({
  provider,
  onPress,
  price,
  disabled = false,
}: BookOnProviderButtonProps) {
  const [loading, setLoading] = useState(false);
  const displayName = getProviderDisplayName(provider);
  const color = getProviderColor(provider);

  const handlePress = async () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await onPress();
    } finally {
      // Keep loading briefly so user sees feedback before browser opens
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: color },
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <>
          <View style={styles.content}>
            <Text style={styles.label}>Book on {displayName}</Text>
            {price && <Text style={styles.price}>{price}</Text>}
          </View>
          <Ionicons name="open-outline" size={18} color="#FFFFFF" />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  price: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
