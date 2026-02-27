/**
 * LIVE MAP SCREEN
 * 
 * Shows nearby travelers and activities on a real-time map.
 * Users can see who's around and join/create meetup activities.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
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
  const { colors: themeColors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LocationIcon size={64} color={colors.gray400} variant="Bold" />
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

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
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Live Map</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <People size={18} color={colors.primary} />
          <Text style={styles.statText}>
            {activities.length} Activities Nearby
          </Text>
        </View>
      </View>

      {/* Floating Action Buttons */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 100 }]}>
        <TouchableOpacity style={styles.fabSecondary} onPress={handleRecenter}>
          <Map1 size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabPrimary} onPress={handleCreateActivity}>
          <Add size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Selected Activity Card */}
      {selectedActivity && (
        <View style={[styles.activityCard, { bottom: insets.bottom + 20 }]}>
          <View style={styles.activityCardHeader}>
            <View style={styles.activityTypeIcon}>
              <Text style={styles.activityTypeEmoji}>
                {getActivityIcon(selectedActivity.type)}
              </Text>
            </View>
            <View style={styles.activityCardInfo}>
              <Text style={styles.activityCardTitle} numberOfLines={1}>
                {selectedActivity.title}
              </Text>
              <Text style={styles.activityCardLocation} numberOfLines={1}>
                {selectedActivity.locationName}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedActivity(null)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCardDetails}>
            <View style={styles.activityCardDetail}>
              <Text style={styles.detailLabel}>When</Text>
              <Text style={styles.detailValue}>
                {selectedActivity.timing === 'now'
                  ? 'Right now'
                  : selectedActivity.timing === 'today'
                  ? 'Today'
                  : selectedActivity.scheduledFor?.toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.activityCardDetail}>
              <Text style={styles.detailLabel}>Going</Text>
              <Text style={styles.detailValue}>
                {selectedActivity.participantCount}
                {selectedActivity.maxParticipants
                  ? `/${selectedActivity.maxParticipants}`
                  : ''}
              </Text>
            </View>
          </View>

          {selectedActivity.creator && (
            <View style={styles.creatorRow}>
              <Image
                source={{ uri: selectedActivity.creator.avatarUrl || 'https://via.placeholder.com/32' }}
                style={styles.creatorAvatar}
              />
              <Text style={styles.creatorName}>
                {selectedActivity.creator.firstName} {selectedActivity.creator.lastName}
              </Text>
            </View>
          )}

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
              <Text style={styles.joinButtonText}>Join Chat</Text>
            )}
          </TouchableOpacity>
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
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
    backgroundColor: colors.gray100,
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
    borderTopColor: colors.gray100,
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
    marginTop: spacing.lg,
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
});
