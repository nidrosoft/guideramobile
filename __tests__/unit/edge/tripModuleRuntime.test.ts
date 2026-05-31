import {
  TRIP_MODULE_NAMESPACE,
  buildTripModuleCacheKey,
  buildTripModuleCacheRow,
  getTripModuleCachePolicy,
  buildSmartPlanLockKey,
  buildTripModuleResourceKey,
  buildTripModuleLockKey,
  buildTripModuleRateLimitConfigs,
  buildSmartPlanInitialModuleStatus,
  buildTripModuleFunctionInvokeHeaders,
  evaluateSmartPlanCompletion,
  isSmartPlanReady,
  shouldSkipReadyModule,
} from '../../../supabase/functions/_shared/tripModule/runtime';

describe('tripModule runtime', () => {
  it('builds stable lock keys for modules and smart plan orchestration', () => {
    expect(buildTripModuleLockKey('Trip-123', 'Safety Profile')).toBe('trip-123:safety_profile');
    expect(buildSmartPlanLockKey('Trip-123')).toBe('trip-123:smart_plan');
  });

  it('builds durable user, trip, module, and global rate-limit buckets', () => {
    expect(
      buildTripModuleRateLimitConfigs({
        userId: 'profile-123',
        tripId: 'trip-456',
        moduleKey: 'itinerary',
      })
    ).toEqual([
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'user:profile-123',
        windowSeconds: 3600,
        maxRequests: 20,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'trip:trip-456',
        windowSeconds: 600,
        maxRequests: 6,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'module:itinerary',
        windowSeconds: 60,
        maxRequests: 30,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'global',
        windowSeconds: 60,
        maxRequests: 120,
      },
    ]);
  });

  it('uses stricter fan-out-aware buckets for a full smart plan start', () => {
    expect(
      buildTripModuleRateLimitConfigs({
        userId: 'profile-123',
        tripId: 'trip-456',
        moduleKey: 'smart_plan',
      })
    ).toEqual([
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'user:profile-123',
        windowSeconds: 3600,
        maxRequests: 5,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'trip:trip-456',
        windowSeconds: 600,
        maxRequests: 2,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'module:smart_plan',
        windowSeconds: 60,
        maxRequests: 10,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'global',
        windowSeconds: 60,
        maxRequests: 30,
      },
    ]);
  });

  it('uses relaxed smart plan buckets for database-entitled testers', () => {
    expect(
      buildTripModuleRateLimitConfigs({
        userId: 'profile-123',
        tripId: 'trip-456',
        moduleKey: 'smart_plan',
        isPrivilegedTester: true,
      })
    ).toEqual([
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'user:profile-123',
        windowSeconds: 3600,
        maxRequests: 100,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'trip:trip-456',
        windowSeconds: 600,
        maxRequests: 25,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'module:smart_plan',
        windowSeconds: 60,
        maxRequests: 120,
      },
      {
        namespace: TRIP_MODULE_NAMESPACE,
        bucketKey: 'global',
        windowSeconds: 60,
        maxRequests: 300,
      },
    ]);
  });

  it('skips ready modules unless a force refresh is requested', () => {
    expect(shouldSkipReadyModule({ packing: 'ready' }, 'packing', false)).toBe(true);
    expect(shouldSkipReadyModule({ packing: 'ready' }, 'packing', true)).toBe(false);
    expect(shouldSkipReadyModule({ packing: 'failed' }, 'packing', false)).toBe(false);
  });

  it('recognizes an already ready smart plan before rate limiting a restart', () => {
    expect(
      isSmartPlanReady({
        smart_plan: 'ready',
        itinerary: 'ready',
        documents: 'ready',
      })
    ).toBe(true);
    expect(isSmartPlanReady({ smart_plan: 'partial', itinerary: 'ready' })).toBe(false);
  });

  it('uses the anon gateway token for internal module fan-out when available', () => {
    expect(
      buildTripModuleFunctionInvokeHeaders({
        anonKey: 'anon-key',
        serviceRoleKey: 'service-key',
      })
    ).toMatchObject({
      Authorization: 'Bearer anon-key',
      apikey: 'anon-key',
    });
  });

  it('does not erase ready module status when restarting a partial smart plan', () => {
    expect(
      buildSmartPlanInitialModuleStatus(
        {
          documents: 'ready',
          documents_model: 'cache',
          safety: 'failed',
          language: 'ready',
        },
        false
      )
    ).toMatchObject({
      itinerary: 'waiting',
      dos_donts: 'waiting',
      documents: 'ready',
      packing: 'waiting',
      safety: 'waiting',
      language: 'ready',
    });

    expect(
      buildSmartPlanInitialModuleStatus(
        {
          documents: 'ready',
          language: 'ready',
        },
        true
      )
    ).toMatchObject({
      documents: 'waiting',
      language: 'waiting',
    });
  });

  it('builds scoped keys for reactive trip AI resources', () => {
    expect(buildTripModuleResourceKey('Compensation Claim', 'Claim 123')).toBe(
      'compensation_claim:claim_123'
    );
    expect(buildTripModuleLockKey('Trip-123', buildTripModuleResourceKey('Expense Summary'))).toBe(
      'trip-123:expense_summary'
    );
  });

  it('builds destination-level cache keys for shareable modules', () => {
    expect(
      buildTripModuleCacheKey({
        moduleKey: 'language',
        city: 'Antananarivo',
        country: 'Madagascar',
        startDate: '2026-11-12',
      })
    ).toBe('v1:trip_module:language:antananarivo-madagascar');

    expect(
      buildTripModuleCacheKey({
        moduleKey: 'documents',
        city: 'Antananarivo',
        country: 'Madagascar',
        nationality: 'United States',
        startDate: '2026-11-12',
        composition: 'solo',
      })
    ).toBe('v1:trip_module:documents:antananarivo-madagascar:united_states:solo:autumn');
  });

  it('declares cache policy by module risk and personalization scope', () => {
    expect(getTripModuleCachePolicy('language')).toEqual({
      cacheTier: 'destination_base',
      shareable: true,
      ttlDays: 90,
    });
    expect(getTripModuleCachePolicy('packing')).toEqual({
      cacheTier: 'personal',
      shareable: false,
      ttlDays: 0,
    });
  });

  it('keeps smart plan generation running until every module is ready', () => {
    expect(
      evaluateSmartPlanCompletion([
        { key: 'itinerary', success: true },
        { key: 'documents', success: true },
        { key: 'packing', success: true },
        { key: 'language', success: false, error: 'model timeout' },
      ])
    ).toEqual({
      status: 'generating',
      modulesReady: 3,
      modulesTotal: 6,
      modulesGenerated: false,
      failedModules: ['language'],
      missingModules: ['dos_donts', 'safety'],
    });

    expect(
      evaluateSmartPlanCompletion([
        { key: 'itinerary', success: true },
        { key: 'dos_donts', success: true },
        { key: 'documents', success: true },
        { key: 'packing', success: true },
        { key: 'safety', success: true },
        { key: 'language', success: true },
      ])
    ).toMatchObject({
      status: 'ready',
      modulesReady: 6,
      modulesGenerated: true,
      failedModules: [],
      missingModules: [],
    });
  });

  it('builds an ai_module_cache row for shareable module content', () => {
    const row = buildTripModuleCacheRow(
      {
        moduleKey: 'language',
        city: 'Tokyo',
        country: 'Japan',
        startDate: '2027-04-10',
      },
      { language_kit: { language: 'Japanese' } },
      new Date('2026-05-28T12:00:00Z')
    );

    expect(row).toMatchObject({
      cache_key: 'v1:trip_module:language:tokyo-japan',
      module_type: 'language',
      cache_tier: 'destination_base',
      context_hash: 'v1:trip_module:language:tokyo-japan',
      content: { language_kit: { language: 'Japanese' } },
      destination_code: 'tokyo-japan',
      season: 'spring',
      ttl_days: 90,
      expires_at: '2026-08-26T12:00:00.000Z',
      access_count: 1,
    });
  });
});
