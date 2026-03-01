/**
 * ABOUT TAB
 * 
 * Group description, rules, tags, and creation info.
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  InfoCircle,
  ShieldTick,
  Tag,
  Calendar,
  Global,
  Lock,
} from 'iconsax-react-native';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';

interface AboutTabProps {
  description: string;
  guidelines: string[];
  tags: string[];
  privacy: 'public' | 'private' | 'invite_only';
  createdAt: string;
  postingRule: string;
}

function AboutTab({
  description,
  guidelines,
  tags,
  privacy,
  createdAt,
  postingRule,
}: AboutTabProps) {
  const { colors: tc } = useTheme();

  const PrivacyIcon = privacy === 'public' ? Global : Lock;
  const privacyLabel = privacy === 'public' ? 'Public group' : 'Private group';
  const postingLabel = postingRule === 'anyone'
    ? 'Anyone can post'
    : postingRule === 'approval_required'
      ? 'Posts require approval'
      : 'Only admins can post';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Description */}
      <View style={[styles.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <View style={styles.sectionHeader}>
          <InfoCircle size={16} color={tc.primary} variant="Bold" />
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>About</Text>
        </View>
        <Text style={[styles.descriptionText, { color: tc.textSecondary }]}>
          {description}
        </Text>

        {/* Quick info rows */}
        <View style={[styles.infoRow, { borderTopColor: tc.borderSubtle }]}>
          <PrivacyIcon size={15} color={tc.textTertiary} variant="Linear" />
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>{privacyLabel}</Text>
        </View>
        <View style={styles.infoRow}>
          <ShieldTick size={15} color={tc.textTertiary} variant="Linear" />
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>{postingLabel}</Text>
        </View>
        <View style={styles.infoRow}>
          <Calendar size={15} color={tc.textTertiary} variant="Linear" />
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>
            Created {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Guidelines */}
      {guidelines.length > 0 && (
        <View style={[styles.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <View style={styles.sectionHeader}>
            <ShieldTick size={16} color={tc.primary} variant="Bold" />
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Community Rules</Text>
          </View>
          {guidelines.map((rule, index) => (
            <View key={index} style={styles.ruleRow}>
              <View style={[styles.ruleNumber, { backgroundColor: tc.primarySubtle }]}>
                <Text style={[styles.ruleNumberText, { color: tc.primary }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.ruleText, { color: tc.textSecondary }]}>{rule}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <View style={[styles.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <View style={styles.sectionHeader}>
            <Tag size={16} color={tc.primary} variant="Bold" />
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Tags</Text>
          </View>
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: tc.primarySubtle }]}>
                <Text style={[styles.tagText, { color: tc.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

export default memo(AboutTab);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  section: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading3,
  },
  descriptionText: {
    ...typography.bodyLg,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  infoText: {
    ...typography.bodySm,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  ruleNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ruleText: {
    ...typography.bodySm,
    flex: 1,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
