/**
 * DESIGN SYSTEM — TEXT INPUT
 *
 * Sizes: sm (36), md (44), lg (52)
 * Focus state: accent border. Error state: red border + message.
 * Supports leading/trailing icons.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { fontFamily } from '@/styles/typography';

type InputSize = 'sm' | 'md' | 'lg';

interface DSInputProps extends Omit<TextInputProps, 'style'> {
  size?: InputSize;
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

const SIZE_CONFIG = {
  sm: { height: 36 },
  md: { height: 44 },
  lg: { height: 52 },
};

export default function DSInput({
  size = 'md',
  label,
  error,
  hint,
  leadingIcon,
  trailingIcon,
  containerStyle,
  inputStyle,
  ...textInputProps
}: DSInputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const sizeConfig = SIZE_CONFIG[size];

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    textInputProps.onFocus?.(e);
  }, [textInputProps.onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    textInputProps.onBlur?.(e);
  }, [textInputProps.onBlur]);

  const inputContainerStyle: TextStyle[] = [
    {
      backgroundColor: colors.bgInput,
      borderWidth: 1,
      borderColor: colors.borderStandard,
      borderRadius: 10,
      paddingHorizontal: 14,
      fontSize: 13,
      fontFamily: fontFamily.regular,
      color: colors.textPrimary,
      height: sizeConfig.height,
    } as TextStyle,
    isFocused && ({ borderColor: colors.primaryBorderStrong, backgroundColor: colors.bgElevated } as TextStyle),
    !!error && ({ borderColor: colors.errorBorder } as TextStyle),
    leadingIcon ? ({ paddingLeft: 40 } as TextStyle) : undefined,
    trailingIcon ? ({ paddingRight: 40 } as TextStyle) : undefined,
    inputStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}
      <View style={styles.inputRow}>
        {leadingIcon && <View style={styles.leadingIcon}>{leadingIcon}</View>}
        <TextInput
          {...textInputProps}
          style={inputContainerStyle}
          placeholderTextColor={colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {trailingIcon && <View style={styles.trailingIcon}>{trailingIcon}</View>}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      {hint && !error && <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  inputRow: {
    position: 'relative',
  },
  leadingIcon: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  trailingIcon: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
});
