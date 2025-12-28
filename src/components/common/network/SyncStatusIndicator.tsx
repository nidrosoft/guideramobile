/**
 * SyncStatusIndicator
 * 
 * Shows pending sync actions count and sync status.
 * Displays when there are pending offline actions.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CloudChange, TickCircle } from 'iconsax-react-native';
import { colors, typography, spacing } from '@/styles';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface SyncStatusIndicatorProps {
  onPress?: () => void;
  compact?: boolean;
}

export function SyncStatusIndicator({ onPress, compact = false }: SyncStatusIndicatorProps) {
  const { pendingCount, isSyncing, isOnline } = useOfflineSync();

  // Don't show if nothing pending and online
  if (pendingCount === 0 && isOnline && !isSyncing) {
    return null;
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : pendingCount > 0 ? (
          <>
            <CloudChange size={16} color={colors.warning} variant="Bold" />
            <Text style={styles.compactCount}>{pendingCount}</Text>
          </>
        ) : (
          <TickCircle size={16} color={colors.success} variant="Bold" />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSyncing && styles.containerSyncing,
        !isOnline && styles.containerOffline,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <CloudChange size={18} color={colors.white} variant="Bold" />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {isSyncing
            ? 'Syncing...'
            : !isOnline
            ? 'Offline'
            : `${pendingCount} pending`}
        </Text>
        <Text style={styles.subtitle}>
          {isSyncing
            ? 'Uploading changes'
            : !isOnline
            ? 'Changes will sync when online'
            : 'Tap to sync now'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderRadius: 12,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  containerSyncing: {
    backgroundColor: colors.primary,
  },
  containerOffline: {
    backgroundColor: colors.gray600,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  compactCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
  },
});

export default SyncStatusIndicator;
