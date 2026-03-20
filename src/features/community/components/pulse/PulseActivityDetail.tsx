/**
 * PULSE ACTIVITY DETAIL
 *
 * Floating card shown when a map marker is tapped.
 * - Owner: Edit + Cancel buttons
 * - Joined viewer: Chat only (no Join)
 * - New viewer: Chat + Join buttons
 * - Share + Report in circled icons, spaced from close X
 *
 * Part of the Connect feature (formerly Community).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { MessageText1, Send2, Flag, Edit2, CloseCircle, Clock, Location } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import type { Activity } from '@/services/community/types/community.types';
import { getActivityIcon, getTimingLabel } from './pulse.utils';
import AvatarFallback from './AvatarFallback';

interface PulseActivityDetailProps {
  activity: Activity;
  currentUserId?: string;
  hasJoined?: boolean;
  joining: boolean;
  onJoin: () => void;
  onLeave?: () => void;
  onChat: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onReport?: () => void;
  onViewDetails?: () => void;
  onClose: () => void;
  bottomOffset: number;
}

export default function PulseActivityDetail({
  activity,
  currentUserId,
  hasJoined = false,
  joining,
  onJoin,
  onLeave,
  onChat,
  onEdit,
  onCancel,
  onReport,
  onViewDetails,
  onClose,
  bottomOffset,
}: PulseActivityDetailProps) {
  const { colors: tc } = useTheme();
  const isOwner = !!(currentUserId && activity.createdBy === currentUserId);
  const creatorFirst = activity.creator?.firstName || 'Someone';

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({
      message: `Join ${creatorFirst} for "${activity.title}" on Guidera!\n\nhttps://guidera.app/pulse/${activity.id}`,
    }).catch(() => {});
  };

  const handleCancel = () => {
    Alert.prompt
      ? Alert.prompt(
          'Cancel Activity',
          'Let others know why (optional):',
          [
            { text: 'Keep it', style: 'cancel' },
            { text: 'Cancel Activity', style: 'destructive', onPress: (_reason?: string) => onCancel?.() },
          ],
          'plain-text'
        )
      : Alert.alert(
          'Cancel Activity',
          'All participants will be notified. Continue?',
          [
            { text: 'Keep it', style: 'cancel' },
            { text: 'Cancel Activity', style: 'destructive', onPress: () => onCancel?.() },
          ]
        );
  };

  return (
    <View style={[styles.card, { bottom: bottomOffset, backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
      {/* Row 1: icon actions (share ... report, close) — each in a circle */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.iconCircle, { backgroundColor: tc.borderSubtle + '50' }]}
          onPress={handleShare}
        >
          <Send2 size={16} color={tc.textSecondary} />
        </TouchableOpacity>

        <View style={styles.topSpacer} />

        <View style={styles.topRightGroup}>
          {!isOwner && (
            <TouchableOpacity
              style={[styles.iconCircle, { backgroundColor: tc.error + '10' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onReport?.(); }}
            >
              <Flag size={16} color={tc.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconCircle, { backgroundColor: tc.borderSubtle + '50' }]}
            onPress={onClose}
          >
            <CloseCircle size={18} color={tc.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity type emoji centered */}
      <View style={styles.emojiRow}>
        <View style={[styles.emojiCircle, { backgroundColor: tc.primary + '12' }]}>
          <Text style={styles.emoji}>{getActivityIcon(activity.type)}</Text>
        </View>
      </View>

      {/* Creative presentation: "Cyriac is hosting Pool party" */}
      <Text style={[styles.headline, { color: tc.textPrimary }]}>
        <Text style={{ color: tc.primary, fontWeight: '700' }}>{creatorFirst}</Text>
        {isOwner ? ' — you\'re hosting' : ' is hosting'}
      </Text>
      <TouchableOpacity onPress={onViewDetails} activeOpacity={0.7}>
        <Text style={[styles.activityTitle, { color: tc.textPrimary }]}>
          {activity.title}
        </Text>
        <Text style={[styles.viewDetailsLink, { color: tc.primary }]}>View details & discussion</Text>
      </TouchableOpacity>

      {/* Meta: time + location + going */}
      <View style={styles.metaChips}>
        <View style={[styles.chip, { backgroundColor: tc.borderSubtle + '40' }]}>
          <Clock size={13} color={tc.textSecondary} />
          <Text style={[styles.chipText, { color: tc.textSecondary }]}>{getTimingLabel(activity)}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: tc.borderSubtle + '40' }]}>
          <Location size={13} color={tc.textSecondary} variant="Bold" />
          <Text style={[styles.chipText, { color: tc.textSecondary }]} numberOfLines={1}>{activity.locationName || 'Nearby'}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: tc.primary + '15' }]}>
          <Text style={[styles.chipText, { color: tc.primary }]}>
            {activity.participantCount} going
          </Text>
        </View>
      </View>

      {/* Creator row */}
      {activity.creator && (
        <View style={styles.creatorRow}>
          <AvatarFallback
            uri={activity.creator.avatarUrl}
            name={`${activity.creator.firstName || ''} ${activity.creator.lastName || ''}`}
            size={36}
          />
          <Text style={[styles.creatorLabel, { color: tc.textTertiary }]}>{creatorFirst}</Text>
        </View>
      )}

      {/* Actions — context-dependent */}
      {isOwner ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: tc.borderSubtle }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit?.(); }}
          >
            <Edit2 size={16} color={tc.textPrimary} />
            <Text style={[styles.outlineBtnText, { color: tc.textPrimary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: tc.error + '12' }]}
            onPress={handleCancel}
          >
            <CloseCircle size={16} color={tc.error} />
            <Text style={[styles.dangerBtnText, { color: tc.error }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : hasJoined ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: tc.borderSubtle }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChat(); }}
          >
            <MessageText1 size={16} color={tc.textPrimary} />
            <Text style={[styles.outlineBtnText, { color: tc.textPrimary }]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: tc.error + '12' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onLeave?.(); }}
          >
            <CloseCircle size={16} color={tc.error} />
            <Text style={[styles.dangerBtnText, { color: tc.error }]}>Leave</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: tc.borderSubtle }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChat(); }}
          >
            <MessageText1 size={16} color={tc.textPrimary} />
            <Text style={[styles.outlineBtnText, { color: tc.textPrimary }]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, joining && { opacity: 0.7 }]}
            onPress={onJoin}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Join</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  // Top row: share ... report close
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSpacer: { flex: 1 },
  topRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // Emoji
  emojiRow: { alignItems: 'center', marginBottom: spacing.sm },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  // Headline
  headline: { fontSize: 15, textAlign: 'center', marginBottom: 2 },
  activityTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  viewDetailsLink: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginBottom: spacing.md },
  // Meta chips
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  chipText: { fontSize: 12, fontWeight: '500', maxWidth: 120 },
  // Creator
  creatorRow: { alignItems: 'center', marginBottom: spacing.md },
  creatorAvatar: { width: 36, height: 36, borderRadius: 18, marginBottom: 3 },
  creatorLabel: { fontSize: 11, fontWeight: '500' },
  // Actions
  actions: { flexDirection: 'row', gap: spacing.sm },
  outlineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 6,
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600' },
  primaryBtn: {
    flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  fullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, gap: 8,
  },
  fullBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  dangerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 6,
  },
  dangerBtnText: { fontSize: 14, fontWeight: '600' },
});
