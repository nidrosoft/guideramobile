/**
 * CACHED IMAGE
 * 
 * Wraps expo-image with:
 * - Disk + memory caching (expo-image default)
 * - Blurhash placeholder while loading
 * - Gradient fallback on error (no broken image icons)
 * - Smooth crossfade transition
 * 
 * Drop-in replacement for expo-image's <Image> in card components.
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image, type ImageProps, type ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';

// Generic travel/landscape blurhash placeholder (soft warm gradient look)
const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface CachedImageProps extends Omit<ImageProps, 'source' | 'style'> {
  /** Image URL string or source object */
  uri: string | undefined | null;
  /** Style applied to the image */
  style?: ImageStyle | ImageStyle[];
  /** Custom blurhash placeholder (optional) */
  blurhash?: string;
  /** Whether to show gradient fallback on error (default: true) */
  showFallback?: boolean;
}

export default function CachedImage({
  uri,
  style,
  blurhash = DEFAULT_BLURHASH,
  showFallback = true,
  contentFit = 'cover',
  transition = 300,
  ...rest
}: CachedImageProps) {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // If no URI or load failed, show gradient fallback
  if (!uri || hasError) {
    if (!showFallback) return null;
    return (
      <View style={[styles.fallbackContainer, style as any]}>
        <LinearGradient
          colors={[colors.bgElevated || '#2a2a3e', colors.bgSecondary || '#1a1a2e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      placeholder={{ blurhash }}
      cachePolicy="disk"
      recyclingKey={uri}
      onError={handleError}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    overflow: 'hidden',
  },
});
