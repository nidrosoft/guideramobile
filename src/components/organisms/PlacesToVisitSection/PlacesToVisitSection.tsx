/**
 * PLACES TO VISIT SECTION ORGANISM
 * 
 * Displays places to visit with category filters, map, and place cards
 * White container with rounded corners (24px)
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Linking } from 'react-native';
import { useState } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Location, Send2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

interface Place {
  id: string;
  name: string;
  description: string;
  image: string;
  distance: string;
  category: string;
  latitude: number;
  longitude: number;
}

interface PlacesToVisitSectionProps {
  places: Place[];
}

const categories = ['All', 'Hidden Gems', 'Interaction', 'Attractions', 'Restaurants'];

export default function PlacesToVisitSection({ places }: PlacesToVisitSectionProps) {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const handleCategoryPress = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
    setSelectedPlace(null);
  };

  const handleDirections = (place: Place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `https://maps.google.com/?q=${place.latitude},${place.longitude}`;
    Linking.openURL(url);
  };

  // Filter places based on selected category
  const filteredPlaces = selectedCategory === 'All' 
    ? places 
    : places.filter(place => place.category === selectedCategory);

  const currentPlace = selectedPlace || filteredPlaces[0];

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Place to Visit</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Discover amazing places around this location</Text>
      </View>
      
      {/* White Container Card */}
      <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.borderMedium }]}>
        {/* Category Filter Pills */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterPill,
                { backgroundColor: colors.gray100, borderColor: colors.borderMedium },
                selectedCategory === category && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                { color: colors.textSecondary },
                selectedCategory === category && { color: '#FFFFFF', fontWeight: '600' }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Interactive Map with Markers and Overlay Card */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: filteredPlaces[0]?.latitude || 48.8566,
              longitude: filteredPlaces[0]?.longitude || 2.3522,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {filteredPlaces.map((place, index) => (
              <Marker
                key={`${place.id}-${index}`}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                description={place.description}
              >
                <View style={styles.markerContainer}>
                  <Image 
                    source={{ uri: place.image }}
                    style={styles.markerImage}
                  />
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Place Card Overlay - Inside Map */}
          {currentPlace && (
            <View style={styles.placeCardOverlay}>
              <View style={[styles.placeCard, { backgroundColor: colors.bgElevated }]}>
                <Image 
                  source={{ uri: currentPlace.image }}
                  style={styles.placeImage}
                  resizeMode="cover"
                />
                <View style={styles.placeInfo}>
                  <View style={styles.placeHeader}>
                    <Text style={[styles.placeName, { color: colors.textPrimary }]} numberOfLines={1}>{currentPlace.name}</Text>
                    <View style={styles.distanceContainer}>
                      <Location size={12} color={colors.primary} variant="Bold" />
                      <Text style={[styles.distanceText, { color: colors.textSecondary }]}>{currentPlace.distance}</Text>
                    </View>
                  </View>
                  <Text style={[styles.placeDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {currentPlace.description}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.directionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleDirections(currentPlace)}
                >
                  <Send2 size={18} color="#FFFFFF" variant="Bold" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Place List - Horizontal scroll of all filtered places */}
        {filteredPlaces.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.placeListContent}
            style={styles.placeListScroll}
          >
            {filteredPlaces.map((place, index) => (
              <TouchableOpacity
                key={`${place.id}-card-${index}`}
                style={[
                  styles.placeListCard,
                  { backgroundColor: colors.background, borderColor: colors.borderMedium },
                  currentPlace?.id === place.id && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPlace(place);
                }}
                activeOpacity={0.8}
              >
                <Image source={{ uri: place.image }} style={styles.placeListImage} resizeMode="cover" />
                <View style={styles.placeListInfo}>
                  <Text style={[styles.placeListName, { color: colors.textPrimary }]} numberOfLines={1}>{place.name}</Text>
                  <Text style={[styles.placeListDesc, { color: colors.textSecondary }]} numberOfLines={1}>{place.description}</Text>
                  <View style={styles.placeListFooter}>
                    <View style={[styles.categoryBadge, { backgroundColor: `${colors.primary}20` }]}>
                      <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{place.category}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDirections(place)}>
                      <Send2 size={14} color={colors.primary} variant="Bold" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {filteredPlaces.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No {selectedCategory.toLowerCase()} found nearby</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
  },
  card: {
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  filterScroll: {
    marginHorizontal: -spacing.md,
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  mapContainer: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0F0F0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  placeCardOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  placeCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: spacing.sm,
  },
  placeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  placeName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
  },
  placeDescription: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  directionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  placeListScroll: {
    marginTop: spacing.md,
  },
  placeListContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  placeListCard: {
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  placeListImage: {
    width: '100%',
    height: 90,
  },
  placeListInfo: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  placeListName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  placeListDesc: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  placeListFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
  },
});
