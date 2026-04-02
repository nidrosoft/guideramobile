/**
 * PULSE SCREEN
 *
 * Real-time meetup discovery map with bottom sheet activity list.
 * Orchestrates map, filter chips, activity list, and detail card.
 * Components extracted into src/features/community/components/pulse/
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  ArrowLeft2,
  Location as LocationIcon,
  Add,
  Map1,
  ArrowUp2,
  Clock,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useNearbyActivities, useActivityActions } from '@/hooks/useCommunity';
import { activityService } from '@/services/community/activity.service';
import type { Activity } from '@/services/community/types/community.types';
import {
  PulseFilterChips,
  PulseActivityList,
  PulseActivityDetail,
  getActivityIcon,
} from '../components/pulse';

interface LocationState {
  latitude: number;
  longitude: number;
}

export default function PulseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const { showError } = useToast();
  const userId = profile?.id;
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<LocationState | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showList, setShowList] = useState(true);

  const { activities, loading: loadingActivities, refetch } = useNearbyActivities(
    userId,
    location ? { lat: location.latitude, lng: location.longitude } : null,
    cityName,
  );
  const { joinActivity, leaveActivity, loading: joiningActivity } = useActivityActions(userId);

  // Request location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          setLoading(false);
          return;
        }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
        // Reverse geocode to get city name for city-based filtering
        try {
          const [geo] = await Location.reverseGeocodeAsync(current.coords);
          if (geo?.city) setCityName(geo.city);
        } catch { /* non-critical */ }
      } catch {
        setLocationError('Could not get your location');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Refetch activities when screen comes into focus (e.g., after creating one)
  useFocusEffect(
    useCallback(() => {
      if (location) refetch();
    }, [location, refetch])
  );

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') return activities;
    return activities.filter(a => a.type === activeFilter);
  }, [activities, activeFilter]);

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
    router.push('/community/create-activity');
  };

  const handleActivityPress = (activity: Activity) => {
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
  };

  const handleJoinActivity = async () => {
    if (!selectedActivity) return;
    try {
      await joinActivity(selectedActivity.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedActivity(null);
      // Realtime will auto-refresh the list
    } catch (error: any) {
      showError(error.message || 'Failed to join activity');
    }
  };

  const handleLeaveActivity = async () => {
    if (!selectedActivity) return;
    try {
      await leaveActivity(selectedActivity.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedActivity(null);
    } catch (error: any) {
      showError(error.message || 'Failed to leave activity');
    }
  };

  // Check if current user has joined the selected activity
  const hasJoinedSelected = !!(
    selectedActivity &&
    userId &&
    selectedActivity.participants?.some(p => p.userId === userId)
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: tc.background }]}>
        <ActivityIndicator size="large" color={tc.primary} />
        <Text style={[styles.loadingText, { color: tc.textSecondary }]}>Getting your location...</Text>
      </View>
    );
  }

  // Error state
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
          mapPadding={{ top: 0, right: 0, bottom: showList ? 260 : 0, left: 0 }}
        >
          {filteredActivities.map(activity => {
            const isMine = activity.createdBy === userId;
            return (
              <Marker
                key={activity.id}
                coordinate={{ latitude: activity.latitude || 0, longitude: activity.longitude || 0 }}
                onPress={() => handleActivityPress(activity)}
                tracksViewChanges={false}
                zIndex={isMine ? 999 : 1}
              >
                <View style={[
                  styles.marker,
                  { backgroundColor: tc.bgElevated, borderColor: tc.primary },
                  isMine && { borderColor: tc.success || '#34C759', shadowColor: tc.success || '#34C759', shadowOpacity: 0.4 },
                ]}>
                  <Text style={styles.markerEmoji}>{getActivityIcon(activity.type)}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)' }]}>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: tc.bgElevated }]} onPress={() => router.back()}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{cityName ? `Pulse · ${cityName}` : 'Pulse'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: tc.bgElevated }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/community/my-activities'); }}
          >
            <Clock size={20} color={tc.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: tc.bgElevated }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowList(!showList); }}
          >
            {showList ? <Map1 size={22} color={tc.textPrimary} /> : <ArrowUp2 size={22} color={tc.textPrimary} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={[styles.filterRow, { top: insets.top + 60 }]}>
        <PulseFilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </View>

      {/* FABs */}
      <View style={[styles.fabCol, { bottom: showList ? '58%' : (insets.bottom + 24) }]}>
        <TouchableOpacity
          style={[styles.fabSmall, { backgroundColor: tc.bgElevated }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowList(!showList); }}
        >
          {showList ? <Map1 size={22} color={tc.primary} /> : <ArrowUp2 size={22} color={tc.primary} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fabSmall, { backgroundColor: tc.bgElevated }]} onPress={handleRecenter}>
          <LocationIcon size={22} color={tc.primary} variant="Bold" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabPrimary} onPress={handleCreateActivity}>
          <Add size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet — Activity List */}
      {showList && (
        <PulseActivityList
          activities={filteredActivities}
          onActivityPress={handleActivityPress}
          onCreatorPress={(creatorId) => router.push(`/community/buddy/${creatorId}`)}
        />
      )}

      {/* Selected Activity Detail */}
      {!showList && selectedActivity && (
        <PulseActivityDetail
          activity={selectedActivity}
          currentUserId={userId}
          hasJoined={hasJoinedSelected}
          joining={joiningActivity}
          onJoin={handleJoinActivity}
          onLeave={handleLeaveActivity}
          onViewDetails={() => router.push(`/community/activity/${selectedActivity.id}`)}
          onChat={() => router.push(`/community/activity-chat/${selectedActivity.id}`)}
          onEdit={() => {
            router.push({
              pathname: '/community/create-activity',
              params: {
                editId: selectedActivity.id,
                editTitle: selectedActivity.title,
                editType: selectedActivity.type,
                editDescription: selectedActivity.description || '',
                editLocationName: selectedActivity.locationName || '',
                editLatitude: String(selectedActivity.latitude || 0),
                editLongitude: String(selectedActivity.longitude || 0),
              },
            });
          }}
          onCancel={async () => {
            try {
              // Cancel via service — sets status to 'cancelled'
              const { activityService } = require('@/services/community/activity.service');
              await activityService.cancelActivity(userId, selectedActivity.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setSelectedActivity(null);
              refetch();
            } catch (err: any) {
              showError(err?.message || 'Could not cancel activity');
            }
          }}
          onReport={() => router.push(`/community/report?type=event&id=${selectedActivity.id}`)}
          onClose={() => setSelectedActivity(null)}
          bottomOffset={insets.bottom + 20}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { marginTop: spacing.md, fontSize: 15 },
  errorTitle: { marginTop: spacing.md, fontSize: 20, fontWeight: '700' },
  errorText: { marginTop: spacing.sm, fontSize: 15, textAlign: 'center' },
  retryButton: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.full },
  retryButtonText: { fontSize: 15, fontWeight: '600', color: colors.white },
  map: { ...StyleSheet.absoluteFillObject },
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
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  filterRow: { position: 'absolute', left: 0, right: 0, zIndex: 10 },
  fabCol: { position: 'absolute', right: spacing.lg, gap: spacing.md },
  fabSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  marker: {
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
  markerMine: {
    borderColor: '#34C759',
    borderWidth: 3,
    shadowColor: '#34C759',
    shadowOpacity: 0.4,
  },
  markerEmoji: { fontSize: 20 },
});
