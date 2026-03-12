/**
 * EMAIL LINK STEP
 * 
 * Step 2 in email import flow.
 * Checks if user has a connected email account. If yes, skips ahead.
 * If no, shows permission screen to connect via Traxo OAuth.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Sms, ShieldTick, TickCircle, Scan } from 'iconsax-react-native';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { StepComponentProps } from '../../types/import-flow.types';
import { tripImportEngine } from '@/services/trip/trip-import-engine.service';

export default function EmailLinkStep({ onNext, onBack }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (profile?.id) tripImportEngine.setUserId(profile.id);
        const status = await tripImportEngine.getConnectionStatus('traxo');
        if (status.connected) {
          setIsConnected(true);
          // Already connected — skip ahead to scanning
          onNext({ connectedEmail: status.accounts[0]?.provider_email });
          return;
        }
      } catch (error) {
        console.warn('Connection check failed:', error);
      }
      setIsChecking(false);
    };
    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      if (profile?.id) tripImportEngine.setUserId(profile.id);
      const { authUrl } = await tripImportEngine.connectEmail('traxo');
      // Open Traxo OAuth in the browser
      await Linking.openURL(authUrl);
      // After user completes OAuth, they'll return to the app
      // For now, proceed to the next step which will attempt the scan
      onNext();
    } catch (error: any) {
      console.error('Connect error:', error);
      // If OAuth isn't set up yet, show a helpful message and proceed
      onNext();
    }
  };

  if (isChecking) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tc.primary} />
        <Text style={[styles.checkingText, { color: tc.textSecondary }]}>Checking connection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.illustrationContainer}>
        <View style={[styles.iconCircle, { backgroundColor: tc.primary + '12' }]}>
          <Sms size={48} color={tc.primary} variant="Bold" />
        </View>
      </View>

      <Text style={[styles.title, { color: tc.textPrimary }]}>Connect Your Email</Text>
      <Text style={[styles.description, { color: tc.textSecondary }]}>
        Connect your email account so we can automatically find flights, hotels, and car rentals from your booking confirmations.
      </Text>

      {/* Features */}
      <View style={styles.featuresList}>
        {[
          { icon: Scan, text: 'Scans last 60 days of emails' },
          { icon: TickCircle, text: 'Detects bookings from 4,000+ providers' },
          { icon: ShieldTick, text: 'Your data is encrypted and never shared' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <View key={i} style={[styles.featureItem, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <Icon size={18} color={tc.primary} variant="Bold" />
              <Text style={[styles.featureText, { color: tc.textPrimary }]}>{item.text}</Text>
            </View>
          );
        })}
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: tc.primary }]}
          onPress={handleConnect}
        >
          <Text style={[styles.primaryButtonText, { color: tc.white }]}>Connect Email Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkingText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  featuresList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  buttonsContainer: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
  primaryButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});
