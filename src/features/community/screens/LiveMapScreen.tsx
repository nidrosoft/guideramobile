/**
 * PULSE SCREEN
 * 
 * Real-time meetup discovery map. Shows nearby activities and travelers.
 * Users can browse, join, or create instant meetups.
 * Inspired by NomadTable — list-first with map backing.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  ArrowLeft,
  Location as LocationIcon,
  Add,
  Filter,
  People,
  Coffee,
  Map1,
  Clock,
  MessageText1,
  ArrowUp2,
  ArrowDown2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useNearbyActivities, useActivityActions } from '@/hooks/useCommunity';
import type { Activity, NearbyTraveler } from '@/services/community/types/community.types';

interface LocationState {
  latitude: number;
  longitude: number;
}

export default function LiveMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const userId = profile?.id;
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showList, setShowList] = useState(true);

  const { activities, loading: loadingActivities, refetch } = useNearbyActivities(
    userId,
    location ? { lat: location.latitude, lng: location.longitude } : null
  );
  const { joinActivity, loading: joiningActivity } = useActivityActions(userId);

  // Request location permission and get current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          setLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setLoading(false);
      } catch (error) {
        setLocationError('Could not get your location');
        setLoading(false);
      }
    })();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleRecenter = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [location]);

  const handleCreateActivity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/community/create-activity' as any);
  };

  const handleActivityPress = (activity: Activity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivity(activity);
  };

  const handleJoinActivity = async () => {
    if (!selectedActivity) return;
    try {
      await joinActivity(selectedActivity.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedActivity(null);
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const FILTER_CHIPS = [
    { id: 'all', label: 'All', emoji: '✨' },
    { id: 'coffee', label: 'Coffee', emoji: '☕' },
    { id: 'food', label: 'Food', emoji: '🍽️' },
    { id: 'drinks', label: 'Drinks', emoji: '🍻' },
    { id: 'sightseeing', label: 'Explore', emoji: '📸' },
    { id: 'coworking', label: 'Cowork', emoji: '💻' },
    { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
    { id: 'sports', label: 'Sports', emoji: '⚽' },
  ];

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') return activities;
    return activities.filter(a => a.type === activeFilter);
  }, [activities, activeFilter]);

  const getTimingLabel = (activity: Activity) => {
    if (activity.timing === 'now') return 'Happening now';
    if (activity.timing === 'today') return 'Today';
    if (activity.timing === 'tomorrow') return 'Tomorrow';
    if (activity.scheduledFor) {
      return new Date(activity.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'Soon';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'coffee':
        return '☕';
      case 'food':
        return '🍽️';
      case 'drinks':
        return '🍻';
      case 'sightseeing':
        return '📸';
      case 'walking_tour':
        return '🚶';
      case 'museum':
        return '🏛️';
      case 'nightlife':
        return '🌙';
      case 'sports':
        return '⚽';
      case 'coworking':
        return '💻';
      default:
        return '📍';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: tc.background }]}>
        <ActivityIndicator size="large" color={tc.primary} />
        <Text style={[styles.loadingText, { color: tc.textSecondary }]}>Getting your location...</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: tc.background }]}>
        <LocationIcon size={64} color={tc.textTertiary} variant="Bold" />
        <Text style={[styles.errorTitle, { color: tc.textPrimary }]}>Location Required</Text>
        <Text style={[styles.errorText, { color: tc.textSecondary }]}>{locationError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Map */}
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* Activity Markers */}
          {activities.map((activity) => (
            <Marker
              key={activity.id}
              coordinate={{
                latitude: activity.latitude || 0,
                longitude: activity.longitude || 0,
              }}
              onPress={() => handleActivityPress(activity)}
            >
              <View style={styles.activityMarker}>
                <Text style={styles.activityMarkerEmoji}>
                  {getActivityIcon(activity.type)}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)' }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: tc.bgElevated }]} onPress={handleBack}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: tc.textPrimary }]}>Pulse</Text>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: tc.bgElevated }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowList(!showList); }}
        >
          {showList ? <Map1 size={22} color={tc.textPrimary} /> : <Filter size={22} color={tc.textPrimary} />}
        </TouchableOpacity>
      </View>

      {/* Filter Chips — below header */}
      <View style={[styles.filterChipsRow, { top: insets.top + 60 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
          {FILTER_CHIPS.map(chip => {
            const isActive = activeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: isActive ? tc.primary : tc.bgElevated, borderColor: isActive ? tc.primary : tc.borderSubtle },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveFilter(chip.id);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.filterChipEmoji}>{chip.emoji}</Text>
                <Text style={[styles.filterChipText, { color: isActive ? '#FFFFFF' : tc.textSecondary }]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* FABs — recenter + create + toggle list */}
      <View style={[styles.fabContainer, { bottom: showList ? (insets.bottom + 340) : (insets.bottom + 24) }]}>
        <TouchableOpacity
          style={[styles.fabSecondary, { backgroundColor: tc.bgElevated }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowList(!showList); }}
        >
          {showList ? <Map1 size={22} color={tc.primary} /> : <ArrowUp2 size={22} color={tc.primary} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fabSecondary, { backgroundColor: tc.bgElevated }]} onPress={handleRecenter}>
          <LocationIcon size={22} color={tc.primary} variant="Bold" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabPrimary} onPress={handleCreateActivity}>
          <Add size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet — Activity List */}
      {showList && (
        <View style={[styles.bottomSheet, { backgroundColor: tc.background, paddingBottom: insets.bottom }]}>
          {/* Handle */}
          <View style={styles.sheetHandleRow}>
            <View style={[styles.sheetHandle, { backgroundColor: tc.borderSubtle }]} />
          </View>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: tc.textPrimary }]}>
              {filteredActivities.length} {filteredActivities.length === 1 ? 'meetup' : 'meetups'} nearby
            </Text>
          </View>

          {filteredActivities.length === 0 ? (
            <View style={styles.sheetEmpty}>
              <Text style={[styles.sheetEmptyText, { color: tc.textSecondary }]}>
                No meetups right now. Tap + to start one!
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredActivities}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetList}
              renderItem={({ item: activity }) => (
                <TouchableOpacity
                  style={[styles.listCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedActivity(activity);
                    setShowList(false);
                    if (activity.latitude && activity.longitude && mapRef.current) {
                      mapRef.current.animateToRegion({
                        latitude: activity.latitude,
                        longitude: activity.longitude,
                        latitudeDelta: 0.008,
                        longitudeDelta: 0.008,
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.listCardIcon, { backgroundColor: tc.primary + '12' }]}>
                    <Text style={{ fontSize: 22 }}>{getActivityIcon(activity.type)}</Text>
                  </View>
                  <View style={styles.listCardContent}>
                    <Text style={[styles.listCardTitle, { color: tc.textPrimary }]} numberOfLines={1}>
                      {activity.title}
                    </Text>
                    <View style={styles.listCardMeta}>
                      <Clock size={13} color={tc.textTertiary} />
                      <Text style={[styles.listCardMetaText, { color: tc.textSecondary }]}>
                        {getTimingLabel(activity)}
                      </Text>
                      <Text style={[styles.listCardDot, { color: tc.textTertiary }]}>·</Text>
                      <LocationIcon size={13} color={tc.textTertiary} />
                      <Text style={[styles.listCardMetaText, { color: tc.textSecondary }]} numberOfLines={1}>
                        {activity.locationName || 'Nearby'}
                      </Text>
                    </View>
                    <View style={styles.listCardFooter}>
                      <View style={styles.listCardAvatars}>
                        {activity.participants?.slice(0, 3).map((p, i) => (
                          <Image
                            key={p.id || i}
                            source={{ uri: p.user?.avatarUrl || `https://i.pravatar.cc/40?u=${p.userId}` }}
                            style={[styles.listCardAvatar, { marginLeft: i > 0 ? -8 : 0, borderColor: tc.bgElevated }]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.listCardGoingText, { color: tc.textTertiary }]}>
                        {activity.participantCount} going{activity.maxParticipants ? ` · ${activity.maxParticipants - activity.participantCount} spots left` : ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Selected Activity Detail Card — shown when list is hidden and marker tapped */}
      {!showList && selectedActivity && (
        <View style={[styles.activityCard, { bottom: insets.bottom + 20, backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <View style={styles.activityCardHeader}>
            <View style={[styles.activityTypeIcon, { backgroundColor: tc.primary + '15' }]}>
              <Text style={styles.activityTypeEmoji}>
                {getActivityIcon(selectedActivity.type)}
              </Text>
            </View>
            <View style={styles.activityCardInfo}>
              <Text style={[styles.activityCardTitle, { color: tc.textPrimary }]} numberOfLines={1}>
                {selectedActivity.title}
              </Text>
              <Text style={[styles.activityCardLocation, { color: tc.textSecondary }]} numberOfLines={1}>
                {selectedActivity.locationName}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: tc.bgCard }]}
              onPress={() => setSelectedActivity(null)}
            >
              <Text style={[styles.closeButtonText, { color: tc.textSecondary }]}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.activityCardDetails, { borderTopColor: tc.borderSubtle }]}>
            <View style={styles.activityCardDetail}>
              <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>When</Text>
              <Text style={[styles.detailValue, { color: tc.textPrimary }]}>
                {getTimingLabel(selectedActivity)}
              </Text>
            </View>
            <View style={styles.activityCardDetail}>
              <Text style={[styles.detailLabel, { color: tc.textSecondary }]}>Going</Text>
              <Text style={[styles.detailValue, { color: tc.textPrimary }]}>
                {selectedActivity.participantCount}
                {selectedActivity.maxParticipants ? `/${selectedActivity.maxParticipants}` : ''}
              </Text>
            </View>
          </View>

          {selectedActivity.creator && (
            <View style={styles.creatorRow}>
              <Image
                source={{ uri: selectedActivity.creator.avatarUrl || `https://i.pravatar.cc/32?u=${selectedActivity.createdBy}` }}
                style={styles.creatorAvatar}
              />
              <Text style={[styles.creatorName, { color: tc.textSecondary }]}>
                {selectedActivity.creator.firstName} {selectedActivity.creator.lastName}
              </Text>
            </View>
          )}

          <View style={styles.activityCardActions}>
            <TouchableOpacity
              style={[styles.chatButton, { borderColor: tc.borderSubtle }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/community/chat/${selectedActivity.id}` as any);
              }}
            >
              <MessageText1 size={18} color={tc.textPrimary} />
              <Text style={[styles.chatButtonText, { color: tc.textPrimary }]}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.joinButton,
                joiningActivity && styles.joinButtonDisabled,
              ]}
              onPress={handleJoinActivity}
              disabled={joiningActivity}
            >
              {joiningActivity ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.joinButtonText}>Join</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  errorTitle: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsBanner: {
    position: 'absolute',
    top: 120,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'column',
    gap: spacing.md,
  },
  fabSecondary: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  fabPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  activityMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  activityMarkerEmoji: {
    fontSize: 20,
  },
  activityCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTypeEmoji: {
    fontSize: 24,
  },
  activityCardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  activityCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  activityCardLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  activityCardDetails: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  activityCardDetail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  creatorName: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  joinButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },

  // Filter Chips
  filterChipsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterChipsScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipEmoji: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: 340,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sheetEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  sheetEmptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  sheetList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },

  // List Card
  listCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 18,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  listCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  listCardContent: {
    flex: 1,
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  listCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  listCardMetaText: {
    fontSize: 12,
    flexShrink: 1,
  },
  listCardDot: {
    fontSize: 12,
  },
  listCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listCardAvatars: {
    flexDirection: 'row',
  },
  listCardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  listCardGoingText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Activity Detail Actions
  activityCardActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  chatButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
