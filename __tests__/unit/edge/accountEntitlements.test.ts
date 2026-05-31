import {
  hasAccountEntitlement,
  INTERNAL_TESTING_ENTITLEMENT,
} from '../../../supabase/functions/_shared/accountEntitlements';

function createEntitlementClient(data: unknown, error: unknown = null) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    or: jest.fn(() => chain),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  return { client: { from: jest.fn(() => chain) }, chain };
}

describe('account entitlements', () => {
  it('recognizes enabled internal testing entitlements server-side', async () => {
    const { client, chain } = createEntitlementClient({ id: 'entitlement-1' });

    await expect(
      hasAccountEntitlement(client, 'profile-123', INTERNAL_TESTING_ENTITLEMENT, 'ai_input')
    ).resolves.toBe(true);

    expect(client.from).toHaveBeenCalledWith('account_entitlements');
    expect(chain.in).toHaveBeenCalledWith('scope', ['all', 'ai_input']);
  });

  it('fails closed when no entitlement row exists', async () => {
    const { client } = createEntitlementClient(null);

    await expect(hasAccountEntitlement(client, 'profile-123')).resolves.toBe(false);
  });
});
