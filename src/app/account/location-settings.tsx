/**
 * LOCATION SETTINGS SCREEN
 * 
 * Allows users to set their location via GPS detection or manual city search.
 * Updates the profile with city, country, location_name, and coordinates.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Location, Gps, SearchNormal1, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as ExpoLocation from 'expo-location';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profile.service';

interface LocationResult {
  city: string;
  country: string;
  region?: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const { profile, refreshProfile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>(
    profile?.location_name || profile?.city || ''
  );
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Detect current location via GPS
  const detectLocation = useCallback(async () => {
    setIsDetecting(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable location permissions in your device settings to use GPS detection.');
        setIsDetecting(false);
        return;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const [geo] = await ExpoLocation.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geo) {
        const city = geo.city || geo.subregion || '';
        const country = geo.country || '';
        const region = geo.region || '';
        const displayName = [city, region, country].filter(Boolean).join(', ');

        await saveLocation({
          city,
          country,
          region,
          displayName,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        Alert.alert('Error', 'Could not determine your city from GPS coordinates. Try searching manually.');
      }
    } catch (err) {
      console.error('Location detection error:', err);
      Alert.alert('Error', 'Failed to detect location. Please try again or search manually.');
    } finally {
      setIsDetecting(false);
    }
  }, [profile?.id]);

  // Search for cities using reverse geocoding
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await ExpoLocation.geocodeAsync(query);
      
      const locationResults: LocationResult[] = [];
      for (const result of results.slice(0, 5)) {
        const [geo] = await ExpoLocation.reverseGeocodeAsync({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        if (geo) {
          const city = geo.city || geo.subregion || query;
          const country = geo.country || '';
          const region = geo.region || '';
          const displayName = [city, region, country].filter(Boolean).join(', ');
          
          // Avoid duplicates
          if (!locationResults.some(r => r.displayName === displayName)) {
            locationResults.push({
              city,
              country,
              region,
              displayName,
              latitude: result.latitude,
              longitude: result.longitude,
            });
          }
        }
      }
      
      setSearchResults(locationResults);
    } catch (err) {
      console.error('City search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchCities(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchCities]);

  // Save selected location to profile
  const saveLocation = async (location: LocationResult) => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const { error } = await profileService.updateProfile(profile.id, {
        city: location.city,
        country: location.country,
        location_name: location.displayName,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (error) {
        Alert.alert('Error', 'Failed to save location. Please try again.');
        return;
      }

      setCurrentLocation(location.displayName);
      await refreshProfile();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate back after short delay
      setTimeout(() => router.back(), 300);
    } catch (err) {
      console.error('Save location error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSearchResult = ({ item }: { item: LocationResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: tc.borderSubtle }]}
      onPress={() => saveLocation(item)}
      activeOpacity={0.7}
    >
      <Location size={20} color={tc.textSecondary} variant="Bold" />
      <View style={styles.resultTextContainer}>
        <Text style={[styles.resultCity, { color: tc.textPrimary }]}>{item.city}</Text>
        <Text style={[styles.resultCountry, { color: tc.textSecondary }]}>
          {[item.region, item.country].filter(Boolean).join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={[styles.backButton, { backgroundColor: tc.bgCard }]}
          >
            <ArrowLeft size={20} color={tc.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Set Location</Text>
          <View style={styles.backButton} />
        </View>

        {/* Current Location */}
        {currentLocation ? (
          <View style={[styles.currentLocationCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
            <View style={styles.currentLocationRow}>
              <TickCircle size={20} color={tc.success || '#4CAF50'} variant="Bold" />
              <View style={styles.currentLocationText}>
                <Text style={[styles.currentLabel, { color: tc.textSecondary }]}>Current Location</Text>
                <Text style={[styles.currentValue, { color: tc.textPrimary }]} numberOfLines={1}>
                  {currentLocation}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Detect GPS Button */}
        <TouchableOpacity
          style={[styles.detectButton, { backgroundColor: tc.primary }]}
          onPress={detectLocation}
          disabled={isDetecting || isSaving}
          activeOpacity={0.8}
        >
          {isDetecting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Gps size={20} color="#FFFFFF" variant="Bold" />
          )}
          <Text style={styles.detectButtonText}>
            {isDetecting ? 'Detecting...' : 'Use Current GPS Location'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderSubtle }]} />
          <Text style={[styles.dividerText, { color: tc.textSecondary }]}>or search</Text>
          <View style={[styles.dividerLine, { backgroundColor: tc.borderSubtle }]} />
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
          <SearchNormal1 size={20} color={tc.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            placeholder="Search for a city..."
            placeholderTextColor={tc.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={tc.primary} />
          ) : null}
        </View>

        {/* Search Results */}
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => `${item.displayName}-${index}`}
          renderItem={renderSearchResult}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searchQuery.length >= 2 && !isSearching ? (
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
                No results found for "{searchQuery}"
              </Text>
            ) : null
          }
        />

        {/* Saving overlay */}
        {isSaving ? (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="large" color={tc.primary} />
            <Text style={[styles.savingText, { color: tc.textPrimary }]}>Saving location...</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  currentLocationCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  currentLocationText: {
    flex: 1,
  },
  currentLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
  currentValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: borderRadius.full,
  },
  detectButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    height: '100%',
  },
  resultsList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultCity: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  resultCountry: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing.xl,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  savingText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
