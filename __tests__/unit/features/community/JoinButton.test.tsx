import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockLeaveGroup = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowInfo = jest.fn();
const mockShowError = jest.fn();

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'user-1' } }),
}));

jest.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showInfo: mockShowInfo,
    showError: mockShowError,
  }),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      bgOverlay: 'rgba(0,0,0,0.4)',
      bgElevated: '#ffffff',
      borderSubtle: '#eeeeee',
      error: '#ff3355',
      errorBg: '#ffeeee',
      primary: '#3FC39E',
      textPrimary: '#111111',
      textSecondary: '#666666',
    },
  }),
}));

jest.mock('@/services/community/group.service', () => ({
  groupService: {
    joinGroup: jest.fn(),
    leaveGroup: (...args: any[]) => mockLeaveGroup(...args),
    cancelJoinRequest: jest.fn(),
  },
}));

jest.mock('iconsax-react-native', () => ({
  Add: 'Add',
  Clock: 'Clock',
  LogoutCurve: 'LogoutCurve',
  TickCircle: 'TickCircle',
}));

import JoinButton from '@/features/community/components/JoinButton';

describe('JoinButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLeaveGroup.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the in-app confirmation modal before leaving a group', async () => {
    const { findByText, getByText } = render(
      <JoinButton communityId="group-1" privacy="public" initialStatus="active" />
    );

    fireEvent.press(getByText('Joined'));

    expect(await findByText('Leave Group')).toBeTruthy();
    expect(getByText('Are you sure you want to leave this group?')).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByText('Leave'));
    });

    await waitFor(() => {
      expect(mockLeaveGroup).toHaveBeenCalledWith('user-1', 'group-1');
    });
  });
});
