/**
 * CACHED IMAGE
 *
 * Wraps expo-image with:
 * - Disk + memory caching (expo-image default)
 * - Smooth crossfade transition
 * - Completely invisible when image is missing or fails (no fallback colors)
 *
 * Drop-in replacement for expo-image's <Image> in card components.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, type StyleProp } from 'react-native';
import { Image, type ImageProps, type ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchDestinationCoverImage } from '@/utils/destinationImage';

/**
 * Deterministic, pleasant gradient derived from a label so a given destination
 * always renders the same branded placeholder instead of a blank box.
 */
const PLACEHOLDER_GRADIENTS: [string, string][] = [
  ['#0EA5E9', '#2563EB'],
  ['#10B981', '#0D9488'],
  ['#F59E0B', '#EA580C'],
  ['#8B5CF6', '#6366F1'],
  ['#EC4899', '#BE185D'],
  ['#14B8A6', '#0891B2'],
  ['#F43F5E', '#9F1239'],
  ['#84CC16', '#15803D'],
];

function gradientForLabel(label: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return PLACEHOLDER_GRADIENTS[hash % PLACEHOLDER_GRADIENTS.length];
}

interface CachedImageProps extends Omit<ImageProps, 'source' | 'style'> {
  /** Image URL string or source object */
  uri: string | undefined | null;
  /** Style applied to the image */
  style?: ImageStyle | ImageStyle[];
  /** Custom blurhash placeholder (optional — only shown while loading a valid URL) */
  blurhash?: string;
  /** Whether to show fallback on error (default: true) */
  showFallback?: boolean;
  /** Callback when image fails or is missing — parent can trigger a repair */
  onImageMissing?: () => void;
  /** Destination/city name used to fetch a fresh cover image when the provided URL is stale */
  fallbackCityName?: string;
}

export default function CachedImage({
  uri,
  style,
  blurhash,
  showFallback = true,
  contentFit = 'cover',
  transition = 300,
  onImageMissing,
  fallbackCityName,
  ...rest
}: CachedImageProps) {
  const sourceKey = `${uri || ''}|${fallbackCityName || ''}`;
  const [failedState, setFailedState] = useState<{ sourceKey: string; uri: string } | null>(null);
  const [fallbackState, setFallbackState] = useState<{ sourceKey: string; uri: string } | null>(
    null
  );
  const notifiedKeyRef = useRef<string | null>(null);
  const fallbackAttemptedKeyRef = useRef<string | null>(null);

  const fallbackUri = fallbackState?.sourceKey === sourceKey ? fallbackState.uri : '';
  const activeUri = fallbackUri || uri || '';
  const hasError = failedState?.sourceKey === sourceKey && failedState.uri === activeUri;

  const requestFallback = useCallback(async (): Promise<boolean> => {
    const cityName = fallbackCityName?.trim();
    if (!cityName || fallbackAttemptedKeyRef.current === sourceKey) return false;

    fallbackAttemptedKeyRef.current = sourceKey;
    const nextUri = await fetchDestinationCoverImage(cityName);
    if (!nextUri) return false;

    setFallbackState({ sourceKey, uri: nextUri });
    setFailedState(null);
    return true;
  }, [fallbackCityName, sourceKey]);

  const handleError = useCallback(() => {
    if (fallbackCityName?.trim() && fallbackAttemptedKeyRef.current !== sourceKey) {
      void requestFallback().then((foundFallback) => {
        if (!foundFallback && activeUri) setFailedState({ sourceKey, uri: activeUri });
      });
      return;
    }

    if (activeUri) setFailedState({ sourceKey, uri: activeUri });
  }, [activeUri, fallbackCityName, requestFallback, sourceKey]);

  // Notify parent when image is missing so it can trigger a background repair
  useEffect(() => {
    if ((!activeUri || hasError) && onImageMissing && notifiedKeyRef.current !== sourceKey) {
      notifiedKeyRef.current = sourceKey;
      onImageMissing();
    }
  }, [activeUri, hasError, onImageMissing, sourceKey]);

  // If no URI or load failed:
  // - With a destination label, render a branded gradient placeholder so the
  //   card always shows content (never a blank box).
  // - Otherwise collapse the space entirely (avatars, optional images, etc.).
  if (!activeUri || hasError) {
    const label = fallbackCityName?.trim();
    if (showFallback && label) {
      const [from, to] = gradientForLabel(label);
      const display = label.split(',')[0];
      return (
        <View style={[styles.placeholderContainer, style as StyleProp<ImageStyle>]}>
          <LinearGradient
            colors={[from, to]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.placeholderText} numberOfLines={2}>
            {display}
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <Image
      source={{ uri: activeUri }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      placeholder={blurhash ? { blurhash } : undefined}
      placeholderContentFit="cover"
      cachePolicy="disk"
      recyclingKey={activeUri}
      onError={handleError}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 12,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
