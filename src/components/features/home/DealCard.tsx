import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { typography, spacing, borderRadius, colors } from '@/styles';

interface DealCardProps {
  title: string;
  discount: string;
  buttonText: string;
  backgroundColor: string;
  imageUrl?: string;
}

export default function DealCard({ 
  title, 
  discount, 
  buttonText, 
  backgroundColor,
  imageUrl 
}: DealCardProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Decorative elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeWave} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.discount}>{discount}</Text>
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>

      {/* Image (if provided) */}
      {imageUrl && (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 200,
    borderRadius: 26,
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -20,
    right: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 40,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorativeWave: {
    position: 'absolute',
    top: 60,
    right: 80,
    width: 50,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    maxWidth: '60%',
  },
  discount: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginTop: 'auto',
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#3FC39E',
  },
  image: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 160,
    height: 180,
  },
});
