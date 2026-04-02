/**
 * INSIGHT SECTION ORGANISM
 * 
 * Displays insight with image gallery and description
 * White container with rounded corners (32px)
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Modal, FlatList, StatusBar, SafeAreaView } from 'react-native';
import { useState, useCallback } from 'react';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { CloseCircle } from 'iconsax-react-native';
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
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  const openGallery = useCallback((startIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGalleryIndex(startIndex);
    setGalleryVisible(true);
  }, []);

  const renderFullImage = useCallback(({ item }: { item: string }) => (
    <View style={styles.fullImageContainer}>
      <Image source={{ uri: item }} style={styles.fullImage} resizeMode="contain" />
    </View>
  ), []);

  return (
    <View style={styles.container}>
      {/* Section Header - Outside container */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Insight</Text>
      
      {/* White Container Card */}
      <View style={[styles.card, { backgroundColor: colors.bgElevated, borderColor: colors.borderMedium }]}>
        {/* Description Text - Now First */}
        <Text 
          style={[styles.description, { color: colors.textSecondary }]}
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
            <TouchableOpacity
              key={index}
              style={styles.imageWrapper}
              onPress={() => openGallery(index)}
              activeOpacity={0.85}
            >
              <Image 
                source={{ uri: image }} 
                style={styles.image}
                resizeMode="cover"
              />
              {index === 2 && images.length > 3 && (
                <TouchableOpacity
                  style={styles.moreOverlay}
                  onPress={() => openGallery(2)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.moreText}>{images.length - 3}+ More</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Full-Screen Gallery Modal */}
      <Modal
        visible={galleryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGalleryVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setGalleryVisible(false)}
            activeOpacity={0.8}
          >
            <CloseCircle size={36} color="#FFFFFF" variant="Bold" />
          </TouchableOpacity>

          {/* Counter */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {galleryIndex + 1} / {images.length}
            </Text>
          </View>

          {/* Paging Gallery */}
          <FlatList
            data={images}
            renderItem={renderFullImage}
            keyExtractor={(_, i) => `full-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={galleryIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setGalleryIndex(idx);
            }}
          />
        </SafeAreaView>
      </Modal>
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
    marginBottom: spacing.md,
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
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  counterContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  fullImageContainer: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: '100%',
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#3FC39E',
  },
});
