/**
 * POST REACTIONS
 * 
 * Travel-specific reaction bar with animated feedback.
 * Shows reaction counts and allows toggling reactions.
 */

import React, { memo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Heart,
  Airplane,
  LampCharge,
  Flag,
  Flash,
  Message,
  Send2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';
import { ReactionType, ReactionsCount, REACTION_CONFIGS } from '../../types/feed.types';

const REACTION_ICONS: Record<ReactionType, any> = {
  love: Heart,
  been_there: Airplane,
  helpful: LampCharge,
  want_to_go: Flag,
  fire: Flash,
};

interface PostReactionsProps {
  reactionsCount: ReactionsCount;
  commentCount: number;
  myReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  onComment: () => void;
  onShare?: () => void;
  compact?: boolean;
}

function PostReactions({
  reactionsCount,
  commentCount,
  myReaction,
  onReact,
  onComment,
  onShare,
  compact = false,
}: PostReactionsProps) {
  const { colors: tc } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const scaleAnims = useRef<Record<string, Animated.Value>>({});

  const getScaleAnim = (type: string) => {
    if (!scaleAnims.current[type]) {
      scaleAnims.current[type] = new Animated.Value(1);
    }
    return scaleAnims.current[type];
  };

  const totalReactions = Object.values(reactionsCount).reduce((a, b) => a + b, 0);

  const handleReaction = useCallback((type: ReactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const anim = getScaleAnim(type);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onReact(type);
    setShowPicker(false);
  }, [onReact]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPicker(prev => !prev);
  }, []);

  const handleQuickReact = useCallback(() => {
    if (myReaction) {
      handleReaction(myReaction);
    } else {
      handleReaction('love');
    }
  }, [myReaction, handleReaction]);

  // Top reactions summary (non-zero only)
  const topReactions = REACTION_CONFIGS
    .filter(r => reactionsCount[r.type] > 0)
    .sort((a, b) => reactionsCount[b.type] - reactionsCount[a.type])
    .slice(0, 3);

  return (
    <View>
      {/* Reaction summary row */}
      {totalReactions > 0 && (
        <View style={[styles.summaryRow, { borderBottomColor: tc.borderSubtle }]}>
          <View style={styles.summaryLeft}>
            {topReactions.map((r) => {
              const Icon = REACTION_ICONS[r.type];
              return (
                <View key={r.type} style={[styles.summaryBadge, { backgroundColor: r.activeColor + '18' }]}>
                  <Icon size={11} color={r.activeColor} variant="Bold" />
                </View>
              );
            })}
            <Text style={[styles.summaryCount, { color: tc.textSecondary }]}>
              {totalReactions}
            </Text>
          </View>
          {commentCount > 0 && (
            <TouchableOpacity onPress={onComment}>
              <Text style={[styles.commentSummary, { color: tc.textSecondary }]}>
                {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Reaction picker (expanded) */}
      {showPicker && (
        <View style={[styles.pickerRow, { backgroundColor: tc.bgElevated, borderColor: tc.borderMedium }]}>
          {REACTION_CONFIGS.map((r) => {
            const Icon = REACTION_ICONS[r.type];
            const isActive = myReaction === r.type;
            const scale = getScaleAnim(r.type);
            return (
              <TouchableOpacity
                key={r.type}
                style={styles.pickerItem}
                onPress={() => handleReaction(r.type)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.pickerIcon,
                    isActive && { backgroundColor: r.activeColor + '20' },
                    { transform: [{ scale }] },
                  ]}
                >
                  <Icon
                    size={20}
                    color={isActive ? r.activeColor : tc.textTertiary}
                    variant={isActive ? 'Bold' : 'Linear'}
                  />
                </Animated.View>
                <Text style={[styles.pickerLabel, { color: isActive ? r.activeColor : tc.textTertiary }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Action buttons row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleQuickReact}
          onLongPress={handleLongPress}
          activeOpacity={0.7}
          delayLongPress={300}
        >
          <Animated.View style={{ transform: [{ scale: getScaleAnim('love') }] }}>
            <Heart
              size={18}
              color={myReaction ? REACTION_CONFIGS.find(r => r.type === myReaction)!.activeColor : tc.textTertiary}
              variant={myReaction ? 'Bold' : 'Linear'}
            />
          </Animated.View>
          <Text
            style={[
              styles.actionLabel,
              { color: myReaction ? REACTION_CONFIGS.find(r => r.type === myReaction)!.activeColor : tc.textTertiary },
            ]}
          >
            {myReaction
              ? REACTION_CONFIGS.find(r => r.type === myReaction)!.label
              : 'React'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onComment}
          activeOpacity={0.7}
        >
          <Message size={18} color={tc.textTertiary} variant="Linear" />
          <Text style={[styles.actionLabel, { color: tc.textTertiary }]}>Comment</Text>
        </TouchableOpacity>

        {onShare && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onShare}
            activeOpacity={0.7}
          >
            <Send2 size={18} color={tc.textTertiary} variant="Linear" />
            <Text style={[styles.actionLabel, { color: tc.textTertiary }]}>Share</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default memo(PostReactions);

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  summaryBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -4,
  },
  summaryCount: {
    ...typography.bodySm,
    marginLeft: 8,
  },
  commentSummary: {
    ...typography.bodySm,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  pickerItem: {
    alignItems: 'center',
    gap: 3,
  },
  pickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 9,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  actionLabel: {
    ...typography.bodySm,
    fontWeight: '500',
  },
});
