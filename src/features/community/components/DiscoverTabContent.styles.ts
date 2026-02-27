/**
 * DISCOVER TAB CONTENT STYLES
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: colors.gray400,
  },
  subTabsContainer: {
    marginBottom: spacing.sm,
  },
  subTabsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    gap: 6,
  },
  subTabActive: {
    backgroundColor: colors.primary,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray500,
  },
  subTabTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  horizontalScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  horizontalCard: {
    width: 280,
  },
  destinationCard: {
    width: 160,
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  destinationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  destinationCountry: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  travelerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  travelerCount: {
    fontSize: 11,
    color: colors.white,
  },
  destinationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  destinationGridCard: {
    width: '48%',
    height: 150,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  destinationGridImage: {
    width: '100%',
    height: '100%',
  },
  bottomPadding: {
    height: 100,
  },
});
