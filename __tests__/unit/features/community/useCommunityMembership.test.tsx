import { act, renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockJoinGroup = jest.fn();
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

jest.mock('@/services/community/group.service', () => ({
  groupService: {
    joinGroup: (...args: any[]) => mockJoinGroup(...args),
  },
}));

jest.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showInfo: mockShowInfo,
    showError: mockShowError,
  }),
}));

import { useCommunityMembership } from '@/features/community/hooks/useCommunityMembership';

describe('useCommunityMembership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the app toast system when a public group is joined', async () => {
    mockJoinGroup.mockResolvedValue({ status: 'joined' });

    const { result } = renderHook(() =>
      useCommunityMembership({
        communityId: 'group-1',
        privacy: 'public',
        initialStatus: 'none',
      })
    );

    await act(async () => {
      await result.current.join();
    });

    expect(mockShowSuccess).toHaveBeenCalledWith('You are now a member of this group.');
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(result.current.status).toBe('active');
  });
});
