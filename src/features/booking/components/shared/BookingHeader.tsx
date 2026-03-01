/**
 * BOOKING HEADER
 * 
 * Header component for booking flows with back button, title, and close button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface BookingHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  showBack?: boolean;
  showClose?: boolean;
  transparent?: boolean;
  rightComponent?: React.ReactNode;
}

export default function BookingHeader({
  title,
  subtitle,
  onBack,
  onClose,
  showBack = true,
  showClose = true,
  transparent = false,
  rightComponent,
}: BookingHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };
  
  return (
    <View 
      style={[
        styles.container, 
        { paddingTop: insets.top + spacing.sm, backgroundColor: colors.bgElevated, borderBottomColor: colors.borderSubtle },
        transparent && styles.transparent,
      ]}
    >
      <View style={styles.content}>
        {/* Left - Back Button */}
        <View style={styles.leftSection}>
          {showBack && onBack && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.bgCard }]}
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Center - Title */}
        <View style={styles.centerSection}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {/* Right - Close Button or Custom Component */}
        <View style={styles.rightSection}>
          {rightComponent ? (
            rightComponent
          ) : showClose && onClose ? (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.bgCard }]}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseCircle size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  leftSection: {
    width: 44,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 44,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
});
