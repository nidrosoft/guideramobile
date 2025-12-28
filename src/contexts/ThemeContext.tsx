/**
 * Theme Context
 * 
 * Provides dark mode support with:
 * - System preference detection
 * - Manual toggle
 * - Persistent preference storage
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logging';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Light theme colors
const lightColors = {
  // Primary
  primary: '#7257FF',
  primaryLight: '#9B85FF',
  primaryDark: '#5A3FE6',
  
  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F1F3F5',
  
  // Surface
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Border
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // Card
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
};

// Dark theme colors
const darkColors = {
  // Primary
  primary: '#9B85FF',
  primaryLight: '#B8A5FF',
  primaryDark: '#7257FF',
  
  // Background
  background: '#0F0F1A',
  backgroundSecondary: '#1A1A2E',
  backgroundTertiary: '#252542',
  
  // Surface
  surface: '#1A1A2E',
  surfaceElevated: '#252542',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  textInverse: '#1A1A2E',
  
  // Border
  border: '#3F3F5A',
  borderLight: '#2D2D44',
  
  // Status
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  // Misc
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  
  // Card
  card: '#1A1A2E',
  cardBorder: '#3F3F5A',
};

export type ThemeColors = typeof lightColors;

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
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
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

  // Determine if dark mode is active
  const isDark = mode === 'system' 
    ? systemColorScheme === 'dark' 
    : mode === 'dark';

  // Get current colors
  const colors = isDark ? darkColors : lightColors;

  // Set mode and persist
  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
      logger.info('Theme mode changed', { mode: newMode });
    } catch (error) {
      logger.error('Failed to save theme preference', error);
    }
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  }, [isDark, setMode]);

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
