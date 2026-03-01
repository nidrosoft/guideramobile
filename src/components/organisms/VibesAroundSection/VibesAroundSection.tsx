/**
 * VIBES AROUND HERE SECTION ORGANISM
 * 
 * Displays vibes/activities around the location
 * Similar to Must See cards but with vibe tags
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing } from '@/styles';
import { Location } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

interface Vibe {
  id: string;
  name: string;
  description: string;
  distance: string;
  image: string;
  tags: string[];
}

interface VibesAroundSectionProps {
  vibes: Vibe[];
}

const tagEmojis: { [key: string]: string } = {
  'Artsy': '🎨',
  'Historic': '🏛️',
  'Social': '😊',
  'Nature': '🌿',
  'Coffee': '☕',
  'Romantic': '💕',
  'Adventure': '🎒',
  'Foodie': '🍽️',
  'Nightlife': '🌙',
  'Shopping': '🛍️',
};

export default function VibesAroundSection({ vibes }: VibesAroundSectionProps) {
  const handleVibePress = (vibe: Vibe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to vibe detail
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Vibes Around Here</Text>
        <Text style={styles.sectionSubtitle}>Explore the unique atmosphere and experiences nearby</Text>
      </View>
      
      {/* Horizontal Scrollable Cards */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContent}
      >
        {vibes.map((vibe) => (
          <TouchableOpacity 
            key={vibe.id} 
            style={styles.card}
            onPress={() => handleVibePress(vibe)}
            activeOpacity={0.9}
          >
            {/* Image */}
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: vibe.image }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>

            {/* Info Section */}
            <View style={styles.infoContainer}>
              {/* Name and Distance */}
              <View style={styles.cardHeader}>
                <Text style={styles.name} numberOfLines={1}>{vibe.name}</Text>
                <View style={styles.distanceContainer}>
                  <Location size={14} color={colors.primary} variant="Bold" />
                  <Text style={styles.distanceText}>{vibe.distance}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>
                {vibe.description}
              </Text>

              {/* Vibe Tags */}
              <View style={styles.tagsContainer}>
                {vibe.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagEmoji}>{tagEmojis[tag] || '✨'}</Text>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
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
  cardsContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 320,
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  tagEmoji: {
    fontSize: 14,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
});
