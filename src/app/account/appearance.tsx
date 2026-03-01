/**
 * APPEARANCE SETTINGS SCREEN
 * 
 * Toggle between light, dark, and system theme modes.
 * Uses ThemeContext for app-wide theme management.
 */

import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sun1, Moon, Mobile, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors as lightColors, darkColors } from '@/styles/colors';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme, ThemeMode } from '@/context/ThemeContext';

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const systemColorScheme = useColorScheme();
  const { themeMode, isDark, colors, setThemeMode } = useTheme();
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSelectTheme = async (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setThemeMode(mode);
  };

  const themeOptions = useMemo(() => [
    {
      id: 'light' as ThemeMode,
      title: 'Light',
      description: 'Always use light mode',
      icon: <Sun1 size={24} color="#F59E0B" variant="Bold" />,
    },
    {
      id: 'dark' as ThemeMode,
      title: 'Dark',
      description: 'Always use dark mode',
      icon: <Moon size={24} color={colors.primary} variant="Bold" />,
    },
    {
      id: 'system' as ThemeMode,
      title: 'System',
      description: 'Follow your device settings',
      icon: <Mobile size={24} color={colors.textSecondary} variant="Bold" />,
    },
  ], [colors]);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.bgCard,
      borderBottomColor: colors.borderSubtle,
    },
    headerTitle: {
      color: colors.textPrimary,
    },
    sectionTitle: {
      color: colors.textPrimary,
    },
    sectionSubtitle: {
      color: colors.textSecondary,
    },
    previewCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '08',
    },
    previewLabel: {
      color: colors.textSecondary,
    },
    optionCard: {
      backgroundColor: colors.bgCard,
      borderColor: colors.borderSubtle,
    },
    optionCardSelected: {
      backgroundColor: colors.primary + '08',
      borderColor: colors.primary,
    },
    optionIconContainer: {
      backgroundColor: colors.bgElevated,
    },
    optionIconContainerSelected: {
      backgroundColor: colors.primary + '15',
    },
    optionTitle: {
      color: colors.textPrimary,
    },
    optionTitleSelected: {
      color: colors.primary,
    },
    optionDescription: {
      color: colors.textSecondary,
    },
    statusCard: {
      backgroundColor: colors.bgElevated,
    },
    statusIconContainer: {
      backgroundColor: colors.bgCard,
    },
    statusText: {
      color: colors.textSecondary,
    },
    statusHighlight: {
      color: colors.textPrimary,
    },
  }), [colors]);
  
  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Appearance</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Preview */}
        <View style={styles.previewSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Preview</Text>
          <Text style={[styles.sectionSubtitle, dynamicStyles.sectionSubtitle]}>See how the app will look</Text>
          
          <View style={styles.previewContainer}>
            {/* Light Preview */}
            <TouchableOpacity 
              style={[
                styles.previewCard,
                !isDark && dynamicStyles.previewCardActive,
              ]}
              onPress={() => handleSelectTheme('light')}
              activeOpacity={0.7}
            >
              <View style={styles.previewLight}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewHeaderBar} />
                </View>
                <View style={styles.previewContent}>
                  <View style={styles.previewCardMock} />
                  <View style={styles.previewCardMockSmall} />
                </View>
                <View style={styles.previewNav}>
                  <View style={styles.previewNavDot} />
                  <View style={styles.previewNavDot} />
                  <View style={[styles.previewNavDot, styles.previewNavDotActive]} />
                  <View style={styles.previewNavDot} />
                </View>
              </View>
              <Text style={[styles.previewLabel, dynamicStyles.previewLabel]}>Light</Text>
            </TouchableOpacity>

            {/* Dark Preview */}
            <TouchableOpacity 
              style={[
                styles.previewCard,
                isDark && dynamicStyles.previewCardActive,
              ]}
              onPress={() => handleSelectTheme('dark')}
              activeOpacity={0.7}
            >
              <View style={styles.previewDark}>
                <View style={styles.previewHeaderDark}>
                  <View style={styles.previewHeaderBarDark} />
                </View>
                <View style={styles.previewContentDark}>
                  <View style={styles.previewCardMockDark} />
                  <View style={styles.previewCardMockSmallDark} />
                </View>
                <View style={styles.previewNavDark}>
                  <View style={styles.previewNavDotDark} />
                  <View style={styles.previewNavDotDark} />
                  <View style={[styles.previewNavDotDark, styles.previewNavDotActiveDark]} />
                  <View style={styles.previewNavDotDark} />
                </View>
              </View>
              <Text style={[styles.previewLabel, dynamicStyles.previewLabel]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Theme Mode</Text>
          <Text style={[styles.sectionSubtitle, dynamicStyles.sectionSubtitle]}>Choose your preferred appearance</Text>
          
          <View style={styles.optionsList}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  dynamicStyles.optionCard,
                  themeMode === option.id && dynamicStyles.optionCardSelected,
                ]}
                onPress={() => handleSelectTheme(option.id)}
              >
                <View style={[
                  styles.optionIconContainer,
                  dynamicStyles.optionIconContainer,
                  themeMode === option.id && dynamicStyles.optionIconContainerSelected,
                ]}>
                  {option.icon}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionTitle,
                    dynamicStyles.optionTitle,
                    themeMode === option.id && dynamicStyles.optionTitleSelected,
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.optionDescription, dynamicStyles.optionDescription]}>
                    {option.description}
                  </Text>
                </View>
                {themeMode === option.id && (
                  <TickCircle size={22} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current Status */}
        {themeMode === 'system' && (
          <View style={[styles.statusCard, dynamicStyles.statusCard]}>
            <View style={[styles.statusIconContainer, dynamicStyles.statusIconContainer]}>
              {systemColorScheme === 'dark' ? (
                <Moon size={20} color={colors.primary} variant="Bold" />
              ) : (
                <Sun1 size={20} color="#F59E0B" variant="Bold" />
              )}
            </View>
            <Text style={[styles.statusText, dynamicStyles.statusText]}>
              Your device is currently using <Text style={[styles.statusHighlight, dynamicStyles.statusHighlight]}>
                {systemColorScheme === 'dark' ? 'dark' : 'light'}
              </Text> mode
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Dark Mode</Text>
          <Text style={styles.infoText}>
            Dark mode provides a comfortable viewing experience in low-light environments while reducing eye strain and battery consumption on OLED screens.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
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
  previewSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  previewContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  previewCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewLight: {
    width: '100%',
    aspectRatio: 0.6,
    backgroundColor: lightColors.gray100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewHeader: {
    height: '15%',
    backgroundColor: lightColors.white,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  previewHeaderBar: {
    width: '40%',
    height: 4,
    backgroundColor: lightColors.gray300,
    borderRadius: 2,
  },
  previewContent: {
    flex: 1,
    padding: 8,
    gap: 6,
  },
  previewCardMock: {
    height: '45%',
    backgroundColor: lightColors.white,
    borderRadius: 8,
  },
  previewCardMockSmall: {
    height: '25%',
    backgroundColor: lightColors.white,
    borderRadius: 8,
  },
  previewNav: {
    height: '12%',
    backgroundColor: lightColors.white,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  previewNavDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: lightColors.gray300,
  },
  previewNavDotActive: {
    backgroundColor: lightColors.primary,
  },
  previewDark: {
    width: '100%',
    aspectRatio: 0.6,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewHeaderDark: {
    height: '15%',
    backgroundColor: '#2C2C2E',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  previewHeaderBarDark: {
    width: '40%',
    height: 4,
    backgroundColor: '#48484A',
    borderRadius: 2,
  },
  previewContentDark: {
    flex: 1,
    padding: 8,
    gap: 6,
  },
  previewCardMockDark: {
    height: '45%',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  previewCardMockSmallDark: {
    height: '25%',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  previewNavDark: {
    height: '12%',
    backgroundColor: '#2C2C2E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  previewNavDotDark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48484A',
  },
  previewNavDotActiveDark: {
    backgroundColor: '#8B7AFF',
  },
  previewLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statusText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  statusHighlight: {
    fontWeight: typography.fontWeight.semibold,
  },
  infoCard: {
    backgroundColor: '#3B82F610',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#3B82F620',
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#3B82F6',
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    lineHeight: 20,
  },
});
