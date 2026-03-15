/**
 * EMAIL LINK STEP
 * 
 * Step 2 in email import flow.
 * Shows the user's unique import email address.
 * User forwards their booking confirmation to this address.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Sms, ShieldTick, TickCircle, Copy, ExportSquare } from 'iconsax-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { StepComponentProps } from '../../types/import-flow.types';
import { emailImportService } from '@/services/emailImport.service';

export default function EmailLinkStep({ onNext }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const { showSuccess } = useToast();

  const importAddress = profile?.id
    ? emailImportService.getImportAddress(profile.id)
    : 'import@guidera.one';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(importAddress);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Email address copied!');
  };

  const handleOpenMail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${importAddress}?subject=Booking%20Confirmation`);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext({ connectedEmail: importAddress });
  };

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconRow}>
        <View style={[styles.iconCircle, { backgroundColor: tc.primary + '12' }]}>
          <Sms size={40} color={tc.primary} variant="Bold" />
        </View>
      </View>

      <Text style={[styles.title, { color: tc.textPrimary }]}>Forward Your Booking</Text>
      <Text style={[styles.description, { color: tc.textSecondary }]}>
        Forward your booking confirmation email to the address below. We'll automatically detect your flight, hotel, or car rental.
      </Text>

      {/* Import Address Card */}
      <View style={[styles.addressCard, { backgroundColor: tc.bgSunken || tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <Text style={[styles.addressLabel, { color: tc.textTertiary }]}>Your import address</Text>
        <Text style={[styles.addressText, { color: tc.primary }]} numberOfLines={1} selectable>
          {importAddress}
        </Text>
        <View style={styles.addressActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tc.primary }]} onPress={handleCopy} activeOpacity={0.8}>
            <Copy size={16} color="#FFFFFF" variant="Bold" />
            <Text style={styles.actionBtnText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: tc.info }]} onPress={handleOpenMail} activeOpacity={0.8}>
            <ExportSquare size={16} color="#FFFFFF" variant="Bold" />
            <Text style={styles.actionBtnText}>Open Mail</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresList}>
        {[
          { icon: TickCircle, text: 'Works with any email provider (Gmail, Outlook, Yahoo, etc.)' },
          { icon: TickCircle, text: 'Detects flights, hotels, car rentals & activities' },
          { icon: ShieldTick, text: 'Your data is encrypted and never shared' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <View key={i} style={styles.featureItem}>
              <Icon size={16} color={tc.success} variant="Bold" />
              <Text style={[styles.featureText, { color: tc.textSecondary }]}>{item.text}</Text>
            </View>
          );
        })}
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.continueBtn, { backgroundColor: tc.primary }]} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.continueBtnText}>I've Forwarded My Email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.md },
  iconRow: { alignItems: 'center', marginBottom: spacing.lg },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.fontSize.xl, fontWeight: '700', textAlign: 'center', marginBottom: spacing.xs },
  description: { fontSize: typography.fontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg, paddingHorizontal: spacing.sm },
  addressCard: { borderRadius: 16, padding: spacing.lg, borderWidth: 1, marginBottom: spacing.lg },
  addressLabel: { fontSize: typography.fontSize.xs, fontWeight: '600', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  addressText: { fontSize: typography.fontSize.base, fontWeight: '700', marginBottom: spacing.md },
  addressActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  actionBtnText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: '#FFFFFF' },
  featuresList: { gap: spacing.sm, marginBottom: spacing.lg },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingHorizontal: spacing.xs },
  featureText: { fontSize: typography.fontSize.xs, lineHeight: 18, flex: 1 },
  footer: { marginTop: 'auto', paddingBottom: spacing.md },
  continueBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { fontSize: typography.fontSize.base, fontWeight: '700', color: '#FFFFFF' },
});
