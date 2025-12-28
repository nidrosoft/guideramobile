/**
 * PACKAGE BUILD SCREEN STYLES
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
    paddingBottom: 280, // Increased to ensure content doesn't appear behind BundleCart
  },
  
  // Sticky Filters Container - stays fixed while cards scroll underneath
  stickyFiltersContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    zIndex: 10,
  },
  
  // Results Container
  resultsContainer: {
    padding: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  resultsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  resultsSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // View All Button
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  // Filter Chips
  filterScroll: {
    marginBottom: spacing.md,
    marginHorizontal: -spacing.lg,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Result Card
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.sm,
  },
  resultCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  resultTitleSelected: {
    color: colors.white,
  },
  resultSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceTextSelected: {
    color: colors.white,
  },
  priceUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  
  // Cart Wrapper - Fixed at bottom with proper elevation
  cartWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 20,
    // Shadow for visual separation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
});
