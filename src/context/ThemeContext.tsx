/**
 * THEME CONTEXT
 * 
 * Dark-mode-first design system. Primary accent: #3FC39E.
 * Supports light / dark / system toggle.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as darkColors, lightColors, ColorScheme } from '@/styles/colors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ColorScheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const STORAGE_KEY = '@guidera_theme_mode';
const MIGRATION_KEY = '@guidera_theme_user_chosen';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);
  const systemColorScheme = useColorScheme();

  // Load saved theme preference (with migration for existing installs)
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const userChosen = await AsyncStorage.getItem(MIGRATION_KEY);
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (userChosen === 'true' && saved && ['light', 'dark', 'system'].includes(saved)) {
          // User explicitly chose a theme — respect it
          setThemeModeState(saved as ThemeMode);
        } else {
          // No explicit choice yet — default to system (follows device)
          setThemeModeState('system');
          await AsyncStorage.setItem(STORAGE_KEY, 'system');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Resolve isDark from themeMode + system preference
  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemColorScheme === 'dark';
  }, [themeMode, systemColorScheme]);

  // Return the correct color set
  const activeColors = isDark ? darkColors : lightColors;

  // Set theme mode and persist (marks as user-chosen so migration doesn't reset it)
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
      await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(async () => {
    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    await setThemeMode(next);
  }, [themeMode, setThemeMode]);

  const value = useMemo(() => ({
    themeMode,
    isDark,
    colors: activeColors,
    setThemeMode,
    toggleTheme,
  }), [themeMode, isDark, activeColors, setThemeMode, toggleTheme]);

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for just getting colors (convenience)
export function useThemeColors(): ColorScheme {
  const { colors } = useTheme();
  return colors;
}

export { ThemeContext };
