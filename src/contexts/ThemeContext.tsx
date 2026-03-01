/**
 * Theme Context (Legacy)
 * 
 * Dark-mode-first design system. Primary accent: #3FC39E.
 * Kept for backward compatibility with any files importing from @/contexts/ThemeContext.
 * The canonical ThemeContext is at @/context/ThemeContext.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as dsColors } from '@/styles/colors';
import { logger } from '@/services/logging';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Dark-mode-first — both color sets point to the same tokens
const darkColors = {
  primary: dsColors.primary,
  primaryLight: dsColors.primaryLight,
  primaryDark: dsColors.primaryDark,

  background: dsColors.bgPrimary,
  backgroundSecondary: dsColors.bgSecondary,
  backgroundTertiary: dsColors.bgElevated,

  surface: dsColors.bgCard,
  surfaceElevated: dsColors.bgElevated,

  text: dsColors.textPrimary,
  textSecondary: dsColors.textSecondary,
  textTertiary: dsColors.textTertiary,
  textInverse: dsColors.textInverse,

  border: dsColors.borderStandard,
  borderLight: dsColors.borderSubtle,

  success: dsColors.success,
  warning: dsColors.warning,
  error: dsColors.error,
  info: dsColors.info,

  overlay: dsColors.bgOverlay,
  shadow: 'rgba(0, 0, 0, 0.3)',

  card: dsColors.bgCard,
  cardBorder: dsColors.borderStandard,
};

const lightColors = { ...darkColors };

export type ThemeColors = typeof darkColors;

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = '@guidera_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        logger.error('Failed to load theme preference', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Always dark
  const isDark = true;
  const colors = darkColors;

  // Set mode and persist (kept for API compat)
  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
      logger.info('Theme mode changed', { mode: newMode });
    } catch (error) {
      logger.error('Failed to save theme preference', error);
    }
  }, []);

  // Toggle (no-op in dark-mode-only)
  const toggleTheme = useCallback(() => {
    // Dark mode only
  }, []);

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get themed colors only
 */
export function useColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}

/**
 * Hook to check if dark mode is active
 */
export function useIsDark(): boolean {
  const { isDark } = useTheme();
  return isDark;
}

export { lightColors, darkColors };
export default ThemeContext;
