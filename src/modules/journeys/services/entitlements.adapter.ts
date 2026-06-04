/**
 * Entitlements adapter (spec §2.2/§11.1) — the only place the module reads
 * subscription state. Source of truth is profiles.membership_type
 * ('free' | paid tiers). Pro = any non-free tier.
 */
export type MembershipTier = string | null | undefined;

export function isProTier(tier: MembershipTier): boolean {
  return !!tier && tier !== 'free';
}
