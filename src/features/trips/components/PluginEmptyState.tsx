/**
 * PLUGIN EMPTY STATE — Shared empty state for all trip hub plugin screens.
 *
 * Pattern: Colored icon in circle container → Title → Subtitle → CTA button pinned to bottom.
 * Used by: Language, Documents, Packing, Planner, Do's & Don'ts, Safety, Expenses, Journal, Compensation.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { ArrowLeft2 } from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PluginEmptyStateProps {
  headerTitle: string;
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaPress?: () => void;
  headerRight?: React.ReactNode;
  hideHeader?: boolean;
}

export default function PluginEmptyState({
  headerTitle,
  icon,
  iconColor,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  headerRight,
  hideHeader,
}: PluginEmptyStateProps) {
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleCta = onCtaPress || (() => router.replace('/(tabs)/trips'));

  // When used inside a parent that already has a header + SafeAreaView
  if (hideHeader) {
    return (
      <>
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
            {icon}
          </View>
          <Text style={[styles.title, { color: tc.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>{subtitle}</Text>
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: tc.primary }]}
            onPress={handleCta}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{headerTitle}</Text>
        {headerRight || <View style={{ width: 24 }} />}
      </View>

      {/* Content — centered */}
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
          {icon}
        </View>
        <Text style={[styles.title, { color: tc.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>{subtitle}</Text>
      </View>

      {/* CTA — pinned to bottom */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: tc.primary }]}
          onPress={handleCta}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
