/**
 * CREATORS CONTENT SECTION ORGANISM
 * 
 * Displays TikTok creator content for a destination.
 * Powered by TikAPI via Supabase Edge Function.
 * - Live hashtag-based video fetching per category
 * - Expanded filter categories (15+)
 * - View All → full feed screen
 * - Fullscreen TikTok-style video player
 * - Blocked region fallback
 * - No video/image hosting — streams from TikTok CDN
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Modal, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Heart, Play, ArrowRight2 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';
import { getHashtagVideos } from '@/services/tiktok.service';
import type { TikTokVideo, TikTokCategory } from '@/services/tiktok.service';
import VideoPlayer from '@/components/features/creators/VideoPlayer';

interface CreatorsContentSectionProps {
  content?: any[]; // Legacy prop — ignored when TikAPI is active
  destinationName?: string;
}

const CATEGORIES: TikTokCategory[] = [
  { id: 'trending', label: 'On Trending', icon: '🔥' },
  { id: 'nightlife', label: 'Night Life', icon: '🌙' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'activities', label: 'Activities', icon: '🎯' },
  { id: 'hidden gems', label: 'Hidden Gems', icon: '💎' },
  { id: 'street food', label: 'Street Food', icon: '🍜' },
  { id: 'cafes', label: 'Cafes', icon: '☕' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'culture', label: 'Culture', icon: '🏛️' },
  { id: 'beach', label: 'Beach', icon: '🏖️' },
  { id: 'adventure', label: 'Adventure', icon: '🧗' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'budget', label: 'Budget', icon: '💰' },
  { id: 'luxury', label: 'Luxury', icon: '✨' },
  { id: 'photography', label: 'Photography', icon: '📸' },
];

export default function CreatorsContentSection({ content, destinationName }: CreatorsContentSectionProps) {
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<TikTokCategory>(CATEGORIES[0]);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();

  const destination = destinationName || '';

  const fetchVideos = useCallback(async (cat: TikTokCategory, append = false) => {
    if (!destination) return;
    setLoading(true);
    setError(false);

    try {
      const res = await getHashtagVideos(destination, cat.id, {
        count: 20,
        cursor: append ? cursor : undefined,
      });

      if (res.fallback || !res.success) {
        if (!append) setVideos([]);
        setError(true);
      } else {
        setVideos(prev => append ? [...prev, ...res.videos] : res.videos);
        setHasMore(res.hasMore);
        setCursor(res.cursor);
      }
    } catch {
      if (!append) setVideos([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [destination, cursor]);

  useEffect(() => {
    if (destination) {
      setCursor(undefined);
      fetchVideos(selectedCategory);
    }
  }, [destination, selectedCategory.id]);

  const handleCategoryPress = (cat: TikTokCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
  };

  const handleVideoPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlayerIndex(index);
    setPlayerVisible(true);
  };

  const handleClosePlayer = () => {
    setPlayerVisible(false);
  };

  // Don't render section if no destination
  if (!destination) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Creators Content</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              See what creators are saying about {destination}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Category Filter Pills */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.filterPill,
              { backgroundColor: isDark ? '#2A2A2A' : colors.gray100, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.gray200 },
              selectedCategory.id === cat.id && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => handleCategoryPress(cat)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterText,
              { color: colors.textSecondary },
              selectedCategory.id === cat.id && { color: '#FFFFFF', fontWeight: '600' }
            ]}>
              {cat.icon} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading State — skeleton cards during initial load OR category switch */}
      {loading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContent}
          style={styles.cardsScroll}
        >
          {[1, 2, 3].map((i) => (
            <View
              key={`skel-${i}`}
              style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.gray200, backgroundColor: isDark ? '#1A1A1A' : colors.gray100 }]}
            >
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                {i === 1 && (
                  <Text style={[styles.loadingText, { color: colors.textTertiary, marginTop: 8 }]}>
                    Loading {selectedCategory.label.toLowerCase()}...
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Error / Empty State */}
      {!loading && error && videos.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            No videos available yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Creator content for {destination} will appear here soon
          </Text>
        </View>
      )}

      {/* Horizontal Scrollable Video Cards */}
      {!loading && videos.length > 0 && (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContent}
          style={styles.cardsScroll}
        >
          {videos.map((video, index) => (
            <TouchableOpacity 
              key={`${video.id}-${index}`} 
              style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.gray200 }]} 
              activeOpacity={0.9}
              onPress={() => handleVideoPress(index)}
            >
              <ImageBackground 
                source={{ uri: video.coverUrl || video.dynamicCover }}
                style={styles.cardImage}
                imageStyle={styles.cardImageStyle}
              >
                {/* TikTok Badge */}
                <View style={styles.platformBadge}>
                  <Text style={styles.platformIcon}>🎵</Text>
                  <Text style={styles.platformText}>TikTok</Text>
                </View>

                {/* Play indicator */}
                <View style={styles.playIndicator}>
                  <Play size={24} color="#FFF" variant="Bold" />
                </View>

                {/* Duration badge */}
                {video.duration > 0 && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                      {video.duration >= 60 ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : `0:${String(video.duration).padStart(2, '0')}`}
                    </Text>
                  </View>
                )}

                {/* Bottom Overlay with Info */}
                <View style={styles.cardOverlay}>
                  <View style={styles.cardMeta}>
                    <View style={styles.creatorMini}>
                      {video.creator.avatar ? (
                        <Image source={{ uri: video.creator.avatar }} style={styles.miniAvatar} />
                      ) : null}
                      <Text style={styles.creatorUsername} numberOfLines={1}>
                        @{video.creator.username}
                      </Text>
                    </View>
                    <View style={styles.likesContainer}>
                      <Heart size={14} color="#FF6B6B" variant="Bold" />
                      <Text style={styles.likesText}>{video.likesFormatted}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {video.caption}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}

          {/* View All Card */}
          {videos.length >= 5 && (
            <TouchableOpacity
              style={[styles.viewAllCard, { backgroundColor: isDark ? '#2A2A2A' : colors.gray100, borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.gray200 }]}
              onPress={() => handleVideoPress(0)}
              activeOpacity={0.8}
            >
              <ArrowRight2 size={32} color={colors.primary} />
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              <Text style={[styles.viewAllSubtext, { color: colors.textTertiary }]}>
                {selectedCategory.label}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Fullscreen Video Player Modal */}
      <Modal
        visible={playerVisible}
        animationType="slide"
        onRequestClose={handleClosePlayer}
        statusBarTranslucent
      >
        <VideoPlayer
          videos={videos}
          initialIndex={playerIndex}
          onClose={handleClosePlayer}
          hasMore={hasMore}
          onLoadMore={() => fetchVideos(selectedCategory, true)}
        />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
  },
  filterScroll: {
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  cardsScroll: {},
  cardsContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 180,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    margin: 8,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  platformIcon: {
    fontSize: 12,
  },
  platformText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  creatorMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  creatorUsername: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    flex: 1,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  likesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  viewAllCard: {
    width: 120,
    height: 280,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewAllSubtext: {
    fontSize: 11,
    textAlign: 'center',
  },
});
