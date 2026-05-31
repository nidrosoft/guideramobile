/**
 * JOIN BUTTON COMPONENT
 * 
 * Smart button that handles join/leave/pending states.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { TickCircle, Clock, Add, LogoutCurve } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors: tc, isDark } = useTheme();
  const [confirmAction, setConfirmAction] = React.useState<'leave' | 'cancel' | null>(null);
  const {
    status,
    isLoading,
    isMember,
    isPending,
    leave,
    cancelRequest,
    getButtonText,
    getButtonAction,
  } = useCommunityMembership({
    communityId,
    privacy,
    initialStatus,
    isPremium,
  });
  
  const isSmall = variant === 'small';

  const confirmationCopy = confirmAction === 'leave'
    ? {
        title: 'Leave Group',
        message: 'Are you sure you want to leave this group?',
        confirm: 'Leave',
      }
    : {
        title: 'Cancel Request',
        message: 'Are you sure you want to cancel your join request?',
        confirm: 'Cancel Request',
      };

  const handlePress = () => {
    if (isMember) {
      setConfirmAction('leave');
      return;
    }
    if (isPending) {
      setConfirmAction('cancel');
      return;
    }
    getButtonAction()();
  };

  const handleConfirm = () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === 'leave') {
      leave();
    } else if (action === 'cancel') {
      cancelRequest();
    }
  };
  
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
    <>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handlePress}
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

      <Modal
        visible={confirmAction !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmAction(null)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: tc.bgOverlay }]}
          onPress={() => setConfirmAction(null)}
        >
          <Pressable
            style={[
              styles.confirmCard,
              {
                backgroundColor: isDark ? tc.bgModal : tc.bgElevated,
                borderColor: tc.borderSubtle,
              },
            ]}
          >
            <Text style={[styles.confirmTitle, { color: tc.textPrimary }]}>
              {confirmationCopy.title}
            </Text>
            <Text style={[styles.confirmMessage, { color: tc.textSecondary }]}>
              {confirmationCopy.message}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: tc.bgInput }]}
                onPress={() => setConfirmAction(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelText, { color: tc.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: tc.errorBg }]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={[styles.leaveText, { color: tc.error }]}>
                  {confirmationCopy.confirm}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  confirmTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  confirmMessage: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  leaveText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});
