/**
 * DESIGN SYSTEM — BADGE
 *
 * Sizes: sm, md, lg
 * Variants: default (subtle bg), status (colored), outline
 * Pill-shaped. Supports icon + label.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/styles/colors';
import { fontFamily } from '@/styles/typography';

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'outline';

interface DSBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const SIZE_CONFIG = {
  sm: { fontSize: 10, paddingV: 2, paddingH: 8 },
  md: { fontSize: 11, paddingV: 3, paddingH: 10 },
  lg: { fontSize: 13, paddingV: 5, paddingH: 14 },
};

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  default: { bg: colors.bgElevated, text: colors.textSecondary, border: colors.borderStandard },
  success: { bg: colors.successBg, text: colors.success, border: colors.successBorder },
  warning: { bg: colors.warningBg, text: colors.warning, border: colors.warningBorder },
  error: { bg: colors.errorBg, text: colors.error, border: colors.errorBorder },
  info: { bg: colors.infoBg, text: colors.info, border: colors.infoBorder },
  primary: { bg: colors.primarySubtle, text: colors.primary, border: colors.primaryBorderSubtle },
  outline: { bg: 'transparent', text: colors.textSecondary, border: colors.borderStandard },
};

export default function DSBadge({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
}: DSBadgeProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const variantConfig = VARIANT_STYLES[variant];

  const containerStyle: ViewStyle = {
    ...styles.container,
    backgroundColor: variantConfig.bg,
    borderColor: variantConfig.border,
    paddingVertical: sizeConfig.paddingV,
    paddingHorizontal: sizeConfig.paddingH,
    ...style,
  };

  const textStyle: TextStyle = {
    ...styles.label,
    color: variantConfig.text,
    fontSize: sizeConfig.fontSize,
  };

  return (
    <View style={containerStyle}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
  },
});
