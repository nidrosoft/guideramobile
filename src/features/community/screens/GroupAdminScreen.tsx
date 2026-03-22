/**
 * GROUP ADMIN SCREEN
 * 
 * Admin tools for managing group members and settings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft2,
  People,
  Setting2,
  Trash,
  Edit2,
  Shield,
  Notification,
  Lock,
  Global,
  UserRemove,
  Crown,
  TickCircle,
  CloseCircle,
  SearchNormal1,
  More,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { notifyJoinApproved, notifyJoinDenied } from '@/services/notifications/community-notifications';
import { groupService } from '@/services/community';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';

type AdminTab = 'members' | 'requests' | 'settings';

export default function GroupAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('members');
  const [members, setMembers] = useState<{ id: string; name: string; avatar: string; role: string; joinedAt: string }[]>([]);
  const [requests, setRequests] = useState<{ id: string; name: string; avatar: string; requestedAt: string; message: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupSettings, setGroupSettings] = useState({
    id: id || '',
    name: '',
    description: '',
    privacy: 'private' as 'public' | 'private',
    allowMemberPosts: true,
    allowMemberEvents: false,
    requireApproval: true,
    muteNotifications: false,
  });
  const [isFetching, setIsFetching] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setIsFetching(true);
      const [group, memberData, requestData] = await Promise.all([
        groupService.getGroup(id),
        groupService.getMembers(id),
        groupService.getJoinRequests(id),
      ]);

      if (group) {
        setGroupSettings({
          id: group.id,
          name: group.name,
          description: group.description || '',
          privacy: group.privacy === 'public' ? 'public' as const : 'private' as const,
          allowMemberPosts: group.whoCanPost !== 'admins_only',
          allowMemberEvents: false,
          requireApproval: group.joinApproval === 'admin_approval',
          muteNotifications: false,
        });
      }

      setMembers(memberData.map(m => ({
        id: m.userId,
        name: m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Unknown',
        avatar: m.user?.avatarUrl || '',
        role: m.role,
        joinedAt: m.joinedAt.toISOString().split('T')[0],
      })));

      setRequests(requestData.map(r => ({
        id: r.id,
        name: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Unknown',
        avatar: r.user?.avatarUrl || '',
        requestedAt: r.requestedAt.toISOString().split('T')[0],
        message: r.message || '',
      })));
    } catch (err) {
      if (__DEV__) console.warn('Failed to fetch group admin data:', err);
    } finally {
      setIsFetching(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleApproveRequest = async (requestId: string) => {
    if (!profile?.id) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const request = requests.find(r => r.id === requestId);
      await groupService.approveRequest(profile.id, requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      showSuccess('Member has been added to the group.');
      if (request) {
        notifyJoinApproved(request.id, groupSettings.name, id || '').catch(() => {});
      }
      fetchData();
    } catch (err: any) {
      if (__DEV__) console.warn('Failed to approve request:', err);
      showError(err?.message || 'Could not approve request.');
    }
  };
  
  const handleDenyRequest = async (requestId: string) => {
    if (!profile?.id) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const request = requests.find(r => r.id === requestId);
      await groupService.rejectRequest(profile.id, requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      if (request) {
        notifyJoinDenied(request.id, groupSettings.name, id || '').catch(() => {});
      }
    } catch (err: any) {
      if (__DEV__) console.warn('Failed to deny request:', err);
      showError(err?.message || 'Could not deny request.');
    }
  };
  
  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!profile?.id || !id) return;
            try {
              await groupService.removeMember(profile.id, id, memberId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setMembers(prev => prev.filter(m => m.id !== memberId));
            } catch (err: any) {
              if (__DEV__) console.warn('Failed to remove member:', err);
              showError(err?.message || 'Could not remove member.');
            }
          },
        },
      ]
    );
  };
  
  const handlePromoteToMod = (memberId: string, memberName: string) => {
    Alert.alert(
      'Promote to Moderator',
      `Make ${memberName} a moderator?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            if (!profile?.id || !id) return;
            try {
              await groupService.updateMemberRole(profile.id, id, memberId, 'moderator');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setMembers(prev => prev.map(m => 
                m.id === memberId ? { ...m, role: 'moderator' } : m
              ));
            } catch (err: any) {
              if (__DEV__) console.warn('Failed to promote member:', err);
              showError(err?.message || 'Could not promote member.');
            }
          },
        },
      ]
    );
  };
  
  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'This action cannot be undone. All messages and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            router.replace('/community' as any);
          },
        },
      ]
    );
  };
  
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { color: colors.warning, label: 'Admin', icon: Crown };
      case 'moderator':
        return { color: colors.primary, label: 'Mod', icon: Shield };
      default:
        return null;
    }
  };
  
  const renderMembersTab = () => (
    <>
      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchNormal1 size={20} color={tc.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          placeholderTextColor={tc.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Members List */}
      {filteredMembers.map(member => {
        const roleBadge = getRoleBadge(member.role);
        return (
          <View key={member.id} style={styles.memberCard}>
            <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
            <View style={styles.memberInfo}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberName}>{member.name}</Text>
                {roleBadge && (
                  <View style={[styles.roleBadge, { backgroundColor: roleBadge.color + '20' }]}>
                    <roleBadge.icon size={12} color={roleBadge.color} variant="Bold" />
                    <Text style={[styles.roleBadgeText, { color: roleBadge.color }]}>
                      {roleBadge.label}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.memberJoined}>Joined {member.joinedAt}</Text>
            </View>
            
            {member.role !== 'admin' && (
              <TouchableOpacity
                style={styles.memberAction}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert(
                    member.name,
                    'Choose an action',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      member.role === 'member' && {
                        text: 'Make Moderator',
                        onPress: () => handlePromoteToMod(member.id, member.name),
                      },
                      {
                        text: 'Remove from Group',
                        style: 'destructive',
                        onPress: () => handleRemoveMember(member.id, member.name),
                      },
                    ].filter(Boolean) as any
                  );
                }}
              >
                <More size={20} color={colors.bgElevated} />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </>
  );
  
  const renderRequestsTab = () => (
    <>
      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <People size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No pending requests</Text>
          <Text style={styles.emptyText}>New join requests will appear here</Text>
        </View>
      ) : (
        requests.map(request => (
          <View key={request.id} style={styles.requestCard}>
            <Image source={{ uri: request.avatar }} style={styles.requestAvatar} />
            <View style={styles.requestInfo}>
              <Text style={styles.requestName}>{request.name}</Text>
              <Text style={styles.requestDate}>Requested {request.requestedAt}</Text>
              {request.message && (
                <Text style={styles.requestMessage} numberOfLines={2}>
                  "{request.message}"
                </Text>
              )}
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.denyButton}
                onPress={() => handleDenyRequest(request.id)}
              >
                <CloseCircle size={20} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApproveRequest(request.id)}
              >
                <TickCircle size={20} color={colors.white} variant="Bold" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </>
  );
  
  const renderSettingsTab = () => (
    <>
      {/* Group Info */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Group Information</Text>
        
        <TouchableOpacity style={styles.settingsItem}>
          <Edit2 size={20} color={colors.bgElevated} />
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Edit Group Name</Text>
            <Text style={styles.settingsItemValue}>{groupSettings.name}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsItem}>
          <Edit2 size={20} color={colors.bgElevated} />
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Edit Description</Text>
            <Text style={styles.settingsItemValue} numberOfLines={1}>
              {groupSettings.description}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Privacy */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Privacy</Text>
        
        <TouchableOpacity style={styles.settingsItem}>
          {groupSettings.privacy === 'public' ? (
            <Global size={20} color={colors.bgElevated} />
          ) : (
            <Lock size={20} color={colors.bgElevated} />
          )}
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Group Privacy</Text>
            <Text style={styles.settingsItemValue}>
              {groupSettings.privacy === 'public' ? 'Public' : 'Private'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.settingsItemSwitch}>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Require Approval</Text>
            <Text style={styles.settingsItemDesc}>
              New members need admin approval
            </Text>
          </View>
          <Switch
            value={groupSettings.requireApproval}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setGroupSettings(prev => ({ ...prev, requireApproval: value }));
            }}
            trackColor={{ false: colors.textTertiary, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>
      
      {/* Permissions */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Permissions</Text>
        
        <View style={styles.settingsItemSwitch}>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Allow Member Posts</Text>
            <Text style={styles.settingsItemDesc}>
              Members can post in the group
            </Text>
          </View>
          <Switch
            value={groupSettings.allowMemberPosts}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setGroupSettings(prev => ({ ...prev, allowMemberPosts: value }));
            }}
            trackColor={{ false: colors.textTertiary, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
        
        <View style={styles.settingsItemSwitch}>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Allow Member Events</Text>
            <Text style={styles.settingsItemDesc}>
              Members can create events
            </Text>
          </View>
          <Switch
            value={groupSettings.allowMemberEvents}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setGroupSettings(prev => ({ ...prev, allowMemberEvents: value }));
            }}
            trackColor={{ false: colors.textTertiary, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>
      
      {/* Notifications */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Notifications</Text>
        
        <View style={styles.settingsItemSwitch}>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Mute Notifications</Text>
            <Text style={styles.settingsItemDesc}>
              Stop receiving notifications
            </Text>
          </View>
          <Switch
            value={groupSettings.muteNotifications}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setGroupSettings(prev => ({ ...prev, muteNotifications: value }));
            }}
            trackColor={{ false: colors.textTertiary, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>
      
      {/* Danger Zone */}
      <View style={styles.settingsSection}>
        <Text style={[styles.settingsSectionTitle, { color: colors.error }]}>
          Danger Zone
        </Text>
        
        <TouchableOpacity 
          style={[styles.settingsItem, styles.dangerItem]}
          onPress={handleDeleteGroup}
        >
          <Trash size={20} color={colors.error} />
          <View style={styles.settingsItemContent}>
            <Text style={[styles.settingsItemTitle, { color: colors.error }]}>
              Delete Group
            </Text>
            <Text style={styles.settingsItemDesc}>
              Permanently delete this group
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
  
  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft2 size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Tools</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { id: 'members' as AdminTab, label: 'Members', icon: People, count: members.length },
          { id: 'requests' as AdminTab, label: 'Requests', icon: People, count: requests.length },
          { id: 'settings' as AdminTab, label: 'Settings', icon: Setting2 },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
            >
              <Icon size={18} color={isActive ? colors.primary : colors.bgElevated} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'requests' && renderRequestsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.bgElevated,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabBadge: {
    backgroundColor: colors.textTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: colors.primary,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  tabBadgeTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  // Members
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  memberJoined: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  memberAction: {
    padding: spacing.sm,
  },
  // Requests
  requestCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  requestInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  requestDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  requestMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  denyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Settings
  settingsSection: {
    marginBottom: spacing.xl,
  },
  settingsSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  settingsItemSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  settingsItemValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingsItemDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: colors.error + '30',
    backgroundColor: colors.error + '05',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
