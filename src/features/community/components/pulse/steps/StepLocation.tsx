/**
 * STEP 3: LOCATION (Inline Map)
 *
 * Full-screen map with draggable center pin.
 * Toggle between "Area" (general radius) and "Exact" (specific pin).
 * Address bar shows reverse-geocoded location.
 * No modal — the map IS the step content.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Location } from 'iconsax-react-native';
import * as ExpoLocation from 'expo-location';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

type PrecisionMode = 'area' | 'exact';

interface StepLocationProps {
  coords: { latitude: number; longitude: number } | null;
  locationName: string;
  onLocationChange: (coords: { latitude: number; longitude: number }, name: string) => void;
}

export default function StepLocation({ coords, locationName, onLocationChange }: StepLocationProps) {
  const { colors: tc } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [precision, setPrecision] = useState<PrecisionMode>('area');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressText, setAddressText] = useState(locationName || 'Move the map to pick a spot');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [toggleWidth, setToggleWidth] = useState(0);

  const defaultRegion: Region = {
    latitude: coords?.latitude || 32.75,
    longitude: coords?.longitude || -117.15,
    latitudeDelta: precision === 'area' ? 0.04 : 0.008,
    longitudeDelta: precision === 'area' ? 0.04 : 0.008,
  };

  // Reverse geocode on region change
  const handleRegionChange = useCallback(async (region: Region) => {
    setIsGeocoding(true);
    try {
      const [geo] = await ExpoLocation.reverseGeocodeAsync({
        latitude: region.latitude,
        longitude: region.longitude,
      });
      let name = 'Location selected';
      if (geo) {
        if (precision === 'exact') {
          name = [geo.name, geo.street, geo.city].filter(Boolean).join(', ') || 'Location selected';
        } else {
          name = [geo.district || geo.subregion, geo.city].filter(Boolean).join(', ') || geo.city || 'General area';
        }
      }
      setAddressText(name);
      onLocationChange({ latitude: region.latitude, longitude: region.longitude }, name);
    } catch {
      setAddressText('Location selected');
      onLocationChange({ latitude: region.latitude, longitude: region.longitude }, 'Location selected');
    } finally {
      setIsGeocoding(false);
    }
  }, [precision, onLocationChange]);

  const handlePrecisionToggle = (mode: PrecisionMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrecision(mode);
    Animated.spring(slideAnim, {
      toValue: mode === 'exact' ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    if (mapRef.current && coords) {
      mapRef.current.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: mode === 'area' ? 0.04 : 0.008,
        longitudeDelta: mode === 'area' ? 0.04 : 0.008,
      }, 400);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map fills the step */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={defaultRegion}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Center pin */}
      <View style={styles.pinContainer} pointerEvents="none">
        {precision === 'exact' ? (
          <View style={[styles.exactPin, { backgroundColor: tc.primary }]}>
            <Location size={18} color="#FFFFFF" variant="Bold" />
          </View>
        ) : (
          <View style={[styles.areaCircle, { borderColor: tc.primary + '60', backgroundColor: tc.primary + '15' }]}>
            <View style={[styles.areaDot, { backgroundColor: tc.primary }]} />
          </View>
        )}
      </View>

      {/* Pill Toggle: Area / Exact */}
      <View
        style={[styles.toggleOuter, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
        onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
      >
        {/* Animated sliding pill */}
        {toggleWidth > 0 && (
          <Animated.View
            style={[
              styles.togglePill,
              {
                backgroundColor: tc.primary,
                width: (toggleWidth - 8) / 2,
                transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (toggleWidth - 8) / 2] }) }],
              },
            ]}
          />
        )}
        <TouchableOpacity style={styles.toggleHalf} onPress={() => handlePrecisionToggle('area')} activeOpacity={0.8}>
          <Text style={[styles.toggleLabel, { color: precision === 'area' ? '#FFFFFF' : tc.textSecondary }]}>
            General Area
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toggleHalf} onPress={() => handlePrecisionToggle('exact')} activeOpacity={0.8}>
          <Text style={[styles.toggleLabel, { color: precision === 'exact' ? '#FFFFFF' : tc.textSecondary }]}>
            Exact Spot
          </Text>
        </TouchableOpacity>
      </View>

      {/* Address bar at bottom */}
      <View style={[styles.addressBar, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <Location size={18} color={tc.primary} variant="Bold" />
        <View style={styles.addressContent}>
          {isGeocoding ? (
            <ActivityIndicator size="small" color={tc.primary} />
          ) : (
            <Text style={[styles.addressText, { color: tc.textPrimary }]} numberOfLines={2}>
              {addressText}
            </Text>
          )}
          <Text style={[styles.addressHint, { color: tc.textTertiary }]}>
            {precision === 'area' ? 'General area \u2014 drag to adjust' : 'Exact spot \u2014 drag to pin'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pinContainer: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    alignItems: 'center',
  },
  exactPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: -18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  areaCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginLeft: -40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  toggleOuter: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    borderRadius: 28,
    borderWidth: 1,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  togglePill: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: '100%',
    borderRadius: 24,
  },
  toggleHalf: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  addressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '600',
  },
  addressHint: {
    fontSize: 12,
    marginTop: 2,
  },
});
