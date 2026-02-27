/**
 * REWARDS SERVICE
 * 
 * Service for managing rewards points, membership tiers, and referrals.
 */

import { supabase } from '@/lib/supabase/client';

export type MembershipTier = 'free' | 'silver' | 'gold' | 'platinum';
export type PointsType = 'earned' | 'redeemed' | 'expired' | 'bonus' | 'referral';
export type ReferralStatus = 'pending' | 'signed_up' | 'completed' | 'expired';

export interface MembershipTierInfo {
  id: MembershipTier;
  name: string;
  color: string;
  gradient: string[];
  icon: string;
  pointsMultiplier: number;
  benefits: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  minPoints?: number;
}

export interface RewardPoints {
  id: string;
  user_id: string;
  amount: number;
  type: PointsType;
  source: string;
  description?: string;
  booking_id?: string;
  referral_id?: string;
  expires_at?: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id?: string;
  referral_code: string;
  status: ReferralStatus;
  reward_amount: number;
  reward_claimed: boolean;
  referred_email?: string;
  referred_name?: string;
  signed_up_at?: string;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export const MEMBERSHIP_TIERS: MembershipTierInfo[] = [
  {
    id: 'free',
    name: 'Explorer',
    color: '#6B7280',
    gradient: ['#6B7280', '#4B5563'],
    icon: 'compass',
    pointsMultiplier: 1,
    benefits: [
      'Basic trip planning',
      'Standard customer support',
      'Access to deals',
      'Earn 1x points on bookings',
    ],
    monthlyPrice: 0,
    yearlyPrice: 0,
  },
  {
    id: 'silver',
    name: 'Voyager',
    color: '#94A3B8',
    gradient: ['#94A3B8', '#64748B'],
    icon: 'star',
    pointsMultiplier: 1.5,
    benefits: [
      'Everything in Explorer',
      'Priority customer support',
      'Early access to deals',
      'Earn 1.5x points on bookings',
      'Free cancellation on select hotels',
      '5% discount on experiences',
    ],
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    minPoints: 1000,
  },
  {
    id: 'gold',
    name: 'Navigator',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    icon: 'crown',
    pointsMultiplier: 2,
    benefits: [
      'Everything in Voyager',
      '24/7 premium support',
      'Exclusive member-only deals',
      'Earn 2x points on bookings',
      'Free cancellation on all bookings',
      '10% discount on all bookings',
      'Airport lounge access (2x/year)',
      'Free travel insurance',
    ],
    monthlyPrice: 19.99,
    yearlyPrice: 199,
    minPoints: 5000,
  },
  {
    id: 'platinum',
    name: 'Elite',
    color: '#1E293B',
    gradient: ['#1E293B', '#0F172A'],
    icon: 'diamond',
    pointsMultiplier: 3,
    benefits: [
      'Everything in Navigator',
      'Dedicated travel concierge',
      'First access to flash sales',
      'Earn 3x points on bookings',
      '15% discount on all bookings',
      'Unlimited airport lounge access',
      'Premium travel insurance',
      'Free room upgrades when available',
      'Late checkout guaranteed',
      'Complimentary airport transfers',
    ],
    monthlyPrice: 49.99,
    yearlyPrice: 499,
    minPoints: 15000,
  },
];

export const rewardsService = {
  // ============ MEMBERSHIP ============

  /**
   * Get membership tier info by ID
   */
  getTierInfo(tierId: MembershipTier): MembershipTierInfo {
    return MEMBERSHIP_TIERS.find(t => t.id === tierId) || MEMBERSHIP_TIERS[0];
  },

  /**
   * Get all membership tiers
   */
  getAllTiers(): MembershipTierInfo[] {
    return MEMBERSHIP_TIERS;
  },

  /**
   * Get user's current membership
   */
  async getUserMembership(userId: string): Promise<{
    tier: MembershipTier;
    expiresAt?: string;
    pointsBalance: number;
    referralCode?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('membership_type, membership_expires_at, reward_points_balance, referral_code')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return { tier: 'free', pointsBalance: 0 };
      }

      return {
        tier: (data.membership_type as MembershipTier) || 'free',
        expiresAt: data.membership_expires_at,
        pointsBalance: data.reward_points_balance || 0,
        referralCode: data.referral_code,
      };
    } catch {
      return { tier: 'free', pointsBalance: 0 };
    }
  },

  /**
   * Generate a unique referral code for user
   */
  async generateReferralCode(userId: string): Promise<string> {
    const code = `GUIDERA${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    await supabase
      .from('profiles')
      .update({ referral_code: code })
      .eq('id', userId);

    return code;
  },

  // ============ REWARD POINTS ============

  /**
   * Get user's points history
   */
  async getPointsHistory(userId: string, limit?: number): Promise<{ data: RewardPoints[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('reward_points')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching points history:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getPointsHistory:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get points summary
   */
  async getPointsSummary(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalRedeemed: number;
    expiringThisMonth: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('reward_points')
        .select('amount, type, expires_at')
        .eq('user_id', userId);

      if (error || !data) {
        return { balance: 0, totalEarned: 0, totalRedeemed: 0, expiringThisMonth: 0 };
      }

      const totalEarned = data
        .filter(p => ['earned', 'bonus', 'referral'].includes(p.type))
        .reduce((sum, p) => sum + p.amount, 0);

      const totalRedeemed = data
        .filter(p => p.type === 'redeemed')
        .reduce((sum, p) => sum + Math.abs(p.amount), 0);

      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const expiringThisMonth = data
        .filter(p => {
          if (!p.expires_at) return false;
          const expiryDate = new Date(p.expires_at);
          return expiryDate <= endOfMonth && expiryDate > now;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        balance: totalEarned - totalRedeemed,
        totalEarned,
        totalRedeemed,
        expiringThisMonth,
      };
    } catch {
      return { balance: 0, totalEarned: 0, totalRedeemed: 0, expiringThisMonth: 0 };
    }
  },

  /**
   * Add points to user account
   */
  async addPoints(
    userId: string,
    amount: number,
    source: string,
    type: PointsType = 'earned',
    description?: string,
    bookingId?: string,
    referralId?: string
  ): Promise<{ error: Error | null }> {
    try {
      // Insert points record
      const { error: insertError } = await supabase
        .from('reward_points')
        .insert({
          user_id: userId,
          amount,
          type,
          source,
          description,
          booking_id: bookingId,
          referral_id: referralId,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        });

      if (insertError) {
        return { error: insertError as Error };
      }

      // Update balance in profile
      const { error: updateError } = await supabase.rpc('increment_points_balance', {
        user_id: userId,
        points_amount: amount,
      });

      // If RPC doesn't exist, update manually
      if (updateError) {
        await supabase
          .from('profiles')
          .update({ 
            reward_points_balance: supabase.rpc('coalesce', { 
              value: 'reward_points_balance', 
              default_value: 0 
            }) 
          })
          .eq('id', userId);
      }

      return { error: null };
    } catch (error) {
      console.error('Error in addPoints:', error);
      return { error: error as Error };
    }
  },

  // ============ REFERRALS ============

  /**
   * Get user's referrals
   */
  async getReferrals(userId: string): Promise<{ data: Referral[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referrals:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getReferrals:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Get referral stats
   */
  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalEarned: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('status, reward_amount, reward_claimed')
        .eq('referrer_id', userId);

      if (error || !data) {
        return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, totalEarned: 0 };
      }

      const completedReferrals = data.filter(r => r.status === 'completed').length;
      const pendingReferrals = data.filter(r => ['pending', 'signed_up'].includes(r.status)).length;
      const totalEarned = data
        .filter(r => r.reward_claimed)
        .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

      return {
        totalReferrals: data.length,
        completedReferrals,
        pendingReferrals,
        totalEarned,
      };
    } catch {
      return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, totalEarned: 0 };
    }
  },

  /**
   * Create a referral invite
   */
  async createReferral(
    userId: string,
    referralCode: string,
    email?: string,
    name?: string
  ): Promise<{ data: Referral | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: userId,
          referral_code: `${referralCode}_${Date.now()}`,
          referred_email: email,
          referred_name: name,
          reward_amount: 500, // Default reward: 500 points
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating referral:', error);
        return { data: null, error: error as Error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createReferral:', error);
      return { data: null, error: error as Error };
    }
  },
};
