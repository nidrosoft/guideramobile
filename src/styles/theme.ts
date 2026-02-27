import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';

// Apple-style border radius (iOS Human Interface Guidelines)
export const borderRadius = {
  none: 0,
  xs: 4,       // Small elements, badges
  sm: 6,       // Chips, small buttons
  md: 8,       // Standard cards, buttons (Apple default)
  lg: 10,      // Larger cards
  xl: 12,      // Modal sheets, large containers
  '2xl': 16,   // Full-screen modals
  full: 9999,  // Pills, circular elements
  
  // Nested element rule: inner elements = container radius - 4px
  nested: 6,   // For images/components inside cards
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
    borderRadius: borderRadius.md,  // All cards = 8px (Apple standard)
    padding: spacing.lg,
  },
};
