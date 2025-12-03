/**
 * EXPERIENCE RESULTS STEP
 * 
 * Browse and filter available experiences.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import {
  Star1,
  Clock,
  People,
  Heart,
  Filter,
  Sort,
  CloseCircle,
  TickCircle,
  Location,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { Experience, ExperienceCategory, EXPERIENCE_CATEGORY_LABELS } from '../../../types/experience.types';

interface ResultsStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Generate mock experiences
const generateMockExperiences = (destination: string): Experience[] => {
  const experiences: Experience[] = [
    {
      id: '1',
      title: `Skip-the-Line ${destination} Museum Tour`,
      description: 'Explore the world-famous museum with an expert guide who will bring art and history to life.',
      shortDescription: 'Expert-guided museum tour with priority access',
      images: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
      category: 'tours',
      duration: 180,
      location: {
        city: destination,
        country: 'France',
        meetingPoint: {
          name: 'Museum Entrance',
          address: '1 Museum Plaza',
          instructions: 'Look for guide with red umbrella',
          coordinates: { lat: 48.8606, lng: 2.3376 },
        },
        coordinates: { lat: 48.8606, lng: 2.3376 },
      },
      host: {
        id: 'h1',
        name: 'Marie L.',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        bio: 'Art historian with 10+ years experience',
        rating: 4.9,
        reviewCount: 847,
        responseRate: 98,
        responseTime: 'within an hour',
        languages: ['English', 'French', 'Spanish'],
        verified: true,
        superHost: true,
        memberSince: new Date('2018-03-15'),
        totalExperiences: 12,
      },
      price: { amount: 65, currency: 'USD', formatted: '$65' },
      rating: 4.9,
      reviewCount: 2847,
      maxParticipants: 8,
      minParticipants: 1,
      includes: ['Skip-the-line entry', 'Professional guide', 'Headsets for groups 6+'],
      notIncluded: ['Hotel pickup', 'Gratuities'],
      requirements: ['Valid ID required'],
      whatToBring: ['Comfortable shoes', 'Camera'],
      accessibility: {
        wheelchairAccessible: true,
        mobilityAid: true,
        visualAid: false,
        hearingAid: true,
        serviceAnimals: true,
        infantFriendly: false,
        childFriendly: true,
        seniorFriendly: true,
        fitnessLevel: 'easy',
      },
      languages: ['English', 'French', 'Spanish'],
      availability: [],
      cancellationPolicy: 'free_24h',
      instantConfirmation: true,
      mobileTicket: true,
      featured: true,
      bestSeller: true,
      tags: ['skip-the-line', 'small-group', 'expert-guide'],
    },
    {
      id: '2',
      title: `${destination} Food Walking Tour`,
      description: 'Taste your way through the city with a local foodie guide. Sample authentic cuisine at hidden gems.',
      shortDescription: 'Culinary adventure with local tastings',
      images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
      category: 'food_drink',
      duration: 240,
      location: {
        city: destination,
        country: 'France',
        meetingPoint: {
          name: 'Central Market',
          address: 'Market Square',
          instructions: 'Meet at the fountain',
          coordinates: { lat: 48.8566, lng: 2.3522 },
        },
        coordinates: { lat: 48.8566, lng: 2.3522 },
      },
      host: {
        id: 'h2',
        name: 'Pierre D.',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        bio: 'Chef and food enthusiast',
        rating: 4.8,
        reviewCount: 523,
        responseRate: 95,
        responseTime: 'within 2 hours',
        languages: ['English', 'French'],
        verified: true,
        superHost: false,
        memberSince: new Date('2019-06-20'),
        totalExperiences: 5,
      },
      price: { amount: 89, currency: 'USD', formatted: '$89' },
      rating: 4.8,
      reviewCount: 1203,
      maxParticipants: 12,
      minParticipants: 2,
      includes: ['All food tastings', 'Local guide', 'Wine pairing'],
      notIncluded: ['Additional drinks', 'Tips'],
      requirements: ['No dietary restrictions that cannot be accommodated'],
      whatToBring: ['Empty stomach', 'Comfortable shoes'],
      accessibility: {
        wheelchairAccessible: false,
        mobilityAid: false,
        visualAid: false,
        hearingAid: false,
        serviceAnimals: true,
        infantFriendly: false,
        childFriendly: true,
        seniorFriendly: true,
        fitnessLevel: 'moderate',
      },
      languages: ['English', 'French'],
      availability: [],
      cancellationPolicy: 'free_48h',
      instantConfirmation: true,
      mobileTicket: true,
      featured: false,
      bestSeller: true,
      tags: ['food-tour', 'local-experience', 'tastings'],
    },
    {
      id: '3',
      title: `${destination} Bike Tour`,
      description: 'Discover the city on two wheels. Cycle through charming neighborhoods and iconic landmarks.',
      shortDescription: 'Scenic cycling adventure through the city',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
      category: 'adventure',
      duration: 180,
      location: {
        city: destination,
        country: 'France',
        meetingPoint: {
          name: 'Bike Shop',
          address: '15 River Street',
          instructions: 'Shop with blue awning',
          coordinates: { lat: 48.8584, lng: 2.2945 },
        },
        coordinates: { lat: 48.8584, lng: 2.2945 },
      },
      host: {
        id: 'h3',
        name: 'Lucas M.',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        bio: 'Cycling enthusiast and city expert',
        rating: 4.7,
        reviewCount: 312,
        responseRate: 92,
        responseTime: 'within 3 hours',
        languages: ['English', 'French', 'German'],
        verified: true,
        superHost: false,
        memberSince: new Date('2020-02-10'),
        totalExperiences: 3,
      },
      price: { amount: 45, currency: 'USD', formatted: '$45' },
      rating: 4.7,
      reviewCount: 892,
      maxParticipants: 15,
      minParticipants: 2,
      includes: ['Bike rental', 'Helmet', 'Guide', 'Water bottle'],
      notIncluded: ['Snacks', 'Tips'],
      requirements: ['Must know how to ride a bike'],
      whatToBring: ['Sunscreen', 'Comfortable clothing'],
      accessibility: {
        wheelchairAccessible: false,
        mobilityAid: false,
        visualAid: false,
        hearingAid: false,
        serviceAnimals: false,
        infantFriendly: false,
        childFriendly: true,
        seniorFriendly: false,
        fitnessLevel: 'moderate',
      },
      languages: ['English', 'French', 'German'],
      availability: [],
      cancellationPolicy: 'free_24h',
      instantConfirmation: true,
      mobileTicket: true,
      featured: false,
      bestSeller: false,
      tags: ['bike-tour', 'outdoor', 'active'],
    },
    {
      id: '4',
      title: `${destination} Night Photography Walk`,
      description: 'Capture the city lights with a professional photographer. Learn night photography techniques.',
      shortDescription: 'Evening photo tour with pro tips',
      images: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'],
      category: 'classes_workshops',
      duration: 150,
      location: {
        city: destination,
        country: 'France',
        meetingPoint: {
          name: 'Tower Base',
          address: 'Tower Gardens',
          instructions: 'Near the ticket booth',
          coordinates: { lat: 48.8584, lng: 2.2945 },
        },
        coordinates: { lat: 48.8584, lng: 2.2945 },
      },
      host: {
        id: 'h4',
        name: 'Sophie B.',
        avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
        bio: 'Professional photographer',
        rating: 4.9,
        reviewCount: 156,
        responseRate: 99,
        responseTime: 'within an hour',
        languages: ['English', 'French'],
        verified: true,
        superHost: true,
        memberSince: new Date('2019-09-05'),
        totalExperiences: 4,
      },
      price: { amount: 75, currency: 'USD', formatted: '$75' },
      rating: 4.9,
      reviewCount: 456,
      maxParticipants: 6,
      minParticipants: 1,
      includes: ['Photography tips', 'Edited photos', 'Tripod rental'],
      notIncluded: ['Camera', 'Transportation'],
      requirements: ['Bring your own camera or smartphone'],
      whatToBring: ['Camera', 'Warm clothing', 'Tripod (optional)'],
      accessibility: {
        wheelchairAccessible: true,
        mobilityAid: true,
        visualAid: false,
        hearingAid: true,
        serviceAnimals: true,
        infantFriendly: false,
        childFriendly: true,
        seniorFriendly: true,
        fitnessLevel: 'easy',
      },
      languages: ['English', 'French'],
      availability: [],
      cancellationPolicy: 'free_24h',
      instantConfirmation: true,
      mobileTicket: true,
      featured: true,
      bestSeller: false,
      tags: ['photography', 'night-tour', 'workshop'],
    },
    {
      id: '5',
      title: `${destination} River Cruise`,
      description: 'Glide along the river and see the city from a unique perspective. Includes audio guide.',
      shortDescription: 'Scenic boat tour with commentary',
      images: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
      category: 'tours',
      duration: 60,
      location: {
        city: destination,
        country: 'France',
        meetingPoint: {
          name: 'River Dock',
          address: 'Dock 7, Riverside',
          instructions: 'Look for the blue boat',
          coordinates: { lat: 48.8566, lng: 2.3522 },
        },
        coordinates: { lat: 48.8566, lng: 2.3522 },
      },
      host: {
        id: 'h5',
        name: 'River Tours Co.',
        avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
        bio: 'Premier river cruise operator',
        rating: 4.6,
        reviewCount: 2341,
        responseRate: 90,
        responseTime: 'within 4 hours',
        languages: ['English', 'French', 'Spanish', 'German', 'Italian'],
        verified: true,
        superHost: false,
        memberSince: new Date('2015-01-01'),
        totalExperiences: 8,
      },
      price: { amount: 25, currency: 'USD', formatted: '$25' },
      rating: 4.6,
      reviewCount: 5678,
      maxParticipants: 150,
      minParticipants: 1,
      includes: ['Boat ride', 'Audio guide in 10 languages'],
      notIncluded: ['Food', 'Drinks'],
      requirements: [],
      whatToBring: ['Camera', 'Jacket (can be breezy)'],
      accessibility: {
        wheelchairAccessible: true,
        mobilityAid: true,
        visualAid: true,
        hearingAid: true,
        serviceAnimals: true,
        infantFriendly: true,
        childFriendly: true,
        seniorFriendly: true,
        fitnessLevel: 'easy',
      },
      languages: ['English', 'French', 'Spanish', 'German', 'Italian'],
      availability: [],
      cancellationPolicy: 'free_24h',
      instantConfirmation: true,
      mobileTicket: true,
      featured: false,
      bestSeller: true,
      tags: ['river-cruise', 'sightseeing', 'family-friendly'],
    },
  ];
  
  return experiences;
};

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'duration', label: 'Duration' },
  { id: 'popularity', label: 'Most Popular' },
];

export default function ResultsStep({ onNext, onBack, onClose }: ResultsStepProps) {
  const insets = useSafeAreaInsets();
  const {
    searchParams,
    results,
    setResults,
    sortBy,
    setSortBy,
    filters,
    setFilters,
    selectExperience,
    getFilteredResults,
  } = useExperienceStore();
  
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    // Generate mock results based on destination
    const destination = searchParams.destination?.name || 'Paris';
    const mockResults = generateMockExperiences(destination);
    setResults(mockResults);
  }, [searchParams.destination]);
  
  const filteredResults = getFilteredResults();
  
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };
  
  const toggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const handleExperienceSelect = (experience: Experience) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectExperience(experience);
    onNext();
  };
  
  const renderExperienceCard = ({ item, index }: { item: Experience; index: number }) => (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
      <TouchableOpacity
        style={styles.experienceCard}
        onPress={() => handleExperienceSelect(item)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.images[0] }} style={styles.experienceImage} />
          
          {/* Badges */}
          <View style={styles.badgeContainer}>
            {item.bestSeller && (
              <View style={[styles.badge, styles.bestSellerBadge]}>
                <Text style={styles.badgeText}>Best Seller</Text>
              </View>
            )}
            {item.featured && !item.bestSeller && (
              <View style={[styles.badge, styles.featuredBadge]}>
                <Text style={styles.badgeText}>Featured</Text>
              </View>
            )}
          </View>
          
          {/* Favorite */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Heart
              size={22}
              color={favorites.has(item.id) ? colors.error : colors.white}
              variant={favorites.has(item.id) ? 'Bold' : 'Linear'}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardContent}>
          {/* Rating */}
          <View style={styles.ratingRow}>
            <Star1 size={14} color={colors.warning} variant="Bold" />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount.toLocaleString()})</Text>
          </View>
          
          {/* Title */}
          <Text style={styles.experienceTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          {/* Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.infoText}>{formatDuration(item.duration)}</Text>
            </View>
            <View style={styles.infoItem}>
              <People size={14} color={colors.textSecondary} />
              <Text style={styles.infoText}>Max {item.maxParticipants}</Text>
            </View>
          </View>
          
          {/* Features */}
          <View style={styles.featuresRow}>
            {item.instantConfirmation && (
              <View style={styles.featureTag}>
                <TickCircle size={12} color={colors.success} variant="Bold" />
                <Text style={styles.featureText}>Instant confirm</Text>
              </View>
            )}
            {item.cancellationPolicy.startsWith('free') && (
              <View style={styles.featureTag}>
                <Text style={styles.featureText}>Free cancellation</Text>
              </View>
            )}
          </View>
          
          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.priceValue}>{item.price.formatted}</Text>
            <Text style={styles.priceUnit}>/person</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
  
  return (
    <View style={styles.container}>
      {/* Header Info */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.headerInfo}>
        <View style={styles.locationInfo}>
          <Location size={16} color={colors.primary} />
          <Text style={styles.locationText}>
            {searchParams.destination?.name || 'Paris'}
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.dateText}>
            {searchParams.date
              ? new Date(searchParams.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Any date'}
          </Text>
        </View>
        <Text style={styles.resultCount}>
          {filteredResults.length} experiences found
        </Text>
      </Animated.View>
      
      {/* Filter/Sort Bar */}
      <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <Sort size={18} color={colors.textPrimary} />
          <Text style={styles.filterButtonText}>Sort</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={18} color={colors.textPrimary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Results List */}
      <FlatList
        data={filteredResults}
        keyExtractor={(item) => item.id}
        renderItem={renderExperienceCard}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sortSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <CloseCircle size={24} color={colors.gray400} />
              </TouchableOpacity>
            </View>
            
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.sortOption}
                onPress={() => {
                  setSortBy(option.id as any);
                  setShowSortModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.id && styles.sortOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.id && (
                  <TickCircle size={20} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <CloseCircle size={28} color={colors.gray400} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterContent}>
            {/* Free Cancellation */}
            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Free Cancellation</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    filters.freeCancellation && styles.toggleButtonActive,
                  ]}
                  onPress={() => setFilters({ freeCancellation: !filters.freeCancellation })}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      filters.freeCancellation && styles.toggleKnobActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Instant Confirmation */}
            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Instant Confirmation</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    filters.instantConfirmation && styles.toggleButtonActive,
                  ]}
                  onPress={() => setFilters({ instantConfirmation: !filters.instantConfirmation })}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      filters.instantConfirmation && styles.toggleKnobActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Rating */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingOptions}>
                {[4.5, 4.0, 3.5, null].map((rating) => (
                  <TouchableOpacity
                    key={rating?.toString() || 'any'}
                    style={[
                      styles.ratingOption,
                      filters.rating === rating && styles.ratingOptionSelected,
                    ]}
                    onPress={() => setFilters({ rating })}
                  >
                    {rating ? (
                      <>
                        <Star1 size={14} color={filters.rating === rating ? colors.white : colors.warning} variant="Bold" />
                        <Text
                          style={[
                            styles.ratingOptionText,
                            filters.rating === rating && styles.ratingOptionTextSelected,
                          ]}
                        >
                          {rating}+
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={[
                          styles.ratingOptionText,
                          filters.rating === rating && styles.ratingOptionTextSelected,
                        ]}
                      >
                        Any
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={[styles.filterFooter, { paddingBottom: insets.bottom + spacing.md }]}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setFilters({
                  freeCancellation: false,
                  instantConfirmation: false,
                  rating: null,
                });
              }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Show Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  headerInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  dotSeparator: {
    marginHorizontal: spacing.sm,
    color: colors.gray400,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  resultCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  
  listContent: { padding: spacing.lg },
  
  experienceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  imageContainer: { position: 'relative' },
  experienceImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  bestSellerBadge: { backgroundColor: colors.warning },
  featuredBadge: { backgroundColor: colors.primary },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cardContent: { padding: spacing.md },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  experienceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  featureText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginRight: 4,
  },
  priceValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  
  // Sort Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sortOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  sortOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Filter Modal
  filterModalContainer: { flex: 1, backgroundColor: colors.background },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filterModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  filterContent: { flex: 1 },
  filterSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  filterSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray200,
    padding: 2,
  },
  toggleButtonActive: { backgroundColor: colors.primary },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleKnobActive: { marginLeft: 22 },
  ratingOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
  },
  ratingOptionSelected: { backgroundColor: colors.primary },
  ratingOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  ratingOptionTextSelected: { color: colors.white },
  filterFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  clearButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
