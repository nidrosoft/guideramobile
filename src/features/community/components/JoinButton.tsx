/**
 * JOIN BUTTON COMPONENT
 * 
 * Smart button that handles join/leave/pending states.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { TickCircle, Clock, Add, LogoutCurve } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useCommunityMembership } from '../hooks/useCommunityMembership';
import { CommunityPrivacy, MembershipStatus } from '../types/community.types';

interface JoinButtonProps {
  communityId: string;
  privacy: CommunityPrivacy;
  initialStatus?: MembershipStatus | 'none';
  variant?: 'primary' | 'outline' | 'small';
  isPremium?: boolean;
}

export default function JoinButton({
  communityId,
  privacy,
  initialStatus = 'none',
  variant = 'primary',
  isPremium = true,
}: JoinButtonProps) {
  const {
    status,
    isLoading,
    isMember,
    isPending,
    getButtonText,
    getButtonAction,
  } = useCommunityMembership({
    communityId,
    privacy,
    initialStatus,
    isPremium,
  });
  
  const isSmall = variant === 'small';
  
  const getButtonStyle = () => {
    if (isMember) {
      return [styles.button, styles.buttonJoined, isSmall && styles.buttonSmall];
    }
    if (isPending) {
      return [styles.button, styles.buttonPending, isSmall && styles.buttonSmall];
    }
    if (variant === 'outline') {
      return [styles.button, styles.buttonOutline, isSmall && styles.buttonSmall];
    }
    return [styles.button, styles.buttonPrimary, isSmall && styles.buttonSmall];
  };
  
  const getTextStyle = () => {
    if (isMember) {
      return [styles.buttonText, styles.textJoined, isSmall && styles.textSmall];
    }
    if (isPending) {
      return [styles.buttonText, styles.textPending, isSmall && styles.textSmall];
    }
    if (variant === 'outline') {
      return [styles.buttonText, styles.textOutline, isSmall && styles.textSmall];
    }
    return [styles.buttonText, styles.textPrimary, isSmall && styles.textSmall];
  };
  
  const getIcon = () => {
    if (isLoading) return null;
    
    const iconSize = isSmall ? 14 : 18;
    
    if (isMember) {
      return <TickCircle size={iconSize} color={colors.success} variant="Bold" />;
    }
    if (isPending) {
      return <Clock size={iconSize} color={colors.warning} />;
    }
    return <Add size={iconSize} color={variant === 'outline' ? colors.primary : colors.white} />;
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={getButtonAction()}
      disabled={isLoading || status === 'banned'}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={isMember || isPending ? colors.textSecondary : colors.white} 
        />
      ) : (
        <View style={styles.content}>
          {getIcon()}
          <Text style={getTextStyle()}>{getButtonText()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 100,
  },
  buttonSmall: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 80,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  buttonJoined: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  buttonPending: {
    backgroundColor: colors.warning + '15',
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  textSmall: {
    fontSize: typography.fontSize.xs,
  },
  textPrimary: {
    color: colors.white,
  },
  textOutline: {
    color: colors.primary,
  },
  textJoined: {
    color: colors.success,
  },
  textPending: {
    color: colors.warning,
  },
});
