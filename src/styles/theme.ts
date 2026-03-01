/**
 * DESIGN SYSTEM — THEME TOKENS
 *
 * Border radii, component configs, animation values.
 * All radii are mobile-adapted — do NOT use web values.
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';

// ─── BORDER RADIUS — Mobile Adapted ────────────────────────────────────
export const borderRadius = {
  none: 0,
  sm: 6,       // Chips inside inputs, tiny labels, color dots
  md: 10,      // Inputs, search bars, icon containers, small buttons
  lg: 14,      // Cards, list items, action buttons, dropdowns, badges
  xl: 24,      // Card containers, section containers, modals
  '2xl': 28,   // Large cards, bottom sheets, main content containers
  '3xl': 32,   // Hero cards, featured sections
  full: 999,   // Pills, toggles, fully rounded buttons, circular elements
};

// ─── COMPONENT CONFIGS ──────────────────────────────────────────────────

const button = {
  height: { sm: 36, md: 44, lg: 48, xl: 52 },
  borderRadius: borderRadius.full,
  fontSize: { sm: 12, md: 13, lg: 14, xl: 15 },
  paddingHorizontal: { sm: 14, md: 20, lg: 24, xl: 28 },
};

const input = {
  height: { sm: 36, md: 44, lg: 52 },
  borderRadius: borderRadius.md,
  borderWidth: 1,
  fontSize: 13,
  paddingHorizontal: 14,
};

const card = {
  borderRadius: borderRadius['2xl'],
  borderWidth: 1.5,
  padding: { sm: 12, md: 16, lg: 20, xl: 24 },
};

const badge = {
  borderRadius: borderRadius.full,
  fontSize: { sm: 10, md: 11, lg: 13 },
  paddingVertical: { sm: 2, md: 3, lg: 5 },
  paddingHorizontal: { sm: 8, md: 10, lg: 14 },
};

const toggle = {
  track: { sm: { w: 36, h: 20 }, md: { w: 44, h: 24 }, lg: { w: 52, h: 28 } },
  thumb: { sm: 14, md: 18, lg: 22 },
};

const avatar = {
  size: { xs: 24, sm: 32, md: 40, lg: 48, xl: 56, '2xl': 72 },
  fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, '2xl': 22 },
  statusDot: { xs: 6, sm: 8, md: 10, lg: 12, xl: 14, '2xl': 16 },
};

const iconContainer = {
  size: 36,
  borderRadius: borderRadius.md,
};

const bottomSheet = {
  borderRadius: borderRadius['2xl'],
  handleWidth: 40,
  handleHeight: 4,
};

// ─── ANIMATION VALUES ───────────────────────────────────────────────────
const animation = {
  tabSwitch: 200,
  cardPress: 150,
  toggle: 250,
  modalSlideUp: 300,
  fadeIn: 200,
  scalePress: { scale: 0.97, duration: 100 },
  progressFill: 400,
  statusPulse: 1500,
};

// ─── ICON SIZES ─────────────────────────────────────────────────────────
const iconSize = {
  navigation: 20,
  section: 18,
  inline: 15,
  small: 13,
};

// ─── SCREEN LAYOUT ──────────────────────────────────────────────────────
const layout = {
  screenPadding: spacing.xl,      // 20
  sectionGap: 14,
  contentPadding: spacing.lg,     // 16
};

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  button,
  input,
  card,
  badge,
  toggle,
  avatar,
  iconContainer,
  bottomSheet,
  animation,
  iconSize,
  layout,
};
