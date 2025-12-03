/**
 * BUDDY PROFILE SCREEN
 * 
 * View travel buddy details, their travel plans, and connect.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
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
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

// Mock buddy data
const MOCK_BUDDY = {
  id: 'buddy-1',
  firstName: 'Sarah',
  lastName: 'Chen',
  avatar: 'https://i.pravatar.cc/300?img=5',
  coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  bio: 'Solo traveler & photographer. Love exploring hidden gems and local food scenes. Always up for an adventure! 📸✈️',
  location: 'San Francisco, USA',
  languages: ['English', 'Mandarin', 'Spanish'],
  travelStyle: ['Adventure', 'Photography', 'Foodie', 'Budget'],
  isPremium: true,
  isVerified: true,
  joinedDate: 'March 2023',
  stats: {
    tripsCompleted: 24,
    countriesVisited: 15,
    buddyConnections: 48,
    rating: 4.9,
  },
  upcomingTrips: [
    {
      id: 'trip-1',
      destination: 'Tokyo, Japan',
      dates: 'Jan 15 - Jan 28, 2025',
      lookingFor: 'Travel buddy for exploring temples and food tours',
    },
    {
      id: 'trip-2',
      destination: 'Bali, Indonesia',
      dates: 'Mar 5 - Mar 15, 2025',
      lookingFor: 'Someone to share villa and explore beaches',
    },
  ],
  interests: ['Hiking', 'Street Food', 'Temples', 'Night Markets', 'Photography', 'Yoga'],
  mutualGroups: [
    { id: 'g1', name: 'Solo Female Travelers', avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200' },
    { id: 'g2', name: 'Tokyo Travelers 2025', avatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200' },
  ],
};

export default function BuddyProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const buddy = MOCK_BUDDY;
  const isPremium = true; // Current user's premium status
  
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
          { text: 'Upgrade', onPress: () => router.push('/premium' as any) },
        ]
      );
      return;
    }
    
    setIsConnecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate API call
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Request Sent!', `Your connection request has been sent to ${buddy.firstName}.`);
    }, 1000);
  };
  
  const handleMessage = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Upgrade to Premium to message travel buddies.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/premium' as any) },
        ]
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/chat/${buddy.id}` as any);
  };
  
  const handleReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/report?type=user&id=${buddy.id}` as any);
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover & Avatar */}
        <View style={styles.header}>
          <Image source={{ uri: buddy.coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
          
          {/* Top Bar */}
          <View style={[styles.topBar, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <ArrowLeft size={24} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleReport}>
              <More size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: buddy.avatar }} style={styles.avatar} />
            {buddy.isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={14} color={colors.white} variant="Bold" />
              </View>
            )}
          </View>
        </View>
        
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{buddy.firstName} {buddy.lastName}</Text>
            {buddy.isVerified && (
              <Verify size={20} color={colors.primary} variant="Bold" />
            )}
          </View>
          
          <View style={styles.locationRow}>
            <Location size={16} color={colors.gray500} />
            <Text style={styles.locationText}>{buddy.location}</Text>
          </View>
          
          <Text style={styles.bio}>{buddy.bio}</Text>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{buddy.stats.tripsCompleted}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{buddy.stats.countriesVisited}</Text>
              <Text style={styles.statLabel}>Countries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{buddy.stats.buddyConnections}</Text>
              <Text style={styles.statLabel}>Buddies</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                <Star1 size={14} color={colors.warning} variant="Bold" />
                <Text style={styles.statValue}>{buddy.stats.rating}</Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.connectButton, isConnected && styles.connectedButton]}
              onPress={handleConnect}
              disabled={isConnecting || isConnected}
            >
              <UserAdd size={20} color={isConnected ? colors.success : colors.white} />
              <Text style={[styles.connectButtonText, isConnected && styles.connectedButtonText]}>
                {isConnecting ? 'Sending...' : isConnected ? 'Request Sent' : 'Connect'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <Message size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.tagsContainer}>
            {buddy.languages.map(lang => (
              <View key={lang} style={styles.languageTag}>
                <Global size={14} color={colors.primary} />
                <Text style={styles.languageText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Travel Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Style</Text>
          <View style={styles.tagsContainer}>
            {buddy.travelStyle.map(style => (
              <View key={style} style={styles.tag}>
                <Text style={styles.tagText}>{style}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tagsContainer}>
            {buddy.interests.map(interest => (
              <View key={interest} style={styles.interestTag}>
                <Heart size={12} color={colors.error} variant="Bold" />
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Upcoming Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Trips</Text>
          {buddy.upcomingTrips.map(trip => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Location size={18} color={colors.primary} />
                <Text style={styles.tripDestination}>{trip.destination}</Text>
              </View>
              <View style={styles.tripDates}>
                <Calendar size={14} color={colors.gray500} />
                <Text style={styles.tripDatesText}>{trip.dates}</Text>
              </View>
              <Text style={styles.tripLookingFor}>{trip.lookingFor}</Text>
            </View>
          ))}
        </View>
        
        {/* Mutual Groups */}
        {buddy.mutualGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mutual Groups</Text>
            <View style={styles.groupsContainer}>
              {buddy.mutualGroups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupItem}
                  onPress={() => router.push(`/community/${group.id}` as any)}
                >
                  <Image source={{ uri: group.avatar }} style={styles.groupAvatar} />
                  <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        {/* Report Button */}
        <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
          <Flag size={18} color={colors.error} />
          <Text style={styles.reportText}>Report User</Text>
        </TouchableOpacity>
        
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
    borderColor: colors.white,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
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
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginTop: spacing.lg,
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
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
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  connectedButton: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success,
  },
  connectButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  connectedButtonText: {
    color: colors.success,
  },
  messageButton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
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
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  languageText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  interestText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  tripCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tripDestination: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  tripDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tripDatesText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  tripLookingFor: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
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
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
});
