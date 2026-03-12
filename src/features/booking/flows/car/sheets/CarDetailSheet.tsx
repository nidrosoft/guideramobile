/**
 * CAR DETAIL SHEET
 *
 * Full car details view with specs and features.
 * Theme-aware for dark/light mode.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  People,
  Briefcase,
  Setting4,
  Star1,
  TickCircle,
  Wind,
  Speedometer,
  Car as CarIcon,
  ArrowRight2,
  ExportSquare,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Car } from '../../../types/car.types';
import { useCarStore } from '../../../stores/useCarStore';
import { useDealRedirect } from '@/hooks/useDeals';

interface CarDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (car: Car) => void;
  car: Car | null;
}

export default function CarDetailSheet({ visible, onClose, onSelect, car }: CarDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { getRentalDays } = useCarStore();
  const { redirect } = useDealRedirect();
  const rentalDays = getRentalDays();

  const handleBookOnProvider = async () => {
    if (!car) return;
    const carAny = car as any;
    const companyName = carAny.company?.name || carAny.provider?.name || car.rental?.company?.name || 'Rental';
    const priceAmt = typeof car.rental.pricePerDay === 'number'
      ? car.rental.pricePerDay
      : car.rental.pricePerDay?.amount || 0;
    const totalPrice = priceAmt * rentalDays;

    const { searchParams } = useCarStore.getState();
    const pickupName = searchParams.pickupLocation?.name || searchParams.pickupLocation?.code || '';
    const pickupDate = searchParams.pickupDate instanceof Date
      ? searchParams.pickupDate.toISOString()
      : searchParams.pickupDate
        ? new Date(searchParams.pickupDate).toISOString()
        : new Date().toISOString();
    const returnDate = searchParams.returnDate instanceof Date
      ? searchParams.returnDate.toISOString()
      : searchParams.returnDate
        ? new Date(searchParams.returnDate).toISOString()
        : new Date(Date.now() + rentalDays * 86400000).toISOString();

    await redirect({
      deal_type: 'car',
      provider: 'rentalcars',
      affiliate_url: carAny.deepLink || '',
      deep_link: carAny.deepLink || '',
      date: pickupDate,
      return_date: returnDate,
      location: pickupName,
      deal_snapshot: {
        title: `${car.name} - ${companyName}`,
        subtitle: `${rentalDays} days`,
        provider: { code: 'rentalcars', name: 'Rentalcars.com' },
        price: { amount: totalPrice, currency: 'USD', formatted: `$${totalPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
        car: {
          name: car.name,
          category: car.category,
          company: companyName,
          pickupLocation: pickupName,
          dropoffLocation: pickupName,
          pickupDate,
          dropoffDate: returnDate,
        },
      },
      price_amount: totalPrice,
      source: 'search',
    });
  };

  if (!car) return null;

  const transmissionLabel = car.specs.transmission === 'automatic' ? 'Automatic' : 'Manual';
  const priceAmt = typeof car.rental.pricePerDay === 'number'
    ? car.rental.pricePerDay
    : car.rental.pricePerDay?.amount || 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md, backgroundColor: tc.bgElevated }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: tc.borderSubtle }]}>
            <Text style={[styles.title, { color: tc.textPrimary }]}>Car Details</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={tc.textSecondary} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Car Image */}
            <View style={[styles.imageContainer, { backgroundColor: `${tc.primary}08` }]}>
              {car.images?.[0] ? (
                <Image source={{ uri: car.images[0] }} style={styles.image} resizeMode="contain" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={[styles.placeholderIconCircle, { backgroundColor: `${tc.primary}15` }]}>
                    <CarIcon size={48} color={tc.primary} variant="Bold" />
                  </View>
                  <Text style={[styles.imagePlaceholderText, { color: tc.textSecondary }]}>{car.name}</Text>
                </View>
              )}
            </View>

            {/* Car Name & Company */}
            <View style={[styles.nameSection, { borderBottomColor: tc.borderSubtle }]}>
              <Text style={[styles.carName, { color: tc.textPrimary }]}>{car.name}</Text>
              <Text style={[styles.carCategory, { color: tc.textSecondary }]}>or similar {car.category}</Text>
              <View style={styles.companyRow}>
                <Text style={[styles.companyName, { color: tc.textPrimary }]}>{car.rental.company.name}</Text>
                <View style={styles.ratingContainer}>
                  <Star1 size={14} color={tc.warning} variant="Bold" />
                  <Text style={[styles.rating, { color: tc.textPrimary }]}>{car.rental.company.rating}</Text>
                  <Text style={[styles.reviews, { color: tc.textSecondary }]}>({car.rental.company.reviewCount} reviews)</Text>
                </View>
              </View>
            </View>

            {/* Specifications */}
            <View style={[styles.section, { borderBottomColor: tc.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Specifications</Text>
              <View style={styles.specsGrid}>
                <View style={[styles.specCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
                  <People size={24} color={tc.primary} />
                  <Text style={[styles.specValue, { color: tc.textPrimary }]}>{car.specs.seats}</Text>
                  <Text style={[styles.specLabel, { color: tc.textSecondary }]}>Seats</Text>
                </View>
                <View style={[styles.specCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
                  <Briefcase size={24} color={tc.primary} />
                  <Text style={[styles.specValue, { color: tc.textPrimary }]}>{car.specs.luggage.large + car.specs.luggage.small}</Text>
                  <Text style={[styles.specLabel, { color: tc.textSecondary }]}>Bags</Text>
                </View>
                <View style={[styles.specCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
                  <Setting4 size={24} color={tc.primary} />
                  <Text style={[styles.specValue, { color: tc.textPrimary }]}>{transmissionLabel}</Text>
                  <Text style={[styles.specLabel, { color: tc.textSecondary }]}>Transmission</Text>
                </View>
                <View style={[styles.specCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
                  <Speedometer size={24} color={tc.primary} />
                  <Text style={[styles.specValue, { color: tc.textPrimary }]}>
                    {car.specs.mileage === 'unlimited' ? 'Unlimited' : `${car.specs.mileage} mi`}
                  </Text>
                  <Text style={[styles.specLabel, { color: tc.textSecondary }]}>Mileage</Text>
                </View>
              </View>
            </View>

            {/* Features */}
            <View style={[styles.section, { borderBottomColor: tc.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Features</Text>
              <View style={styles.featuresList}>
                {car.specs.airConditioning && (
                  <View style={styles.featureItem}>
                    <TickCircle size={18} color={tc.success} variant="Bold" />
                    <Text style={[styles.featureText, { color: tc.textPrimary }]}>Air Conditioning</Text>
                  </View>
                )}
                {car.specs.mileage === 'unlimited' && (
                  <View style={styles.featureItem}>
                    <TickCircle size={18} color={tc.success} variant="Bold" />
                    <Text style={[styles.featureText, { color: tc.textPrimary }]}>Unlimited Mileage</Text>
                  </View>
                )}
                {car.specs.transmission === 'automatic' && (
                  <View style={styles.featureItem}>
                    <TickCircle size={18} color={tc.success} variant="Bold" />
                    <Text style={[styles.featureText, { color: tc.textPrimary }]}>Automatic Transmission</Text>
                  </View>
                )}
                {car.rental?.policies?.cancellation?.freeBefore > 0 && (
                  <View style={styles.featureItem}>
                    <TickCircle size={18} color={tc.success} variant="Bold" />
                    <Text style={[styles.featureText, { color: tc.textPrimary }]}>Free Cancellation</Text>
                  </View>
                )}
                {car.features?.filter((feature) => {
                  const name = feature.name.toLowerCase();
                  return !name.includes('air conditioning') &&
                    !name.includes('unlimited') &&
                    !name.includes('automatic') &&
                    !name.includes('free cancellation');
                }).map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <TickCircle size={18} color={feature.included ? tc.success : tc.textSecondary} variant="Bold" />
                    <Text style={[
                      styles.featureText,
                      { color: tc.textPrimary },
                      !feature.included && { color: tc.textSecondary, textDecorationLine: 'line-through' },
                    ]}>
                      {feature.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fuel Policy */}
            <View style={[styles.section, { borderBottomColor: tc.borderSubtle }]}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Fuel Policy</Text>
              <View style={[styles.policyCard, { backgroundColor: `${tc.primary}10`, borderColor: tc.borderSubtle }]}>
                <Wind size={20} color={tc.primary} />
                <Text style={[styles.policyText, { color: tc.textPrimary }]}>
                  {car.specs.fuelPolicy === 'full_to_full'
                    ? 'Full to Full - Return with a full tank'
                    : car.specs.fuelPolicy === 'full_to_empty'
                    ? 'Full to Empty - No need to refuel'
                    : 'Same to Same - Return with same level'}
                </Text>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: tc.bgElevated, borderTopColor: tc.borderSubtle }]}>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: tc.textSecondary }]}>Total for {rentalDays} days</Text>
              <Text style={[styles.priceValue, { color: tc.primary }]}>
                ${(priceAmt * rentalDays).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.bookButton, { backgroundColor: tc.primary }]}
              onPress={handleBookOnProvider}
              activeOpacity={0.85}
            >
              <Text style={styles.bookButtonText}>Book</Text>
              <ExportSquare size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, height: '85%' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1,
  },
  title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  content: { flexGrow: 1 },
  imageContainer: { height: 180, justifyContent: 'center', alignItems: 'center' },
  image: { width: '80%', height: '80%' },
  imagePlaceholder: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  placeholderIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholderText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, marginTop: spacing.xs },
  nameSection: { padding: spacing.lg, borderBottomWidth: 1 },
  carName: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  carCategory: { fontSize: typography.fontSize.base, marginTop: 4 },
  companyRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  companyName: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  reviews: { fontSize: typography.fontSize.sm },
  section: { padding: spacing.lg, borderBottomWidth: 1 },
  sectionTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.md },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  specCard: {
    width: '48%', borderRadius: borderRadius.xl, padding: spacing.md,
    alignItems: 'center', borderWidth: 1.5,
  },
  specValue: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginTop: spacing.xs },
  specLabel: { fontSize: typography.fontSize.sm, marginTop: 2 },
  featuresList: { gap: spacing.sm },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { fontSize: typography.fontSize.base },
  policyCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.sm, borderWidth: 1,
  },
  policyText: { flex: 1, fontSize: typography.fontSize.base },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg,
    borderTopWidth: 1, gap: spacing.md,
  },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: typography.fontSize.sm },
  priceValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: borderRadius.full,
    gap: 8,
  },
  bookButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});
