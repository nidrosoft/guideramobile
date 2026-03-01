/**
 * POST MEDIA GRID
 * 
 * Displays post photos in an adaptive grid layout.
 * 1 photo = full width, 2 = side by side, 3+ = grid with overflow count.
 */

import React, { memo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { borderRadius } from '@/styles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 3;

interface PostMediaGridProps {
  photos: string[];
  onPhotoPress?: (index: number) => void;
}

function PostMediaGrid({ photos, onPhotoPress }: PostMediaGridProps) {
  const { colors: tc } = useTheme();

  if (!photos.length) return null;

  const handlePress = (index: number) => {
    onPhotoPress?.(index);
  };

  if (photos.length === 1) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handlePress(0)}
        style={styles.container}
      >
        <Image
          source={{ uri: photos[0] }}
          style={[styles.singleImage, { backgroundColor: tc.borderSubtle }]}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  if (photos.length === 2) {
    return (
      <View style={[styles.container, styles.twoGrid]}>
        {photos.map((photo, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.9}
            onPress={() => handlePress(i)}
            style={styles.twoGridItem}
          >
            <Image
              source={{ uri: photo }}
              style={[styles.twoImage, { backgroundColor: tc.borderSubtle }]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // 3+ photos: first large, rest in column
  const visiblePhotos = photos.slice(0, 3);
  const overflow = photos.length - 3;

  return (
    <View style={[styles.container, styles.multiGrid]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handlePress(0)}
        style={styles.multiGridMain}
      >
        <Image
          source={{ uri: visiblePhotos[0] }}
          style={[styles.multiMainImage, { backgroundColor: tc.borderSubtle }]}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.multiGridSide}>
        {visiblePhotos.slice(1).map((photo, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.9}
            onPress={() => handlePress(i + 1)}
            style={styles.multiGridSideItem}
          >
            <Image
              source={{ uri: photo }}
              style={[styles.multiSideImage, { backgroundColor: tc.borderSubtle }]}
              resizeMode="cover"
            />
            {i === 1 && overflow > 0 && (
              <View style={styles.overflowOverlay}>
                <Text style={styles.overflowText}>+{overflow}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default memo(PostMediaGrid);

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
  },
  twoGrid: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  twoGridItem: {
    flex: 1,
  },
  twoImage: {
    width: '100%',
    height: 180,
  },
  multiGrid: {
    flexDirection: 'row',
    height: 220,
    gap: GRID_GAP,
  },
  multiGridMain: {
    flex: 2,
  },
  multiMainImage: {
    width: '100%',
    height: '100%',
  },
  multiGridSide: {
    flex: 1,
    gap: GRID_GAP,
  },
  multiGridSideItem: {
    flex: 1,
    position: 'relative',
  },
  multiSideImage: {
    width: '100%',
    height: '100%',
  },
  overflowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overflowText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
