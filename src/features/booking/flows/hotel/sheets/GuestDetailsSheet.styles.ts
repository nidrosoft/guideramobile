/**
 * GUEST DETAILS SHEET STYLES
 * 
 * Extracted styles for GuestDetailsSheet to keep the component file lean.
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E9EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  // Guest Card
  guestCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E6E9EB',
    overflow: 'hidden',
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  guestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  guestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestIconComplete: {
    backgroundColor: colors.success,
  },
  guestTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  guestEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.error}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestForm: {
    padding: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  // Input Fields
  inputRow: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 48,
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  dateText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.gray400,
  },
  // Date Picker
  datePickerContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E9EB',
  },
  datePickerDoneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  datePickerDoneText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  // Add Guest Button
  addGuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addGuestText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  // Footer
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E6E9EB',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
