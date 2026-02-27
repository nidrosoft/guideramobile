/**
 * CHECKOUT SECTION
 * 
 * Reusable expandable section component for checkout flow.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowRight2, TickCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface CheckoutSectionProps {
  title: string;
  subtitle?: string | React.ReactNode;
  icon: React.ReactNode;
  completed?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  index?: number;
}

export default function CheckoutSection({
  title,
  subtitle,
  icon,
  completed = false,
  disabled = false,
  loading = false,
  onPress,
  index = 0,
}: CheckoutSectionProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <TouchableOpacity
        style={[styles.container, disabled && styles.containerDisabled]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, completed && styles.iconContainerCompleted]}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : completed ? (
            <TickCircle size={20} color={colors.white} variant="Bold" />
          ) : (
            icon
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, disabled && styles.titleDisabled]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, disabled && styles.subtitleDisabled]}>
              {subtitle}
            </Text>
          )}
        </View>
        
        <ArrowRight2 size={20} color={disabled ? colors.gray300 : colors.gray400} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  containerDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainerCompleted: {
    backgroundColor: colors.success,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.textPrimary,
  },
  titleDisabled: {
    color: colors.gray400,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subtitleDisabled: {
    color: colors.gray300,
  },
});
