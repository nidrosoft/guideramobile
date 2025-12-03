/**
 * CAR EXTRAS STEP
 * 
 * Protection packages and add-ons selection.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Shield,
  TickCircle,
  Gps,
  User,
  Wifi,
  ArrowRight2,
  Add,
  Minus,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useCarStore, PROTECTION_PACKAGES, AVAILABLE_EXTRAS } from '../../../stores/useCarStore';

interface ExtrasStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ExtrasStep({ onNext, onBack, onClose }: ExtrasStepProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedProtection,
    selectProtection,
    selectedExtras,
    toggleExtra,
    setExtraQuantity,
    pricing,
    getRentalDays,
  } = useCarStore();
  
  const rentalDays = getRentalDays();
  
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  const getExtraIcon = (iconName: string) => {
    switch (iconName) {
      case 'gps': return Gps;
      case 'user': return User;
      case 'wifi': return Wifi;
      default: return Shield;
    }
  };
  
  const isExtraSelected = (extraId: string) => {
    return selectedExtras.some(e => e.extra.id === extraId);
  };
  
  const getExtraQuantity = (extraId: string) => {
    const found = selectedExtras.find(e => e.extra.id === extraId);
    return found?.quantity || 0;
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Protection & Extras</Text>
          <Text style={styles.subtitle}>Choose your coverage and add-ons</Text>
        </Animated.View>
        
        {/* Protection Packages */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Protection Package</Text>
          
          {PROTECTION_PACKAGES.map((pkg, index) => {
            const isSelected = selectedProtection?.id === pkg.id;
            
            return (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.protectionCard, isSelected && styles.protectionCardSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  selectProtection(pkg);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.protectionHeader}>
                  <View style={styles.protectionInfo}>
                    <View style={styles.protectionTitleRow}>
                      <Text style={[styles.protectionName, isSelected && styles.protectionNameSelected]}>
                        {pkg.name}
                      </Text>
                      {pkg.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.protectionDesc}>{pkg.description}</Text>
                  </View>
                  
                  <View style={styles.protectionPrice}>
                    {pkg.pricePerDay === 0 ? (
                      <Text style={styles.includedText}>Included</Text>
                    ) : (
                      <>
                        <Text style={styles.priceAmount}>+${pkg.pricePerDay}</Text>
                        <Text style={styles.priceLabel}>/day</Text>
                      </>
                    )}
                  </View>
                </View>
                
                <View style={styles.coverageList}>
                  {pkg.coverage.map((item, i) => (
                    <View key={i} style={styles.coverageItem}>
                      <TickCircle size={14} color={isSelected ? colors.primary : colors.success} variant="Bold" />
                      <Text style={styles.coverageText}>{item}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.excessRow}>
                  <Text style={styles.excessLabel}>Excess/Deductible:</Text>
                  <Text style={[styles.excessValue, pkg.excessAmount === 0 && styles.excessZero]}>
                    {pkg.excessAmount === 0 ? 'None' : `$${pkg.excessAmount}`}
                  </Text>
                </View>
                
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <TickCircle size={24} color={colors.primary} variant="Bold" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
        
        {/* Extras */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Optional Extras</Text>
          
          {AVAILABLE_EXTRAS.filter(e => e.id !== 'prepaid_fuel').map((extra) => {
            const Icon = getExtraIcon(extra.icon);
            const isSelected = isExtraSelected(extra.id);
            const quantity = getExtraQuantity(extra.id);
            
            return (
              <TouchableOpacity
                key={extra.id}
                style={[styles.extraCard, isSelected && styles.extraCardSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleExtra(extra);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.extraIcon, isSelected && styles.extraIconSelected]}>
                  <Icon size={20} color={isSelected ? colors.white : colors.primary} />
                </View>
                
                <View style={styles.extraInfo}>
                  <Text style={styles.extraName}>{extra.name}</Text>
                  <Text style={styles.extraDesc}>{extra.description}</Text>
                </View>
                
                <View style={styles.extraRight}>
                  <Text style={styles.extraPrice}>+${extra.pricePerDay}/day</Text>
                  
                  {isSelected && extra.maxQuantity > 1 && (
                    <View style={styles.quantityControl}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setExtraQuantity(extra.id, quantity - 1);
                        }}
                      >
                        <Minus size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.quantityValue}>{quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setExtraQuantity(extra.id, quantity + 1);
                        }}
                      >
                        <Add size={14} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
        
        {/* Price Summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Protection ({rentalDays} days)</Text>
            <Text style={styles.summaryValue}>${pricing.protectionCost.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Extras ({rentalDays} days)</Text>
            <Text style={styles.summaryValue}>${pricing.extrasCost.toFixed(0)}</Text>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceAmount}>${pricing.total.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Driver Details</Text>
            <ArrowRight2 size={18} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
  
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  
  // Protection Card
  protectionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  protectionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  protectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  protectionInfo: { flex: 1 },
  protectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  protectionName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  protectionNameSelected: { color: colors.primary },
  recommendedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  protectionDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  protectionPrice: { alignItems: 'flex-end' },
  includedText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  priceAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  coverageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coverageText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  excessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  excessLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  excessValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  excessZero: { color: colors.success },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  
  // Extra Card
  extraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  extraCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  extraIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraIconSelected: { backgroundColor: colors.primary },
  extraInfo: { flex: 1, marginLeft: spacing.md },
  extraName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  extraDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  extraRight: { alignItems: 'flex-end' },
  extraPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  
  // Summary
  summaryCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPrice: { flex: 1 },
  footerPriceLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  footerPriceAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  continueButton: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
