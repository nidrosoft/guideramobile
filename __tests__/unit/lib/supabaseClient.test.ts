process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

const {
  buildClerkEdgeFunctionHeaders,
  getAuthenticatedEdgeFunctionHeaders,
  setClerkTokenGetter,
} = require('../../../src/lib/supabase/client');

describe('Supabase Clerk edge function headers', () => {
  afterEach(() => {
    setClerkTokenGetter(null);
  });

  it('builds a Clerk token header without replacing the Supabase Authorization header', () => {
    expect(buildClerkEdgeFunctionHeaders('clerk-token')).toEqual({
      'x-clerk-token': 'clerk-token',
    });
  });

  it('returns an empty header object when there is no active Clerk token', async () => {
    setClerkTokenGetter(async () => null);

    await expect(getAuthenticatedEdgeFunctionHeaders()).resolves.toEqual({});
  });

  it('returns Clerk edge headers from the registered token getter', async () => {
    setClerkTokenGetter(async () => 'clerk-token');

    await expect(getAuthenticatedEdgeFunctionHeaders()).resolves.toEqual({
      'x-clerk-token': 'clerk-token',
    });
  });
});
