import {
  getRequestAuthTokens,
  isServiceRoleToken,
  parseRequestingUserId,
} from '../../../supabase/functions/_shared/auth';

function unsignedJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('parseRequestingUserId', () => {
  it('returns a scalar uuid string returned by the RPC', () => {
    expect(parseRequestingUserId('5d9e9f49-1b06-421f-be33-180fddd44b77')).toBe(
      '5d9e9f49-1b06-421f-be33-180fddd44b77'
    );
  });

  it('reads the uuid from an array row shape', () => {
    expect(parseRequestingUserId([{ requesting_user_id: 'abc' }])).toBe('abc');
  });

  it('returns null for empty or invalid results', () => {
    expect(parseRequestingUserId(null)).toBeNull();
    expect(parseRequestingUserId('')).toBeNull();
    expect(parseRequestingUserId([])).toBeNull();
    expect(parseRequestingUserId({})).toBeNull();
  });
});

describe('edge auth request tokens', () => {
  it('reads the Supabase bearer token and optional Clerk edge token separately', () => {
    const tokens = getRequestAuthTokens(
      new Headers({
        Authorization: 'Bearer anon-key',
        'x-clerk-token': 'clerk-session-token',
      })
    );

    expect(tokens).toEqual({
      bearerToken: 'anon-key',
      clerkToken: 'clerk-session-token',
    });
  });

  it('falls back to the bearer token when no separate Clerk token is provided', () => {
    const tokens = getRequestAuthTokens(
      new Headers({ Authorization: 'Bearer clerk-session-token' })
    );

    expect(tokens).toEqual({
      bearerToken: 'clerk-session-token',
      clerkToken: 'clerk-session-token',
    });
  });
});

describe('isServiceRoleToken', () => {
  it('accepts the configured service role key exactly', () => {
    expect(isServiceRoleToken('sb_secret_key', 'sb_secret_key', 'https://ref.supabase.co')).toBe(true);
  });

  it('accepts a gateway-verified legacy service_role JWT for the same project ref', () => {
    const token = unsignedJwt({
      iss: 'supabase',
      ref: 'pkydmdygctojtfzbqcud',
      role: 'service_role',
    });

    expect(
      isServiceRoleToken(
        token,
        'sb_secret_new_key',
        'https://pkydmdygctojtfzbqcud.supabase.co'
      )
    ).toBe(true);
  });

  it('rejects service_role JWTs for a different project ref', () => {
    const token = unsignedJwt({
      iss: 'supabase',
      ref: 'otherprojectref',
      role: 'service_role',
    });

    expect(
      isServiceRoleToken(
        token,
        'sb_secret_new_key',
        'https://pkydmdygctojtfzbqcud.supabase.co'
      )
    ).toBe(false);
  });
});
