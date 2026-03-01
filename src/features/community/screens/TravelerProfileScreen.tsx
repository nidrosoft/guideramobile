/**
 * TRAVELER PROFILE SCREEN
 * 
 * Public view of a traveler's profile with stats, interests,
 * countries visited, mutual groups, and buddy/follow actions.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Verify,
  Airplane,
  Global,
  Star1,
  People,
  ProfileAdd,
  UserAdd,
  MessageText1,
  TickCircle,
  Heart,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius, shadows } from '@/styles';
import { MOCK_TRAVELER_PROFILE } from '../data/feedMockData';

export default function TravelerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [profile, setProfile] = useState(MOCK_TRAVELER_PROFILE);
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
  const [buddyStatus, setBuddyStatus] = useState(profile.buddyStatus);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(!isFollowing);
  };

  const handleBuddyRequest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!buddyStatus) {
      setBuddyStatus('pending');
    } else if (buddyStatus === 'pending') {
      setBuddyStatus(null);
    }
  };

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/chat/${userId || profile.id}` as any);
  };

  const stats = [
    { label: 'Trips', value: profile.stats.tripsCount, icon: Airplane },
    { label: 'Countries', value: profile.stats.countriesVisited, icon: Global },
    { label: 'Reviews', value: profile.stats.reviewsCount, icon: Star1 },
    { label: 'Groups', value: profile.stats.groupsCount, icon: People },
  ];

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Cover + Avatar */}
        <ImageBackground
          source={{ uri: profile.coverPhoto || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800' }}
          style={styles.coverImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
            <TouchableOpacity style={styles.navButton} onPress={handleBack}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <Animated.View style={[styles.profileContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Avatar + Name */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarBorder, { borderColor: tc.background }]}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            </View>
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: tc.textPrimary }]}>
                  {profile.firstName} {profile.lastName}
                </Text>
                {profile.isVerified && (
                  <Verify size={18} color={tc.primary} variant="Bold" />
                )}
              </View>
              {profile.city && (
                <Text style={[styles.location, { color: tc.textSecondary }]}>
                  {profile.city}, {profile.country}
                </Text>
              )}
            </View>
          </View>

          {/* Bio */}
          {profile.bio && (
            <Text style={[styles.bio, { color: tc.textSecondary }]}>
              {profile.bio}
            </Text>
          )}

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.primaryAction,
                {
                  backgroundColor: buddyStatus === 'accepted'
                    ? tc.primary + '18'
                    : buddyStatus === 'pending'
                      ? tc.borderMedium
                      : tc.primary,
                },
              ]}
              onPress={handleBuddyRequest}
              activeOpacity={0.8}
            >
              {buddyStatus === 'accepted' ? (
                <TickCircle size={16} color={tc.primary} variant="Bold" />
              ) : (
                <ProfileAdd size={16} color={buddyStatus === 'pending' ? tc.textSecondary : '#121212'} variant={buddyStatus ? 'Bold' : 'Linear'} />
              )}
              <Text
                style={[
                  styles.primaryActionText,
                  {
                    color: buddyStatus === 'accepted'
                      ? tc.primary
                      : buddyStatus === 'pending'
                        ? tc.textSecondary
                        : '#121212',
                  },
                ]}
              >
                {buddyStatus === 'accepted' ? 'Buddies' : buddyStatus === 'pending' ? 'Requested' : 'Add Buddy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryAction,
                {
                  backgroundColor: isFollowing ? tc.bgElevated : 'transparent',
                  borderColor: tc.borderMedium,
                },
              ]}
              onPress={handleFollow}
              activeOpacity={0.8}
            >
              <UserAdd size={16} color={isFollowing ? tc.primary : tc.textSecondary} variant={isFollowing ? 'Bold' : 'Linear'} />
              <Text style={[styles.secondaryActionText, { color: isFollowing ? tc.primary : tc.textSecondary }]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconAction, { backgroundColor: tc.bgElevated, borderColor: tc.borderMedium }]}
              onPress={handleMessage}
            >
              <MessageText1 size={18} color={tc.textSecondary} variant="Linear" />
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={[styles.statsCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <View
                  key={stat.label}
                  style={[
                    styles.statItem,
                    index < stats.length - 1 && [styles.statDivider, { borderRightColor: tc.borderSubtle }],
                  ]}
                >
                  <Icon size={18} color={tc.primary} variant="Bold" />
                  <Text style={[styles.statValue, { color: tc.textPrimary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: tc.textTertiary }]}>{stat.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Travel Interests */}
          {profile.travelInterests.length > 0 && (
            <View style={[styles.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Travel Interests</Text>
              <View style={styles.chipRow}>
                {profile.travelInterests.map((interest) => (
                  <View key={interest} style={[styles.interestChip, { backgroundColor: tc.primarySubtle }]}>
                    <Text style={[styles.interestText, { color: tc.primary }]}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Countries Visited */}
          {profile.countriesVisited.length > 0 && (
            <View style={[styles.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>
                Countries Visited ({profile.countriesVisited.length})
              </Text>
              <View style={styles.chipRow}>
                {profile.countriesVisited.map((code) => (
                  <View key={code} style={[styles.countryChip, { backgroundColor: tc.bgCard }]}>
                    <Text style={styles.flag}>{getFlag(code)}</Text>
                    <Text style={[styles.countryCode, { color: tc.textSecondary }]}>{code}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Mutual Groups */}
          {profile.mutualGroups.length > 0 && (
            <View style={[styles.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Mutual Groups</Text>
              {profile.mutualGroups.map((group) => (
                <View key={group} style={[styles.mutualGroupRow, { borderBottomColor: tc.borderSubtle }]}>
                  <People size={15} color={tc.textTertiary} variant="Bold" />
                  <Text style={[styles.mutualGroupText, { color: tc.textSecondary }]}>{group}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: spacing['3xl'] }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function getFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-start',
  },
  topBar: {
    paddingHorizontal: spacing.md,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContent: {
    marginTop: -40,
    paddingHorizontal: spacing.lg,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  avatarBorder: {
    borderRadius: 46,
    borderWidth: 4,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  nameSection: {
    flex: 1,
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
  },
  location: {
    ...typography.bodySm,
    marginTop: 2,
  },
  bio: {
    ...typography.bodyLg,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  section: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '500',
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  flag: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 11,
    fontWeight: '500',
  },
  mutualGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mutualGroupText: {
    ...typography.bodySm,
    flex: 1,
  },
});
