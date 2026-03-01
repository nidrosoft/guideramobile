/**
 * DESIGN SYSTEM — TYPOGRAPHY TOKENS
 *
 * Display font: Host Grotesk (Bold 700 only — headings, KPI values)
 * Body font: Rubik (300–700 — everything else)
 *
 * If custom fonts are not loaded, falls back to system fonts.
 */

export const fontFamily = {
  // Display — ONLY for headings and large KPI values at weight 700
  display: 'HostGrotesk-Bold',
  // Body — all other text
  light: 'Rubik-Light',
  regular: 'Rubik-Regular',
  medium: 'Rubik-Medium',
  semibold: 'Rubik-SemiBold',
  bold: 'Rubik-Bold',
};

export const typography = {
  fontFamily,

  // Font Families — legacy compatibility (maps to Rubik by default)
  fonts: {
    display: fontFamily.display,
    body: fontFamily.regular,
  },

  // ─── FONT SIZES — Mobile Scale ────────────────────────────────────────
  fontSize: {
    captionSm: 10,
    caption: 11,
    bodySm: 12,
    body: 13,
    bodyLg: 14,
    heading3: 15,
    heading2: 18,
    kpiValue: 20,
    heading1: 22,
    // Legacy aliases
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // ─── FONT WEIGHTS ─────────────────────────────────────────────────────
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // ─── LINE HEIGHTS ─────────────────────────────────────────────────────
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // ─── SEMANTIC TEXT STYLES (ready-to-spread presets) ────────────────────
  heading1: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  heading2: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24,
  },
  heading3: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  captionSm: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 13,
  },
  kpiValue: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
  },
};
