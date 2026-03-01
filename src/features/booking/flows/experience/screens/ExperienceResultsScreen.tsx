/**
 * EXPERIENCE RESULTS SCREEN
 * 
 * Browse and filter available experiences.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  CloseCircle,
  Star1,
  Clock,
  Filter,
  Sort,
  Heart,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { Experience } from '../../../types/experience.types';

// Import sheets
import ExperienceDetailSheet from '../sheets/ExperienceDetailSheet';

// Import shared
import { CancelBookingModal } from '../../shared';
import { ExperienceCard, ExperienceCardData } from '../../../shared/components';

interface ExperienceResultsScreenProps {
  onSelectExperience: (experience: Experience) => void;
  onBack: () => void;
  onClose: () => void;
}

// Mock experiences
const generateMockExperiences = (destination: string): Experience[] => [
  {
    id: '1',
    title: `Skip-the-Line ${destination} Museum Tour`,
    description: 'Explore the world-famous museum with an expert guide.',
    shortDescription: 'Expert-guided museum tour with priority access',
    images: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
    category: 'tours',
    duration: 180,
    location: {
      city: destination,
      country: 'France',
      meetingPoint: { name: 'Museum Entrance', address: '1 Museum Plaza', instructions: 'Look for guide', coordinates: { lat: 48.8606, lng: 2.3376 } },
      coordinates: { lat: 48.8606, lng: 2.3376 },
    },
    host: { id: 'h1', name: 'Marie L.', avatar: '', bio: 'Art historian', rating: 4.9, reviewCount: 847, responseRate: 98, responseTime: '1 hour', languages: ['English', 'French'], verified: true, superHost: true, memberSince: new Date(), totalExperiences: 12 },
    price: { amount: 65, currency: 'USD', formatted: '$65' },
    rating: 4.9,
    reviewCount: 2847,
    maxParticipants: 8,
    minParticipants: 1,
    includes: ['Skip-the-line entry', 'Professional guide'],
    notIncluded: ['Hotel pickup'],
    requirements: ['Valid ID'],
    whatToBring: ['Comfortable shoes'],
    accessibility: { wheelchairAccessible: true, mobilityAid: true, visualAid: false, hearingAid: true, serviceAnimals: true, infantFriendly: false, childFriendly: true, seniorFriendly: true, fitnessLevel: 'easy' },
    languages: ['English', 'French'],
    availability: [],
    cancellationPolicy: 'free_24h',
    instantConfirmation: true,
    mobileTicket: true,
    featured: true,
    bestSeller: true,
    tags: ['skip-the-line'],
  },
  {
    id: '2',
    title: `${destination} Food Walking Tour`,
    description: 'Taste your way through the city with a local foodie guide.',
    shortDescription: 'Culinary adventure with local tastings',
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
    category: 'food_drink',
    duration: 240,
    location: {
      city: destination,
      country: 'France',
      meetingPoint: { name: 'Central Market', address: 'Market Square', instructions: 'Meet at fountain', coordinates: { lat: 48.8566, lng: 2.3522 } },
      coordinates: { lat: 48.8566, lng: 2.3522 },
    },
    host: { id: 'h2', name: 'Pierre D.', avatar: '', bio: 'Chef', rating: 4.8, reviewCount: 523, responseRate: 95, responseTime: '2 hours', languages: ['English', 'French'], verified: true, superHost: false, memberSince: new Date(), totalExperiences: 5 },
    price: { amount: 89, currency: 'USD', formatted: '$89' },
    rating: 4.8,
    reviewCount: 1203,
    maxParticipants: 12,
    minParticipants: 2,
    includes: ['All food tastings', 'Local guide'],
    notIncluded: ['Additional drinks'],
    requirements: [],
    whatToBring: ['Empty stomach'],
    accessibility: { wheelchairAccessible: false, mobilityAid: false, visualAid: false, hearingAid: false, serviceAnimals: true, infantFriendly: false, childFriendly: true, seniorFriendly: true, fitnessLevel: 'moderate' },
    languages: ['English', 'French'],
    availability: [],
    cancellationPolicy: 'free_48h',
    instantConfirmation: true,
    mobileTicket: true,
    featured: false,
    bestSeller: true,
    tags: ['food-tour'],
  },
  {
    id: '3',
    title: `${destination} Bike Tour`,
    description: 'Discover the city on two wheels through charming neighborhoods.',
    shortDescription: 'Scenic cycling adventure',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    category: 'adventure',
    duration: 180,
    location: {
      city: destination,
      country: 'France',
      meetingPoint: { name: 'Bike Shop', address: '15 River Street', instructions: 'Blue awning', coordinates: { lat: 48.8584, lng: 2.2945 } },
      coordinates: { lat: 48.8584, lng: 2.2945 },
    },
    host: { id: 'h3', name: 'Lucas M.', avatar: '', bio: 'Cycling enthusiast', rating: 4.7, reviewCount: 312, responseRate: 92, responseTime: '3 hours', languages: ['English', 'French', 'German'], verified: true, superHost: false, memberSince: new Date(), totalExperiences: 3 },
    price: { amount: 45, currency: 'USD', formatted: '$45' },
    rating: 4.7,
    reviewCount: 892,
    maxParticipants: 10,
    minParticipants: 2,
    includes: ['Bike rental', 'Helmet', 'Guide'],
    notIncluded: ['Lunch'],
    requirements: ['Know how to ride a bike'],
    whatToBring: ['Sunscreen'],
    accessibility: { wheelchairAccessible: false, mobilityAid: false, visualAid: false, hearingAid: false, serviceAnimals: false, infantFriendly: false, childFriendly: true, seniorFriendly: false, fitnessLevel: 'moderate' },
    languages: ['English', 'French', 'German'],
    availability: [],
    cancellationPolicy: 'free_24h',
    instantConfirmation: true,
    mobileTicket: true,
    featured: false,
    bestSeller: false,
    tags: ['bike-tour'],
  },
];

export default function ExperienceResultsScreen({
  onSelectExperience,
  onBack,
  onClose,
}: ExperienceResultsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { searchParams, setResults, results } = useExperienceStore();
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load mock results
  useEffect(() => {
    const destination = searchParams.destination?.name || 'Paris';
    const mockResults = generateMockExperiences(destination);
    setResults(mockResults);
  }, []);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const handleClose = () => {
    setShowCancelModal(true);
  };

  const toggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const handleExperienceSelect = (experience: Experience) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedExperience(experience);
  };

  const handleCheckAvailability = (experience: Experience) => {
    setSelectedExperience(null);
    onSelectExperience(experience);
  };

  // Use the shared ExperienceCard component for consistent premium UI
  const renderExperienceCard = ({ item, index }: { item: Experience; index: number }) => {
    // Convert Experience to ExperienceCardData format
    const cardData: ExperienceCardData = {
      id: item.id,
      title: item.title,
      shortDescription: item.shortDescription,
      images: item.images,
      category: item.category.charAt(0).toUpperCase() + item.category.slice(1), // Capitalize
      duration: item.duration,
      price: item.price.amount,
      rating: item.rating,
      reviewCount: item.reviewCount,
      bestSeller: item.bestSeller,
      featured: item.featured,
      instantConfirmation: item.instantConfirmation,
    };

    return (
      <ExperienceCard
        experience={cardData}
        index={index}
        isFavorite={favorites.has(item.id)}
        onPress={() => handleExperienceSelect(item)}
        onFavorite={() => toggleFavorite(item.id)}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Background Image */}
      <ImageBackground
        source={require('../../../../../../assets/images/experiencebg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{searchParams.destination?.name || 'Experiences'}</Text>
            <Text style={styles.headerSubtitle}>{results.length} experiences found</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <CloseCircle size={24} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Filter Bar - Outside Header */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={18} color={colors.textPrimary} />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Sort size={18} color={colors.textPrimary} />
          <Text style={styles.filterText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* Results List */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderExperienceCard}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      />

      {/* Experience Detail Sheet */}
      <ExperienceDetailSheet
        visible={!!selectedExperience}
        onClose={() => setSelectedExperience(null)}
        onSelect={handleCheckAvailability}
        experience={selectedExperience}
      />

      {/* Cancel Modal */}
      <CancelBookingModal
        visible={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          onClose();
        }}
        title="Cancel Search?"
        message="Are you sure you want to cancel? Your search results will be lost."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  experienceCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  experienceImage: {
    width: '100%',
    height: 180,
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
  bestSellerBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  bestSellerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  cardContent: {
    padding: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
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
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 4,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
    color: colors.primary,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});
