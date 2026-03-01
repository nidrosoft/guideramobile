/**
 * PLACES TO VISIT SECTION ORGANISM
 * 
 * Displays places to visit with category filters, map, and place cards
 * White container with rounded corners (24px)
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useState } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, typography, spacing } from '@/styles';
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

const categories = ['All', 'Hidden Gems', 'Attractions', 'Restaurants'];

export default function PlacesToVisitSection({ places }: PlacesToVisitSectionProps) {
  const { colors: tc } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleCategoryPress = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  // Filter places based on selected category
  const filteredPlaces = selectedCategory === 'All' 
    ? places 
    : places.filter(place => place.category === selectedCategory);

  const currentPlace = filteredPlaces[0]; // Show first place for now

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Place to Visit</Text>
        <Text style={styles.sectionSubtitle}>Discover amazing places around this location</Text>
      </View>
      
      {/* White Container Card */}
      <View style={styles.card}>
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
                selectedCategory === category && styles.filterPillActive
              ]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                selectedCategory === category && styles.filterTextActive
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
            {filteredPlaces.map((place) => (
              <Marker
                key={place.id}
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
              <View style={styles.placeCard}>
                <Image 
                  source={{ uri: currentPlace.image }}
                  style={styles.placeImage}
                  resizeMode="cover"
                />
                <View style={styles.placeInfo}>
                  <View style={styles.placeHeader}>
                    <Text style={styles.placeName}>{currentPlace.name}</Text>
                    <View style={styles.distanceContainer}>
                      <Location size={12} color={colors.primary} variant="Bold" />
                      <Text style={styles.distanceText}>{currentPlace.distance}</Text>
                    </View>
                  </View>
                  <Text style={styles.placeDescription} numberOfLines={2}>
                    {currentPlace.description}
                  </Text>
                </View>
                <TouchableOpacity style={styles.directionButton}>
                  <Send2 size={18} color={colors.white} variant="Bold" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
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
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: spacing.md,
    shadowColor: colors.black,
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
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterPillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  mapContainer: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.gray50,
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
    borderColor: colors.white,
    shadowColor: colors.black,
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
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: spacing.sm,
    shadowColor: colors.black,
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
    color: colors.textPrimary,
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  placeDescription: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  directionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
