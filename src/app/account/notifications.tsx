/**
 * NOTIFICATIONS SETTINGS SCREEN
 * 
 * Manage notification preferences grouped by category.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft2, 
  Notification,
  Airplane,
  Calendar,
  ShieldTick,
  PercentageCircle,
  Gift,
  Message,
  People,
  Setting2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { 
  notificationService, 
  NotificationPreferences,
} from '@/services/notifications/notificationService';

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  items: NotificationItem[];
}

interface NotificationItem {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
}

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuth();

  const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
    {
      id: 'trips',
      title: 'Trip Updates',
      description: 'Stay informed about your trips',
      icon: <Airplane size={20} color={tc.primary} variant="Bold" />,
      items: [
        {
          key: 'bookingConfirmations',
          title: 'Booking Confirmations',
          description: 'Get notified when your bookings are confirmed',
        },
        {
          key: 'tripReminders',
          title: 'Trip Reminders',
          description: 'Reminders at 7 days, 3 days, and 1 day before your trip',
        },
        {
          key: 'packingReminders',
          title: 'Packing Reminders',
          description: 'Reminders to pack and check your packing list',
        },
        {
          key: 'departureAdvisor',
          title: 'Departure Advisor',
          description: '"Time to leave" alerts so you never miss a flight',
        },
        {
          key: 'flightTracking',
          title: 'Flight Status',
          description: 'Delays, gate changes, and cancellations for your flights',
        },
      ],
    },
    {
      id: 'safety',
      title: 'Safety & Alerts',
      description: 'Important safety information',
      icon: <ShieldTick size={20} color={tc.success} variant="Bold" />,
      items: [
        {
          key: 'safetyAlerts',
          title: 'Safety Alerts',
          description: 'Travel advisories and safety updates for your destinations',
        },
        {
          key: 'weatherAlerts',
          title: 'Weather Alerts',
          description: 'Severe weather warnings at your destination',
        },
      ],
    },
    {
      id: 'deals',
      title: 'Deals & Offers',
      description: 'Never miss a great deal',
      icon: <PercentageCircle size={20} color={tc.warning} variant="Bold" />,
      items: [
        {
          key: 'priceDrops',
          title: 'Price Drop Alerts',
          description: 'Get notified when prices drop for saved searches',
        },
        {
          key: 'promotional',
          title: 'Promotions & Offers',
          description: 'Exclusive deals, offers, and travel inspiration',
        },
      ],
    },
    {
      id: 'community',
      title: 'Community & Social',
      description: 'Stay connected with fellow travelers',
      icon: <People size={20} color={tc.info || '#6366F1'} variant="Bold" />,
      items: [
        {
          key: 'communityMessages',
          title: 'Messages',
          description: 'Direct messages and group chat notifications',
        },
        {
          key: 'communityEvents',
          title: 'Events & Activities',
          description: 'New events, activities, and group updates',
        },
      ],
    },
  ];
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      if (profile?.id) {
        await notificationService.loadPreferencesFromDB(profile.id);
      }
      const prefs = notificationService.getPreferences();
      setPreferences(prefs);
      
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    await notificationService.setPreferences({ [key]: value }, profile?.id);
  };

  const handleMasterToggle = async (value: boolean) => {
    if (!preferences) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newPrefs = { ...preferences, enabled: value };
    setPreferences(newPrefs);
    await notificationService.setPreferences({ enabled: value }, profile?.id);
  };

  const handleRequestPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status === 'granted') {
      setPermissionGranted(true);
    } else {
      Alert.alert(
        'Notifications Disabled',
        'To enable notifications, please go to your device settings and allow notifications for Guidera.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: tc.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? '#1A1A1A' : tc.white, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{t('account.notifications.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Banner */}
        {!permissionGranted && (
          <TouchableOpacity style={[styles.permissionBanner, { backgroundColor: tc.primary }]} onPress={handleRequestPermission} accessibilityRole="button" accessibilityLabel="Enable notifications">
            <View style={styles.permissionIconContainer}>
              <Notification size={24} color="#FFFFFF" variant="Bold" />
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>{t('account.notifications.enableNotifications')}</Text>
              <Text style={styles.permissionDescription}>
                Allow notifications to stay updated on your trips and deals
              </Text>
            </View>
            <View style={styles.permissionArrow}>
              <Text style={styles.permissionArrowText}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Master Toggle */}
        <View style={[styles.masterToggleCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <View style={styles.masterToggleContent}>
            <View style={[styles.masterIconContainer, { backgroundColor: tc.primary + '15' }]}>
              <Setting2 size={24} color={tc.primary} variant="Bold" />
            </View>
            <View style={styles.masterTextContainer}>
              <Text style={[styles.masterTitle, { color: tc.textPrimary }]}>{t('account.notifications.allNotifications')}</Text>
              <Text style={[styles.masterDescription, { color: tc.textSecondary }]}>
                {preferences?.enabled ? 'Notifications are enabled' : 'Notifications are disabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences?.enabled ?? false}
            onValueChange={handleMasterToggle}
            disabled={!permissionGranted}
            trackColor={{ false: isDark ? '#39393D' : '#E9E9EA', true: tc.primary }}
            thumbColor={'#FFFFFF'}
            accessibilityRole="switch"
            accessibilityLabel="All notifications"
          />
        </View>

        {/* Notification Categories */}
        {NOTIFICATION_CATEGORIES.map((category) => (
          <View key={category.id} style={[styles.categoryCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <View style={[styles.categoryHeader, { borderBottomColor: tc.borderSubtle }]}>
              <View style={[styles.categoryIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : tc.gray50 }]}>
                {category.icon}
              </View>
              <View style={styles.categoryHeaderText}>
                <Text style={[styles.categoryTitle, { color: tc.textPrimary }]}>{category.title}</Text>
                <Text style={[styles.categoryDescription, { color: tc.textSecondary }]}>{category.description}</Text>
              </View>
            </View>
            
            <View style={styles.categoryItems}>
              {category.items.map((item, index) => (
                <View key={item.key}>
                  {index > 0 && <View style={[styles.itemDivider, { backgroundColor: tc.borderSubtle }]} />}
                  <View style={styles.notificationItem}>
                    <View style={styles.itemTextContainer}>
                      <Text style={[
                        styles.itemTitle,
                        { color: tc.textPrimary },
                        (!permissionGranted || !preferences?.enabled) && { color: tc.textTertiary },
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={[
                        styles.itemDescription,
                        { color: tc.textSecondary },
                        (!permissionGranted || !preferences?.enabled) && { color: tc.textTertiary },
                      ]}>
                        {item.description}
                      </Text>
                    </View>
                    <Switch
                      value={preferences?.[item.key] ?? false}
                      onValueChange={(value) => handleToggle(item.key, value)}
                      disabled={!permissionGranted || !preferences?.enabled}
                      trackColor={{ false: isDark ? '#39393D' : '#E9E9EA', true: tc.primary }}
                      thumbColor={'#FFFFFF'}
                      accessibilityRole="switch"
                      accessibilityLabel={item.title}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: tc.info + '10', borderColor: tc.info + '20' }]}>
          <Text style={[styles.infoTitle, { color: tc.info }]}>About Notifications</Text>
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>
            We'll only send you notifications that matter. Safety alerts are always recommended to keep you informed about your travel destinations.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  permissionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  permissionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionArrowText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  masterToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  masterToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  masterIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  masterTextContainer: {
    flex: 1,
  },
  masterTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  masterDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  categoryCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  categoryDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryItems: {
    gap: 0,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.gray100,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  itemTitleDisabled: {
    color: colors.gray400,
  },
  itemDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  itemDescriptionDisabled: {
    color: colors.gray300,
  },
  infoCard: {
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.info,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
