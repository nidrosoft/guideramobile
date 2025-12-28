/**
 * Accessibility Utilities
 * 
 * Helpers for WCAG 2.1 compliance:
 * - Accessibility props generation
 * - Screen reader announcements
 * - Focus management
 * - Reduced motion detection
 */

import { AccessibilityInfo, Platform } from 'react-native';
import { useEffect, useState, useCallback } from 'react';

// Accessibility roles
export const A11Y_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  IMAGE: 'image',
  TEXT: 'text',
  HEADER: 'header',
  SEARCH: 'search',
  TAB: 'tab',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SWITCH: 'switch',
  SLIDER: 'slider',
  MENU: 'menu',
  ALERT: 'alert',
  NONE: 'none',
} as const;

type AccessibilityRole = typeof A11Y_ROLES[keyof typeof A11Y_ROLES];

interface A11yProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

/**
 * Generate accessibility props for a button
 */
export function buttonA11y(
  label: string,
  hint?: string,
  disabled?: boolean
): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: 'button',
    accessibilityState: { disabled },
  };
}

/**
 * Generate accessibility props for an image
 */
export function imageA11y(description: string): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: description,
    accessibilityRole: 'image',
  };
}

/**
 * Generate accessibility props for a header
 */
export function headerA11y(text: string, level?: number): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: text,
    accessibilityRole: 'header',
  };
}

/**
 * Generate accessibility props for a link
 */
export function linkA11y(label: string, hint?: string): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint || 'Double tap to open',
    accessibilityRole: 'link',
  };
}

/**
 * Generate accessibility props for a checkbox
 */
export function checkboxA11y(
  label: string,
  checked: boolean,
  hint?: string
): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint || `Double tap to ${checked ? 'uncheck' : 'check'}`,
    accessibilityRole: 'checkbox',
    accessibilityState: { checked },
  };
}

/**
 * Generate accessibility props for a switch/toggle
 */
export function switchA11y(
  label: string,
  enabled: boolean,
  hint?: string
): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: `${label}, ${enabled ? 'on' : 'off'}`,
    accessibilityHint: hint || `Double tap to ${enabled ? 'disable' : 'enable'}`,
    accessibilityRole: 'switch',
    accessibilityState: { checked: enabled },
  };
}

/**
 * Generate accessibility props for a slider
 */
export function sliderA11y(
  label: string,
  value: number,
  min: number,
  max: number
): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'slider' as AccessibilityRole,
    accessibilityValue: {
      min,
      max,
      now: value,
      text: `${value}`,
    },
  };
}

/**
 * Generate accessibility props for a tab
 */
export function tabA11y(
  label: string,
  selected: boolean,
  index: number,
  total: number
): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: `${label}, tab ${index + 1} of ${total}`,
    accessibilityRole: 'tab',
    accessibilityState: { selected },
  };
}

/**
 * Announce a message to screen readers
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Hook to detect if screen reader is enabled
 */
export function useScreenReader(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsEnabled(enabled);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isEnabled;
}

/**
 * Hook to detect if reduce motion is enabled
 */
export function useReducedMotion(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkReduceMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsEnabled(enabled);
    };

    checkReduceMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isEnabled;
}

/**
 * Hook to detect if bold text is enabled (iOS only)
 */
export function useBoldText(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const checkBoldText = async () => {
      const enabled = await AccessibilityInfo.isBoldTextEnabled();
      setIsEnabled(enabled);
    };

    checkBoldText();

    const subscription = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      setIsEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isEnabled;
}

/**
 * Set accessibility focus to a component
 */
export function setAccessibilityFocus(ref: any): void {
  if (ref?.current) {
    AccessibilityInfo.setAccessibilityFocus(ref.current);
  }
}

/**
 * Check color contrast ratio (WCAG 2.1)
 * Returns true if contrast is sufficient (>= 4.5:1 for normal text)
 */
export function hasGoodContrast(
  foreground: string,
  background: string,
  largeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const threshold = largeText ? 3 : 4.5;
  return ratio >= threshold;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export default {
  buttonA11y,
  imageA11y,
  headerA11y,
  linkA11y,
  checkboxA11y,
  switchA11y,
  sliderA11y,
  tabA11y,
  announceForAccessibility,
  setAccessibilityFocus,
  hasGoodContrast,
  getContrastRatio,
  A11Y_ROLES,
};
