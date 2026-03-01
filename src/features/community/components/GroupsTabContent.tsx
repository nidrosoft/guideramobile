/**
 * GROUPS TAB CONTENT
 *
 * Facebook Groups-style layout:
 * - Top: "My Groups" (joined groups)
 * - Below: "Discover Groups" (trending, trip-based, etc.)
 * - "Create a Group" CTA (only for verified guides)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { People, Add, SearchNormal1 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import CommunityCard from './CommunityCard';
import SectionHeader from './SectionHeader';
import { CommunityPreview } from '../types/community.types';

interface GroupsTabContentProps {
  myGroups: Array<{
    group: {
      id: string;
      name: string;
      groupPhotoUrl?: string;
      coverPhotoUrl?: string;
      memberCount: number;
      isVerified: boolean;
      category?: string;
      privacy: string;
      tags: string[];
    };
    role: string;
  }>;
  loadingMyGroups: boolean;
  onGroupPress: (groupId: string) => void;
  onCreateGroup: () => void;
  onSeeAllMyGroups?: () => void;
  onRefresh?: () => Promise<void>;
  isVerifiedGuide?: boolean;
}

// Mock data for "My Groups" (joined groups)
const MOCK_MY_GROUPS: Array<{
  group: {
    id: string;
    name: string;
    groupPhotoUrl?: string;
    coverPhotoUrl?: string;
    memberCount: number;
    isVerified: boolean;
    category?: string;
    privacy: string;
    tags: string[];
  };
  role: string;
}> = [
  {
    group: {
      id: 'my-grp-1',
      name: 'Backpackers Europe 2025',
      groupPhotoUrl: 'https://images.unsplash.com/photo-1473625247510-8ceb1760943f?w=200',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1473625247510-8ceb1760943f?w=400',
      memberCount: 3450,
      isVerified: true,
      category: 'destination',
      privacy: 'public',
      tags: ['Europe', 'Backpacking', '2025'],
    },
    role: 'member',
  },
  {
    group: {
      id: 'my-grp-2',
      name: 'Paris Foodies & Café Lovers',
      groupPhotoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
      memberCount: 1280,
      isVerified: false,
      category: 'interest',
      privacy: 'public',
      tags: ['Paris', 'Food', 'Cafés'],
    },
    role: 'member',
  },
  {
    group: {
      id: 'my-grp-3',
      name: 'Budget Travel Tips',
      groupPhotoUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
      memberCount: 18700,
      isVerified: true,
      category: 'interest',
      privacy: 'public',
      tags: ['Budget', 'Tips', 'Saving'],
    },
    role: 'member',
  },
  {
    group: {
      id: 'my-grp-4',
      name: 'Adventure Photographers',
      groupPhotoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      memberCount: 6340,
      isVerified: true,
      category: 'interest',
      privacy: 'public',
      tags: ['Photography', 'Adventure', 'Landscape'],
    },
    role: 'admin',
  },
  {
    group: {
      id: 'my-grp-5',
      name: 'Southeast Asia Explorers',
      groupPhotoUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=200',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400',
      memberCount: 9120,
      isVerified: true,
      category: 'destination',
      privacy: 'public',
      tags: ['SEA', 'Thailand', 'Vietnam'],
    },
    role: 'member',
  },
];

// Mock data for "Discover Groups"
const MOCK_SUGGESTED_GROUPS: CommunityPreview[] = [
  {
    id: 'grp-s1',
    name: 'Japan 2025 Travelers',
    avatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
    coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    memberCount: 12400,
    isVerified: true,
    type: 'destination',
    privacy: 'public',
    tags: ['Japan', '2025', 'Travel'],
    description: 'Plan trips, share tips, and connect with fellow travelers heading to Japan in 2025. From cherry blossoms to hidden gems.',
    isMember: false,
  },
  {
    id: 'grp-s2',
    name: 'Solo Female Travelers',
    avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
    coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    memberCount: 45600,
    isVerified: true,
    type: 'interest',
    privacy: 'public',
    tags: ['Solo', 'Women', 'Safety'],
    description: 'A supportive community for women exploring the world solo. Safety tips, destination reviews, and travel buddy matching.',
    isMember: false,
  },
  {
    id: 'grp-s3',
    name: 'Digital Nomads Worldwide',
    avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
    memberCount: 28900,
    isVerified: true,
    type: 'interest',
    privacy: 'public',
    tags: ['Remote Work', 'Nomad', 'Coworking'],
    description: 'Remote workers sharing coworking spaces, visa advice, cost-of-living reports, and the best cities for digital nomads.',
    isMember: false,
  },
  {
    id: 'grp-s4',
    name: 'Tokyo Foodies',
    avatar: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200',
    coverImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    memberCount: 2800,
    isVerified: false,
    type: 'destination',
    privacy: 'public',
    tags: ['Tokyo', 'Food', 'Ramen'],
    description: 'Discover the best ramen shops, sushi bars, and street food spots in Tokyo. Reviews and recommendations from locals and travelers.',
    isMember: false,
  },
];

export default function GroupsTabContent({
  myGroups,
  loadingMyGroups,
  onGroupPress,
  onCreateGroup,
  onSeeAllMyGroups,
  onRefresh,
  isVerifiedGuide = false,
}: GroupsTabContentProps) {
  const { colors: tc, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Use mock data as fallback when no real groups exist
  const displayGroups = myGroups.length > 0 ? myGroups : MOCK_MY_GROUPS;

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  };

  const renderMyGroups = () => {
    if (loadingMyGroups) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tc.primary} />
        </View>
      );
    }

    if (displayGroups.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: tc.primarySubtle }]}>
            <People size={32} color={tc.primary} variant="Bold" />
          </View>
          <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>
            No groups yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
            Join a group to connect with fellow travelers
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.myGroupsList}>
        {displayGroups.map(({ group, role }) => (
          <TouchableOpacity
            key={group.id}
            style={[styles.groupCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
            onPress={() => onGroupPress(group.id)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: group.groupPhotoUrl || 'https://via.placeholder.com/56' }}
              style={styles.groupAvatar}
            />
            <View style={styles.groupInfo}>
              <View style={styles.groupNameRow}>
                <Text style={[styles.groupName, { color: tc.textPrimary }]} numberOfLines={1}>
                  {group.name}
                </Text>
                {group.isVerified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: tc.primary }]}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.groupMeta, { color: tc.textSecondary }]}>
                {group.memberCount.toLocaleString()} members · {role === 'admin' ? 'Admin' : 'Member'}
              </Text>
              <View style={styles.groupTags}>
                {group.tags.slice(0, 2).map(tag => (
                  <View key={tag} style={[styles.groupTag, { backgroundColor: tc.primary + '12' }]}>
                    <Text style={[styles.groupTagText, { color: tc.primary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: tc.background }]}>
    <ScrollView
      style={[styles.container, { backgroundColor: tc.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tc.primary}
        />
      }
    >
      {/* My Groups */}
      <SectionHeader
        title="My Groups"
        subtitle={displayGroups.length > 0 ? `${displayGroups.length} joined` : undefined}
        onSeeAll={displayGroups.length > 3 ? onSeeAllMyGroups : undefined}
      />
      {renderMyGroups()}

      {/* Create Group CTA - only for verified guides */}
      {isVerifiedGuide && (
        <TouchableOpacity
          style={[styles.createGroupCta, { backgroundColor: tc.primarySubtle, borderColor: tc.primaryBorderMedium }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onCreateGroup();
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.createGroupIcon, { backgroundColor: tc.primary }]}>
            <Add size={20} color={tc.primaryText} />
          </View>
          <View style={styles.createGroupTextContainer}>
            <Text style={[styles.createGroupTitle, { color: tc.textPrimary }]}>
              Create a Group
            </Text>
            <Text style={[styles.createGroupSubtitle, { color: tc.textSecondary }]}>
              Start a community for travelers in your city
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Suggested Groups */}
      <SectionHeader title="Suggested Groups" />
      <View style={styles.suggestedList}>
        {MOCK_SUGGESTED_GROUPS.map((group) => (
          <CommunityCard
            key={group.id}
            community={group}
            variant="list"
            onPress={() => onGroupPress(group.id)}
            showJoinButton
          />
        ))}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>

    {/* Floating Action Button */}
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: '#000000' }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onCreateGroup();
      }}
      activeOpacity={0.85}
    >
      <Add size={28} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  myGroupsList: {
    paddingHorizontal: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  createGroupCta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  createGroupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createGroupTextContainer: {
    flex: 1,
  },
  createGroupTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  createGroupSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
  },
  groupInfo: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  groupMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  groupTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  groupTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  groupTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  suggestedList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPadding: {
    height: 100,
  },
});
