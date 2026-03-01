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
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { UserProfile } from '../types/account.types';

interface ProfileHeaderProps {
  user: UserProfile;
  onEditPress?: () => void;
  onAvatarPress?: () => void;
}

export default function ProfileHeader({ user, onEditPress, onAvatarPress }: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const fullName = `${user.firstName} ${user.lastName}`;
  const isPremium = user.membership?.type === 'premium' || user.membership?.type === 'pro';
  
  return (
    <View style={styles.container}>
      {/* Dark solid background - matches safe area exactly */}
      <View style={[styles.backgroundSolid, { backgroundColor: isDark ? colors.bgSecondary : '#1C1C1E' }]} />
      
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
                <Verify size={16} color="#FFFFFF" variant="Bold" />
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
        <TouchableOpacity style={[styles.editButton, { backgroundColor: 'rgba(255,255,255,0.12)' }]} onPress={onEditPress}>
          <Edit2 size={20} color="#FFFFFF" variant="Outline" />
        </TouchableOpacity>
      </View>
      
      {/* Stats */}
      {user.stats && (
        <View style={[styles.statsContainer, { backgroundColor: isDark ? '#1A1A1A' : colors.bgCard, zIndex: 1 }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{user.stats.tripsCompleted}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trips</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{user.stats.countriesVisited}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Countries</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{user.stats.reviewsWritten}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{user.stats.communitiesJoined}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Groups</Text>
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
    height: 420,
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
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3FC39E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  premiumTag: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#111827',
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
    color: '#FFFFFF',
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md, // Slight negative margin - pushed down a bit
    paddingVertical: spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
  },
});
