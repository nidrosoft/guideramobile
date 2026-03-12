/**
 * HOTEL RESULTS SCREEN STYLES
 *
 * Matches FlightResultsScreen styling for visual consistency.
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: spacing.lg,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
    alignItems: 'center',
  },
  routeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Date Scroll — matches flight date chips
  dateScrollContainer: {
    borderBottomWidth: 1,
  },
  dateScrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 110,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateDay: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  dateNum: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginVertical: 2,
  },
  datePrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  // Filters — pill-shaped, matching flight filter bar
  filtersContainer: {
    zIndex: 100,
    borderBottomWidth: 1,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    minHeight: 40,
    gap: 6,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    marginRight: spacing.xs,
  },
  filterDropdown: {
    position: 'absolute',
    top: 52,
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 280,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  filterOptionText: {
    fontSize: typography.fontSize.base,
  },

  // Results
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
