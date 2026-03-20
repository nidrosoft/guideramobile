/**
 * PRIVACY SETTINGS SCREEN
 * 
 * Manage profile visibility, data sharing, and privacy preferences.
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
  Eye, 
  EyeSlash, 
  People, 
  Location, 
  SearchNormal, 
  Setting2,
  DocumentDownload,
  Link21,
  Trash,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private';
  activity_status: boolean;
  trip_sharing: 'public' | 'friends' | 'private';
  location_sharing: boolean;
  search_visibility: boolean;
  personalization: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  profile_visibility: 'public',
  activity_status: true,
  trip_sharing: 'friends',
  location_sharing: false,
  search_visibility: true,
  personalization: true,
};

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Everyone', description: 'Anyone can see' },
  { value: 'friends', label: 'Friends Only', description: 'Only your connections' },
  { value: 'private', label: 'Private', description: 'Only you' },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showProfileVisibility, setShowProfileVisibility] = useState(false);
  const [showTripSharing, setShowTripSharing] = useState(false);

  // Load settings from Supabase
  const loadSettings = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('id', profile.id)
        .single();

      if (error) throw error;
      
      if (data?.privacy_settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.privacy_settings });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings to Supabase
  const saveSettings = async (newSettings: PrivacySettings) => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: newSettings })
        .eq('id', profile.id);

      if (error) throw error;
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof PrivacySettings) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleVisibilityChange = (key: 'profile_visibility' | 'trip_sharing', value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    if (key === 'profile_visibility') setShowProfileVisibility(false);
    if (key === 'trip_sharing') setShowTripSharing(false);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleDownloadData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Download Your Data',
      'We\'ll prepare a copy of your data and send it to your email within 48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Download', 
          onPress: () => {
            // TODO: Implement data download request
            Alert.alert('Request Sent', 'You\'ll receive an email when your data is ready.');
          }
        },
      ]
    );
  };

  const handleConnectedApps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/account/connected-apps' as any);
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
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Privacy Settings</Text>
        <View style={styles.headerSpacer}>
          {isSaving && <ActivityIndicator size="small" color={tc.primary} />}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Visibility Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Profile Visibility</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Control who can see your profile and activity</Text>
          
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            {/* Profile Visibility */}
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowProfileVisibility(!showProfileVisibility)}
            >
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <Eye size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Profile Visibility</Text>
                <Text style={[styles.settingValue, { color: tc.primary }]}>
                  {VISIBILITY_OPTIONS.find(o => o.value === settings.profile_visibility)?.label}
                </Text>
              </View>
              <ArrowLeft2 
                size={18} 
                color={tc.textTertiary} 
                style={{ transform: [{ rotate: showProfileVisibility ? '90deg' : '-90deg' }] }} 
              />
            </TouchableOpacity>
            
            {showProfileVisibility && (
              <View style={[styles.optionsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.gray50 }]}>
                {VISIBILITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      settings.profile_visibility === option.value && [styles.optionItemSelected, { backgroundColor: tc.primary + '10' }],
                    ]}
                    onPress={() => handleVisibilityChange('profile_visibility', option.value)}
                  >
                    <View style={[styles.optionRadio, { borderColor: settings.profile_visibility === option.value ? tc.primary : tc.textTertiary }]}>
                      {settings.profile_visibility === option.value && (
                        <View style={[styles.optionRadioInner, { backgroundColor: tc.primary }]} />
                      )}
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, { color: tc.textPrimary }]}>{option.label}</Text>
                      <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />

            {/* Activity Status */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <View style={[styles.statusDot, settings.activity_status && styles.statusDotActive]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Activity Status</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Show when you're online</Text>
              </View>
              <Switch
                value={settings.activity_status}
                onValueChange={() => handleToggle('activity_status')}
                trackColor={{ false: isDark ? '#333' : colors.gray200, true: tc.primary + '40' }}
                thumbColor={settings.activity_status ? tc.primary : isDark ? '#666' : colors.gray400}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />

            {/* Search Visibility */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <SearchNormal size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Search Visibility</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Appear in search results</Text>
              </View>
              <Switch
                value={settings.search_visibility}
                onValueChange={() => handleToggle('search_visibility')}
                trackColor={{ false: isDark ? '#333' : colors.gray200, true: tc.primary + '40' }}
                thumbColor={settings.search_visibility ? tc.primary : isDark ? '#666' : colors.gray400}
              />
            </View>
          </View>
        </View>

        {/* Sharing Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Sharing</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Manage how your content is shared</Text>
          
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            {/* Trip Sharing */}
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowTripSharing(!showTripSharing)}
            >
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <People size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Default Trip Sharing</Text>
                <Text style={[styles.settingValue, { color: tc.primary }]}>
                  {VISIBILITY_OPTIONS.find(o => o.value === settings.trip_sharing)?.label}
                </Text>
              </View>
              <ArrowLeft2 
                size={18} 
                color={tc.textTertiary} 
                style={{ transform: [{ rotate: showTripSharing ? '90deg' : '-90deg' }] }} 
              />
            </TouchableOpacity>
            
            {showTripSharing && (
              <View style={[styles.optionsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.gray50 }]}>
                {VISIBILITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      settings.trip_sharing === option.value && [styles.optionItemSelected, { backgroundColor: tc.primary + '10' }],
                    ]}
                    onPress={() => handleVisibilityChange('trip_sharing', option.value)}
                  >
                    <View style={[styles.optionRadio, { borderColor: settings.trip_sharing === option.value ? tc.primary : tc.textTertiary }]}>
                      {settings.trip_sharing === option.value && (
                        <View style={[styles.optionRadioInner, { backgroundColor: tc.primary }]} />
                      )}
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, { color: tc.textPrimary }]}>{option.label}</Text>
                      <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />

            {/* Location Sharing */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <Location size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Location Sharing</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Share location with travel buddies</Text>
              </View>
              <Switch
                value={settings.location_sharing}
                onValueChange={() => handleToggle('location_sharing')}
                trackColor={{ false: isDark ? '#333' : colors.gray200, true: tc.primary + '40' }}
                thumbColor={settings.location_sharing ? tc.primary : isDark ? '#666' : colors.gray400}
              />
            </View>
          </View>
        </View>

        {/* Data & Personalization Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Data & Personalization</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Control how your data is used</Text>
          
          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            {/* Personalization */}
            <View style={styles.settingItem}>
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <Setting2 size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Personalized Recommendations</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Get tailored travel suggestions</Text>
              </View>
              <Switch
                value={settings.personalization}
                onValueChange={() => handleToggle('personalization')}
                trackColor={{ false: isDark ? '#333' : colors.gray200, true: tc.primary + '40' }}
                thumbColor={settings.personalization ? tc.primary : isDark ? '#666' : colors.gray400}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />

            {/* Download Data */}
            <TouchableOpacity style={styles.settingItem} onPress={handleDownloadData}>
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <DocumentDownload size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Download My Data</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Get a copy of your data</Text>
              </View>
              <ArrowLeft2 size={18} color={tc.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: tc.borderSubtle }]} />

            {/* Connected Apps */}
            <TouchableOpacity style={styles.settingItem} onPress={handleConnectedApps}>
              <View style={[styles.settingIcon, { backgroundColor: tc.primary + '10' }]}>
                <Link21 size={20} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tc.textPrimary }]}>Connected Apps</Text>
                <Text style={[styles.settingDescription, { color: tc.textSecondary }]}>Manage third-party access</Text>
              </View>
              <ArrowLeft2 size={18} color={tc.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: tc.info + '10', borderColor: tc.info + '20' }]}>
          <InfoCircle size={20} color={tc.info} variant="Bold" />
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>
            Your privacy is important to us. We never sell your personal data to third parties. 
            Learn more in our Privacy Policy.
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
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginLeft: 68,
  },
  optionsContainer: {
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  optionItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  optionDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray300,
  },
  statusDotActive: {
    backgroundColor: colors.success,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
});
