/**
 * LANDMARK INFO SHEET
 * 
 * Bottom sheet displaying landmark information.
 * Shows history, details, photos, etc.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Location, Calendar, Star1 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface Landmark {
  name: string;
  description: string;
  location: string;
  yearBuilt?: number;
  rating?: number;
  imageUrl?: string;
  facts?: string[];
}

interface LandmarkInfoSheetProps {
  landmark: Landmark;
}

export default function LandmarkInfoSheet({ landmark }: LandmarkInfoSheetProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Landmark Image */}
      {landmark.imageUrl && (
        <Image 
          source={{ uri: landmark.imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Landmark Name */}
      <Text style={styles.name}>{landmark.name}</Text>

      {/* Info Row */}
      <View style={styles.infoRow}>
        {landmark.location && (
          <View style={styles.infoItem}>
            <Location size={16} color={colors.primary} variant="Bold" />
            <Text style={styles.infoText}>{landmark.location}</Text>
          </View>
        )}
        
        {landmark.yearBuilt && (
          <View style={styles.infoItem}>
            <Calendar size={16} color={colors.primary} variant="Bold" />
            <Text style={styles.infoText}>{landmark.yearBuilt}</Text>
          </View>
        )}
        
        {landmark.rating && (
          <View style={styles.infoItem}>
            <Star1 size={16} color={colors.warning} variant="Bold" />
            <Text style={styles.infoText}>{landmark.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{landmark.description}</Text>
      </View>

      {/* Interesting Facts */}
      {landmark.facts && landmark.facts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interesting Facts</Text>
          {landmark.facts.map((fact, index) => (
            <View key={index} style={styles.factItem}>
              <View style={styles.factBullet} />
              <Text style={styles.factText}>{fact}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  factBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  factText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
