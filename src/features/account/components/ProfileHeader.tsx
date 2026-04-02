/**
 * PROFILE HEADER
 * 
 * User profile card with avatar, name, stats, and quick actions.
 * Dark theme header with gradient background.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Setting2, Verify, Star1, Location, Clock, CloseCircle, TickCircle } from 'iconsax-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius, colors as staticColors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { UserProfile } from '../types/account.types';
import { partnerService } from '@/services/community/partner.service';

interface ProfileHeaderProps {
  user: UserProfile;
  onEditPress?: () => void;
  onAvatarPress?: () => void;
}

// Map application + verification status to a display state
type VerificationDisplayStatus = 'none' | 'draft' | 'in_review' | 'verified' | 'declined';

function getVerificationDisplay(appStatus: string | null, diditStatus: string | null): {
  status: VerificationDisplayStatus;
  label: string;
  color: string;
  bgColor: string;
  Icon: any;
} {
  if (!appStatus || appStatus === 'draft') {
    return { status: 'none', label: '', color: '', bgColor: '', Icon: null };
  }
  if (appStatus === 'approved' || diditStatus === 'approved') {
    return { status: 'verified', label: 'Verified Partner', color: '#FBBF24', bgColor: 'rgba(251,191,36,0.18)', Icon: TickCircle };
  }
  if (appStatus === 'rejected' || diditStatus === 'declined') {
    return { status: 'declined', label: 'Verification Declined', color: staticColors.error, bgColor: 'rgba(239,68,68,0.12)', Icon: CloseCircle };
  }
  // submitted, under_review, identity_verification, in_progress
  return { status: 'in_review', label: 'In Review', color: staticColors.warning, bgColor: 'rgba(245,158,11,0.12)', Icon: Clock };
}

export default function ProfileHeader({ user, onEditPress, onAvatarPress }: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const fullName = `${user.firstName} ${user.lastName}`;
  const isPremium = user.membership?.type === 'premium' || user.membership?.type === 'pro';

  // Partner verification status
  const [partnerStatus, setPartnerStatus] = useState<{ status: string; didit: string } | null>(null);

  useEffect(() => {
    if (!user.id) return;
    partnerService.getApplicationStatus(user.id).then((data) => {
      if (data) {
        setPartnerStatus({ status: data.status, didit: data.didit_verification_status });
      }
    }).catch(() => {});
  }, [user.id]);

  const verification = getVerificationDisplay(
    partnerStatus?.status ?? null,
    partnerStatus?.didit ?? null,
  );

  const handleVerificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/partner-apply');
  };
  
  return (
    <View style={styles.container}>
      {/* Primary gradient background - matches splash screen */}
      <LinearGradient
        colors={['#10B981', '#059669', '#047857', '#065F46']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundSolid}
      />
      
      {/* Profile content */}
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        {/* Avatar */}
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user.avatar || undefined }}
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
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{fullName}</Text>
            {isPremium && (
              <View style={styles.premiumTag}>
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}
          </View>
          
          {/* Verification Status Pill */}
          {verification.status !== 'none' && (
            <TouchableOpacity
              style={[styles.verificationPill, { backgroundColor: verification.bgColor }]}
              onPress={handleVerificationPress}
              activeOpacity={0.7}
            >
              <verification.Icon size={14} color={verification.color} variant="Bold" />
              <Text style={[styles.verificationPillText, { color: verification.color }]}>
                {verification.label}
              </Text>
            </TouchableOpacity>
          )}

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
        
        {/* Settings button */}
        <TouchableOpacity
          onPress={onEditPress || (() => {})}
          activeOpacity={0.7}
          style={styles.settingsButton}
        >
          <Setting2 size={20} color={colors.white} variant="TwoTone" />
        </TouchableOpacity>
      </View>
      
      {/* Stats */}
      {user.stats && (
        <View style={[styles.statsContainer, { backgroundColor: isDark ? colors.bgSecondary : colors.bgCard, zIndex: 1 }]}>
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

const { height: _screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg + spacing.md,
  },
  backgroundSolid: {
    position: 'absolute',
    top: -(_screenHeight * 0.25),
    left: 0,
    right: 0,
    height: _screenHeight * 0.48,
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
    borderColor: staticColors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: staticColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: staticColors.white,
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
    borderColor: staticColors.white,
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
    color: staticColors.white,
  },
  premiumTag: {
    backgroundColor: staticColors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#111827',
  },
  verificationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    gap: 5,
  },
  verificationPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
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
    color: staticColors.white,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: staticColors.white,
    opacity: 0.85,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md, // Slight negative margin - pushed down a bit
    paddingVertical: spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: staticColors.borderSubtle,
    shadowColor: staticColors.black,
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
