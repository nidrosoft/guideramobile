/**
 * NotificationPreferencesCard
 * 
 * A settings card for managing notification preferences.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { Notification, TickCircle, CloseCircle } from 'iconsax-react-native';
import { colors, typography, spacing } from '@/styles';
import { 
  notificationService, 
  NotificationPreferences,
  requestNotificationPermissions,
} from '@/services/notifications';

interface PreferenceItemProps {
  title: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

function PreferenceItem({ title, description, value, onToggle, disabled }: PreferenceItemProps) {
  return (
    <View style={[styles.preferenceItem, disabled && styles.preferenceItemDisabled]}>
      <View style={styles.preferenceText}>
        <Text style={[styles.preferenceTitle, disabled && styles.textDisabled]}>{title}</Text>
        <Text style={[styles.preferenceDescription, disabled && styles.textDisabled]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.gray300, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

export function NotificationPreferencesCard() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences()
  );
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const enabled = await notificationService.areNotificationsEnabled();
    setPermissionGranted(enabled);
    setIsLoading(false);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermissions();
    setPermissionGranted(granted);
    
    if (!granted) {
      Alert.alert(
        'Notifications Disabled',
        'To enable notifications, please go to your device settings and allow notifications for Guidera.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => notificationService.cleanup() },
        ]
      );
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    await notificationService.setPreferences({ [key]: value });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Notification size={24} color={colors.primary} variant="Bold" />
        </View>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {!permissionGranted ? (
        <View style={styles.permissionBanner}>
          <CloseCircle size={20} color={colors.error} variant="Bold" />
          <Text style={styles.permissionText}>
            Notifications are disabled. Enable them to stay updated on your trips.
          </Text>
          <TouchableOpacity style={styles.enableButton} onPress={handleRequestPermission}>
            <Text style={styles.enableButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.enabledBanner}>
          <TickCircle size={20} color={colors.success} variant="Bold" />
          <Text style={styles.enabledText}>Notifications enabled</Text>
        </View>
      )}

      <View style={styles.preferencesContainer}>
        <PreferenceItem
          title="Master Toggle"
          description="Enable or disable all notifications"
          value={preferences.enabled}
          onToggle={(value) => updatePreference('enabled', value)}
          disabled={!permissionGranted}
        />

        <View style={styles.divider} />

        <PreferenceItem
          title="Booking Confirmations"
          description="Get notified when your bookings are confirmed"
          value={preferences.bookingConfirmations}
          onToggle={(value) => updatePreference('bookingConfirmations', value)}
          disabled={!permissionGranted || !preferences.enabled}
        />

        <PreferenceItem
          title="Trip Reminders"
          description="Receive reminders before your trips"
          value={preferences.tripReminders}
          onToggle={(value) => updatePreference('tripReminders', value)}
          disabled={!permissionGranted || !preferences.enabled}
        />

        <PreferenceItem
          title="Safety Alerts"
          description="Important safety information for your destinations"
          value={preferences.safetyAlerts}
          onToggle={(value) => updatePreference('safetyAlerts', value)}
          disabled={!permissionGranted || !preferences.enabled}
        />

        <PreferenceItem
          title="Price Drops"
          description="Get notified when prices drop for saved searches"
          value={preferences.priceDrops}
          onToggle={(value) => updatePreference('priceDrops', value)}
          disabled={!permissionGranted || !preferences.enabled}
        />

        <PreferenceItem
          title="Promotional"
          description="Deals, offers, and travel inspiration"
          value={preferences.promotional}
          onToggle={(value) => updatePreference('promotional', value)}
          disabled={!permissionGranted || !preferences.enabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    padding: spacing.lg,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}10`,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  permissionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
  },
  enableButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  enableButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  enabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}10`,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  enabledText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  preferencesContainer: {
    gap: spacing.xs,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  preferenceItemDisabled: {
    opacity: 0.5,
  },
  preferenceText: {
    flex: 1,
    marginRight: spacing.md,
  },
  preferenceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray900,
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  textDisabled: {
    color: colors.gray400,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.xs,
  },
});

export default NotificationPreferencesCard;
