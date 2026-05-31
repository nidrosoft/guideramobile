interface EntitlementClient {
  from: (table: string) => any;
}

export const INTERNAL_TESTING_ENTITLEMENT = 'internal_testing';

export async function hasAccountEntitlement(
  supabase: EntitlementClient,
  userId: string | null | undefined,
  entitlement = INTERNAL_TESTING_ENTITLEMENT,
  scope = 'all'
): Promise<boolean> {
  if (!userId) return false;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('account_entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('entitlement', entitlement)
    .eq('enabled', true)
    .in('scope', ['all', scope])
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();

  if (error) {
    console.warn('[account-entitlements] lookup failed:', error.message || error);
    return false;
  }

  return Boolean(data?.id);
}
