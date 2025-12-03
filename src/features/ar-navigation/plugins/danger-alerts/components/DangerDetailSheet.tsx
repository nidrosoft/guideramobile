/**
 * DANGER DETAIL SHEET
 * 
 * Bottom sheet showing details of selected danger zone or incident.
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  CloseCircle,
  Location,
  Clock,
  People,
  Like1,
  Dislike,
  Share,
  Flag,
  ShieldCross,
  Warning2,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { DangerZone, Incident } from '../types/dangerAlerts.types';
import { getDangerColor, getDangerGradient, getIncidentLabel } from '../data/mockDangerData';

interface DangerDetailSheetProps {
  zone?: DangerZone | null;
  incident?: Incident | null;
  onClose: () => void;
}

export default function DangerDetailSheet({ zone, incident, onClose }: DangerDetailSheetProps) {
  const item = zone || incident;
  if (!item) return null;

  const isZone = !!zone;
  const level = isZone ? zone!.level : incident!.level;
  const dangerColor = getDangerColor(level);
  const gradient = getDangerGradient(level);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Share functionality
  };

  const handleReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Report functionality
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Close button */}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <CloseCircle size={28} color={colors.white} variant="Bold" />
        </TouchableOpacity>

        {/* Level badge */}
        <View style={styles.levelBadge}>
          <ShieldCross size={16} color={colors.white} variant="Bold" />
          <Text style={styles.levelText}>{level.toUpperCase()}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isZone ? zone!.title : incident!.title}
        </Text>

        {/* Type */}
        <View style={styles.typeRow}>
          <Warning2 size={14} color="rgba(255,255,255,0.8)" variant="Bold" />
          <Text style={styles.typeText}>
            {isZone ? getIncidentLabel(zone!.type) : getIncidentLabel(incident!.type)}
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <Text style={styles.description}>
          {isZone ? zone!.description : incident!.description}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {isZone && (
            <>
              <View style={styles.stat}>
                <People size={18} color={dangerColor} variant="Bold" />
                <Text style={styles.statValue}>{zone!.reportCount}</Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>
              <View style={styles.stat}>
                <Location size={18} color={dangerColor} variant="Bold" />
                <Text style={styles.statValue}>{zone!.radius}m</Text>
                <Text style={styles.statLabel}>Radius</Text>
              </View>
            </>
          )}
          {incident && (
            <>
              <View style={styles.stat}>
                <Like1 size={18} color={colors.success} variant="Bold" />
                <Text style={styles.statValue}>{incident.upvotes}</Text>
                <Text style={styles.statLabel}>Upvotes</Text>
              </View>
              <View style={styles.stat}>
                <Dislike size={18} color={colors.error} variant="Bold" />
                <Text style={styles.statValue}>{incident.downvotes}</Text>
                <Text style={styles.statLabel}>Downvotes</Text>
              </View>
            </>
          )}
          <View style={styles.stat}>
            <Clock size={18} color={colors.gray500} variant="Bold" />
            <Text style={styles.statValue}>
              {formatTimeAgo(isZone ? zone!.lastReported : incident!.reportedAt)}
            </Text>
            <Text style={styles.statLabel}>Reported</Text>
          </View>
        </View>

        {/* Verification badge for incidents */}
        {incident && incident.verified && (
          <View style={styles.verifiedBanner}>
            <ShieldCross size={16} color={colors.success} variant="Bold" />
            <Text style={styles.verifiedText}>Verified by community</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share size={20} color={colors.primary} variant="Bold" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
            <Flag size={20} color={colors.error} variant="Bold" />
            <Text style={[styles.actionText, { color: colors.error }]}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Safety tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Safety Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Stay alert and aware of your surroundings</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Keep valuables hidden and secure</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Avoid this area after dark if possible</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    zIndex: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: spacing.xs,
  },
  levelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: spacing.lg,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.gray100,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success + '15',
    padding: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  verifiedText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gray100,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  tipsContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  tipsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tipBullet: {
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    marginRight: spacing.xs,
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
