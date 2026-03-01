/**
 * DESIGN SYSTEM — BUTTON
 *
 * Variants: primary, secondary, ghost
 * Sizes: sm, md, lg, xl
 * Pill-shaped (borderRadius: 999). Primary uses dark text on mint.
 */

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/colors';
import { fontFamily } from '@/styles/typography';
import { shadows } from '@/styles/shadows';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface DSButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
  fullWidth?: boolean;
}

const SIZE_CONFIG = {
  sm: { height: 36, fontSize: 12, paddingHorizontal: 14 },
  md: { height: 44, fontSize: 13, paddingHorizontal: 20 },
  lg: { height: 48, fontSize: 14, paddingHorizontal: 24 },
  xl: { height: 52, fontSize: 15, paddingHorizontal: 28 },
};

export default function DSButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  haptic = true,
  fullWidth = false,
}: DSButtonProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, loading, haptic, onPress]);

  const containerStyle: ViewStyle[] = [
    styles.base,
    { height: sizeConfig.height, paddingHorizontal: sizeConfig.paddingHorizontal },
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    variant === 'primary' && shadows.btnPrimary,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const labelStyle: TextStyle[] = [
    styles.label,
    { fontSize: sizeConfig.fontSize },
    variant === 'primary' && styles.primaryLabel,
    variant === 'secondary' && styles.secondaryLabel,
    variant === 'ghost' && styles.ghostLabel,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  const iconColor =
    variant === 'primary' ? colors.primaryText : colors.textSecondary;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.primaryText : colors.textSecondary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={labelStyle}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    gap: 6,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStandard,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Labels
  label: {
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
  },
  primaryLabel: {
    color: colors.primaryText,
    fontFamily: fontFamily.bold,
    fontWeight: '700',
  },
  secondaryLabel: {
    color: colors.textSecondary,
  },
  ghostLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontWeight: '500',
  },
});
