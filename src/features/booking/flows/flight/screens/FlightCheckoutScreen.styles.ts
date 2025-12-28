/**
 * FLIGHT CHECKOUT SCREEN STYLES
 * 
 * Extracted styles for FlightCheckoutScreen to keep the component file lean.
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  // Cards
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  selectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  selectionIconComplete: {
    backgroundColor: colors.success,
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
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  // Sections
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconCompleted: {
    backgroundColor: colors.success,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  // Flight Summary
  flightSummary: {
    paddingTop: spacing.sm,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  routePoint: {
    alignItems: 'center',
  },
  routeTime: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  routeCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  routeLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  lineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray300,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  flightInfo: {
    alignItems: 'center',
  },
  flightInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Seats
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  seat: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatSelected: {
    backgroundColor: colors.primary,
  },
  seatAisle: {
    marginRight: spacing.lg,
  },
  seatText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  seatTextSelected: {
    color: colors.white,
  },
  seatLegend: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Extras
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  extraInfo: {
    flex: 1,
  },
  extraTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  extraPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnDisabled: {
    backgroundColor: colors.gray50,
  },
  counterValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  mealOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  mealOptionSelected: {
    backgroundColor: colors.primary,
  },
  mealOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  mealOptionTextSelected: {
    color: colors.white,
  },
  // Form
  formGroup: {
    gap: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formField: {
    flex: 1,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  // Payment
  paymentMethods: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray50,
    gap: spacing.md,
  },
  paymentMethodSelected: {
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  paymentIcon: {
    fontSize: 20,
  },
  paymentLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  paymentLabelSelected: {
    fontWeight: typography.fontWeight.medium,
  },
  cardForm: {
    gap: spacing.md,
  },
  // Bottom Bar
  bottomBar: {
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
  },
  priceBreakdown: {
    flex: 1,
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  bookButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  bookButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
