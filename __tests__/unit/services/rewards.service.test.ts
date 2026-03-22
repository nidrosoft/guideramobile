/**
 * Rewards Service Tests
 *
 * Tests for the rewards service covering referral code generation,
 * points management, and membership tier logic.
 */

// Mock Supabase before importing the service
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import { rewardsService, MEMBERSHIP_TIERS } from '@/services/rewards.service';
import { supabase } from '@/lib/supabase/client';

describe('rewardsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReferralCode', () => {
    it('should return a string starting with "GUIDERA"', async () => {
      // Mock the Supabase update call
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const code = await rewardsService.generateReferralCode('user-123');
      expect(typeof code).toBe('string');
      expect(code.startsWith('GUIDERA')).toBe(true);
    });

    it('should return a code of expected length (GUIDERA + 6 chars)', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const code = await rewardsService.generateReferralCode('user-123');
      // "GUIDERA" is 7 chars + 6 random chars = 13
      expect(code.length).toBe(13);
    });

    it('should generate unique codes on subsequent calls', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const code1 = await rewardsService.generateReferralCode('user-123');
      const code2 = await rewardsService.generateReferralCode('user-123');
      // Extremely unlikely to collide
      expect(code1).not.toBe(code2);
    });

    it('should persist the code to Supabase profiles', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await rewardsService.generateReferralCode('user-456');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ referral_code: expect.any(String) })
      );
    });
  });

  describe('addPoints', () => {
    it('should insert a points record and update balance via RPC', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

      const result = await rewardsService.addPoints('user-123', 100, 'booking', 'earned', 'Test points');
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('reward_points');
    });

    it('should fallback to manual balance update when RPC fails', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { reward_points_balance: 50 }, error: null }),
        }),
      });
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ insert: mockInsert }) // reward_points insert
        .mockReturnValueOnce({ select: mockSelect }) // profiles select
        .mockReturnValueOnce({ update: mockUpdate }); // profiles update

      // Make RPC fail to trigger fallback
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'RPC not found' } });

      const result = await rewardsService.addPoints('user-123', 100, 'booking');
      expect(result.error).toBeNull();
    });
  });

  describe('getTierInfo', () => {
    it('should return correct tier info for each tier ID', () => {
      const freeTier = rewardsService.getTierInfo('free');
      expect(freeTier.name).toBe('Explorer');
      expect(freeTier.pointsMultiplier).toBe(1);

      const goldTier = rewardsService.getTierInfo('gold');
      expect(goldTier.name).toBe('Navigator');
      expect(goldTier.pointsMultiplier).toBe(2);
    });

    it('should return free tier as fallback for unknown tier', () => {
      const tier = rewardsService.getTierInfo('unknown' as any);
      expect(tier.id).toBe('free');
    });
  });

  describe('getAllTiers', () => {
    it('should return all 4 membership tiers', () => {
      const tiers = rewardsService.getAllTiers();
      expect(tiers).toHaveLength(4);
      expect(tiers.map(t => t.id)).toEqual(['free', 'silver', 'gold', 'platinum']);
    });
  });

  describe('MEMBERSHIP_TIERS', () => {
    it('should have increasing price tiers', () => {
      for (let i = 1; i < MEMBERSHIP_TIERS.length; i++) {
        expect(MEMBERSHIP_TIERS[i].monthlyPrice).toBeGreaterThan(MEMBERSHIP_TIERS[i - 1].monthlyPrice);
      }
    });

    it('should have increasing points multipliers', () => {
      for (let i = 1; i < MEMBERSHIP_TIERS.length; i++) {
        expect(MEMBERSHIP_TIERS[i].pointsMultiplier).toBeGreaterThan(MEMBERSHIP_TIERS[i - 1].pointsMultiplier);
      }
    });
  });
});
