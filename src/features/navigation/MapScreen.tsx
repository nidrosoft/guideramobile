/**
 * MAP SCREEN
 *
 * Unified navigation screen with 4 modes:
 * - City: Outdoor turn-by-turn with Mapbox 3D, voice guidance, auto-reroute
 * - Airport: Indoor wayfinding (Mappedin — coming soon, needs API key)
 * - Landmarks: POI search with category filters + navigate-to
 * - General: Free explore map
 *
 * Replaces the old AR camera + sidebar for all navigation features.
 * Part of the Connect feature (formerly Community).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, SearchNormal1, Location, Map1, Airplane, Building } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius as br } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { mapboxService, MapboxPlace } from '@/features/ar-navigation/services/mapbox.service';

import OutdoorMap from './components/OutdoorMap';
import TurnBanner from './components/TurnBanner';
import NavigationHUD from './components/NavigationHUD';
import { useOutdoorNavigation } from './hooks/useOutdoorNavigation';
import { useLandmarkSearch, POICategory } from './hooks/useLandmarkSearch';

export type MapMode = 'city' | 'airport' | 'landmarks';

const MODE_TABS: { id: MapMode; label: string; icon: any }[] = [
  { id: 'city', label: 'City', icon: Map1 },
  { id: 'airport', label: 'Airport', icon: Airplane },
  { id: 'landmarks', label: 'Landmarks', icon: Building },
];

const LANDMARK_CATEGORIES: { id: POICategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'culture', label: 'Culture' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'transport', label: 'Transport' },
  { id: 'shopping', label: 'Shopping' },
];

interface MapScreenProps {
  initialMode?: MapMode;
  onClose: () => void;
}

export default function MapScreen({ initialMode = 'city', onClose }: MapScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const [mode, setMode] = useState<MapMode>(initialMode);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<MapboxPlace[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<MapboxPlace | null>(null);

  const nav = useOutdoorNavigation();
  const landmarks = useLandmarkSearch();

  // Auto-load POIs when location is available
  const [poisLoaded, setPoisLoaded] = React.useState(false);
  React.useEffect(() => {
    if (!nav.userLocation) return;
    if (poisLoaded && mode !== 'landmarks') return; // only auto-load once for city, always reload for landmarks
    if (__DEV__) console.log('📍 MapScreen: Loading POIs for mode:', mode, 'location:', nav.userLocation.latitude.toFixed(4), nav.userLocation.longitude.toFixed(4));
    landmarks.searchNearby(nav.userLocation.latitude, nav.userLocation.longitude, mode === 'landmarks' ? landmarks.activeCategory : 'all');
    if (mode !== 'landmarks') setPoisLoaded(true);
  }, [nav.userLocation, mode, landmarks.activeCategory]);

  // Load landmarks when switching to landmarks mode
  const handleModeChange = useCallback((newMode: MapMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(newMode);
    if (newMode === 'landmarks' && nav.userLocation) {
      landmarks.searchNearby(nav.userLocation.latitude, nav.userLocation.longitude);
    }
  }, [nav.userLocation, landmarks]);

  // Search for a destination
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || !nav.userLocation) return;
    setSearchLoading(true);
    try {
      const results = await mapboxService.geocode(query, {
        lat: nav.userLocation.latitude,
        lng: nav.userLocation.longitude,
      });
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [nav.userLocation]);

  // Start navigation to a place
  const handleNavigateToPlace = useCallback((place: MapboxPlace) => {
    setShowSearch(false);
    setSelectedPlace(null);
    setSearchResults([]);
    setSearchText('');
    nav.startNavigation(
      { latitude: place.coordinates.latitude, longitude: place.coordinates.longitude, name: place.name },
      nav.profile
    );
  }, [nav]);

  // Handle landmark tap
  const handleLandmarkPress = useCallback((place: MapboxPlace) => {
    setSelectedPlace(place);
  }, []);

  // Handle landmark category change
  const handleCategoryChange = useCallback((cat: POICategory) => {
    if (!nav.userLocation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    landmarks.searchNearby(nav.userLocation.latitude, nav.userLocation.longitude, cat);
  }, [nav.userLocation, landmarks]);

  return (
    <View style={[styles.container, { backgroundColor: '#0a0a0a' }]}>
      {/* Map */}
      <OutdoorMap
        userLocation={nav.userLocation}
        routeCoordinates={nav.routeCoordinates}
        isNavigating={nav.isNavigating}
        landmarks={mode === 'landmarks' || mode === 'city' ? landmarks.places : []}
        onLandmarkPress={handleLandmarkPress}
      />

      {/* Turn-by-turn banner (when navigating) */}
      <TurnBanner
        instruction={nav.nextInstruction}
        distanceToNext={nav.route?.steps[nav.currentStepIndex]?.distance}
        visible={nav.isNavigating}
      />

      {/* Top bar: back + mode tabs (hidden during navigation) */}
      {!nav.isNavigating && (
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: tc.bgElevated }]} onPress={onClose}>
            <ArrowLeft size={22} color={tc.textPrimary} />
          </TouchableOpacity>

          <View style={[styles.modeRow, { backgroundColor: tc.bgElevated }]}>
            {MODE_TABS.map(tab => {
              const isActive = mode === tab.id;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.modeTab, isActive && { backgroundColor: tc.primary }]}
                  onPress={() => handleModeChange(tab.id)}
                >
                  <Icon size={16} color={isActive ? '#FFFFFF' : tc.textSecondary} variant="Bold" />
                  <Text style={[styles.modeLabel, { color: isActive ? '#FFFFFF' : tc.textSecondary }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Search bar (city + landmarks modes, hidden during navigation) */}
      {!nav.isNavigating && mode !== 'airport' && (
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, top: insets.top + 70 }]}
          onPress={() => setShowSearch(true)}
        >
          <SearchNormal1 size={18} color={tc.textTertiary} />
          <Text style={[styles.searchPlaceholder, { color: tc.textTertiary }]}>
            {mode === 'landmarks' ? 'Search landmarks...' : 'Where do you want to go?'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Landmark category chips */}
      {!nav.isNavigating && mode === 'landmarks' && (
        <View style={[styles.categoryRow, { top: insets.top + 120 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {LANDMARK_CATEGORIES.map(cat => {
              const isActive = landmarks.activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, { backgroundColor: isActive ? tc.primary : tc.bgElevated, borderColor: isActive ? tc.primary : tc.borderSubtle }]}
                  onPress={() => handleCategoryChange(cat.id)}
                >
                  <Text style={[styles.categoryText, { color: isActive ? '#FFFFFF' : tc.textSecondary }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Airport mode placeholder */}
      {mode === 'airport' && !nav.isNavigating && (
        <View style={styles.airportPlaceholder}>
          <View style={[styles.airportCard, { backgroundColor: tc.bgElevated }]}>
            <Airplane size={32} color={tc.primary} variant="Bold" />
            <Text style={[styles.airportTitle, { color: tc.textPrimary }]}>Airport Navigation</Text>
            <Text style={[styles.airportSub, { color: tc.textSecondary }]}>
              Indoor airport wayfinding with Mappedin is coming soon.{'\n'}Scan your boarding pass to navigate to your gate.
            </Text>
          </View>
        </View>
      )}

      {/* Selected landmark bottom sheet */}
      {selectedPlace && !nav.isNavigating && (
        <View style={[styles.placeSheet, { backgroundColor: tc.bgElevated }]}>
          <View style={styles.placeHeader}>
            <View style={[styles.placeIcon, { backgroundColor: tc.primary + '15' }]}>
              <Location size={20} color={tc.primary} variant="Bold" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.placeName, { color: tc.textPrimary }]} numberOfLines={1}>{selectedPlace.name}</Text>
              <Text style={[styles.placeAddr, { color: tc.textSecondary }]} numberOfLines={1}>{selectedPlace.address}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPlace(null)}>
              <Text style={{ color: tc.textTertiary, fontSize: 18 }}>x</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.navigateBtn, { backgroundColor: tc.primary }]}
            onPress={() => handleNavigateToPlace(selectedPlace)}
          >
            <Text style={styles.navigateBtnText}>Navigate Here</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation HUD (when navigating) */}
      {nav.isNavigating && nav.destination && (
        <NavigationHUD
          distanceRemaining={nav.distanceRemaining}
          durationRemaining={nav.durationRemaining}
          destinationName={nav.destination.name}
          profile={nav.profile}
          voiceEnabled={nav.voiceEnabled}
          onChangeProfile={nav.setProfile}
          onToggleVoice={nav.toggleVoice}
          onStop={nav.stopNavigation}
        />
      )}

      {/* Loading overlay */}
      {nav.isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={tc.primary} />
          <Text style={{ color: '#FFFFFF', marginTop: 8 }}>Calculating route...</Text>
        </View>
      )}

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" transparent>
        <View style={[styles.searchModal, { backgroundColor: tc.background }]}>
          <View style={[styles.searchModalHeader, { paddingTop: insets.top + spacing.sm }]}>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchResults([]); setSearchText(''); }}>
              <ArrowLeft size={24} color={tc.textPrimary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.searchInput, { color: tc.textPrimary, backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
              placeholder="Search for a place..."
              placeholderTextColor={tc.textTertiary}
              value={searchText}
              onChangeText={(t) => { setSearchText(t); if (t.length > 2) handleSearch(t); }}
              autoFocus
            />
          </View>
          {searchLoading && <ActivityIndicator size="small" color={tc.primary} style={{ marginTop: spacing.lg }} />}
          <ScrollView style={styles.searchResultsList}>
            {searchResults.map(place => (
              <TouchableOpacity
                key={place.id}
                style={[styles.searchResultItem, { borderBottomColor: tc.borderSubtle }]}
                onPress={() => handleNavigateToPlace(place)}
              >
                <Location size={18} color={tc.textTertiary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchResultName, { color: tc.textPrimary }]}>{place.name}</Text>
                  <Text style={[styles.searchResultAddr, { color: tc.textSecondary }]} numberOfLines={1}>{place.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  modeRow: {
    flex: 1, flexDirection: 'row', borderRadius: br.full, padding: 3, gap: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: br.full, gap: 4,
  },
  modeLabel: { fontSize: 13, fontWeight: '600' },
  // Search
  searchBar: {
    position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 40,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, height: 44, borderRadius: br.md, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  searchPlaceholder: { fontSize: 14 },
  // Categories
  categoryRow: { position: 'absolute', left: 0, right: 0, zIndex: 35 },
  categoryScroll: { paddingHorizontal: spacing.md, gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: br.full, borderWidth: 1 },
  categoryText: { fontSize: 12, fontWeight: '600' },
  // Airport placeholder
  airportPlaceholder: {
    position: 'absolute', bottom: 100, left: spacing.lg, right: spacing.lg, zIndex: 30,
  },
  airportCard: {
    padding: spacing.xl, borderRadius: 20, alignItems: 'center', gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  airportTitle: { fontSize: 18, fontWeight: '700' },
  airportSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  // Place sheet
  placeSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 80,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  placeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  placeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  placeName: { fontSize: 16, fontWeight: '700' },
  placeAddr: { fontSize: 13, marginTop: 2 },
  navigateBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  navigateBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 200,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  // Search modal
  searchModal: { flex: 1 },
  searchModalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  searchInput: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: spacing.md, fontSize: 15,
  },
  searchResultsList: { paddingHorizontal: spacing.lg },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  searchResultName: { fontSize: 15, fontWeight: '600' },
  searchResultAddr: { fontSize: 12, marginTop: 2 },
});
