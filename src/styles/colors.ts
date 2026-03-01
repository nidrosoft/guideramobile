/**
 * DESIGN SYSTEM — COLOR TOKENS
 *
 * Dark-mode-first design system. Primary accent: #3FC39E (mint/teal).
 * All screens, components, and interactions use these values.
 */

export const colors = {
  // ─── PRIMARY / ACCENT ────────────────────────────────────────────────
  primary: '#3FC39E',
  primaryHover: '#36B08E',
  primaryGradient: '#2D9A7A',
  primaryText: '#121212',
  primarySubtle: 'rgba(63, 195, 158, 0.06)',
  primaryMedium: 'rgba(63, 195, 158, 0.08)',
  primaryStrong: 'rgba(63, 195, 158, 0.12)',
  primaryBorderSubtle: 'rgba(63, 195, 158, 0.10)',
  primaryBorderMedium: 'rgba(63, 195, 158, 0.15)',
  primaryBorderStrong: 'rgba(63, 195, 158, 0.30)',
  // Legacy aliases
  primaryLight: '#36B08E',
  primaryDark: '#2D9A7A',

  // ─── BACKGROUNDS ─────────────────────────────────────────────────────
  bgPrimary: '#202020',
  bgSecondary: '#1a1a1a',
  bgCard: 'rgba(248, 248, 248, 0.03)',
  bgElevated: 'rgba(248, 248, 248, 0.06)',
  bgInput: 'rgba(248, 248, 248, 0.04)',
  bgHover: 'rgba(248, 248, 248, 0.05)',
  bgSunken: 'rgba(248, 248, 248, 0.02)',
  bgOverlay: 'rgba(10, 10, 10, 0.97)',
  bgModal: '#1a1a1a',
  // Legacy aliases
  background: '#202020',
  backgroundSecondary: '#1a1a1a',

  // ─── TEXT ─────────────────────────────────────────────────────────────
  textPrimary: 'rgba(248, 248, 248, 0.95)',
  textSecondary: 'rgba(248, 248, 248, 0.70)',
  textTertiary: 'rgba(248, 248, 248, 0.50)',
  textInverse: '#121212',

  // ─── BORDERS ─────────────────────────────────────────────────────────
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderStandard: 'rgba(255, 255, 255, 0.06)',
  borderMedium: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',

  // ─── STATUS COLORS ───────────────────────────────────────────────────
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.08)',
  errorBorder: 'rgba(239, 68, 68, 0.15)',

  warning: '#FFBD2E',
  warningBg: 'rgba(255, 189, 46, 0.08)',
  warningBorder: 'rgba(255, 189, 46, 0.15)',

  success: '#28C840',
  successBg: 'rgba(40, 200, 64, 0.08)',
  successBorder: 'rgba(40, 200, 64, 0.15)',

  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.08)',
  infoBorder: 'rgba(59, 130, 246, 0.15)',

  // ─── ADDITIONAL COLORS (charts, categories, agents) ──────────────────
  purple: '#A855F7',
  orange: '#F97316',
  pink: '#EC4899',
  yellow: '#EAB308',
  cyan: '#06B6D4',

  // ─── NEUTRALS ────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',

  // ─── GRADIENT ────────────────────────────────────────────────────────
  gradientStart: '#3FC39E',
  gradientEnd: '#2D9A7A',

  // ─── GRAY SCALE (dark-mode adapted) ──────────────────────────────────
  // Low numbers = subtle surfaces, mid = borders, high = lighter text
  gray50: '#272727',
  gray100: '#2e2e2e',
  gray200: '#383838',
  gray300: '#444444',
  gray400: '#666666',
  gray500: '#888888',
  gray600: '#aaaaaa',
  gray700: '#cccccc',
  gray800: '#dddddd',
  gray900: '#eeeeee',
};

// Dark mode colors — identical to `colors`
export const darkColors = { ...colors };

// ─── LIGHT MODE ──────────────────────────────────────────────────────────────
export const lightColors: ColorScheme = {
  // PRIMARY / ACCENT (same hue, both modes)
  primary: '#3FC39E',
  primaryHover: '#36B08E',
  primaryGradient: '#2D9A7A',
  primaryText: '#FFFFFF',
  primarySubtle: 'rgba(63, 195, 158, 0.06)',
  primaryMedium: 'rgba(63, 195, 158, 0.08)',
  primaryStrong: 'rgba(63, 195, 158, 0.12)',
  primaryBorderSubtle: 'rgba(63, 195, 158, 0.10)',
  primaryBorderMedium: 'rgba(63, 195, 158, 0.15)',
  primaryBorderStrong: 'rgba(63, 195, 158, 0.30)',
  primaryLight: '#36B08E',
  primaryDark: '#2D9A7A',

  // BACKGROUNDS
  bgPrimary: '#F8F8F8',
  bgSecondary: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgInput: 'rgba(0, 0, 0, 0.04)',
  bgHover: 'rgba(0, 0, 0, 0.03)',
  bgSunken: '#F0F0F0',
  bgOverlay: 'rgba(0, 0, 0, 0.50)',
  bgModal: '#FFFFFF',
  background: '#F8F8F8',
  backgroundSecondary: '#FFFFFF',

  // TEXT
  textPrimary: 'rgba(18, 18, 18, 0.95)',
  textSecondary: 'rgba(18, 18, 18, 0.60)',
  textTertiary: 'rgba(18, 18, 18, 0.40)',
  textInverse: '#F8F8F8',

  // BORDERS
  borderSubtle: 'rgba(0, 0, 0, 0.05)',
  borderStandard: 'rgba(0, 0, 0, 0.08)',
  borderMedium: 'rgba(0, 0, 0, 0.12)',
  borderStrong: 'rgba(0, 0, 0, 0.20)',

  // STATUS COLORS (identical both modes)
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.08)',
  errorBorder: 'rgba(239, 68, 68, 0.15)',
  warning: '#FFBD2E',
  warningBg: 'rgba(255, 189, 46, 0.08)',
  warningBorder: 'rgba(255, 189, 46, 0.15)',
  success: '#28C840',
  successBg: 'rgba(40, 200, 64, 0.08)',
  successBorder: 'rgba(40, 200, 64, 0.15)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.08)',
  infoBorder: 'rgba(59, 130, 246, 0.15)',

  // ADDITIONAL COLORS
  purple: '#A855F7',
  orange: '#F97316',
  pink: '#EC4899',
  yellow: '#EAB308',
  cyan: '#06B6D4',

  // NEUTRALS
  white: '#FFFFFF',
  black: '#000000',

  // GRADIENT
  gradientStart: '#3FC39E',
  gradientEnd: '#2D9A7A',

  // GRAY SCALE (light-mode)
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
};

export type ColorScheme = typeof colors;
