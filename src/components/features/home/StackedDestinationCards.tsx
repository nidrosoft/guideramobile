import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { Bookmark, ArrowRight, Star1, Ticket, TrendUp, Crown } from 'iconsax-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 64;

const destinations = [
  {
    id: 1,
    city: 'Brazil',
    country: 'Rio de Janeiro',
    name: 'Christ the Redeemer',
    rating: 4.8,
    visitors: '2M/year',
    entryFee: '$25',
    bestTime: 'Apr-Oct',
    image: 'https://picsum.photos/seed/rio/600/800',
    isUNESCO: true,
    trending: '+15%',
  },
  {
    id: 2,
    city: 'France',
    country: 'Paris',
    name: 'Eiffel Tower',
    rating: 4.9,
    visitors: '7M/year',
    entryFee: '€26',
    bestTime: 'Apr-Jun',
    image: 'https://picsum.photos/seed/paris/600/800',
    isUNESCO: false,
    trending: '+22%',
  },
  {
    id: 3,
    city: 'Egypt',
    country: 'Giza',
    name: 'Great Pyramid',
    rating: 4.7,
    visitors: '14M/year',
    entryFee: '$20',
    bestTime: 'Oct-Apr',
    image: 'https://picsum.photos/seed/egypt/600/800',
    isUNESCO: true,
    trending: '+18%',
  },
  {
    id: 4,
    city: 'India',
    country: 'Agra',
    name: 'Taj Mahal',
    rating: 4.9,
    visitors: '8M/year',
    entryFee: '₹1050',
    bestTime: 'Nov-Feb',
    image: 'https://picsum.photos/seed/india/600/800',
    isUNESCO: true,
    trending: '+25%',
  },
  {
    id: 5,
    city: 'USA',
    country: 'New York',
    name: 'Statue of Liberty',
    rating: 4.6,
    visitors: '4.5M/year',
    entryFee: '$24',
    bestTime: 'May-Sep',
    image: 'https://picsum.photos/seed/newyork/600/800',
    isUNESCO: true,
    trending: '+12%',
  },
];

export default function StackedDestinationCards() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = () => {
    setCurrentIndex((prev) => (prev + 1) % destinations.length);
  };

  const handleCardPress = (destination: typeof destinations[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/detail/${destination.id}` as any);
  };

  return (
    <View style={styles.container}>
      {/* Stacked Cards */}
      {destinations.map((destination, index) => {
        const position = (index - currentIndex + destinations.length) % destinations.length;
        
        if (position > 2) return null; // Only show 3 cards

        const scale = 1 - (position * 0.05);
        const translateY = position * -20;
        const opacity = position === 0 ? 1 : 0.7;

        return (
          <TouchableOpacity
            key={destination.id}
            style={[
              styles.card,
              {
                transform: [{ scale }, { translateY }],
                opacity,
                zIndex: destinations.length - position,
              },
            ]}
            onPress={position === 0 ? handleSwipe : undefined}
            activeOpacity={0.9}
          >
            {/* Background Image */}
            <Image source={{ uri: destination.image }} style={styles.cardImage} />

            {/* Top Badges */}
            <View style={styles.topContainer}>
              {destination.isUNESCO && (
                <View style={styles.unescoBadge}>
                  <Crown size={14} color="#FFD700" variant="Bold" />
                  <Text style={styles.unescoBadgeText}>UNESCO</Text>
                </View>
              )}
              <View style={styles.trendingBadge}>
                <TrendUp size={14} color="#4CAF50" variant="Bold" />
                <Text style={styles.trendingText}>{destination.trending}</Text>
              </View>
              <TouchableOpacity style={styles.bookmarkButton}>
                <Bookmark size={20} color={colors.textPrimary} variant="Outline" />
              </TouchableOpacity>
            </View>

            {/* Bottom Info with Blur */}
            <BlurView intensity={30} tint="light" style={styles.bottomContainer}>
              <View style={styles.infoContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.location}>{destination.city}, {destination.country}</Text>
                  <Text style={styles.name}>{destination.name}</Text>
                  
                  {/* Key Info Row */}
                  <View style={styles.keyInfoRow}>
                    <View style={styles.infoItem}>
                      <Star1 size={14} color="#FFD700" variant="Bold" />
                      <Text style={styles.infoText}>{destination.rating}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ticket size={14} color={colors.white} variant="Bold" />
                      <Text style={styles.infoText}>{destination.entryFee}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Best:</Text>
                      <Text style={styles.infoText}>{destination.bestTime}</Text>
                    </View>
                  </View>
                  
                  {/* Visitors */}
                  <Text style={styles.visitors}>{destination.visitors} visitors</Text>
                </View>

                <TouchableOpacity 
                  style={styles.arrowButton}
                  onPress={() => handleCardPress(destination)}
                >
                  <ArrowRight size={20} color={colors.textPrimary} variant="Outline" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 450,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: 420,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  topContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unescoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  unescoBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#FFD700',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  trendingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#4CAF50',
  },
  bookmarkButton: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    borderRadius: 24,
    overflow: 'hidden',
  },
  infoContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginBottom: 4,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  keyInfoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.fontWeight.medium,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  visitors: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.fontWeight.medium,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
