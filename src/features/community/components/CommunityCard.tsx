/**
 * COMMUNITY CARD
 * 
 * Displays a community preview in horizontal or list format.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { People, Verify, Lock, Location, Briefcase, Airplane, Map } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { CommunityPreview, CommunityType } from '../types/community.types';
import JoinButton from './JoinButton';

// Color-coded badge colors based on community type
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'destination': { bg: '#3FC39E20', text: '#3FC39E' },
  'interest': { bg: '#28C84020', text: '#28C840' },
  'trip': { bg: '#FFBD2E20', text: '#D4A017' },
  'local': { bg: '#3B82F620', text: '#3B82F6' },
  'adventure': { bg: '#FF6B6B20', text: '#FF6B6B' },
  'foodie': { bg: '#FFA50020', text: '#FFA500' },
  'food': { bg: '#FFA50020', text: '#FFA500' },
  'photography': { bg: '#9B59B620', text: '#9B59B6' },
  'budget': { bg: '#27AE6020', text: '#27AE60' },
  'luxury': { bg: '#F1C40F20', text: '#D4AC0D' },
  'digital nomad': { bg: '#3498DB20', text: '#3498DB' },
  'backpacking': { bg: '#E67E2220', text: '#E67E22' },
  'solo': { bg: '#1ABC9C20', text: '#1ABC9C' },
  'nightlife': { bg: '#8B5CF620', text: '#8B5CF6' },
  'japan': { bg: '#EF444420', text: '#EF4444' },
  '2025': { bg: '#3B82F620', text: '#3B82F6' },
  'women': { bg: '#EC489920', text: '#EC4899' },
  'tokyo': { bg: '#EF444420', text: '#EF4444' },
  'default': { bg: '#3FC39E15', text: '#3FC39E' },
};

interface CommunityCardProps {
  community: CommunityPreview;
  variant?: 'horizontal' | 'list';
  onPress: () => void;
  showJoinButton?: boolean;
}

const getTagColor = (tag: string) => {
  const lowerTag = tag.toLowerCase();
  return TAG_COLORS[lowerTag] || TAG_COLORS['default'];
};

export default function CommunityCard({ 
  community, 
  variant = 'horizontal',
  onPress,
  showJoinButton = false,
}: CommunityCardProps) {
  const { colors: tc } = useTheme();
  const isHorizontal = variant === 'horizontal';
  
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Cover Image */}
      <Image
        source={{ uri: isHorizontal ? community.coverImage : community.avatar }}
        style={isHorizontal ? styles.coverImage : styles.listAvatar}
      />
      
      {/* Content */}
      <View style={[styles.content, isHorizontal && styles.contentHorizontal]}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: tc.textPrimary }]} numberOfLines={1}>
            {community.name}
          </Text>
          {community.isVerified && (
            <Verify size={16} color={tc.primary} variant="Bold" />
          )}
          {community.privacy === 'private' && (
            <Lock size={14} color={tc.textSecondary} />
          )}
        </View>
        
        {community.destination && (
          <Text style={[styles.destination, { color: tc.textSecondary }]} numberOfLines={1}>
            {community.destination.city}, {community.destination.country}
          </Text>
        )}

        {community.description && (
          <Text style={[styles.description, { color: tc.textSecondary }]} numberOfLines={2}>
            {community.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <View style={styles.memberCount}>
            <People size={14} color={tc.textSecondary} />
            <Text style={[styles.memberText, { color: tc.textSecondary }]}>
              {community.memberCount.toLocaleString()} members
            </Text>
          </View>
          
          {showJoinButton && !community.isMember ? (
            <JoinButton
              communityId={community.id}
              privacy={community.privacy}
              initialStatus="none"
              variant="small"
            />
          ) : community.isMember ? (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          ) : null}
        </View>
        
        {/* Tags - Color coded */}
        {community.tags.length > 0 && (
          <View style={styles.tags}>
            {community.tags.slice(0, 3).map(tag => {
              const tagColor = getTagColor(tag);
              return (
                <View 
                  key={tag} 
                  style={[styles.tag, { backgroundColor: tagColor.bg }]}
                >
                  <Text style={[styles.tagText, { color: tagColor.text }]}>{tag}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  horizontal: {
    width: 260,
  },
  list: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.xs,
  },
  coverImage: {
    width: '100%',
    height: 130,
  },
  listAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    margin: spacing.sm,
  },
  content: {
    padding: spacing.md,
    flex: 1,
  },
  contentHorizontal: {
    paddingTop: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  destination: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  description: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberText: {
    fontSize: typography.fontSize.xs,
    color: colors.borderSubtle,
  },
  joinedBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  joinedText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    color: colors.success,
  },
  tags: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tagText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
  },
});
