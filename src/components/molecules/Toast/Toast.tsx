import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TickCircle, InfoCircle, Warning2, CloseCircle } from 'iconsax-react-native';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors: tc, isDark } = useTheme();
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
          icon: <TickCircle size={20} color={tc.success} variant="Bold" />,
          backgroundColor: tc.successBg,
          iconColor: tc.success,
        };
      case 'error':
        return {
          icon: <CloseCircle size={20} color={tc.error} variant="Bold" />,
          backgroundColor: tc.errorBg,
          iconColor: tc.error,
        };
      case 'warning':
        return {
          icon: <Warning2 size={20} color={tc.warning} variant="Bold" />,
          backgroundColor: tc.warningBg,
          iconColor: tc.warning,
        };
      case 'info':
        return {
          icon: <InfoCircle size={20} color={tc.info} variant="Bold" />,
          backgroundColor: tc.infoBg,
          iconColor: tc.info,
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
      <View style={[styles.toast, { backgroundColor: isDark ? tc.bgSecondary : tc.white, borderWidth: 1, borderColor: isDark ? tc.borderMedium : tc.borderStandard }]}>
        <View style={[styles.iconContainer, { backgroundColor }]}>
          {icon}
        </View>
        <Text style={[styles.message, { color: tc.textPrimary }]}>{message}</Text>
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
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
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
    fontWeight: typography.fontWeight.semibold,
  },
});
