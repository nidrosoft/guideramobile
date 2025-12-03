/**
 * BUDDY MATCH CARD
 * 
 * Displays a travel buddy match with compatibility score.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Verify, Location, Crown } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { BuddyMatch } from '../types/buddy.types';

interface BuddyMatchCardProps {
  buddy: BuddyMatch;
  onPress: () => void;
  isPremium: boolean;
}

export default function BuddyMatchCard({ buddy, onPress, isPremium }: BuddyMatchCardProps) {
  const getMatchColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.gray400;
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: buddy.avatar }} style={styles.avatar} />
        {buddy.verificationLevel !== 'none' && (
          <View style={styles.verifiedBadge}>
            <Verify size={12} color={colors.white} variant="Bold" />
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{buddy.firstName} {buddy.lastName}</Text>
          <View style={[styles.matchBadge, { backgroundColor: getMatchColor(buddy.matchScore) + '20' }]}>
            <Text style={[styles.matchText, { color: getMatchColor(buddy.matchScore) }]}>
              {buddy.matchScore}% match
            </Text>
          </View>
        </View>
        
        {buddy.sharedTrip && (
          <View style={styles.tripRow}>
            <Location size={14} color={colors.primary} variant="Bold" />
            <Text style={styles.tripText}>
              {buddy.sharedTrip.destination} • {buddy.sharedTrip.dates}
            </Text>
          </View>
        )}
        
        <Text style={styles.bio} numberOfLines={2}>{buddy.bio}</Text>
        
        {/* Match Reasons */}
        <View style={styles.reasons}>
          {buddy.matchReasons.slice(0, 2).map((reason, index) => (
            <View key={index} style={styles.reasonTag}>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Connect Button */}
      <View style={styles.actionContainer}>
        {!isPremium ? (
          <View style={styles.premiumLock}>
            <Crown size={16} color={colors.warning} variant="Bold" />
          </View>
        ) : buddy.connectionStatus === 'pending_sent' ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.connectButton}>
            <Text style={styles.connectText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  matchBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  matchText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tripText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  bio: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  reasons: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  reasonTag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  reasonText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  actionContainer: {
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  premiumLock: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.full,
  },
  pendingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  connectButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  connectText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
});
