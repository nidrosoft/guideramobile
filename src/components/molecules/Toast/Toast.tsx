import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TickCircle, InfoCircle, Warning2, CloseCircle } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  onHide: () => void;
  duration?: number;
}

export default function Toast({
  visible,
  message,
  type,
  onHide,
  duration = 3000,
}: ToastProps) {
  const translateY = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide down
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: <TickCircle size={20} color="#10B981" variant="Bold" />,
          backgroundColor: '#10B98115',
          iconColor: '#10B981',
        };
      case 'error':
        return {
          icon: <CloseCircle size={20} color="#EF4444" variant="Bold" />,
          backgroundColor: '#EF444415',
          iconColor: '#EF4444',
        };
      case 'warning':
        return {
          icon: <Warning2 size={20} color="#F59E0B" variant="Bold" />,
          backgroundColor: '#F59E0B15',
          iconColor: '#F59E0B',
        };
      case 'info':
        return {
          icon: <InfoCircle size={20} color="#3B82F6" variant="Bold" />,
          backgroundColor: '#3B82F615',
          iconColor: '#3B82F6',
        };
    }
  };

  const { icon, backgroundColor } = getIconAndColor();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.toast}>
        <View style={[styles.iconContainer, { backgroundColor }]}>
          {icon}
        </View>
        <Text style={styles.message}>{message}</Text>
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
    zIndex: 9999,
    paddingTop: spacing.xl + 40, // Account for status bar
    paddingHorizontal: spacing.lg,
  },
  toast: {
    backgroundColor: colors.gray900,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  message: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
});
