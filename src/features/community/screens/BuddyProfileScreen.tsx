/**
 * BUDDY PROFILE SCREEN
 * 
 * View travel buddy details, their travel plans, and connect.
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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft2,
  More,
  Location,
  Calendar,
  Message,
  UserAdd,
  Verify,
  Star1,
  Global,
  Heart,
  Flag,
  Crown,
  ShieldCross,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { buddyService, groupService } from '@/services/community';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface BuddyData {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  languages: string[];
  travelStyle: string[];
  isPremium: boolean;
  isVerified: boolean;
  joinedDate: string;
  stats: { tripsCompleted: number; countriesVisited: number; buddyConnections: number; rating: number };
  upcomingTrips: { id: string; destination: string; dates: string; lookingFor: string }[];
  interests: string[];
  mutualGroups: { id: string; name: string; avatar: string }[];
}

export default function BuddyProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile: authProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const { colors: tc, isDark } = useTheme();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [buddy, setBuddy] = useState<BuddyData | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const isPremium = true;

  const fetchBuddy = useCallback(async () => {
    if (!id) return;
    try {
      setIsFetching(true);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !profileData) throw new Error('Profile not found');

      const { data: socialData } = await supabase
        .from('user_social_profiles')
        .select('interests, travel_styles, languages, countries_visited, buddy_count')
        .eq('user_id', id)
        .single();

      const { data: trips } = await supabase
        .from('trips')
        .select('id, primary_destination_name, start_date, end_date')
        .eq('user_id', id)
        .gt('start_date', new Date().toISOString())
        .limit(3);

      let mutualGroups: { id: string; name: string; avatar: string }[] = [];
      if (authProfile?.id) {
        try {
          const [myGroups, theirGroups] = await Promise.all([
            groupService.getUserGroups(authProfile.id),
            groupService.getUserGroups(id),
          ]);
          const theirGroupIds = new Set(theirGroups.map(g => g.group.id));
          mutualGroups = myGroups
            .filter(g => theirGroupIds.has(g.group.id))
            .map(g => ({
              id: g.group.id,
              name: g.group.name,
              avatar: g.group.groupPhotoUrl || '',
            }));
        } catch {}
      }

      if (authProfile?.id) {
        const [id1, id2] = [authProfile.id, id].sort();
        const { data: conn } = await supabase
          .from('buddy_connections')
          .select('status')
          .eq('user_id_1', id1)
          .eq('user_id_2', id2)
          .single();
        if (conn?.status === 'connected') setIsConnected(true);
        else if (conn?.status === 'pending') { setIsConnecting(false); setIsConnected(false); }
      }

      const joinedDate = profileData.created_at
        ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';

      setBuddy({
        id: profileData.id,
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        avatar: profileData.avatar_url || '',
        coverImage: profileData.cover_photo_url || '',
        bio: profileData.bio || '',
        location: [profileData.city, profileData.nationality].filter(Boolean).join(', ') || '',
        languages: socialData?.languages || [],
        travelStyle: socialData?.travel_styles || [],
        isPremium: profileData.is_premium || false,
        isVerified: profileData.is_verified || false,
        joinedDate,
        stats: {
          tripsCompleted: profileData.trips_count || 0,
          countriesVisited: socialData?.countries_visited?.length || 0,
          buddyConnections: socialData?.buddy_count || 0,
          rating: profileData.rating || 0,
        },
        upcomingTrips: (trips || []).map(t => ({
          id: t.id,
          destination: t.primary_destination_name || '',
          dates: `${new Date(t.start_date).toLocaleDateString()} - ${new Date(t.end_date).toLocaleDateString()}`,
          lookingFor: '',
        })),
        interests: socialData?.interests || [],
        mutualGroups,
      });
    } catch (err) {
      if (__DEV__) console.warn('Failed to fetch buddy profile:', err);
    } finally {
      setIsFetching(false);
    }
  }, [id, authProfile?.id]);

  useEffect(() => {
    fetchBuddy();
  }, [fetchBuddy]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleConnect = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Upgrade to Premium to connect with travel buddies.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Learn More', onPress: () => router.push('/account/membership') },
        ]
      );
      return;
    }
    
    if (!authProfile?.id || !id) return;
    setIsConnecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await buddyService.sendRequest(authProfile.id, id);
      setIsConnecting(false);
      setIsConnected(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(`Connection request sent to ${buddy?.firstName}!`);
    } catch (err: any) {
      setIsConnecting(false);
      if (__DEV__) console.warn('Failed to connect:', err);
      showError(err?.message || 'Could not send connection request');
    }
  };
  
  const handleMessage = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Upgrade to Premium to message travel buddies.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Learn More', onPress: () => router.push('/account/membership') },
        ]
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/chat/${buddy?.id}`);
  };
  
  const handleReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/report?type=user&id=${buddy?.id}`);
  };

  const handleBlock = () => {
    Alert.alert('Block User', `Block ${buddy?.firstName}? They won't be able to see your profile or message you.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: async () => {
        if (!authProfile?.id || !id) return;
        try {
          await supabase.from('user_blocks').insert({ blocker_id: authProfile.id, blocked_id: id });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showSuccess('User blocked');
          router.back();
        } catch { showError('Could not block user'); }
      }},
    ]);
  };

  const handleDisconnect = async () => {
    if (!authProfile?.id || !id) return;
    Alert.alert('Remove Connection', `Remove ${buddy?.firstName} as a buddy?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await buddyService.removeBuddy(authProfile.id, id);
          setIsConnected(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) { showError(err?.message || 'Could not remove buddy.'); }
      }},
    ]);
  };

  if (isFetching || !buddy) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover & Avatar */}
        <View style={styles.header}>
          {buddy.coverImage ? (
            <Image source={{ uri: buddy.coverImage }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: tc.primary + '30' }]} />
          )}
          <View style={styles.coverOverlay} />
          
          {/* Top Bar */}
          <View style={[styles.topBar, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <ArrowLeft2 size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleReport}>
              <More size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {buddy.avatar ? (
              <Image source={{ uri: buddy.avatar }} style={[styles.avatar, { borderColor: tc.background }]} />
            ) : (
              <View style={[styles.avatar, { borderColor: tc.background, backgroundColor: tc.primary + '30', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 36, fontWeight: '700', color: '#FFFFFF' }}>
                  {(buddy.firstName[0] || '?').toUpperCase()}
                </Text>
              </View>
            )}
            {buddy.isPremium && (
              <View style={[styles.premiumBadge, { borderColor: tc.background }]}>
                <Crown size={14} color="#FFFFFF" variant="Bold" />
              </View>
            )}
          </View>
        </View>
        
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: tc.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{buddy.firstName} {buddy.lastName}</Text>
            {buddy.isVerified && (
              <Verify size={20} color={tc.primary} variant="Bold" />
            )}
          </View>
          
          <View style={styles.locationRow}>
            <Location size={16} color={tc.textTertiary} />
            <Text style={[styles.locationText, { color: tc.textSecondary }]}>{buddy.location}</Text>
          </View>
          
          <Text style={[styles.bio, { color: tc.textSecondary }]}>{buddy.bio}</Text>
          
          {/* Stats */}
          <View style={[styles.statsContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{buddy.stats.tripsCompleted}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Trips</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tc.borderSubtle }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{buddy.stats.countriesVisited}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Countries</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tc.borderSubtle }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{buddy.stats.buddyConnections}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Buddies</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tc.borderSubtle }]} />
            <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                <Star1 size={14} color={tc.warning} variant="Bold" />
                <Text style={[styles.statValue, { color: tc.textPrimary }]}>{buddy.stats.rating}</Text>
              </View>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>Rating</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isConnected ? (
              <TouchableOpacity
                style={[styles.connectButton, { backgroundColor: tc.success + '15', borderWidth: 1, borderColor: tc.success }]}
                onPress={handleDisconnect}
              >
                <UserAdd size={20} color={tc.success} />
                <Text style={[styles.connectButtonText, { color: tc.success }]}>Connected</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.connectButton, { backgroundColor: tc.primary }]}
                onPress={handleConnect}
                disabled={isConnecting}
              >
                <UserAdd size={20} color="#FFFFFF" />
                <Text style={[styles.connectButtonText, { color: '#FFFFFF' }]}>
                  {isConnecting ? 'Sending...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={[styles.messageButton, { backgroundColor: tc.primary + '15' }]} onPress={handleMessage}>
              <Message size={20} color={tc.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Languages */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Languages</Text>
          <View style={styles.tagsContainer}>
            {buddy.languages.map(lang => (
              <View key={lang} style={[styles.languageTag, { backgroundColor: tc.primary + '15' }]}>
                <Global size={14} color={tc.primary} />
                <Text style={[styles.languageText, { color: tc.primary }]}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Travel Style */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Travel Style</Text>
          <View style={styles.tagsContainer}>
            {buddy.travelStyle.map(style => (
              <View key={style} style={[styles.tag, { backgroundColor: tc.borderSubtle }]}>
                <Text style={[styles.tagText, { color: tc.textSecondary }]}>{style}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Interests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Interests</Text>
          <View style={styles.tagsContainer}>
            {buddy.interests.map(interest => (
              <View key={interest} style={[styles.interestTag, { backgroundColor: tc.error + '10' }]}>
                <Heart size={12} color={tc.error} variant="Bold" />
                <Text style={[styles.interestText, { color: tc.error }]}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Upcoming Trips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Upcoming Trips</Text>
          {buddy.upcomingTrips.map(trip => (
            <View key={trip.id} style={[styles.tripCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <View style={styles.tripHeader}>
                <Location size={18} color={tc.primary} />
                <Text style={[styles.tripDestination, { color: tc.textPrimary }]}>{trip.destination}</Text>
              </View>
              <View style={styles.tripDates}>
                <Calendar size={14} color={tc.textTertiary} />
                <Text style={[styles.tripDatesText, { color: tc.textTertiary }]}>{trip.dates}</Text>
              </View>
              {trip.lookingFor ? <Text style={[styles.tripLookingFor, { color: tc.textSecondary }]}>{trip.lookingFor}</Text> : null}
            </View>
          ))}
        </View>
        
        {/* Mutual Groups */}
        {buddy.mutualGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Mutual Groups</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.groupsContainer}>
                {buddy.mutualGroups.map(group => (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupItem}
                    onPress={() => router.push(`/community/${group.id}`)}
                  >
                    <Image source={{ uri: group.avatar }} style={styles.groupAvatar} />
                    <Text style={[styles.groupName, { color: tc.textSecondary }]} numberOfLines={1}>{group.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
        
        {/* Block + Report */}
        <View style={[styles.section, { gap: spacing.sm, marginBottom: 40 }]}>
          <TouchableOpacity style={styles.reportButton} onPress={handleBlock}>
            <ShieldCross size={18} color={tc.error} />
            <Text style={[styles.reportText, { color: tc.error }]}>Block User</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
            <Flag size={18} color={tc.error} />
            <Text style={[styles.reportText, { color: tc.error }]}>Report User</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 240,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -50,
    left: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  profileInfo: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.body,
  },
  bio: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.heading2,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  connectButtonText: {
    fontSize: typography.fontSize.heading3,
    fontWeight: typography.fontWeight.semibold,
  },
  messageButton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.heading3,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  languageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  languageText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: typography.fontSize.body,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  interestText: {
    fontSize: typography.fontSize.body,
  },
  tripCard: {
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tripDestination: {
    fontSize: typography.fontSize.heading3,
    fontWeight: typography.fontWeight.semibold,
  },
  tripDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tripDatesText: {
    fontSize: typography.fontSize.body,
  },
  tripLookingFor: {
    fontSize: 13,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  groupsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  groupItem: {
    alignItems: 'center',
    width: 80,
  },
  groupAvatar: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
  },
  groupName: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  reportText: {
    fontSize: typography.fontSize.body,
  },
});
