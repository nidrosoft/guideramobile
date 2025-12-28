/**
 * LoadingButton Component
 * 
 * Button with integrated loading state for async actions.
 * Prevents double-taps and shows loading indicator.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface LoadingButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  hapticFeedback = true,
  loadingText,
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = async () => {
    if (isDisabled) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await onPress();
  };

  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.buttonDisabled,
    isDisabled && styles[`button_${variant}_disabled`],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={loading ? loadingText || 'Loading' : title}
    >
      {loading ? (
        <>
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary}
            style={styles.loader}
          />
          {loadingText && <Text style={textStyles}>{loadingText}</Text>}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
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
    borderRadius: 12,
    gap: spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Variants
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_primary_disabled: {
    backgroundColor: colors.gray300,
  },
  button_secondary: {
    backgroundColor: colors.gray100,
  },
  button_secondary_disabled: {},
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  button_outline_disabled: {
    borderColor: colors.gray300,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_ghost_disabled: {},
  button_danger: {
    backgroundColor: colors.error,
  },
  button_danger_disabled: {
    backgroundColor: colors.gray300,
  },

  // Sizes
  button_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  button_md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  button_lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },

  // Text
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
  textDisabled: {
    color: colors.gray400,
  },
  text_primary: {
    color: colors.white,
  },
  text_secondary: {
    color: colors.gray900,
  },
  text_outline: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.primary,
  },
  text_danger: {
    color: colors.white,
  },
  text_sm: {
    fontSize: typography.fontSize.sm,
  },
  text_md: {
    fontSize: typography.fontSize.base,
  },
  text_lg: {
    fontSize: typography.fontSize.lg,
  },

  loader: {
    marginRight: spacing.xs,
  },
});

export default LoadingButton;
