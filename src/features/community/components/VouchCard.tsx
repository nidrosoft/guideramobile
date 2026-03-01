/**
 * VOUCH CARD
 * 
 * Displays a vouch from one verified guide to another.
 * Shows voucher's avatar, name, trust tier, and optional message.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { GuideVouch } from '../types/guide.types';
import TrustBadge from './TrustBadge';

interface VouchCardProps {
  vouch: GuideVouch;
  onVoucherPress?: () => void;
}

export default function VouchCard({ vouch, onVoucherPress }: VouchCardProps) {
  const { colors: tc } = useTheme();
  const timeSince = getTimeSince(vouch.createdAt);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
      onPress={onVoucherPress}
      activeOpacity={onVoucherPress ? 0.7 : 1}
      disabled={!onVoucherPress}
    >
      <Image source={{ uri: vouch.voucherAvatar }} style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: tc.textPrimary }]}>{vouch.voucherName}</Text>
          <TrustBadge tier={vouch.voucherTrustTier} size="small" showLabel={false} />
        </View>
        {vouch.message ? (
          <Text style={[styles.message, { color: tc.textSecondary }]} numberOfLines={2}>"{vouch.message}"</Text>
        ) : (
          <Text style={[styles.vouched, { color: colors.textTertiary }]}>Vouched for this guide</Text>
        )}
        <Text style={[styles.time, { color: colors.textTertiary }]}>{timeSince}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 3,
  },
  vouched: {
    fontSize: 13,
    color: colors.textTertiary,
    marginBottom: 3,
  },
  time: {
    fontSize: 11,
    color: colors.textTertiary,
  },
});
