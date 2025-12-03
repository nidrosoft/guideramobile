/**
 * CREATORS CONTENT SECTION ORGANISM
 * 
 * Displays creator content from TikTok, Instagram, YouTube Shorts
 * Video-style cards with filters and platform badges
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Modal } from 'react-native';
import { useState } from 'react';
import { Video, ResizeMode } from 'expo-av';
import { Location, Heart, CloseCircle } from 'iconsax-react-native';
import { colors, typography, spacing } from '@/styles';
import * as Haptics from 'expo-haptics';

interface CreatorContent {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  thumbnail: string;
  videoUrl?: string;
  title: string;
  location: string;
  distance: string;
  likes: string;
  category: string;
}

interface CreatorsContentSectionProps {
  content: CreatorContent[];
}

const categories = ['On Trending', 'Night Life', 'Restaurant', 'Activities'];

const platformColors = {
  tiktok: '#000000',
  instagram: '#E4405F',
  youtube: '#FF0000',
};

const platformIcons = {
  tiktok: '🎵',
  instagram: '📷',
  youtube: '▶️',
};

export default function CreatorsContentSection({ content }: CreatorsContentSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('On Trending');
  const [selectedVideo, setSelectedVideo] = useState<CreatorContent | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  const handleCategoryPress = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleVideoPress = (item: CreatorContent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedVideo(item);
    setIsVideoModalVisible(true);
  };

  const handleCloseVideo = () => {
    setIsVideoModalVisible(false);
    setSelectedVideo(null);
  };

  // Filter content based on selected category
  const filteredContent = selectedCategory === 'On Trending' 
    ? content 
    : content.filter(item => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Creators Content</Text>
        <Text style={styles.sectionSubtitle}>See what creators are saying about this location</Text>
      </View>
      
      {/* Category Filter Pills */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterPill,
              selectedCategory === category && styles.filterPillActive
            ]}
            onPress={() => handleCategoryPress(category)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterText,
              selectedCategory === category && styles.filterTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Horizontal Scrollable Video Cards */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContent}
        style={styles.cardsScroll}
      >
        {filteredContent.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.card} 
            activeOpacity={0.9}
            onPress={() => handleVideoPress(item)}
          >
            <ImageBackground 
              source={{ uri: item.thumbnail }}
              style={styles.cardImage}
              imageStyle={styles.cardImageStyle}
            >
              {/* Platform Badge */}
              <View style={[styles.platformBadge, { backgroundColor: platformColors[item.platform] }]}>
                <Text style={styles.platformIcon}>{platformIcons[item.platform]}</Text>
                <Text style={styles.platformText}>
                  {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                </Text>
              </View>

              {/* Bottom Overlay with Info */}
              <View style={styles.cardOverlay}>
                {/* Location and Likes */}
                <View style={styles.cardMeta}>
                  <View style={styles.locationContainer}>
                    <Location size={16} color={colors.white} variant="Bold" />
                    <Text style={styles.locationText}>{item.location} ({item.distance})</Text>
                  </View>
                  <View style={styles.likesContainer}>
                    <Heart size={16} color="#FF6B6B" variant="Bold" />
                    <Text style={styles.likesText}>{item.likes}</Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fullscreen Video Modal */}
      <Modal
        visible={isVideoModalVisible}
        animationType="fade"
        onRequestClose={handleCloseVideo}
      >
        <View style={styles.videoModal}>
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleCloseVideo}
            activeOpacity={0.8}
          >
            <CloseCircle size={40} color={colors.white} variant="Bold" />
          </TouchableOpacity>

          {/* Video Player */}
          {selectedVideo?.videoUrl ? (
            <Video
              source={{ uri: selectedVideo.videoUrl }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>Video player ready</Text>
              <Text style={styles.videoPlaceholderSubtext}>
                {selectedVideo?.title}
              </Text>
            </View>
          )}
        </View>
      </Modal>
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
  filterScroll: {
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterPillActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  cardsScroll: {
    // No negative margin - let it scroll naturally
  },
  cardsContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 200,
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    margin: spacing.sm,
    gap: spacing.xs,
  },
  platformIcon: {
    fontSize: 14,
  },
  platformText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  cardOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.sm,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    flex: 1,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    lineHeight: 18,
  },
  videoModal: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  videoPlaceholderText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  videoPlaceholderSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.gray400,
    textAlign: 'center',
  },
});
