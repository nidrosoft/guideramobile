/**
 * TRUST BADGE
 * 
 * Displays a guide's trust tier badge with color-coded shield icon.
 * Supports multiple sizes: small (inline text), medium (card), large (profile).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldTick, ShieldSecurity, Shield, Crown } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { TrustTier, TRUST_TIERS } from '../types/guide.types';

interface TrustBadgeProps {
  tier: TrustTier;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: object;
}

const BADGE_SIZES = {
  small: { icon: 14, fontSize: 10, padding: 3, gap: 3 },
  medium: { icon: 16, fontSize: 12, padding: 5, gap: 4 },
  large: { icon: 20, fontSize: 14, padding: 8, gap: 6 },
};

function getBadgeIcon(tier: TrustTier, size: number, color: string) {
  const variant = 'Bold' as const;
  switch (tier) {
    case 'community_ambassador':
      return <Crown size={size} color={color} variant={variant} />;
    case 'trusted_guide':
      return <ShieldSecurity size={size} color={color} variant={variant} />;
    case 'background_cleared':
      return <ShieldTick size={size} color={color} variant={variant} />;
    case 'verified_local':
    default:
      return <Shield size={size} color={color} variant={variant} />;
  }
}

export default function TrustBadge({ tier, size = 'medium', showLabel = true, style }: TrustBadgeProps) {
  const tierInfo = TRUST_TIERS[tier];
  const sizeConfig = BADGE_SIZES[size];

  return (
    <View style={[styles.container, { paddingHorizontal: sizeConfig.padding, paddingVertical: sizeConfig.padding - 1 }, style]}>
      <View style={[styles.iconBg, { backgroundColor: tierInfo.color + '20' }]}>
        {getBadgeIcon(tier, sizeConfig.icon, tierInfo.color)}
      </View>
      {showLabel && (
        <Text style={[styles.label, { fontSize: sizeConfig.fontSize, color: tierInfo.color, marginLeft: sizeConfig.gap }]}>
          {tierInfo.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
  },
  iconBg: {
    borderRadius: 12,
    padding: 2,
  },
  label: {
    fontWeight: '600',
  },
});
