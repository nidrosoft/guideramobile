/**
 * INSIGHT SECTION ORGANISM
 * 
 * Displays insight with image gallery and description
 * White container with rounded corners (32px)
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useState } from 'react';
import { colors, typography, spacing } from '@/styles';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width * 0.25; // Much smaller - 25% of screen width
const IMAGE_HEIGHT = 80; // Reduced from 240 to 80

interface DescriptionSectionProps {
  description: string;
  images: string[];
  maxLines?: number;
}

export default function DescriptionSection({ 
  description,
  images,
  maxLines = 4 
}: DescriptionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Section Header - Outside container */}
      <Text style={styles.sectionTitle}>Insight</Text>
      
      {/* White Container Card */}
      <View style={styles.card}>
        {/* Description Text - Now First */}
        <Text 
          style={styles.description}
          numberOfLines={isExpanded ? undefined : maxLines}
        >
          {description}
        </Text>

        <TouchableOpacity 
          onPress={handleToggle}
          style={styles.readMoreButton}
          activeOpacity={0.7}
        >
          <Text style={styles.readMoreText}>
            {isExpanded ? 'Show Less' : 'Read More'}
          </Text>
        </TouchableOpacity>

        {/* Horizontal Scrollable Image Gallery - Now After Text */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
          contentContainerStyle={styles.imageGalleryContent}
        >
          {images.slice(0, 3).map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image 
                source={{ uri: image }} 
                style={styles.image}
                resizeMode="cover"
              />
              {index === 2 && images.length > 3 && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>{images.length - 3}+ More</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
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
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageGallery: {
    marginHorizontal: -spacing.md,
    marginTop: spacing.md,
  },
  imageGalleryContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 12,
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});
