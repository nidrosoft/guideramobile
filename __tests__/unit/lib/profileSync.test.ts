const mockRpc = jest.fn();
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import { syncClerkUserToSupabase } from '@/lib/clerk/profileSync';

describe('profileSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockResolvedValue({
      data: {
        id: 'profile-123',
        clerk_id: 'user_123',
        first_name: 'Cyriac',
        last_name: 'Demo',
        email: 'cyriac@example.com',
        onboarding_completed: true,
        onboarding_step: 10,
      },
      error: null,
    });
  });

  it('bootstraps the profile with one idempotent RPC', async () => {
    const profile = await syncClerkUserToSupabase({
      id: 'user_123',
      firstName: 'Cyriac',
      lastName: 'Demo',
      emailAddresses: [{ emailAddress: 'cyriac@example.com' }],
      phoneNumbers: [{ phoneNumber: '+15555550123' }],
      imageUrl: 'https://example.com/avatar.jpg',
    });

    expect(profile?.id).toBe('profile-123');
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith(
      'bootstrap_profile',
      expect.objectContaining({
        p_clerk_id: 'user_123',
        p_first_name: 'Cyriac',
        p_last_name: 'Demo',
        p_email: 'cyriac@example.com',
        p_phone: '+15555550123',
        p_avatar_url: 'https://example.com/avatar.jpg',
      })
    );
  });
});
