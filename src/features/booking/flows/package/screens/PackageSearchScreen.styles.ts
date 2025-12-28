/**
 * PACKAGE SEARCH SCREEN STYLES
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 160,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
    zIndex: 2,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: -40,
    zIndex: 20,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  
  // Package Type Card (overlapping header)
  packageTypeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  packageTypeTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  packageTypesContainer: {
    gap: spacing.sm,
    overflow: 'visible',
  },
  packageTypeOption: {
    width: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
    marginTop: 10,
  },
  packageTypeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  packageTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  packageTypeIconSelected: {
    backgroundColor: colors.primary,
  },
  packageTypeLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  packageTypeLabelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -20 }],
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    zIndex: 10,
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  
  // Field Cards
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  fieldPlaceholder: {
    color: colors.textSecondary,
  },
  
  // Date Row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nightsBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  nightsText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  
  // Summary Card
  summaryCard: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  includesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  includeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    zIndex: 100,
    ...shadows.lg,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
