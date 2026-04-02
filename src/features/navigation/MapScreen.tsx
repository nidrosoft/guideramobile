/**
 * MAP SCREEN
 *
 * Unified navigation screen with 3 modes:
 * - City: Outdoor turn-by-turn with Mapbox 3D, voice guidance, auto-reroute
 * - Airport: Redirects to AI Vision Live Mode for camera-based wayfinding
 * - Landmarks: POI search with category filters
 *
 * Clean unified header: mode tabs + search + category filters in one panel.
 * Rich bottom sheet shows place photos, ratings, price level, open status.
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
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft2,
  SearchNormal1,
  Location,
  Map1,
  Airplane,
  Building,
  Star1,
  Clock,
  CloseCircle,
  Camera,
  Routing,
  Reserve,
  Gallery,
  Hospital,
  Bus,
  Bag2,
  Category,
} from 'iconsax-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius as br, colors, typography } from '@/styles';
import { shadows } from '@/styles/shadows';
import { useTheme } from '@/context/ThemeContext';
import { mapboxService, MapboxPlace } from '@/features/ar-navigation/services/mapbox.service';

import OutdoorMap from './components/OutdoorMap';
import TurnBanner from './components/TurnBanner';
import NavigationHUD from './components/NavigationHUD';
import { useOutdoorNavigation } from './hooks/useOutdoorNavigation';
import {
  useLandmarkSearch,
  POICategory,
  EnrichedPlace,
} from './hooks/useLandmarkSearch';

export type MapMode = 'city' | 'airport' | 'landmarks';

const MODE_TABS: { id: MapMode; label: string; icon: any }[] = [
  { id: 'city', label: 'City', icon: Map1 },
  { id: 'airport', label: 'Airport', icon: Airplane },
  { id: 'landmarks', label: 'Landmarks', icon: Building },
];

const LANDMARK_CATEGORIES: { id: POICategory; label: string; icon: any }[] = [
  { id: 'all', label: 'All', icon: Category },
  { id: 'food', label: 'Food', icon: Reserve },
  { id: 'culture', label: 'Culture', icon: Gallery },
  { id: 'emergency', label: 'Emergency', icon: Hospital },
  { id: 'transport', label: 'Transport', icon: Bus },
  { id: 'shopping', label: 'Shopping', icon: Bag2 },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MapScreenProps {
  initialMode?: MapMode;
  onClose: () => void;
  onOpenAIVision?: () => void;
}

export default function MapScreen({ initialMode = 'city', onClose, onOpenAIVision }: MapScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const [mode, setMode] = useState<MapMode>(initialMode);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<MapboxPlace[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<EnrichedPlace | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const nav = useOutdoorNavigation();
  const landmarks = useLandmarkSearch();

  // Auto-load POIs when location is available
  const [poisLoaded, setPoisLoaded] = React.useState(false);
  React.useEffect(() => {
    if (!nav.userLocation) return;
    if (poisLoaded && mode !== 'landmarks') return;
    if (__DEV__) console.log('📍 MapScreen: Loading POIs for mode:', mode);
    landmarks.searchNearby(nav.userLocation.latitude, nav.userLocation.longitude, mode === 'landmarks' ? landmarks.activeCategory : 'all');
    if (mode !== 'landmarks') setPoisLoaded(true);
  }, [nav.userLocation, mode, landmarks.activeCategory]);

  const handleModeChange = useCallback((newMode: MapMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(newMode);
    setSelectedPlace(null);
    setPhotoUrl(null);
    if (newMode === 'landmarks' && nav.userLocation) {
      landmarks.searchNearby(nav.userLocation.latitude, nav.userLocation.longitude);
    }
  }, [nav.userLocation, landmarks]);

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

  const handleNavigateToPlace = useCallback((place: MapboxPlace) => {
    setShowSearch(false);
    setSelectedPlace(null);
    setSearchResults([]);
    setSearchText('');
    setPhotoUrl(null);
    nav.startNavigation(
      { latitude: place.coordinates.latitude, longitude: place.coordinates.longitude, name: place.name },
      nav.profile
    );
  }, [nav]);

  const handleLandmarkPress = useCallback(async (place: MapboxPlace) => {
    const enriched = place as EnrichedPlace;
    setSelectedPlace(enriched);
    setPhotoUrl(null);

    if ((place as any).photoReference) {
      setPhotoLoading(true);
      try {
        const url = await mapboxService.getPlacePhotoUrl((place as any).photoReference, 600);
        setPhotoUrl(url);
      } catch {
        setPhotoUrl(null);
      } finally {
        setPhotoLoading(false);
      }
    }
  }, []);

  const handleCategoryChange = useCallback((cat: POICategory) => {
    if (!nav.userLocation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    landmarks.searchNearby(nav.userLocation.latitude, nav.userLocation.longitude, cat);
  }, [nav.userLocation, landmarks]);

  // Render star rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star1
          key={i}
          size={14}
          color={i < fullStars ? tc.warning : tc.borderSubtle}
          variant={i < fullStars ? 'Bold' : 'Linear'}
        />
      );
    }
    return stars;
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.bgSecondary }]}>
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

      {/* ═══ Unified Header Panel ═══ */}
      {!nav.isNavigating && (
        <View style={[styles.headerPanel, { marginTop: insets.top + 6, backgroundColor: tc.bgElevated }]}>
          {/* Row 1: Back + Mode Tabs */}
          <View style={styles.topRow}>
            <TouchableOpacity style={[styles.backBtn, { backgroundColor: tc.bgSecondary }]} onPress={onClose}>
              <ArrowLeft2 size={20} color={tc.textPrimary} />
            </TouchableOpacity>

            <View style={[styles.modeRow, { backgroundColor: tc.bgSecondary }]}>
              {MODE_TABS.map(tab => {
                const isActive = mode === tab.id;
                const Icon = tab.icon;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.modeTab, isActive && { backgroundColor: tc.primary }]}
                    onPress={() => handleModeChange(tab.id)}
                  >
                    <Icon size={15} color={isActive ? tc.white : tc.textSecondary} variant="Bold" />
                    <Text style={[styles.modeLabel, { color: isActive ? tc.white : tc.textSecondary }]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Row 2: Search Bar (city + landmarks only) */}
          {mode !== 'airport' && (
            <View style={styles.searchRow}>
              <TouchableOpacity
                style={[styles.searchBar, { backgroundColor: tc.bgSecondary, borderColor: tc.borderSubtle }]}
                onPress={() => setShowSearch(true)}
              >
                <SearchNormal1 size={16} color={tc.textTertiary} />
                <Text style={[styles.searchPlaceholder, { color: tc.textTertiary }]}>
                  {mode === 'landmarks' ? 'Search landmarks...' : 'Where do you want to go?'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Row 3: Category chips (landmarks mode only) */}
          {mode === 'landmarks' && (
            <View style={styles.categoryDivider}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {LANDMARK_CATEGORIES.map(cat => {
                  const isActive = landmarks.activeCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, {
                        backgroundColor: isActive ? tc.primary : 'transparent',
                        borderColor: isActive ? tc.primary : tc.borderSubtle,
                      }]}
                      onPress={() => handleCategoryChange(cat.id)}
                    >
                      <cat.icon size={13} color={isActive ? tc.white : tc.textSecondary} variant="Bold" />
                      <Text style={[styles.categoryText, { color: isActive ? tc.white : tc.textSecondary }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Airport mode — redirect to Live Camera */}
      {mode === 'airport' && !nav.isNavigating && (
        <View style={styles.airportPlaceholder}>
          <View style={[styles.airportCard, { backgroundColor: tc.bgElevated }]}>
            <View style={[styles.airportIconWrap, { backgroundColor: tc.primary + '15' }]}>
              <Airplane size={36} color={tc.primary} variant="Bold" />
            </View>
            <Text style={[styles.airportTitle, { color: tc.textPrimary }]}>Airport Wayfinding</Text>
            <Text style={[styles.airportSub, { color: tc.textSecondary }]}>
              Navigate terminals, find gates, and explore amenities using AI-powered camera guidance.
            </Text>
            <TouchableOpacity
              style={[styles.launchLiveBtn, { backgroundColor: tc.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onOpenAIVision?.();
              }}
              activeOpacity={0.8}
            >
              <Camera size={20} color="#FFF" variant="Bold" />
              <Text style={styles.launchLiveBtnText}>Launch Live Camera</Text>
            </TouchableOpacity>
            <Text style={[styles.airportHint, { color: tc.textTertiary }]}>
              Point your camera at signs, gates, or shops for instant guidance
            </Text>
          </View>
        </View>
      )}

      {/* Selected landmark bottom sheet — ENRICHED */}
      {selectedPlace && !nav.isNavigating && (
        <View style={[styles.placeSheet, { backgroundColor: tc.bgElevated }]}>
          {/* Close button */}
          <TouchableOpacity style={styles.sheetClose} onPress={() => { setSelectedPlace(null); setPhotoUrl(null); }}>
            <CloseCircle size={24} color={tc.textTertiary} variant="Bold" />
          </TouchableOpacity>

          {/* Handle bar */}
          <View style={styles.sheetHandle}>
            <View style={[styles.handleBar, { backgroundColor: tc.borderSubtle }]} />
          </View>

          {/* Photo */}
          {(photoUrl || photoLoading) && (
            <View style={styles.photoContainer}>
              {photoLoading ? (
                <View style={[styles.photoPlaceholder, { backgroundColor: tc.bgSecondary }]}>
                  <ActivityIndicator size="small" color={tc.primary} />
                </View>
              ) : photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.placePhoto} resizeMode="cover" />
              ) : null}
            </View>
          )}

          {/* Place info */}
          <View style={styles.placeContent}>
            <View style={styles.placeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.placeName, { color: tc.textPrimary }]} numberOfLines={2}>{selectedPlace.name}</Text>
                <View style={styles.placeMetaRow}>
                  <Location size={13} color={tc.textTertiary} variant="Bold" />
                  <Text style={[styles.placeAddr, { color: tc.textSecondary }]} numberOfLines={1}>{selectedPlace.address}</Text>
                </View>
              </View>

              {/* Open/Closed badge */}
              {selectedPlace.isOpen !== undefined && (
                <View style={[styles.statusBadge, {
                  backgroundColor: selectedPlace.isOpen ? tc.successBg : tc.errorBg
                }]}>
                  <View style={[styles.statusDot, {
                    backgroundColor: selectedPlace.isOpen ? tc.success : tc.error
                  }]} />
                  <Text style={[styles.statusText, {
                    color: selectedPlace.isOpen ? tc.success : tc.error
                  }]}>
                    {selectedPlace.isOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats row: rating, price, category */}
            <View style={styles.statsRow}>
              {selectedPlace.rating && (
                <View style={styles.statItem}>
                  <View style={styles.starsRow}>
                    {renderStars(selectedPlace.rating)}
                  </View>
                  <Text style={[styles.statValue, { color: tc.textPrimary }]}>{selectedPlace.rating.toFixed(1)}</Text>
                  {selectedPlace.reviewCount && (
                    <Text style={[styles.statSub, { color: tc.textTertiary }]}>
                      ({selectedPlace.reviewCount > 999 ? `${(selectedPlace.reviewCount / 1000).toFixed(1)}k` : selectedPlace.reviewCount})
                    </Text>
                  )}
                </View>
              )}

              {selectedPlace.priceLevel !== undefined && selectedPlace.priceLevel > 0 && (
                <View style={[styles.priceBadge, { backgroundColor: tc.successBg }]}>
                  <Text style={[styles.priceLabel, { color: tc.success }]}>
                    {'$'.repeat(selectedPlace.priceLevel)}
                  </Text>
                </View>
              )}

              {selectedPlace.types && selectedPlace.types.length > 0 && (
                <View style={[styles.typeBadge, { backgroundColor: tc.primary + '12' }]}>
                  <Text style={[styles.typeLabel, { color: tc.primary }]}>
                    {(selectedPlace.types[0] || '').replace(/_/g, ' ')}
                  </Text>
                </View>
              )}
            </View>

            {/* Navigate button */}
            <TouchableOpacity
              style={styles.navigateBtn}
              onPress={() => handleNavigateToPlace(selectedPlace)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[tc.primary, tc.primaryDark || colors.primaryDark]}
                style={styles.navigateGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Routing size={20} color={tc.white} variant="Bold" />
                <Text style={[styles.navigateBtnText, { color: tc.white }]}>Navigate Here</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
          <Text style={{ color: tc.white, marginTop: 8 }}>Calculating route...</Text>
        </View>
      )}

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" transparent>
        <View style={[styles.searchModal, { backgroundColor: tc.background }]}>
          <View style={[styles.searchModalHeader, { paddingTop: insets.top + spacing.sm }]}>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchResults([]); setSearchText(''); }}>
              <ArrowLeft2 size={24} color={tc.textPrimary} />
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

  // ═══ Unified Header Panel — Single Card ═══
  headerPanel: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    marginHorizontal: spacing.md,
    borderRadius: br['2xl'],        // 28 — matches card.borderRadius
    paddingBottom: spacing.md,
    shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.sm, paddingTop: spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: br.md,   // 10 — matches iconContainer.borderRadius
    alignItems: 'center', justifyContent: 'center',
  },
  modeRow: {
    flex: 1, flexDirection: 'row', borderRadius: br.lg, padding: 3, gap: 3,  // 14 — matches card inner elements
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: br.md, gap: 4,   // 10 — matches input.borderRadius
  },
  modeLabel: { fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold },

  // Search bar — proper rounded input inside card
  searchRow: {
    paddingHorizontal: spacing.sm, paddingTop: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, height: 40, borderRadius: br.full, borderWidth: 1,  // fully rounded — matches home explorer search
  },
  searchPlaceholder: { fontSize: typography.fontSize.body },

  // Category chips inside card
  categoryDivider: {
    paddingTop: spacing.sm, paddingBottom: spacing.xs || 4,
  },
  categoryScroll: { gap: 6, paddingHorizontal: spacing.sm },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: br.full, borderWidth: 1,  // pills stay fully rounded
  },
  categoryText: { fontSize: 12, fontWeight: '600' as any },

  // Airport
  airportPlaceholder: {
    position: 'absolute', bottom: 100, left: spacing.lg, right: spacing.lg, zIndex: 30,
  },
  airportCard: {
    padding: spacing.xl, borderRadius: br['2xl'], alignItems: 'center', gap: spacing.sm,
    ...shadows.lg,
  },
  airportIconWrap: {
    width: 72, height: 72, borderRadius: br.full, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  airportTitle: { fontSize: typography.fontSize.heading2, fontWeight: typography.fontWeight.bold },
  airportSub: { fontSize: typography.fontSize.body, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  airportHint: { fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 15 },
  launchLiveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: br.lg,
    ...shadows.btnPrimary,
  },
  launchLiveBtnText: { fontSize: 15, fontWeight: '700' as any, color: colors.white },

  // Place sheet (enriched)
  placeSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 80,
    borderTopLeftRadius: br['2xl'], borderTopRightRadius: br['2xl'],
    ...shadows.lg,
  },
  sheetClose: {
    position: 'absolute', top: 12, right: 16, zIndex: 10, padding: 4,
  },
  sheetHandle: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handleBar: { width: 40, height: 4, borderRadius: br.sm },
  photoContainer: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: br.lg, overflow: 'hidden',
  },
  placePhoto: {
    width: '100%', height: 160, borderRadius: br.lg,
  },
  photoPlaceholder: {
    width: '100%', height: 120, borderRadius: br.lg, alignItems: 'center', justifyContent: 'center',
  },
  placeContent: {
    paddingHorizontal: spacing.lg, paddingBottom: 40,
  },
  placeHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.sm,
  },
  placeName: { fontSize: typography.fontSize.heading2, fontWeight: typography.fontWeight.bold, lineHeight: 24 },
  placeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  placeAddr: { fontSize: typography.fontSize.bodySm, flex: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: br.md,
  },
  statusDot: { width: 7, height: 7, borderRadius: br.sm },
  statusText: { fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.semibold },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md, flexWrap: 'wrap',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starsRow: { flexDirection: 'row', gap: 1 },
  statValue: { fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.bold },
  statSub: { fontSize: typography.fontSize.bodySm },
  priceBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: br.md,
  },
  priceLabel: { fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.bold },
  typeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: br.md,
  },
  typeLabel: { fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.semibold, textTransform: 'capitalize' },
  navigateBtn: {
    ...shadows.btnPrimary,
  },
  navigateGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: br.lg,
  },
  navigateBtnText: { fontSize: typography.fontSize.heading3, fontWeight: typography.fontWeight.bold },

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
    flex: 1, height: 44, borderRadius: br.md, borderWidth: 1,
    paddingHorizontal: spacing.md, fontSize: typography.fontSize.body,
  },
  searchResultsList: { paddingHorizontal: spacing.lg },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  searchResultName: { fontSize: typography.fontSize.heading3, fontWeight: typography.fontWeight.semibold },
  searchResultAddr: { fontSize: typography.fontSize.bodySm, marginTop: 2 },
});
