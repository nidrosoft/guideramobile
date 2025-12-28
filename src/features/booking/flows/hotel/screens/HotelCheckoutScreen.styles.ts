/**
 * HOTEL CHECKOUT SCREEN STYLES
 * 
 * Extracted styles for HotelCheckoutScreen to keep the component file lean.
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  summaryArrow: {
    marginRight: spacing.md,
  },
  hotelImage: {
    width: 100,
    height: 100,
  },
  hotelInfo: {
    flex: 1,
    padding: spacing.md,
  },
  hotelName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  roomName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  nightsText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  // Section Card
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sectionIconComplete: {
    backgroundColor: colors.success,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Price Card
  priceCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  priceCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceLabelBold: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  priceValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing.md,
  },
  totalRow: {
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  // Payment Card
  paymentCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  paymentTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  paymentOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  paymentOptionTextInactive: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    ...shadows.lg,
  },
  footerPrice: {
    flex: 1,
  },
  footerLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footerTotal: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  confirmButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonProcessing: {
    opacity: 0.7,
  },
  confirmGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  confirmText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
