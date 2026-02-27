export const colors = {
  // Primary Brand Color
  primary: '#7257FF',
  primaryLight: '#8F7AFF',
  primaryDark: '#5940CC',
  
  // Gradient Colors (from image)
  gradientStart: '#5336E2',
  gradientEnd: '#2E1E7C',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray Scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background
  background: '#F4F6F7',
  backgroundSecondary: '#FFFFFF',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
};

// Dark mode colors
export const darkColors = {
  // Primary Brand Color (same - works well on dark)
  primary: '#8B7AFF',
  primaryLight: '#A899FF',
  primaryDark: '#6B5AD9',
  
  // Gradient Colors
  gradientStart: '#6B5AD9',
  gradientEnd: '#3D2E99',
  
  // Neutral Colors (inverted)
  white: '#1C1C1E',
  black: '#FFFFFF',
  
  // Gray Scale (inverted for dark mode)
  gray50: '#1C1C1E',
  gray100: '#2C2C2E',
  gray200: '#3A3A3C',
  gray300: '#48484A',
  gray400: '#636366',
  gray500: '#8E8E93',
  gray600: '#AEAEB2',
  gray700: '#C7C7CC',
  gray800: '#D1D1D6',
  gray900: '#E5E5EA',
  
  // Semantic Colors (slightly adjusted for dark backgrounds)
  success: '#30D158',
  warning: '#FFD60A',
  error: '#FF453A',
  info: '#64D2FF',
  
  // Background
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textInverse: '#000000',
};

export type ColorScheme = typeof colors;
