/**
 * SECURITY SETTINGS SCREEN
 * 
 * Manage password, 2FA, sessions, and security preferences.
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft2, 
  Lock,
  ShieldTick,
  Mobile,
  Notification,
  FingerScan,
  Monitor,
  Logout,
  InfoCircle,
  Key,
  Sms,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase/client';

const BIOMETRIC_ENABLED_KEY = '@guidera_biometric_enabled';

interface SecuritySettings {
  two_factor_enabled: boolean;
  two_factor_method: 'sms' | 'authenticator' | null;
  biometric_enabled: boolean;
  login_alerts: boolean;
}

const DEFAULT_SETTINGS: SecuritySettings = {
  two_factor_enabled: false,
  two_factor_method: null,
  biometric_enabled: false,
  login_alerts: true,
};

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile, signOut } = useAuth();
  const { showError } = useToast();
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');
  const [sessionCount, setSessionCount] = useState(1);

  // Check biometric availability
  useEffect(() => {
    const checkBiometrics = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
      
      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        }
      }
    };
    checkBiometrics();
  }, []);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('security_settings')
        .eq('id', profile.id)
        .single();

      if (error) throw error;
      
      if (data?.security_settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.security_settings });
      }

      // Get session count (mock for now)
      setSessionCount(2);
    } catch (error) {
      console.error('Error loading security settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings
  const saveSettings = async (newSettings: SecuritySettings) => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ security_settings: newSettings })
        .eq('id', profile.id);

      if (error) throw error;
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving security settings:', error);
      showError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleChangePassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/account/change-password');
  };

  const handleSetup2FA = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (settings.two_factor_enabled) {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable 2FA? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: () => {
              const newSettings = { ...settings, two_factor_enabled: false, two_factor_method: null };
              setSettings(newSettings);
              saveSettings(newSettings);
            }
          },
        ]
      );
    } else {
      router.push('/account/two-factor-auth');
    }
  };

  const handleBiometricToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!settings.biometric_enabled) {
      // Authenticate first before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType}`,
        fallbackLabel: 'Use passcode',
      });
      
      if (result.success) {
        const newSettings = { ...settings, biometric_enabled: true };
        setSettings(newSettings);
        saveSettings(newSettings);
        // Persist biometric preference locally for app login
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      const newSettings = { ...settings, biometric_enabled: false };
      setSettings(newSettings);
      saveSettings(newSettings);
      // Remove biometric preference
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    }
  };

  const handleLoginAlertsToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = { ...settings, login_alerts: !settings.login_alerts };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleActiveSessions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/account/active-sessions');
  };

  const handleLogoutAllDevices = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Log Out All Devices',
      'This will log you out from ALL devices including this one. You\'ll need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out All', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Sign out via Clerk (owns auth session) — triggers AuthContext cleanup
              await signOut();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error logging out all devices:', error);
              showError('Failed to log out. Please try again.');
            }
          }
        },
      ]
    );
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
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Security</Text>
        <View style={styles.headerSpacer}>
          {isSaving && <ActivityIndicator size="small" color={tc.primary} />}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Password Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Password</Text>
          
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <Lock size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Change Password</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Update your password regularly</Text>
              </View>
              <ArrowLeft2 size={18} color={tc.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Two-Factor Authentication Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Two-Factor Authentication</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Add an extra layer of security to your account</Text>
          
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <TouchableOpacity style={styles.settingItem} onPress={handleSetup2FA}>
              <View style={[styles.settingIcon, { backgroundColor: settings.two_factor_enabled ? tc.success + '10' : tc.primary + '10' }]}>
                <ShieldTick size={20} color={settings.two_factor_enabled ? tc.success : tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Two-Factor Authentication</Text>
                <Text style={[
                  styles.settingDescription,
                  { color: tc.textSecondary },
                  settings.two_factor_enabled && { color: tc.success }
                ]}>
                  {settings.two_factor_enabled 
                    ? `Enabled via ${settings.two_factor_method === 'sms' ? 'SMS' : 'Authenticator App'}`
                    : 'Not enabled'
                  }
                </Text>
              </View>
              {settings.two_factor_enabled ? (
                <View style={[styles.enabledBadge, { backgroundColor: tc.success + '20' }]}>
                  <Text style={[styles.enabledBadgeText, { color: tc.success }]}>On</Text>
                </View>
              ) : (
                <ArrowLeft2 size={18} color={tc.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Biometric Login Section */}
        {biometricAvailable && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Biometric Login</Text>
            
            <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <View style={styles.settingItem}>
                <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                  <FingerScan size={20} color={tc.primary} variant="Bold" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>{biometricType}</Text>
                  <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Quick and secure login</Text>
                </View>
                <Switch
                  value={settings.biometric_enabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: isDark ? '#333' : colors.gray200, true: tc.primary + '40' }}
                  thumbColor={settings.biometric_enabled ? tc.primary : isDark ? '#666' : colors.gray400}
                  accessibilityRole="switch"
                  accessibilityLabel={biometricType}
                />
              </View>
            </View>
          </View>
        )}

        {/* Sessions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Sessions & Devices</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Manage your active sessions</Text>
          
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <TouchableOpacity style={styles.settingItem} onPress={handleActiveSessions}>
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <Monitor size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Active Sessions</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>
                  {sessionCount} {sessionCount === 1 ? 'device' : 'devices'} logged in
                </Text>
              </View>
              <ArrowLeft2 size={18} color={tc.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />

            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <Notification size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Login Alerts</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Get notified of new logins</Text>
              </View>
              <Switch
                value={settings.login_alerts}
                onValueChange={handleLoginAlertsToggle}
                trackColor={{ false: isDark ? '#333' : colors.gray200, true: tc.primary + '40' }}
                thumbColor={settings.login_alerts ? tc.primary : isDark ? '#666' : colors.gray400}
                accessibilityRole="switch"
                accessibilityLabel="Login alerts"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />

            <TouchableOpacity style={styles.settingItem} onPress={handleLogoutAllDevices}>
              <View style={[styles.settingIcon, { backgroundColor: tc.error + '10' }]}>
                <Logout size={20} color={tc.error} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.error }]}>Log Out All Devices</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Sign out from everywhere</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Tips */}
        <View style={[styles.tipsCard, { backgroundColor: tc.warning + '10', borderColor: tc.warning + '20' }]}>
          <View style={styles.tipsHeader}>
            <InfoCircle size={20} color={tc.warning} variant="Bold" />
            <Text style={[styles.tipsTitle, { color: tc.warning }]}>Security Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={[styles.tipItem, { color: tc.textSecondary }]}>• Use a strong, unique password</Text>
            <Text style={[styles.tipItem, { color: tc.textSecondary }]}>• Enable two-factor authentication</Text>
            <Text style={[styles.tipItem, { color: tc.textSecondary }]}>• Review your active sessions regularly</Text>
            <Text style={[styles.tipItem, { color: tc.textSecondary }]}>• Never share your login credentials</Text>
          </View>
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
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingIconActive: {
    backgroundColor: colors.success + '10',
  },
  settingIconDanger: {
    backgroundColor: colors.error + '10',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  settingTitleDanger: {
    color: colors.error,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingDescriptionActive: {
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginLeft: 68,
  },
  enabledBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  enabledBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  tipsCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '20',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginLeft: spacing.sm,
  },
  tipsList: {
    marginLeft: spacing.lg + spacing.sm,
  },
  tipItem: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
