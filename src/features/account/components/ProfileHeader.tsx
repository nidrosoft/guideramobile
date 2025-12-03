/**
 * PROFILE HEADER
 * 
 * User profile card with avatar, name, stats, and quick actions.
 * Dark theme header with gradient background.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Edit2, Verify, Star1, Location } from 'iconsax-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { UserProfile } from '../types/account.types';

// Apple-style dark color - must match AccountScreen safe area
const DARK_BG = '#1C1C1E';

interface ProfileHeaderProps {
  user: UserProfile;
  onEditPress?: () => void;
  onAvatarPress?: () => void;
}

export default function ProfileHeader({ user, onEditPress, onAvatarPress }: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();
  const fullName = `${user.firstName} ${user.lastName}`;
  const isPremium = user.membership?.type === 'premium' || user.membership?.type === 'pro';
  
  return (
    <View style={styles.container}>
      {/* Dark solid background - matches safe area exactly */}
      <View style={styles.backgroundSolid} />
      
      {/* Profile content */}
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        {/* Avatar */}
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user.avatar || 'https://i.pravatar.cc/150?img=12' }}
              style={styles.avatar}
            />
            {user.verified?.identity && (
              <View style={styles.verifiedBadge}>
                <Verify size={16} color={colors.white} variant="Bold" />
              </View>
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Star1 size={12} color={colors.warning} variant="Bold" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Name & Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{fullName}</Text>
            {isPremium && (
              <View style={styles.premiumTag}>
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}
          </View>
          
          {user.location && (
            <View style={styles.locationRow}>
              <Location size={14} color={colors.success} variant="Bold" />
              <Text style={styles.location}>{user.location}</Text>
            </View>
          )}
          
          {user.bio && (
            <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
          )}
        </View>
        
        {/* Edit button */}
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Edit2 size={20} color={colors.white} variant="Outline" />
        </TouchableOpacity>
      </View>
      
      {/* Stats */}
      {user.stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.tripsCompleted}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.countriesVisited}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.reviewsWritten}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.communitiesJoined}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  backgroundSolid: {
    position: 'absolute',
    top: -200,
    left: 0,
    right: 0,
    height: 420, // Increased height so stats card sits at edge
    backgroundColor: DARK_BG,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'], // More space for stats card to overlap
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
    paddingTop: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  premiumTag: {
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  location: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md, // Slight negative margin - pushed down a bit
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.gray200,
    alignSelf: 'center',
  },
});
