const mockRpc = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import { cacheService } from '@/services/cache/cacheService';
import { profileService } from '@/services/profile.service';

describe('profileService account summary', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cacheService.clear();
    mockRpc.mockResolvedValue({
      data: {
        profile: { id: 'profile-123', first_name: 'Cyriac', last_name: 'Demo' },
        savedItems: { total: 3 },
        partner: { status: 'approved', didit_verification_status: 'approved' },
      },
      error: null,
    });
  });

  it('fetches account summary with one RPC and caches short-term reads', async () => {
    const first = await profileService.getAccountSummary('profile-123');
    const second = await profileService.getAccountSummary('profile-123');

    expect(first?.savedItems.total).toBe(3);
    expect(second?.partner?.status).toBe('approved');
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('get_account_summary', { p_user_id: 'profile-123' });
  });

  it('bypasses the account summary cache when requested', async () => {
    await profileService.getAccountSummary('profile-123');
    await profileService.getAccountSummary('profile-123', { forceRefresh: true });

    expect(mockRpc).toHaveBeenCalledTimes(2);
  });
});
