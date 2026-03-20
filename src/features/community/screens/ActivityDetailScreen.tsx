/**
 * ACTIVITY DETAIL SCREEN
 *
 * Full-screen view of a Pulse activity with:
 * - Activity info (type, title, description, location, time, participants)
 * - Action buttons (Join/Leave/Chat/Edit/Cancel)
 * - Comments/discussion thread with realtime updates
 *
 * Part of the Connect feature (formerly Community).
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Send2,
  Clock,
  Location,
  MessageText1,
  Edit2,
  CloseCircle,
  Heart,
  Trash,
  People,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useActivityActions, useActivityComments } from '@/hooks/useCommunity';
import { activityService, type ActivityComment } from '@/services/community/activity.service';
import type { Activity } from '@/services/community/types/community.types';
import { getActivityIcon, getTimingLabel } from '../components/pulse/pulse.utils';
import AvatarFallback from '../components/pulse/AvatarFallback';

export default function ActivityDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const userId = profile?.id;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [commentText, setCommentText] = useState('');

  const { joinActivity, leaveActivity, cancelActivity, loading: actionLoading } = useActivityActions(userId);
  const { comments, loading: commentsLoading, addComment, deleteComment, toggleLike } = useActivityComments(activityId, userId);

  // Load activity
  React.useEffect(() => {
    if (!activityId) return;
    setLoadingActivity(true);
    activityService.getActivity(activityId)
      .then(setActivity)
      .finally(() => setLoadingActivity(false));
  }, [activityId]);

  const isOwner = !!(userId && activity?.createdBy === userId);
  const hasJoined = !!(userId && activity?.participants?.some(p => p.userId === userId));
  const creatorName = activity?.creator
    ? `${activity.creator.firstName} ${activity.creator.lastName}`.trim()
    : 'Someone';

  const handleJoin = async () => {
    if (!activityId) return;
    try {
      await joinActivity(activityId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const updated = await activityService.getActivity(activityId);
      setActivity(updated);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleLeave = async () => {
    if (!activityId) return;
    try {
      await leaveActivity(activityId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const updated = await activityService.getActivity(activityId);
      setActivity(updated);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Activity', 'All participants will be notified. Continue?', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel Activity', style: 'destructive', onPress: async () => {
          if (!activityId) return;
          try {
            await cancelActivity(activityId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch (e: any) { Alert.alert('Error', e.message); }
        }
      },
    ]);
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await addComment(commentText.trim());
      setCommentText('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteComment(commentId) },
    ]);
  };

  if (loadingActivity) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: tc.textSecondary, fontSize: 16 }}>Activity not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: tc.primary, fontSize: 15, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: tc.bgElevated }]} onPress={() => router.back()}>
          <ArrowLeft size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Activity</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Activity Card */}
        <View style={[styles.activityCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          {/* Type icon + title */}
          <View style={styles.activityHeader}>
            <View style={[styles.emojiCircle, { backgroundColor: tc.primary + '12' }]}>
              <Text style={styles.emoji}>{getActivityIcon(activity.type)}</Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={[styles.activityTitle, { color: tc.textPrimary }]}>{activity.title}</Text>
              <Text style={[styles.activityCreator, { color: tc.textSecondary }]}>
                by {creatorName}
              </Text>
            </View>
          </View>

          {/* Description */}
          {activity.description && (
            <Text style={[styles.description, { color: tc.textSecondary }]}>{activity.description}</Text>
          )}

          {/* Meta chips */}
          <View style={styles.metaRow}>
            <View style={[styles.metaChip, { backgroundColor: tc.borderSubtle + '40' }]}>
              <Clock size={14} color={tc.textSecondary} />
              <Text style={[styles.metaText, { color: tc.textSecondary }]}>{getTimingLabel(activity)}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: tc.borderSubtle + '40' }]}>
              <Location size={14} color={tc.textSecondary} variant="Bold" />
              <Text style={[styles.metaText, { color: tc.textSecondary }]} numberOfLines={1}>{activity.locationName || 'Nearby'}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: tc.primary + '15' }]}>
              <People size={14} color={tc.primary} />
              <Text style={[styles.metaText, { color: tc.primary }]}>
                {activity.participantCount}{activity.maxParticipants ? `/${activity.maxParticipants}` : ''} going
              </Text>
            </View>
          </View>

          {/* Participant avatars — tap to DM */}
          {(activity.participants?.length || 0) > 0 && (
            <View style={styles.participantRow}>
              {activity.participants?.slice(0, 6).map((p, i) => (
                <TouchableOpacity
                  key={p.id || String(i)}
                  onPress={() => {
                    if (p.userId !== userId) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/community/chat/${p.userId}` as any);
                    }
                  }}
                  activeOpacity={p.userId === userId ? 1 : 0.7}
                >
                  <AvatarFallback
                    uri={p.user?.avatarUrl}
                    name={`${p.user?.firstName || ''} ${p.user?.lastName || ''}`}
                    size={32}
                    style={{ marginLeft: i > 0 ? -8 : 0, borderWidth: 2, borderColor: tc.bgElevated }}
                  />
                </TouchableOpacity>
              ))}
              {(activity.participantCount || 0) > 6 && (
                <Text style={[styles.moreCount, { color: tc.textTertiary }]}>+{activity.participantCount - 6}</Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            {isOwner ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: tc.borderSubtle }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/community/create-activity' as any, params: { editId: activity.id, editTitle: activity.title, editType: activity.type, editDescription: activity.description || '', editLocationName: activity.locationName || '', editLatitude: String(activity.latitude || 0), editLongitude: String(activity.longitude || 0) } });
                  }}
                >
                  <Edit2 size={16} color={tc.textPrimary} />
                  <Text style={[styles.actionBtnText, { color: tc.textPrimary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tc.error + '12', borderColor: 'transparent' }]} onPress={handleCancel}>
                  <CloseCircle size={16} color={tc.error} />
                  <Text style={[styles.actionBtnText, { color: tc.error }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : hasJoined ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: tc.borderSubtle }]}
                  onPress={() => router.push(`/community/activity-chat/${activity.id}` as any)}
                >
                  <MessageText1 size={16} color={tc.textPrimary} />
                  <Text style={[styles.actionBtnText, { color: tc.textPrimary }]}>Group Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tc.error + '12', borderColor: 'transparent' }]} onPress={handleLeave}>
                  <CloseCircle size={16} color={tc.error} />
                  <Text style={[styles.actionBtnText, { color: tc.error }]}>Leave</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: tc.borderSubtle }]}
                  onPress={() => router.push(`/community/activity-chat/${activity.id}` as any)}
                >
                  <MessageText1 size={16} color={tc.textPrimary} />
                  <Text style={[styles.actionBtnText, { color: tc.textPrimary }]}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtnPrimary, { backgroundColor: tc.primary }, actionLoading && { opacity: 0.7 }]}
                  onPress={handleJoin}
                  disabled={actionLoading || activity.status !== 'open'}
                >
                  {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : (
                    <Text style={styles.actionBtnPrimaryText}>Join</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: tc.textPrimary }]}>
            Discussion ({comments.length})
          </Text>

          {commentsLoading && comments.length === 0 ? (
            <ActivityIndicator size="small" color={tc.primary} style={{ marginTop: spacing.lg }} />
          ) : comments.length === 0 ? (
            <Text style={[styles.emptyComments, { color: tc.textTertiary }]}>
              No comments yet. Start the conversation!
            </Text>
          ) : (
            comments.map((comment: ActivityComment) => (
              <View key={comment.id} style={[styles.commentCard, { borderBottomColor: tc.borderSubtle }]}>
                <AvatarFallback
                  uri={comment.author?.avatarUrl}
                  name={`${comment.author?.firstName || ''} ${comment.author?.lastName || ''}`}
                  size={32}
                />
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentAuthor, { color: tc.textPrimary }]}>
                      {comment.authorId === userId ? 'You' : `${comment.author?.firstName || 'Someone'}`}
                    </Text>
                    <Text style={[styles.commentTime, { color: tc.textTertiary }]}>
                      {formatTimeAgo(comment.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.commentContent, { color: tc.textSecondary }]}>
                    {comment.content}
                  </Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity
                      style={styles.commentActionBtn}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleLike(comment.id); }}
                    >
                      <Heart size={14} color={comment.isLiked ? tc.error : tc.textTertiary} variant={comment.isLiked ? 'Bold' : 'Linear'} />
                      {comment.likeCount > 0 && (
                        <Text style={[styles.commentActionText, { color: comment.isLiked ? tc.error : tc.textTertiary }]}>
                          {comment.likeCount}
                        </Text>
                      )}
                    </TouchableOpacity>
                    {comment.authorId === userId && (
                      <TouchableOpacity style={styles.commentActionBtn} onPress={() => handleDeleteComment(comment.id)}>
                        <Trash size={14} color={tc.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={[styles.commentInput, { backgroundColor: tc.bgElevated, borderTopColor: tc.borderSubtle, paddingBottom: insets.bottom || spacing.md }]}>
        <View style={[styles.commentInputWrap, { backgroundColor: tc.bgCard || tc.background, borderColor: tc.borderSubtle }]}>
          <TextInput
            style={[styles.commentTextInput, { color: tc.textPrimary }]}
            placeholder="Add a comment..."
            placeholderTextColor={tc.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            maxLength={500}
          />
        </View>
        <TouchableOpacity
          style={[styles.commentSendBtn, { backgroundColor: commentText.trim() ? tc.primary : tc.borderSubtle }]}
          onPress={handleSendComment}
          disabled={!commentText.trim()}
        >
          <Send2 size={18} color={commentText.trim() ? '#FFFFFF' : tc.textTertiary} variant="Bold" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Activity Card
  activityCard: { margin: spacing.md, borderRadius: 24, padding: spacing.lg, borderWidth: 1 },
  activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  emojiCircle: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  activityInfo: { flex: 1, marginLeft: spacing.md },
  activityTitle: { fontSize: 18, fontWeight: '700' },
  activityCreator: { fontSize: 13, marginTop: 2 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  metaText: { fontSize: 12, fontWeight: '500', maxWidth: 120 },
  participantRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  moreCount: { fontSize: 12, marginLeft: 6 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 6,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
  actionBtnPrimary: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  actionBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Comments
  commentsSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  commentsTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  emptyComments: { fontSize: 14, textAlign: 'center', paddingVertical: spacing.xl },
  commentCard: { flexDirection: 'row', paddingVertical: spacing.md, borderBottomWidth: 1, gap: spacing.sm },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  commentAuthor: { fontSize: 13, fontWeight: '600' },
  commentTime: { fontSize: 11 },
  commentContent: { fontSize: 14, lineHeight: 19, marginBottom: 4 },
  commentActions: { flexDirection: 'row', gap: spacing.md },
  commentActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2 },
  commentActionText: { fontSize: 12, fontWeight: '500' },

  // Comment Input
  commentInput: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md,
    paddingTop: spacing.sm, borderTopWidth: 1, gap: spacing.sm,
  },
  commentInputWrap: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: spacing.md, minHeight: 40, justifyContent: 'center' },
  commentTextInput: { fontSize: 14, paddingVertical: 8 },
  commentSendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
});
