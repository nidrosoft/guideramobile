/**
 * MY GROUPS SCREEN
 *
 * Shows all groups the user has joined in a 2-column grid.
 * Accessible from Groups tab "See All" on My Groups section.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
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
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface MyGroup {
  id: string;
  name: string;
  groupPhotoUrl: string;
  memberCount: number;
  isVerified: boolean;
  role: string;
  tags: string[];
}

const MOCK_MY_GROUPS: MyGroup[] = [
  {
    id: 'my-grp-1',
    name: 'Backpackers Europe 2025',
    groupPhotoUrl: 'https://images.unsplash.com/photo-1473625247510-8ceb1760943f?w=400',
    memberCount: 3450,
    isVerified: true,
    role: 'member',
    tags: ['Europe', 'Backpacking'],
  },
  {
    id: 'my-grp-2',
    name: 'Paris Foodies & Cafe Lovers',
    groupPhotoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    memberCount: 1280,
    isVerified: false,
    role: 'member',
    tags: ['Paris', 'Food'],
  },
  {
    id: 'my-grp-3',
    name: 'Budget Travel Tips',
    groupPhotoUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    memberCount: 18700,
    isVerified: true,
    role: 'member',
    tags: ['Budget', 'Tips'],
  },
  {
    id: 'my-grp-4',
    name: 'Adventure Photographers',
    groupPhotoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    memberCount: 6340,
    isVerified: true,
    role: 'admin',
    tags: ['Photography', 'Adventure'],
  },
  {
    id: 'my-grp-5',
    name: 'Southeast Asia Explorers',
    groupPhotoUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400',
    memberCount: 9120,
    isVerified: true,
    role: 'member',
    tags: ['SEA', 'Thailand'],
  },
  {
    id: 'my-grp-6',
    name: 'Solo Female Travelers',
    groupPhotoUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    memberCount: 45600,
    isVerified: true,
    role: 'member',
    tags: ['Solo', 'Women'],
  },
];

export default function MyGroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();

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
          {MOCK_MY_GROUPS.length} groups joined
        </Text>
      </View>

      {/* Groups Grid */}
      <FlatList
        data={MOCK_MY_GROUPS}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderGroupCard}
      />
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
