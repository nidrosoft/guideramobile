---
description: How to create a new screen with proper theme support
---

# Creating a New Theme-Aware Screen

Every new screen in this project MUST use dynamic theming via `useTheme()`. Never use static `colors` from `@/styles` for UI element colors in JSX.

## Required Pattern

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';

export default function MyNewScreen() {
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Screen Title</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.text, { color: tc.textPrimary }]}>Hello</Text>
        <Text style={[styles.subtext, { color: tc.textSecondary }]}>Subtitle</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  content: { flex: 1, padding: spacing.lg },
  text: { fontSize: typography.fontSize.base },
  subtext: { fontSize: typography.fontSize.sm },
});
```

## Key Rules

1. **Always** import `useTheme` from `@/context/ThemeContext`
2. **Always** destructure as `const { colors: tc, isDark } = useTheme();`
3. **Always** set `StatusBar style={isDark ? 'light' : 'dark'}`
4. **Never** use static `colors.textPrimary`, `colors.background`, etc. in JSX — use `tc.textPrimary`, `tc.background` instead
5. Static `StyleSheet` can keep structural values (padding, flex, borderRadius) but colors should be applied inline via `tc`
6. For cards/elevated surfaces: use `tc.bgElevated` background + `tc.borderSubtle` border
7. For inputs: use `tc.bgCard` background + `tc.borderSubtle` border + `tc.textPrimary` text + `tc.textTertiary` placeholder
8. Import `spacing`, `typography`, `borderRadius` from `@/styles` for layout tokens (these are theme-independent)

## Common Theme Color Tokens

| Token | Usage |
|-------|-------|
| `tc.background` | Screen background |
| `tc.bgElevated` | Card/header backgrounds |
| `tc.bgCard` | Input/form field backgrounds |
| `tc.textPrimary` | Primary text |
| `tc.textSecondary` | Secondary/subtitle text |
| `tc.textTertiary` | Placeholder/hint text |
| `tc.borderSubtle` | Borders and dividers |
| `tc.primary` | Accent/brand color |
