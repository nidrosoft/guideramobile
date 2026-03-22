/**
 * LANGUAGE SETTINGS SCREEN
 * 
 * Select app language preference.
 * Uses i18next for internationalization.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft2, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { changeLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/i18n';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get current language from i18n
    const currentLang = getCurrentLanguage();
    setSelectedLanguage(currentLang);
    setIsLoading(false);
  }, []);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSelectLanguage = async (code: LanguageCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLanguage(code);
    
    try {
      await changeLanguage(code);
    } catch (error) {
      console.error('Error changing language:', error);
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
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{t('settings.items.language')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Language */}
        <View style={[styles.currentLanguageCard, { backgroundColor: tc.primary + '10', borderColor: tc.primary + '20' }]}>
          <Text style={[styles.currentLabel, { color: tc.primary }]}>{t('settings.language.current')}</Text>
          <View style={styles.currentLanguageRow}>
            <Text style={styles.currentFlag}>
              {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
            </Text>
            <Text style={[styles.currentName, { color: tc.textPrimary }]}>
              {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
            </Text>
          </View>
        </View>

        {/* Language List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{t('settings.language.title')}</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>{t('settings.language.subtitle')}</Text>
          
          <View style={[styles.languageList, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            {SUPPORTED_LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  { borderBottomColor: tc.borderSubtle },
                  selectedLanguage === language.code && [styles.languageItemSelected, { backgroundColor: tc.primary + '08' }],
                ]}
                onPress={() => handleSelectLanguage(language.code)}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <View style={styles.languageTextContainer}>
                  <Text style={[
                    styles.languageName,
                    { color: tc.textPrimary },
                    selectedLanguage === language.code && { color: tc.primary },
                  ]}>
                    {language.name}
                  </Text>
                  <Text style={[styles.languageNative, { color: tc.textSecondary }]}>{language.nativeName}</Text>
                </View>
                {selectedLanguage === language.code && (
                  <TickCircle size={22} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: tc.info + '10', borderColor: tc.info + '20' }]}>
          <Text style={[styles.infoTitle, { color: tc.info }]}>{t('account.language.aboutTitle')}</Text>
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>
            {t('account.language.aboutDescription')}
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
  currentLanguageCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  currentLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  currentLanguageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentFlag: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  currentName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.lg,
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
  languageList: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  languageItemSelected: {
    backgroundColor: colors.primary + '08',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  languageNameSelected: {
    color: colors.primary,
  },
  languageNative: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
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
