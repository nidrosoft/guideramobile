/**
 * USE COMMUNITY MEMBERSHIP HOOK
 * 
 * Handles join/leave/request functionality for communities.
 * Wired to real groupService for Supabase operations.
 */

import { useState, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { CommunityPrivacy, MembershipStatus } from '../types/community.types';
import { groupService } from '@/services/community/group.service';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface MembershipState {
  status: MembershipStatus | 'none';
  isLoading: boolean;
}

interface UseCommunityMembershipProps {
  communityId: string;
  privacy: CommunityPrivacy;
  initialStatus?: MembershipStatus | 'none';
  isPremium?: boolean;
}

interface UseCommunityMembershipReturn {
  status: MembershipStatus | 'none';
  isLoading: boolean;
  isMember: boolean;
  isPending: boolean;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  cancelRequest: () => Promise<void>;
  getButtonText: () => string;
  getButtonAction: () => () => void;
}

export function useCommunityMembership({
  communityId,
  privacy,
  initialStatus = 'none',
  isPremium = true,
}: UseCommunityMembershipProps): UseCommunityMembershipReturn {
  const { profile } = useAuth();
  const { showSuccess, showInfo, showError } = useToast();
  const userId = profile?.id;

  const [state, setState] = useState<MembershipState>({
    status: initialStatus,
    isLoading: false,
  });
  
  const isMember = state.status === 'active';
  const isPending = state.status === 'pending';
  
  const join = useCallback(async () => {
    if (state.isLoading || !userId) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await groupService.joinGroup(userId, communityId);
      
      if (result.status === 'joined') {
        setState({ status: 'active', isLoading: false });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess('You are now a member of this group.');
      } else if (result.status === 'pending') {
        setState({ status: 'pending', isLoading: false });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showInfo('Your request to join has been sent. You\'ll be notified when it\'s approved.');
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(error?.message || 'Failed to join group. Please try again.');
    }
  }, [communityId, showError, showInfo, showSuccess, userId, state.isLoading]);
  
  const leave = useCallback(async () => {
    if (state.isLoading || !userId) return;

    setState(prev => ({ ...prev, isLoading: true }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await groupService.leaveGroup(userId, communityId);
      setState({ status: 'none', isLoading: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showInfo('You left this group.');
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(error?.message || 'Failed to leave group. Please try again.');
    }
  }, [communityId, showError, showInfo, userId, state.isLoading]);
  
  const cancelRequest = useCallback(async () => {
    if (state.isLoading || !userId) return;

    setState(prev => ({ ...prev, isLoading: true }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await groupService.cancelJoinRequest(userId, communityId);
      setState({ status: 'none', isLoading: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showInfo('Join request canceled.');
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(error?.message || 'Failed to cancel request. Please try again.');
    }
  }, [communityId, showError, showInfo, userId, state.isLoading]);
  
  const getButtonText = useCallback(() => {
    if (state.isLoading) return 'Loading...';
    
    switch (state.status) {
      case 'active':
        return 'Joined';
      case 'pending':
        return 'Pending';
      case 'banned':
        return 'Banned';
      case 'left':
      case 'none':
      default:
        return privacy === 'public' ? 'Join' : 'Request to Join';
    }
  }, [state.status, state.isLoading, privacy]);
  
  const getButtonAction = useCallback(() => {
    switch (state.status) {
      case 'active':
        return leave;
      case 'pending':
        return cancelRequest;
      case 'banned':
        return () => showError('You have been banned from this group.');
      case 'left':
      case 'none':
      default:
        return join;
    }
  }, [state.status, join, leave, cancelRequest, showError]);
  
  return {
    status: state.status,
    isLoading: state.isLoading,
    isMember,
    isPending,
    join,
    leave,
    cancelRequest,
    getButtonText,
    getButtonAction,
  };
}
