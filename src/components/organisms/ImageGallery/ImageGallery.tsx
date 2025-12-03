/**
 * IMAGE GALLERY ORGANISM
 * 
 * Swipeable image carousel with pagination dots
 * Supports multiple images with smooth scrolling
 */

import { View, StyleSheet, Dimensions, FlatList, Image, TouchableOpacity } from 'react-native';
import { useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = width * 1.2; // 1.2 aspect ratio

interface ImageGalleryProps {
  images: string[];
  onImagePress?: (index: number) => void;
}

export default function ImageGallery({ images, onImagePress }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const handleImagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onImagePress?.(activeIndex);
  };

  const renderImage = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={handleImagePress}
      style={styles.imageContainer}
    >
      <Image
        source={{ uri: item }}
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Image Carousel */}
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderImage}
        keyExtractor={(item, index) => `image-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToAlignment="center"
      />

      {/* Pagination Dots */}
      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                index === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  imageContainer: {
    width: width,
    height: HERO_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  pagination: {
    position: 'absolute',
    bottom: 140, // Moved up to stay above white card
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 10000,
    elevation: 100,
    pointerEvents: 'none', // Don't block touches
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 10,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 10,
  },
});
