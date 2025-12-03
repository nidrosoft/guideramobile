/**
 * HERO IMAGE SECTION ORGANISM
 * 
 * Large hero image with gradient blur at the bottom
 * Blends smoothly into the content below
 */

import { View, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = width * 1.2; // 1.2 aspect ratio

interface HeroImageSectionProps {
  imageUrl: string;
}

export default function HeroImageSection({ imageUrl }: HeroImageSectionProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      >
        {/* Gradient overlay for smooth blend */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(245, 245, 247, 0.3)',
            'rgba(245, 245, 247, 0.7)',
            colors.background,
          ]}
          locations={[0, 0.7, 0.85, 1]}
          style={styles.gradient}
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
});
