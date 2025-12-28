/**
 * FLIGHT RESULTS SCREEN STYLES
 * 
 * Extracted styles for FlightResultsScreen to keep the component file lean.
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    alignItems: 'center',
  },
  routeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  // Date Scroll
  dateScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    minWidth: 110,
    borderWidth: 1,
    borderColor: '#E6E9EB',
    // Elevation for 3D effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateItemSelected: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  dateDay: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dateDaySelected: {
    color: colors.textPrimary,
  },
  datePrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: `${colors.primary}60`,
  },
  datePriceSelected: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  // Filters
  filtersContainer: {
    zIndex: 100,
  },
  filtersRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E6E9EB',
    marginRight: spacing.sm,
    minHeight: 40,
    gap: 6,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  filterButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  filterTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  filterDropdown: {
    position: 'absolute',
    top: 52,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E6E9EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 250,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  filterOptionSelected: {
    backgroundColor: `${colors.primary}08`,
  },
  filterOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  filterOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  // Flight List
  flightList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  flightCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
    // Elevation for 3D effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Badge
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  badgeBestDeal: {
    backgroundColor: `${colors.primary}15`,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  badgeTextBestDeal: {
    color: colors.primary,
  },
  // Airline Row
  airlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  airlineLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  airlineName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  flightNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  // Times Row
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timeBlock: {
    alignItems: 'center',
  },
  time: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  airport: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  airportCode: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginTop: 2,
  },
  durationBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  duration: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  flightLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
  stops: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  directFlight: {
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  // Price Block
  priceBlock: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  // Bottom Row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  facilities: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  facilityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray50,
  },
  facilityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  // Calendar button in header
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
