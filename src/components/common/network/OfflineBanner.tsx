import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wifi, Refresh } from 'iconsax-react-native';
import { colors, typography, spacing } from '@/styles';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OfflineBannerProps {
  onRetry?: () => void;
}

/**
 * Banner that appears when the device is offline.
 * Automatically shows/hides based on network status.
 * 
 * Usage:
 * Place at the top of your screen or in the root layout.
 * <OfflineBanner />
 */
export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const { isOffline, refresh } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -100,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [isOffline, slideAnim]);

  const handleRetry = () => {
    refresh();
    onRetry?.();
  };

  // Don't render at all when online to avoid any visual artifacts
  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.xs,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="auto"
    >
      <View style={styles.content}>
        <Wifi size={18} color={colors.white} variant="Bold" />
        <Text style={styles.text}>No internet connection</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.7}
        >
          <Refresh size={16} color={colors.white} variant="Bold" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.error,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    flex: 1,
  },
  retryButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
});

export default OfflineBanner;
