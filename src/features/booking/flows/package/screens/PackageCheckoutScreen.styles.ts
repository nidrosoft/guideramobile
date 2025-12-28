/**
 * PACKAGE CHECKOUT SCREEN STYLES
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  
  // Section
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  
  // Trip Summary
  tripSummaryCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  tripDestination: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  tripDates: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tripTravelers: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Selection Card
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  selectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  selectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectionPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  // Traveler Card
  travelerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  travelerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  travelerInfo: {
    flex: 1,
  },
  travelerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  travelerHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Extra Card
  extraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  extraCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  extraIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  extraIconSelected: {
    backgroundColor: colors.primary,
  },
  extraInfo: {
    flex: 1,
  },
  extraTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  extraTitleSelected: {
    color: colors.primary,
  },
  extraDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  extraPrice: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  extraPriceText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  extraPriceSelected: {
    color: colors.primary,
  },
  
  // Pricing Card
  pricingCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  pricingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  pricingValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  discountRow: {
    backgroundColor: colors.success + '10',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  discountLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  discountValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing.sm,
  },
  totalRow: {
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  totalValue: {
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
    fontWeight: typography.fontWeight.medium,
    color: colors.success,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    ...shadows.lg,
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  footerTotalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  payButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
