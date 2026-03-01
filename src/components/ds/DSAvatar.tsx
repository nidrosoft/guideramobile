/**
 * DESIGN SYSTEM — AVATAR
 *
 * Sizes: xs(24), sm(32), md(40), lg(48), xl(56), 2xl(72)
 * Shows image or initials fallback. Optional status dot.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/styles/colors';
import { fontFamily } from '@/styles/typography';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type StatusType = 'online' | 'offline' | 'away' | 'busy';

interface DSAvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  status?: StatusType;
  style?: ViewStyle;
}

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 48, xl: 56, '2xl': 72 };
const FONT_MAP = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, '2xl': 22 };
const DOT_MAP = { xs: 6, sm: 8, md: 10, lg: 12, xl: 14, '2xl': 16 };

const STATUS_COLORS: Record<StatusType, string> = {
  online: colors.success,
  offline: colors.gray400,
  away: colors.warning,
  busy: colors.error,
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function DSAvatar({
  uri,
  name,
  size = 'md',
  status,
  style,
}: DSAvatarProps) {
  const dim = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const dotSize = DOT_MAP[size];

  return (
    <View style={[{ width: dim, height: dim }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            backgroundColor: colors.bgElevated,
          }}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: dim, height: dim, borderRadius: dim / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      {status && (
        <View
          style={[
            styles.statusDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: STATUS_COLORS[status],
              borderWidth: 2,
              borderColor: colors.bgPrimary,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryBorderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
    color: colors.primary,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
