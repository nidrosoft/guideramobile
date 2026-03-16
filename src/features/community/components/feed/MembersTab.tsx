/**
 * MEMBERS TAB
 * 
 * Searchable member list with admin/moderator sections.
 * Tap a member to view their traveler profile.
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import {
  SearchNormal1,
  Verify,
  Crown1,
  ShieldTick,
  Profile2User,
} from 'iconsax-react-native';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';

interface MemberItem {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  isVerified: boolean;
  country?: string;
  joinedAt: string;
}

interface MembersTabProps {
  members: MemberItem[];
  totalCount: number;
  onMemberPress: (memberId: string) => void;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  owner: { label: 'Owner', color: '#F59E0B', Icon: Crown1 },
  admin: { label: 'Admin', color: '#3B82F6', Icon: ShieldTick },
  moderator: { label: 'Mod', color: '#8B5CF6', Icon: Profile2User },
};

function MembersTab({ members, totalCount, onMemberPress }: MembersTabProps) {
  const { colors: tc } = useTheme();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    );
  }, [members, search]);

  const staff = filtered.filter(m => m.role !== 'member');
  const regular = filtered.filter(m => m.role === 'member');

  const renderMember = useCallback((member: MemberItem) => {
    const roleConfig = ROLE_CONFIG[member.role];
    return (
      <TouchableOpacity
        key={member.id}
        style={[styles.memberRow, { borderBottomColor: tc.borderSubtle }]}
        onPress={() => onMemberPress(member.id)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: member.avatar }} style={styles.avatar} />
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.memberName, { color: tc.textPrimary }]}>
              {member.firstName} {member.lastName}
            </Text>
            {member.isVerified && (
              <Verify size={13} color={tc.primary} variant="Bold" />
            )}
          </View>
          <Text style={[styles.memberMeta, { color: tc.textTertiary }]}>
            {member.country}
          </Text>
        </View>
        {roleConfig && (
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + '15' }]}>
            <roleConfig.Icon size={12} color={roleConfig.color} variant="Bold" />
            <Text style={[styles.roleText, { color: roleConfig.color }]}>
              {roleConfig.label}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [tc, onMemberPress]);

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: tc.bgInput, borderColor: tc.borderSubtle }]}>
        <SearchNormal1 size={16} color={tc.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: tc.textPrimary }]}
          placeholder="Search members..."
          placeholderTextColor={tc.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={[styles.countText, { color: tc.textSecondary }]}>
        {totalCount.toLocaleString()} members
      </Text>

      <FlatList
        data={[]}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Staff section */}
            {staff.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tc.textSecondary }]}>
                  ADMINS & MODERATORS
                </Text>
                {staff.map(renderMember)}
              </View>
            )}

            {/* Members section */}
            {regular.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tc.textSecondary }]}>
                  MEMBERS
                </Text>
                {regular.map(renderMember)}
              </View>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

export default memo(MembersTab);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySm,
    paddingVertical: 0,
  },
  countText: {
    ...typography.captionSm,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberName: {
    ...typography.heading3,
    fontSize: 14,
  },
  memberMeta: {
    ...typography.captionSm,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
