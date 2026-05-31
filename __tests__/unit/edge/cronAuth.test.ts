import {
  extractBearerToken,
  isAuthorizedCronRequest,
} from '../../../supabase/functions/_shared/cronAuth';

describe('cronAuth', () => {
  it('extracts bearer tokens case-insensitively', () => {
    expect(extractBearerToken('Bearer service-secret')).toBe('service-secret');
    expect(extractBearerToken('bearer another-secret')).toBe('another-secret');
    expect(extractBearerToken('service-secret')).toBeNull();
  });

  it('allows service-role bearer token when it matches', () => {
    const headers = new Headers({ Authorization: 'Bearer service-secret' });

    expect(
      isAuthorizedCronRequest(headers, {
        serviceRoleKey: 'service-secret',
        cronSecret: 'cron-secret',
      })
    ).toBe(true);
  });

  it('allows cron secret header when it matches', () => {
    const headers = new Headers({ 'x-cron-secret': 'cron-secret' });

    expect(
      isAuthorizedCronRequest(headers, {
        serviceRoleKey: 'service-secret',
        cronSecret: 'cron-secret',
      })
    ).toBe(true);
  });

  it('rejects missing, wrong, or unconfigured secrets', () => {
    expect(
      isAuthorizedCronRequest(new Headers(), {
        serviceRoleKey: 'service-secret',
        cronSecret: 'cron-secret',
      })
    ).toBe(false);

    expect(
      isAuthorizedCronRequest(new Headers({ Authorization: 'Bearer wrong' }), {
        serviceRoleKey: 'service-secret',
        cronSecret: 'cron-secret',
      })
    ).toBe(false);

    expect(
      isAuthorizedCronRequest(new Headers({ 'x-cron-secret': 'cron-secret' }), {
        serviceRoleKey: '',
        cronSecret: '',
      })
    ).toBe(false);
  });
});
