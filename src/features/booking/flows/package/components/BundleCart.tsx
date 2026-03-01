/**
 * BUNDLE CART
 * 
 * Persistent cart showing selected items, pricing, and savings.
 * This is the key UX element that makes package booking feel unified.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import {
  Airplane,
  Building,
  Car,
  Map1,
  TickCircle,
  CloseCircle,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { usePackageStore, PackageCategory } from '../../../stores/usePackageStore';
import { BookOnProviderButton } from '../../../components/shared';
import { useDealRedirect } from '@/hooks/useDeals';

interface BundleCartProps {
  onContinue: () => void;
  onCategoryPress: (category: PackageCategory) => void;
  showContinue?: boolean;
  bottomInset?: number;
}

const CATEGORY_CONFIG: Record<PackageCategory, { icon: any; label: string; color: string }> = {
  flight: { icon: Airplane, label: 'Flight', color: colors.primary },
  hotel: { icon: Building, label: 'Hotel', color: colors.success },
  car: { icon: Car, label: 'Car', color: colors.warning },
  experience: { icon: Map1, label: 'Activities', color: colors.info },
};

export default function BundleCart({ 
  onContinue, 
  onCategoryPress,
  showContinue = true,
  bottomInset = 0,
}: BundleCartProps) {
  const { colors: tc } = useTheme();
  const { redirect } = useDealRedirect();
  const {
    tripSetup,
    selections,
    pricing,
    isCategoryComplete,
    isCategoryRequired,
    clearSelection,
    isSelectionComplete,
  } = usePackageStore();
  
  const handleRemove = (category: PackageCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearSelection(category);
  };
  
  const handleCategoryPress = (category: PackageCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategoryPress(category);
  };
  
  const canContinue = isSelectionComplete();
  
  // Get display info for each category
  const getCategoryInfo = (category: PackageCategory) => {
    const isComplete = isCategoryComplete(category);
    const isRequired = isCategoryRequired(category);
    
    switch (category) {
      case 'flight':
        if (selections.flight.outbound) {
          // Support both FlightCardData format and legacy Flight format
          const flight = selections.flight.outbound as any;
          const airlineName = flight.airlineName 
            || flight.segments?.[0]?.airline?.name 
            || 'Flight';
          return {
            title: airlineName,
            subtitle: isComplete ? 'Round trip' : 'One way selected',
            price: pricing.flight,
          };
        }
        return null;
        
      case 'hotel':
        if (selections.hotel.hotel && selections.hotel.room) {
          return {
            title: selections.hotel.hotel.name,
            subtitle: selections.hotel.room.name,
            price: pricing.hotel,
          };
        }
        return null;
        
      case 'car':
        if (selections.car) {
          return {
            title: `${selections.car.make} ${selections.car.model}`,
            subtitle: selections.car.rental.company.name,
            price: pricing.car,
          };
        }
        return null;
        
      case 'experience':
        if (selections.experiences.length > 0) {
          return {
            title: `${selections.experiences.length} experience${selections.experiences.length > 1 ? 's' : ''}`,
            subtitle: selections.experiences.map(e => e.title).join(', '),
            price: pricing.experiences,
          };
        }
        return null;
    }
  };
  
  return (
    <Animated.View 
      entering={FadeInUp.duration(400).springify()}
      style={[styles.container, { paddingBottom: spacing.lg + bottomInset }]}
    >
      {/* Selected Items Only */}
      <View style={styles.itemsContainer}>
        {(['flight', 'hotel', 'car', 'experience'] as PackageCategory[]).map((category) => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          const info = getCategoryInfo(category);
          const isComplete = isCategoryComplete(category);
          
          // Only show items that have been selected
          if (!info) return null;
          
          return (
            <Animated.View 
              key={category}
              entering={FadeIn.duration(300)}
              style={styles.cartItem}
            >
              <TouchableOpacity
                style={styles.itemContent}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
                  <Icon size={18} color={config.color} variant={isComplete ? 'Bold' : 'Linear'} />
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{info.title}</Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>{info.subtitle}</Text>
                </View>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.itemPrice}>${info.price}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemove(category)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <CloseCircle size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
      
      {/* Savings Badge */}
      {pricing.savings > 0 && (
        <Animated.View 
          entering={FadeIn.duration(300).delay(200)}
          style={styles.savingsBadge}
        >
          <TickCircle size={16} color={colors.success} variant="Bold" />
          <Text style={styles.savingsText}>
            Bundle Savings: <Text style={styles.savingsAmount}>-${pricing.savings.toFixed(0)}</Text>
            {' '}({pricing.savingsPercentage.toFixed(0)}% off)
          </Text>
        </Animated.View>
      )}
      
      {/* Required Items Prompt - only show when not complete */}
      {!canContinue && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.requiredPrompt}>
          <Text style={styles.requiredPromptText}>
            Select {!isCategoryComplete('flight') ? 'flight' : ''}{!isCategoryComplete('flight') && !isCategoryComplete('hotel') ? ' & ' : ''}{!isCategoryComplete('hotel') ? 'hotel' : ''} to continue
          </Text>
        </Animated.View>
      )}
      
      {/* Total & Book on Provider */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={[styles.totalLabel, { color: tc.textSecondary }]}>Package Total</Text>
          <Text style={[styles.totalAmount, { color: tc.textPrimary }]}>${pricing.total.toFixed(2)}</Text>
        </View>
        
        {showContinue && (
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <BookOnProviderButton
              provider="kiwi"
              price={`$${pricing.total.toFixed(0)}`}
              onPress={async () => {
                if (!canContinue) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  return;
                }
                await redirect({
                  deal_type: 'flight',
                  provider: 'kiwi',
                  affiliate_url: '',
                  deal_snapshot: {
                    title: `${tripSetup.origin?.name || ''} → ${tripSetup.destination?.name || ''}`,
                    subtitle: 'Package Deal',
                    provider: { code: 'kiwi', name: 'Kiwi.com' },
                    price: { amount: pricing.total, currency: 'USD', formatted: `$${pricing.total.toFixed(0)}` },
                  },
                  price_amount: pricing.total,
                  source: 'search',
                  origin: tripSetup.origin?.code,
                  destination: tripSetup.destination?.code,
                });
              }}
              disabled={!canContinue}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.md,
    // paddingBottom is applied dynamically with bottomInset
    // Strong shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  itemsContainer: {
    paddingHorizontal: spacing.md,
  },
  cartItem: {
    marginBottom: spacing.xs,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  removeButton: {
    padding: 4,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.lg,
  },
  savingsText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
  },
  savingsAmount: {
    fontWeight: typography.fontWeight.bold,
  },
  requiredPrompt: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  requiredPromptText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.sm,
  },
  totalContainer: {},
  totalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
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
