/**
 * REVIEW STEP
 * 
 * Review all package selections before proceeding to traveler details.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Airplane,
  Building,
  Car,
  Map1,
  Calendar,
  People,
  TickCircle,
  ArrowRight2,
  Edit2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { usePackageStore } from '../../../stores/usePackageStore';

interface ReviewStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ReviewStep({ onNext, onBack, onClose }: ReviewStepProps) {
  const insets = useSafeAreaInsets();
  const {
    tripSetup,
    selections,
    pricing,
    getNights,
    getTotalTravelers,
  } = usePackageStore();
  
  const nights = getNights();
  const travelers = getTotalTravelers();
  
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Review Your Package</Text>
          <Text style={styles.subtitle}>
            {tripSetup.destination?.name} • {nights} nights • {travelers} traveler{travelers > 1 ? 's' : ''}
          </Text>
        </Animated.View>
        
        {/* Trip Timeline */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.timeline}>
          {/* Departure */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <Calendar size={16} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>{formatDate(tripSetup.departureDate)}</Text>
              <Text style={styles.timelineLabel}>Departure from {tripSetup.origin?.name}</Text>
            </View>
          </View>
          
          <View style={styles.timelineLine} />
          
          {/* Return */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <Calendar size={16} color={colors.success} variant="Bold" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>{formatDate(tripSetup.returnDate)}</Text>
              <Text style={styles.timelineLabel}>Return to {tripSetup.origin?.name}</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Flight Card */}
        {selections.flight.outbound && (
          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <SelectionCard
              icon={Airplane}
              iconColor={colors.primary}
              title="Flights"
              subtitle={`${selections.flight.outbound.segments[0]?.airline?.name || 'Airline'} • Round trip`}
              price={pricing.flight}
              onEdit={() => {}}
            />
          </Animated.View>
        )}
        
        {/* Hotel Card */}
        {selections.hotel.hotel && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <SelectionCard
              icon={Building}
              iconColor={colors.success}
              title={selections.hotel.hotel.name}
              subtitle={`${selections.hotel.room?.name || 'Room'} • ${nights} nights`}
              price={pricing.hotel}
              image={selections.hotel.hotel.images[0]?.url}
              onEdit={() => {}}
            />
          </Animated.View>
        )}
        
        {/* Car Card */}
        {selections.car && (
          <Animated.View entering={FadeInDown.duration(400).delay(250)}>
            <SelectionCard
              icon={Car}
              iconColor={colors.warning}
              title={`${selections.car.make} ${selections.car.model}`}
              subtitle={selections.car.rental.company.name}
              price={pricing.car}
              onEdit={() => {}}
            />
          </Animated.View>
        )}
        
        {/* Price Summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.priceSummary}>
          <Text style={styles.priceSummaryTitle}>Price Summary</Text>
          
          {pricing.flight > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Flights ({travelers} travelers)</Text>
              <Text style={styles.priceValue}>${pricing.flight}</Text>
            </View>
          )}
          
          {pricing.hotel > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Hotel ({nights} nights)</Text>
              <Text style={styles.priceValue}>${pricing.hotel}</Text>
            </View>
          )}
          
          {pricing.car > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Car Rental</Text>
              <Text style={styles.priceValue}>${pricing.car}</Text>
            </View>
          )}
          
          {pricing.bundleDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.success }]}>Bundle Discount</Text>
              <Text style={[styles.priceValue, { color: colors.success }]}>-${pricing.bundleDiscount.toFixed(0)}</Text>
            </View>
          )}
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes & Fees</Text>
            <Text style={styles.priceValue}>${(pricing.taxes + pricing.fees).toFixed(2)}</Text>
          </View>
          
          <View style={styles.priceDivider} />
          
          <View style={styles.priceRowTotal}>
            <Text style={styles.priceLabelTotal}>Total</Text>
            <Text style={styles.priceValueTotal}>${pricing.total.toFixed(2)}</Text>
          </View>
          
          {pricing.savings > 0 && (
            <View style={styles.savingsBadge}>
              <TickCircle size={16} color={colors.success} variant="Bold" />
              <Text style={styles.savingsText}>
                You're saving ${pricing.savings.toFixed(0)} by bundling!
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Continue to Traveler Details</Text>
            <ArrowRight2 size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Selection Card Component
interface SelectionCardProps {
  icon: any;
  iconColor: string;
  title: string;
  subtitle: string;
  price: number;
  image?: string;
  onEdit: () => void;
}

function SelectionCard({ icon: Icon, iconColor, title, subtitle, price, image, onEdit }: SelectionCardProps) {
  return (
    <View style={styles.selectionCard}>
      {image && <Image source={{ uri: image }} style={styles.cardImage} resizeMode="cover" />}
      <View style={styles.cardContent}>
        <View style={[styles.cardIcon, { backgroundColor: iconColor + '15' }]}>
          <Icon size={20} color={iconColor} variant="Bold" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.cardPrice}>
          <Text style={styles.cardPriceAmount}>${price}</Text>
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Edit2 size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  
  // Timeline
  timeline: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  timelineItem: { flexDirection: 'row', alignItems: 'center' },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: { marginLeft: spacing.md },
  timelineDate: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  timelineLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.gray200,
    marginLeft: 17,
    marginVertical: spacing.xs,
  },
  
  // Selection Card
  selectionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardImage: { width: '100%', height: 100 },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardPrice: { alignItems: 'flex-end', gap: spacing.xs },
  cardPriceAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  
  // Price Summary
  priceSummary: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  priceSummaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  priceValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  priceRowTotal: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabelTotal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  priceValueTotal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.lg,
  },
  savingsText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  continueButton: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
