/**
 * MY GROUPS SCREEN
 *
 * Shows all groups the user has joined in a 2-column grid.
 * Accessible from Groups tab "See All" on My Groups section.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  People,
  Verify,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { groupService } from '@/services/community';
import { useAuth } from '@/context/AuthContext';

interface MyGroup {
  id: string;
  name: string;
  groupPhotoUrl: string;
  memberCount: number;
  isVerified: boolean;
  role: string;
  tags: string[];
}

export default function MyGroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setIsFetching(true);
      const data = await groupService.getUserGroups(profile.id);
      setGroups(data.map(item => ({
        id: item.group.id,
        name: item.group.name,
        groupPhotoUrl: item.group.groupPhotoUrl || item.group.coverPhotoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
        memberCount: item.group.memberCount || 0,
        isVerified: item.group.isVerified || false,
        role: item.role,
        tags: item.group.tags || [],
      })));
    } catch (err) {
      console.error('Failed to fetch user groups:', err);
    } finally {
      setIsFetching(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleGroupPress = (groupId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/${groupId}` as any);
  };

  const renderGroupCard = ({ item }: { item: MyGroup }) => (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
      onPress={() => handleGroupPress(item.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.groupPhotoUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardNameRow}>
          <Text style={[styles.cardName, { color: tc.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isVerified && <Verify size={14} color={tc.primary} variant="Bold" />}
        </View>
        <View style={styles.cardMeta}>
          <People size={12} color={tc.textSecondary} />
          <Text style={[styles.cardMembers, { color: tc.textSecondary }]}>
            {item.memberCount.toLocaleString()} members
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? tc.primary + '15' : tc.borderSubtle }]}>
            <Text style={[styles.roleText, { color: item.role === 'admin' ? tc.primary : tc.textSecondary }]}>
              {item.role === 'admin' ? 'Admin' : 'Member'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>My Groups</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: tc.textSecondary }]}>
          {groups.length} groups joined
        </Text>
      </View>

      {isFetching ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderGroupCard}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  countRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  countText: {
    fontSize: 14,
  },
  gridContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  gridRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  groupCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 100,
  },
  cardContent: {
    padding: spacing.sm,
    gap: 4,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMembers: {
    fontSize: 12,
  },
  cardFooter: {
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
