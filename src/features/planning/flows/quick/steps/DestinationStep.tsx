/**
 * DESTINATION STEP
 * 
 * Step 1: Where do you want to go?
 * Search, popular destinations, and surprise me option.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import {
  SearchNormal1,
  Location,
  Magicpen,
  ArrowRight2,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { usePlanningStore } from '../../../stores/usePlanningStore';
import { POPULAR_DESTINATIONS } from '../../../config/planning.config';
import { Location as LocationType } from '@/features/booking/types/booking.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DestinationStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function DestinationStep({
  onNext,
  onBack,
  onClose,
}: DestinationStepProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { quickTripData, setDestination, isDestinationValid } = usePlanningStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSurpriseAnimation, setShowSurpriseAnimation] = useState(false);
  
  // Filter destinations based on search
  const filteredDestinations = searchQuery
    ? POPULAR_DESTINATIONS.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_DESTINATIONS;
  
  const handleSelectDestination = useCallback((destination: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const location: LocationType = {
      id: destination.id,
      name: destination.name,
      code: destination.code,
      country: destination.country,
      countryCode: destination.countryCode,
      type: destination.type,
    };
    
    setDestination(location);
  }, [setDestination]);
  
  const handleSurpriseMe = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSurpriseAnimation(true);
    
    // Pick a random destination
    const randomIndex = Math.floor(Math.random() * POPULAR_DESTINATIONS.length);
    const randomDest = POPULAR_DESTINATIONS[randomIndex];
    
    setTimeout(() => {
      handleSelectDestination(randomDest);
      setShowSurpriseAnimation(false);
    }, 1000);
  }, [handleSelectDestination]);
  
  const handleContinue = useCallback(() => {
    if (!isDestinationValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isDestinationValid, onNext]);
  
  const isSelected = (id: string) => quickTripData.destination?.id === id;
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.title, { color: tc.textPrimary }]}>Where do you want to go?</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
            Pick a destination and we'll plan the perfect trip for you
          </Text>
        </Animated.View>
        
        {/* Search Bar */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={[styles.searchContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
        >
          <SearchNormal1 size={20} color={tc.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            placeholder="Search destinations..."
            placeholderTextColor={tc.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Animated.View>
        
        {/* Surprise Me Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <TouchableOpacity
            style={styles.surpriseButton}
            onPress={handleSurpriseMe}
            activeOpacity={0.8}
            disabled={showSurpriseAnimation}
          >
            <LinearGradient
              colors={[colors.primary, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.surpriseGradient}
            >
              <Magicpen size={24} color={colors.white} variant="Bold" />
              <View style={styles.surpriseContent}>
                <Text style={styles.surpriseTitle}>
                  {showSurpriseAnimation ? 'Finding your destination...' : 'Surprise Me!'}
                </Text>
                <Text style={styles.surpriseSubtitle}>
                  Let AI pick the perfect destination for you
                </Text>
              </View>
              <ArrowRight2 size={20} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Popular Destinations */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Popular Destinations</Text>
          
          <View style={styles.destinationsGrid}>
            {filteredDestinations.map((destination, index) => (
              <Animated.View
                key={destination.id}
                entering={FadeIn.duration(300).delay(index * 50)}
              >
                <TouchableOpacity
                  style={[
                    styles.destinationCard,
                    { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                    isSelected(destination.id) && { borderColor: tc.primary, backgroundColor: tc.primary + '08' },
                  ]}
                  onPress={() => handleSelectDestination(destination)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.destinationEmoji}>{destination.emoji}</Text>
                  <View style={styles.destinationInfo}>
                    <Text style={[
                      styles.destinationName,
                      { color: tc.textPrimary },
                      isSelected(destination.id) && { color: tc.primary },
                    ]}>
                      {destination.name}
                    </Text>
                    <Text style={[styles.destinationCountry, { color: tc.textSecondary }]}>
                      {destination.country}
                    </Text>
                  </View>
                  {isSelected(destination.id) && (
                    <TickCircle size={20} color={tc.primary} variant="Bold" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Continue Button */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, backgroundColor: tc.background, borderTopColor: tc.borderSubtle }]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isDestinationValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isDestinationValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isDestinationValid() 
              ? [colors.primary, colors.gradientEnd]
              : [colors.gray300, colors.gray400]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>
              {quickTripData.destination 
                ? `Continue to ${quickTripData.destination.name}`
                : 'Select a Destination'
              }
            </Text>
            <ArrowRight2 size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  
  // Search - Fully rounded with white background and border
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.xs,
  },
  
  // Surprise Me
  surpriseButton: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  surpriseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  surpriseContent: {
    flex: 1,
  },
  surpriseTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  surpriseSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  // Destinations Grid
  destinationsGrid: {
    gap: spacing.sm,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
  },
  destinationEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  destinationNameSelected: {
    color: colors.primary,
  },
  destinationCountry: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
