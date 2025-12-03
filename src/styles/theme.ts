import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';

// Apple-style border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 24,      // Universal card radius - ALL cards use 24px
  xl: 24,      // Same as lg for consistency
  '2xl': 28,
  full: 9999,
  
  // Nested element rule: inner elements = card radius - 4px
  nested: 20,  // For images/components inside 24px cards
};

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  
  // Apple-style button configuration
  button: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    borderRadius: borderRadius.md,
  },
  
  // Card configuration
  card: {
    borderRadius: borderRadius.lg,  // All cards = 24px
    padding: spacing.lg,
  },
};
