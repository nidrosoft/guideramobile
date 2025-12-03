import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, typography, spacing } from '@/styles';
import { Bookmark, Star1, Location, People, TickCircle, ArrowRight } from 'iconsax-react-native';

interface FamilyFriendlyViewCardProps {
  name: string;
  location: string;
  rating: number;
  reviews: string;
  distance: string;
  ageRange: string;
  activities: number;
  safetyRating: string;
  imageUrl: string;
  onPress: () => void;
}

export default function FamilyFriendlyViewCard({ 
  name, location, rating, reviews, distance, ageRange, activities, safetyRating, imageUrl, onPress
}: FamilyFriendlyViewCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.backgroundImage} />
        <View style={styles.topSection}>
          <View style={styles.familyBadge}>
            <Text style={styles.familyBadgeIcon}>👍</Text>
            <Text style={styles.familyBadgeText}>Family Trusted</Text>
          </View>
          <TouchableOpacity style={styles.bookmarkButton}>
            <Bookmark size={20} color={colors.textPrimary} variant="Outline" />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomContainer}>
          <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
            <Text style={styles.locationText}>{location}</Text>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Star1 size={16} color="#FFA500" variant="Bold" />
                <Text style={styles.detailText}>{rating} ({reviews} Review)</Text>
              </View>
              <View style={styles.detailItem}>
                <Location size={16} color={colors.primary} variant="Bold" />
                <Text style={styles.detailText}>{distance}</Text>
              </View>
            </View>
            <View style={styles.familyInfoRow}>
              <View style={styles.familyInfoItem}>
                <People size={14} color={colors.white} variant="Outline" />
                <Text style={styles.familyInfoText}>Ages {ageRange}</Text>
              </View>
              <View style={styles.familyInfoItem}>
                <Text style={styles.familyInfoText}>{activities} Activities</Text>
              </View>
              <View style={styles.familyInfoItem}>
                <TickCircle size={14} color="#4CAF50" variant="Bold" />
                <Text style={styles.familyInfoText}>Safety {safetyRating}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>Explore</Text>
              <ArrowRight size={20} color={colors.white} variant="Outline" />
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  card: { height: 360, borderRadius: 32, overflow: 'hidden', position: 'relative' },
  backgroundImage: { width: '100%', height: '100%', position: 'absolute' },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  familyBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20 },
  familyBadgeIcon: { fontSize: 16 },
  familyBadgeText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  bookmarkButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  bottomContainer: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md, borderRadius: 24, overflow: 'hidden' },
  blurContainer: { padding: spacing.lg },
  locationText: { fontSize: typography.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  name: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.white, marginBottom: spacing.sm },
  detailsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: typography.fontSize.sm, color: colors.white },
  familyInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  familyInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12 },
  familyInfoText: { fontSize: typography.fontSize.xs, color: colors.white, fontWeight: typography.fontWeight.medium },
  exploreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 16 },
  exploreButtonText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.white },
});
