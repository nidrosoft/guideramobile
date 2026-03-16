/**
 * GROUPS TAB CONTENT
 *
 * Facebook Groups-style layout:
 * - Top: "My Groups" (joined groups)
 * - Below: "Discover Groups" (fetched from Supabase)
 * - "Create a Group" CTA (only for verified guides)
 */

import React, { useState, useEffect } from 'react';
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
import { groupService } from '@/services/community/group.service';
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

/** Map a Group to CommunityPreview for CommunityCard */
function mapGroupToPreview(g: any, myGroupIds: Set<string>): CommunityPreview {
  return {
    id: g.id,
    name: g.name,
    avatar: g.groupPhotoUrl || g.coverPhotoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
    coverImage: g.coverPhotoUrl || g.groupPhotoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    memberCount: g.memberCount || 0,
    isVerified: g.isVerified || false,
    type: (g.category as any) || 'interest',
    privacy: g.privacy || 'public',
    tags: g.tags || [],
    description: g.description,
    destination: g.destinationName
      ? { city: g.destinationName, country: g.destinationCountry || '' }
      : undefined,
    isMember: myGroupIds.has(g.id),
  };
}

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
  const [suggestedGroups, setSuggestedGroups] = useState<CommunityPreview[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);

  // Fetch suggested groups from Supabase
  useEffect(() => {
    const myGroupIds = new Set(myGroups.map(mg => mg.group.id));
    setLoadingSuggested(true);
    groupService.discoverGroups({ limit: 6 })
      .then(groups => {
        // Filter out groups the user already joined
        const filtered = groups.filter(g => !myGroupIds.has(g.id));
        setSuggestedGroups(filtered.map(g => mapGroupToPreview(g, myGroupIds)));
      })
      .catch(console.warn)
      .finally(() => setLoadingSuggested(false));
  }, [myGroups]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh?.();
    // Re-fetch suggested groups too
    const myGroupIds = new Set(myGroups.map(mg => mg.group.id));
    groupService.discoverGroups({ limit: 6 })
      .then(groups => {
        const filtered = groups.filter(g => !myGroupIds.has(g.id));
        setSuggestedGroups(filtered.map(g => mapGroupToPreview(g, myGroupIds)));
      })
      .catch(console.warn);
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

    if (myGroups.length === 0) {
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
        {myGroups.map(({ group, role }) => (
          <TouchableOpacity
            key={group.id}
            style={[styles.groupCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
            onPress={() => onGroupPress(group.id)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: group.groupPhotoUrl || '' }}
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

  const hasMyGroups = myGroups.length > 0;
  const hasSuggested = suggestedGroups.length > 0;
  const hasAnyContent = hasMyGroups || hasSuggested;
  const isAllEmpty = !loadingMyGroups && !loadingSuggested && !hasAnyContent;

  return (
    <View style={[styles.outerContainer, { backgroundColor: tc.background }]}>
    {isAllEmpty ? (
      /* Full-screen centered empty state — no section headers */
      <View style={styles.fullEmptyState}>
        <View style={[styles.emptyIconContainer, { backgroundColor: tc.primarySubtle }]}>
          <People size={36} color={tc.primary} variant="Bold" />
        </View>
        <Text style={[styles.fullEmptyTitle, { color: tc.textPrimary }]}>
          No Groups Yet
        </Text>
        <Text style={[styles.fullEmptySubtitle, { color: tc.textSecondary }]}>
          Groups are where travelers connect around destinations, interests, and upcoming trips. Join one to share tips, photos, and plan meetups — or create your own.{'\n\n'}Tap the + button to start a group. Verified travelers can host trusted communities.
        </Text>
      </View>
    ) : (
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
      {hasMyGroups && (
        <>
          <SectionHeader
            title="My Groups"
            subtitle={`${myGroups.length} joined`}
            onSeeAll={myGroups.length > 3 ? onSeeAllMyGroups : undefined}
          />
          {renderMyGroups()}
        </>
      )}

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

      {/* Suggested Groups — only show section when there are suggestions */}
      {hasSuggested && (
        <>
          <SectionHeader title="Suggested Groups" />
          <View style={styles.suggestedList}>
            {suggestedGroups.map((group) => (
              <CommunityCard
                key={group.id}
                community={group}
                variant="list"
                onPress={() => onGroupPress(group.id)}
                showJoinButton
              />
            ))}
          </View>
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
    )}

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
  fullEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  fullEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  fullEmptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
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
