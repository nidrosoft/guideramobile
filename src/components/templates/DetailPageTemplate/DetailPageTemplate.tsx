/**
 * DETAIL PAGE TEMPLATE
 * 
 * Universal template for all detail pages
 * Handles destinations, events, places, etc.
 */

import { useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import Animated, { 
  useAnimatedScrollHandler, 
  useSharedValue, 
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageQuestion } from 'iconsax-react-native';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useSaveDestination } from '@/hooks/useSaveDestination';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';
import { PlanTripSheet } from '@/components/features/search';
import AIChatSheet from '@/components/features/ai/AIChatSheet';
import type { TripPlanData } from '@/components/features/search/PlanTripSheet';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 1.2;
import DetailHeader from '@/components/organisms/DetailHeader/DetailHeader';
import ImageGallery from '@/components/organisms/ImageGallery/ImageGallery';
import BasicInfoSection from '@/components/organisms/BasicInfoSection/BasicInfoSection';
import DescriptionSection from '@/components/organisms/DescriptionSection/DescriptionSection';
import PracticalInfoSection from '@/components/organisms/PracticalInfoSection/PracticalInfoSection';
import PlacesToVisitSection from '@/components/organisms/PlacesToVisitSection/PlacesToVisitSection';
import SafetyInfoSection from '@/components/organisms/SafetyInfoSection/SafetyInfoSection';
import CreatorsContentSection from '@/components/organisms/CreatorsContentSection/CreatorsContentSection';
import VibesAroundSection from '@/components/organisms/VibesAroundSection/VibesAroundSection';
import LocalEventSection from '@/components/organisms/LocalEventSection/LocalEventSection';
import ReviewsSection from '@/components/organisms/ReviewsSection/ReviewsSection';
import SimilarItemsSection from '@/components/organisms/SimilarItemsSection/SimilarItemsSection';
import ActionButton from '@/components/organisms/ActionButton/ActionButton';

interface DetailPageTemplateProps {
  type: string;
  id: string;
  data: {
    name: string;
    location: string;
    rating: number;
    category: string;
    visitors: string;
    bestTime?: string;
    budget?: string;
    description: string;
    practicalInfo: any[];
    places?: any[];
    safetyInfo?: any[];
    creatorContent?: any[];
    vibes?: any[];
    localEvents?: any[];
    reviews: any[];
    similarItems: any[];
    images: string[];
  };
}

export default function DetailPageTemplate({ type, id, data }: DetailPageTemplateProps) {
  const { colors, isDark } = useTheme();
  const { isSaved, toggleSave } = useSaveDestination(id);
  const scrollOffset = useSharedValue(0);
  
  // Plan Trip states
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  // Parallax image animation - translates slower + scales on overscroll
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
            [-IMAGE_HEIGHT / 2, 0, IMAGE_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-IMAGE_HEIGHT, 0],
            [2, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  // Header fade animation - transparent to solid
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollOffset.value,
        [0, IMAGE_HEIGHT * 0.5],
        [0, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  const handleAction = () => {
    // For destinations, show Plan Trip sheet
    if (type === 'destination') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowPlanSheet(true);
      return;
    }
    // For other types, open maps with directions
    const query = encodeURIComponent(data.name);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: data.name,
        message: `Check out ${data.name} in ${data.location} on Guidera! Rated ${data.rating}/5 — ${data.description?.slice(0, 100) || ''}...`,
      });
    } catch (_) {}
  };

  const handleAIAssistant = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAIChat(true);
  };

  // Trip plan data from destination
  const tripPlanData: TripPlanData = {
    destination: data.name,
    startDate: null,
    endDate: null,
    guests: { adults: 1, children: 0, infants: 0 },
  };

  const handleQuickTrip = (_tripData: TripPlanData) => {
    // Deprecated — Quick trip flow removed
  };

  const handleAdvancedTrip = (_tripData: TripPlanData) => {
    // Deprecated — Advanced trip flow removed
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent={false} />
      
      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
      >
        {/* Image Gallery - Parallax effect */}
        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          <ImageGallery images={data.images} />
        </Animated.View>

        {/* Content Card with Rounded Top - Fixed 32px corners */}
        <View style={[styles.contentCard, { backgroundColor: colors.background, shadowColor: colors.black }]}>
          {/* Basic Info Section */}
          <BasicInfoSection
          name={data.name}
          location={data.location}
          rating={data.rating}
          category={data.category}
          visitors={data.visitors}
          bestTime={data.bestTime}
          budget={data.budget}
        />

        {/* Insight Section */}
        <DescriptionSection 
          description={data.description}
          images={data.images}
        />

        {/* Places to Visit Section - Right after Insight */}
        {data.places && data.places.length > 0 && (
          <PlacesToVisitSection places={data.places} />
        )}

        {/* Practical Info Section */}
        <PracticalInfoSection items={data.practicalInfo} />

        {/* Safety Information Section */}
        {data.safetyInfo && data.safetyInfo.length > 0 && (
          <SafetyInfoSection safetyInfo={data.safetyInfo} />
        )}

        {/* Creators Content Section — Live TikTok videos */}
        <CreatorsContentSection
          content={data.creatorContent}
          destinationName={data.name}
        />

        {/* Vibes Around Here Section */}
        {data.vibes && data.vibes.length > 0 && (
          <VibesAroundSection vibes={data.vibes} />
        )}

        {/* Local Event Section */}
        {data.localEvents && data.localEvents.length > 0 && (
          <LocalEventSection events={data.localEvents} />
        )}

        {/* Reviews Section */}
        <ReviewsSection 
          averageRating={data.rating}
          totalReviews={data.reviews.length}
          reviews={data.reviews}
        />

        {/* Similar Items Section */}
        <SimilarItemsSection 
          items={data.similarItems}
          type={type}
        />

        </View>
      </Animated.ScrollView>

      {/* Header Background - Fades in on scroll */}
      <Animated.View style={[styles.headerBackground, headerAnimatedStyle, { backgroundColor: colors.background, borderBottomColor: colors.gray200 }]} />
      
      {/* Header Buttons - Always visible */}
      <View style={styles.headerContainer}>
        <DetailHeader title={data.name} isSaved={isSaved} onSave={toggleSave} onShare={handleShare} />
      </View>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity 
        style={styles.floatingAIButton}
        onPress={handleAIAssistant}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#3FC39E', '#2D9A7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiGradient}
        >
          <MessageQuestion size={28} color="#FFFFFF" variant="Bold" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Fixed Bottom Action Button */}
      <View style={[styles.fixedBottomButton, { backgroundColor: colors.background, borderTopColor: colors.gray200, shadowColor: colors.black }]}>
        <ActionButton 
          type={type as any}
          onPress={handleAction}
        />
      </View>

      {/* Plan Trip Sheet */}
      <PlanTripSheet
        visible={showPlanSheet}
        onClose={() => setShowPlanSheet(false)}
        onSelectQuickTrip={handleQuickTrip}
        onSelectAdvancedTrip={handleAdvancedTrip}
        tripData={tripPlanData}
      />


      {/* AI Chat Sheet - context-aware for this destination */}
      <AIChatSheet
        visible={showAIChat}
        onClose={() => setShowAIChat(false)}
        contextType="destination"
        contextData={{
          id,
          name: data.name,
          location: data.location,
          budget: data.budget,
          bestTime: data.bestTime,
          description: data.description,
          category: data.category,
          rating: data.rating,
          highlights: data.places?.slice(0, 8).map((p: any) => typeof p === 'string' ? p : p.name || p.title).filter(Boolean),
          safetyInfo: data.safetyInfo?.slice(0, 6).map((s: any) => typeof s === 'string' ? s : s.text || s.title || s.description).filter(Boolean),
          practicalInfo: data.practicalInfo?.slice(0, 6).map((p: any) => typeof p === 'string' ? p : `${p.label || p.title}: ${p.value || p.description}`).filter(Boolean),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for fixed button
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  contentCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -120,
    paddingTop: 0,
    minHeight: '100%',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    borderBottomWidth: 0.5,
    zIndex: 99,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  fixedBottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: 20,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingAIButton: {
    position: 'absolute',
    bottom: 140,
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 999,
  },
  aiGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
