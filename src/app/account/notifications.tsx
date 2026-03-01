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
  ArrowLeft, 
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
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
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

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: 'trips',
    title: 'Trip Updates',
    description: 'Stay informed about your trips',
    icon: <Airplane size={20} color={colors.primary} variant="Bold" />,
    items: [
      {
        key: 'bookingConfirmations',
        title: 'Booking Confirmations',
        description: 'Get notified when your bookings are confirmed',
      },
      {
        key: 'tripReminders',
        title: 'Trip Reminders',
        description: 'Receive reminders before your trips',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & Alerts',
    description: 'Important safety information',
    icon: <ShieldTick size={20} color={colors.success} variant="Bold" />,
    items: [
      {
        key: 'safetyAlerts',
        title: 'Safety Alerts',
        description: 'Travel advisories and safety updates for your destinations',
      },
    ],
  },
  {
    id: 'deals',
    title: 'Deals & Offers',
    description: 'Never miss a great deal',
    icon: <PercentageCircle size={20} color={colors.warning} variant="Bold" />,
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
];

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      const prefs = notificationService.getPreferences();
      setPreferences(prefs);
      
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    await notificationService.setPreferences({ [key]: value });
  };

  const handleMasterToggle = async (value: boolean) => {
    if (!preferences) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newPrefs = { ...preferences, enabled: value };
    setPreferences(newPrefs);
    await notificationService.setPreferences({ enabled: value });
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
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style={tc.textPrimary === colors.textPrimary ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={tc.textPrimary === colors.textPrimary ? "light" : "dark"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Banner */}
        {!permissionGranted && (
          <TouchableOpacity style={styles.permissionBanner} onPress={handleRequestPermission}>
            <View style={styles.permissionIconContainer}>
              <Notification size={24} color={colors.white} variant="Bold" />
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Enable Notifications</Text>
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
        <View style={styles.masterToggleCard}>
          <View style={styles.masterToggleContent}>
            <View style={styles.masterIconContainer}>
              <Setting2 size={24} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.masterTextContainer}>
              <Text style={styles.masterTitle}>All Notifications</Text>
              <Text style={styles.masterDescription}>
                {preferences?.enabled ? 'Notifications are enabled' : 'Notifications are disabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences?.enabled ?? false}
            onValueChange={handleMasterToggle}
            disabled={!permissionGranted}
            trackColor={{ false: colors.gray200, true: colors.primary + '50' }}
            thumbColor={preferences?.enabled ? colors.primary : colors.gray400}
          />
        </View>

        {/* Notification Categories */}
        {NOTIFICATION_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconContainer}>
                {category.icon}
              </View>
              <View style={styles.categoryHeaderText}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
            </View>
            
            <View style={styles.categoryItems}>
              {category.items.map((item, index) => (
                <View key={item.key}>
                  {index > 0 && <View style={styles.itemDivider} />}
                  <View style={styles.notificationItem}>
                    <View style={styles.itemTextContainer}>
                      <Text style={[
                        styles.itemTitle,
                        (!permissionGranted || !preferences?.enabled) && styles.itemTitleDisabled,
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={[
                        styles.itemDescription,
                        (!permissionGranted || !preferences?.enabled) && styles.itemDescriptionDisabled,
                      ]}>
                        {item.description}
                      </Text>
                    </View>
                    <Switch
                      value={preferences?.[item.key] ?? false}
                      onValueChange={(value) => handleToggle(item.key, value)}
                      disabled={!permissionGranted || !preferences?.enabled}
                      trackColor={{ false: colors.gray200, true: colors.primary + '50' }}
                      thumbColor={preferences?.[item.key] ? colors.primary : colors.gray400}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Notifications</Text>
          <Text style={styles.infoText}>
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
