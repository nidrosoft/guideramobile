/**
 * DETAIL PAGE TEMPLATE
 * 
 * Universal template for all detail pages
 * Handles destinations, events, places, etc.
 */

import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
import { colors, spacing } from '@/styles';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';

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
  const scrollOffset = useSharedValue(0);

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
    // For destinations, open maps with directions
    if (type === 'destination') {
      const query = encodeURIComponent(data.name);
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
    // Add other type-specific actions here
  };

  const handleAIAssistant = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('AI Assistant', `Ask me anything about ${data.name}!`);
    // TODO: Open AI chat interface
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={false} />
      
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
        <View style={styles.contentCard}>
          {/* Basic Info Section */}
          <BasicInfoSection
          name={data.name}
          location={data.location}
          rating={data.rating}
          category={data.category}
          visitors={data.visitors}
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

        {/* Creators Content Section */}
        {data.creatorContent && data.creatorContent.length > 0 && (
          <CreatorsContentSection content={data.creatorContent} />
        )}

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
      <Animated.View style={[styles.headerBackground, headerAnimatedStyle]} />
      
      {/* Header Buttons - Always visible */}
      <View style={styles.headerContainer}>
        <DetailHeader title={data.name} />
      </View>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity 
        style={styles.floatingAIButton}
        onPress={handleAIAssistant}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiGradient}
        >
          <MessageQuestion size={28} color={colors.white} variant="Bold" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Fixed Bottom Action Button */}
      <View style={styles.fixedBottomButton}>
        <ActionButton 
          type={type as any}
          onPress={handleAction}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -120, // Increased overlap - pulls card much higher
    paddingTop: 0,
    minHeight: '100%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden', // Ensures rounded corners clip properly
    zIndex: 1, // Below header but above image
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: colors.background,
    borderBottomWidth: 0.5, // Very thin line
    borderBottomColor: colors.gray200,
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
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingBottom: 20,
    shadowColor: colors.black,
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
    shadowColor: colors.black,
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
