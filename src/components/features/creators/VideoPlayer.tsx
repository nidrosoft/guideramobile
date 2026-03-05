/**
 * FULL-SCREEN VIDEO PLAYER
 * 
 * In-app TikTok video player with expo-av:
 * - Autoplay when card is active
 * - Tap to pause/play
 * - Vertical swipe between videos
 * - Creator overlay, metrics, back button
 * - Uses downloadAddr + videoHeaders from TikAPI
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Audio, Video, ResizeMode } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageText, Send2, MusicPlay, Play, Pause } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { TikTokVideo } from '@/services/tiktok.service';
import { getRelatedVideos } from '@/services/tiktok.service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Configure audio to play through speaker (not silent mode)
Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  shouldDuckAndroid: true,
}).catch(() => {});

interface VideoPlayerProps {
  videos: TikTokVideo[];
  initialIndex?: number;
  onClose: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function VideoCard({ video, isActive }: { video: TikTokVideo; isActive: boolean }) {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Build headers from TikAPI response
  const videoHeaders = video.videoHeaders || {
    Referer: 'https://www.tiktok.com/',
    Origin: 'https://www.tiktok.com',
  };

  useEffect(() => {
    if (isActive && !isPaused) {
      videoRef.current?.playAsync().catch(() => {});
    } else {
      videoRef.current?.pauseAsync().catch(() => {});
    }
  }, [isActive, isPaused]);

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(prev => !prev);
  };

  return (
    <View style={styles.videoCard}>
      {/* Cover image — visible while loading or on error */}
      <Image
        source={{ uri: video.coverUrl || video.dynamicCover }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Video player */}
      {!hasError && (
        <Video
          ref={videoRef}
          source={{
            uri: video.videoUrl,
            headers: videoHeaders,
          }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isActive && !isPaused}
          isMuted={false}
          onLoad={() => setIsLoading(false)}
          onError={() => { setHasError(true); setIsLoading(false); }}
          posterSource={{ uri: video.coverUrl }}
          usePoster={true}
          posterStyle={StyleSheet.absoluteFill as any}
        />
      )}

      {/* Tap area for play/pause */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleTap}>
        {/* Pause icon flash */}
        {isPaused && isActive && !isLoading && (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseCircle}>
              <Play size={36} color="#FFF" variant="Bold" style={{ marginLeft: 4 }} />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Loading */}
      {isLoading && isActive && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}

      {/* Top gradient */}
      <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={styles.topGradient} pointerEvents="none" />

      {/* Bottom gradient */}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bottomGradient} pointerEvents="none" />

      {/* Creator info */}
      <View style={styles.bottomInfo} pointerEvents="none">
        <View style={styles.creatorRow}>
          {video.creator.avatar ? (
            <Image source={{ uri: video.creator.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#555' }]} />
          )}
          <View style={styles.creatorText}>
            <Text style={styles.creatorName} numberOfLines={1}>
              @{video.creator.username}
              {video.creator.verified && <Text style={styles.verified}> ✓</Text>}
            </Text>
          </View>
        </View>
        <Text style={styles.caption} numberOfLines={3}>{video.caption}</Text>
        {video.music && (
          <View style={styles.musicRow}>
            <MusicPlay size={14} color="#FFF" variant="Bold" />
            <Text style={styles.musicText} numberOfLines={1}>
              {video.music.title} — {video.music.author}
            </Text>
          </View>
        )}
      </View>

      {/* Right side metrics */}
      <View style={styles.sideActions} pointerEvents="none">
        <View style={styles.actionItem}>
          <Heart size={28} color="#FFF" variant="Bold" />
          <Text style={styles.actionCount}>{video.likesFormatted}</Text>
        </View>
        <View style={styles.actionItem}>
          <MessageText size={28} color="#FFF" variant="Bold" />
          <Text style={styles.actionCount}>{video.commentsFormatted}</Text>
        </View>
        <View style={styles.actionItem}>
          <Send2 size={28} color="#FFF" variant="Bold" style={{ transform: [{ rotate: '-30deg' }] }} />
          <Text style={styles.actionCount}>{video.sharesFormatted}</Text>
        </View>
      </View>
    </View>
  );
}

export default function VideoPlayer({ videos: initialVideos, initialIndex = 0, onClose, onLoadMore, hasMore }: VideoPlayerProps) {
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState<TikTokVideo[]>(initialVideos);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handleEndReached = useCallback(async () => {
    if (loadingMore) return;
    if (videos.length > 0) {
      setLoadingMore(true);
      try {
        const res = await getRelatedVideos(videos[videos.length - 1].id);
        if (res.videos.length > 0) {
          const ids = new Set(videos.map(v => v.id));
          const fresh = res.videos.filter(v => !ids.has(v.id));
          if (fresh.length > 0) setVideos(prev => [...prev, ...fresh]);
        }
      } catch {}
      setLoadingMore(false);
    }
    if (onLoadMore && hasMore) onLoadMore();
  }, [videos, loadingMore, onLoadMore, hasMore]);

  const renderItem = useCallback(({ item, index }: { item: TikTokVideo; index: number }) => (
    <VideoCard video={item} isActive={index === activeIndex} />
  ), [activeIndex]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index,
  }), []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        initialScrollIndex={initialIndex}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={3}
        windowSize={5}
        ListFooterComponent={loadingMore ? (
          <View style={[styles.videoCard, styles.loadingCard]}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        ) : null}
      />

      {/* Back button */}
      <TouchableOpacity style={[styles.backButton, { top: insets.top + 10 }]} onPress={onClose} activeOpacity={0.7}>
        <ArrowLeft size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Counter */}
      <View style={[styles.counter, { top: insets.top + 16 }]}>
        <Text style={styles.counterText}>{activeIndex + 1} / {videos.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoCard: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, zIndex: 2 },
  bottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 280, zIndex: 2 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 3 },
  pauseOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 4 },
  pauseCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  bottomInfo: { position: 'absolute', bottom: 60, left: 16, right: 64, zIndex: 3 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#FFF' },
  creatorText: { marginLeft: 10, flex: 1 },
  creatorName: { color: '#FFF', fontSize: 15, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  verified: { color: '#3FC39E' },
  caption: { color: '#FFF', fontSize: 14, lineHeight: 20, marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  musicRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  musicText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, flex: 1 },
  sideActions: { position: 'absolute', right: 12, bottom: 120, alignItems: 'center', gap: 22, zIndex: 3 },
  actionItem: { alignItems: 'center' },
  actionCount: { color: '#FFF', fontSize: 12, fontWeight: '600', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  backButton: { position: 'absolute', left: 16, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  counter: { position: 'absolute', right: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  counterText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  loadingCard: { justifyContent: 'center', alignItems: 'center' },
});
