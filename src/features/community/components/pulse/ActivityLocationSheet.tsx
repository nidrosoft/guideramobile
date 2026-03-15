/**
 * ACTIVITY LOCATION SHEET
 *
 * Full-screen modal with map for picking activity location.
 * User drags the map to position the pin, then confirms.
 * Reverse geocodes to show address text.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Location, CloseCircle } from 'iconsax-react-native';
import * as ExpoLocation from 'expo-location';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface ActivityLocationSheetProps {
  visible: boolean;
  initialCoords?: { latitude: number; longitude: number } | null;
  onConfirm: (coords: { latitude: number; longitude: number }, locationName: string) => void;
  onClose: () => void;
}

export default function ActivityLocationSheet({
  visible,
  initialCoords,
  onConfirm,
  onClose,
}: ActivityLocationSheetProps) {
  const { colors: tc, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>({
    latitude: initialCoords?.latitude || 32.75,
    longitude: initialCoords?.longitude || -117.15,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });
  const [addressText, setAddressText] = useState('Move map to set location');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Update region when initial coords change
  useEffect(() => {
    if (initialCoords) {
      setRegion(prev => ({
        ...prev,
        latitude: initialCoords.latitude,
        longitude: initialCoords.longitude,
      }));
    }
  }, [initialCoords?.latitude, initialCoords?.longitude]);

  // Reverse geocode when region changes
  const handleRegionChange = useCallback(async (newRegion: Region) => {
    setRegion(newRegion);
    setIsGeocoding(true);
    try {
      const [geo] = await ExpoLocation.reverseGeocodeAsync({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });
      if (geo) {
        const parts = [geo.name, geo.street, geo.city].filter(Boolean);
        setAddressText(parts.join(', ') || 'Unknown location');
      }
    } catch {
      setAddressText('Location selected');
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(
      { latitude: region.latitude, longitude: region.longitude },
      addressText
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: tc.background }]}>
        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation
          showsMyLocationButton={false}
        />

        {/* Center Pin (fixed in center of map) */}
        <View style={styles.pinContainer} pointerEvents="none">
          <View style={[styles.pin, { backgroundColor: tc.primary }]}>
            <Location size={20} color="#FFFFFF" variant="Bold" />
          </View>
          <View style={[styles.pinShadow, { backgroundColor: tc.primary + '30' }]} />
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: tc.bgElevated, top: 50 }]}
          onPress={onClose}
        >
          <CloseCircle size={24} color={tc.textPrimary} />
        </TouchableOpacity>

        {/* Address Bar */}
        <View style={[styles.addressBar, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <Location size={18} color={tc.primary} variant="Bold" />
          <View style={styles.addressContent}>
            {isGeocoding ? (
              <ActivityIndicator size="small" color={tc.primary} />
            ) : (
              <Text style={[styles.addressText, { color: tc.textPrimary }]} numberOfLines={1}>
                {addressText}
              </Text>
            )}
            <Text style={[styles.addressHint, { color: tc.textTertiary }]}>
              Drag the map to adjust the pin
            </Text>
          </View>
        </View>

        {/* Confirm Button */}
        <View style={[styles.footer, { backgroundColor: tc.background }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: tc.primary }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>Set Activity Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -42,
    alignItems: 'center',
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  pinShadow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginTop: -4,
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  addressBar: {
    position: 'absolute',
    top: 100,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addressHint: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
