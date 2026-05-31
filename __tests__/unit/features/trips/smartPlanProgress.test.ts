import {
  getInitialSmartPlanUiState,
  getSmartPlanProgress,
  modulesFromGenerationStatus,
} from '../../../../src/features/trips/utils/smartPlanProgress';

describe('smartPlanProgress', () => {
  it('keeps partial smart plans in the generating state for the user', () => {
    expect(
      getInitialSmartPlanUiState({
        modulesGenerated: false,
        generationStatus: {
          smart_plan: 'partial',
          itinerary: 'ready',
          documents: 'ready',
          packing: 'ready',
          language: 'failed',
        },
      })
    ).toEqual({
      planStatus: 'generating',
      generated: false,
    });
  });

  it('does not trust modulesGenerated when module evidence is only partial', () => {
    expect(
      getInitialSmartPlanUiState({
        modulesGenerated: true,
        generationStatus: {
          smart_plan: 'partial',
          itinerary: 'ready',
          documents: 'ready',
          packing: 'ready',
        },
      })
    ).toEqual({
      planStatus: 'generating',
      generated: false,
    });
  });

  it('trusts modules_generated for finished trips whose saved status omits smart_plan', () => {
    expect(
      getInitialSmartPlanUiState({
        modulesGenerated: true,
        generationStatus: {
          itinerary: 'ready',
          documents: 'ready',
        },
      })
    ).toEqual({
      planStatus: 'idle',
      generated: true,
    });
  });

  it('treats all six ready modules as generated even if the summary flag lags', () => {
    expect(
      getInitialSmartPlanUiState({
        modulesGenerated: false,
        generationStatus: {
          itinerary: 'ready',
          dos_donts: 'ready',
          documents: 'ready',
          packing: 'ready',
          safety: 'ready',
          language: 'ready',
        },
      })
    ).toEqual({
      planStatus: 'idle',
      generated: true,
    });
  });

  it('maps generation_status into progress bar modules', () => {
    const modules = modulesFromGenerationStatus({
      itinerary: 'ready',
      dos_donts: 'generating',
      documents: 'ready',
      packing: 'failed',
      safety: 'waiting',
      language: 'ready',
      itinerary_detail: 7,
      documents_detail: 14,
      language_detail: 24,
    });

    expect(modules.map((module) => [module.dbKey, module.status, module.detail])).toEqual([
      ['itinerary', 'done', '7 day plan'],
      ['dos_donts', 'generating', undefined],
      ['documents', 'done', '14 docs'],
      ['packing', 'failed', undefined],
      ['safety', 'waiting', undefined],
      ['language', 'done', '24 phrases'],
    ]);
  });

  it('does not count failed modules as completed progress', () => {
    expect(
      getSmartPlanProgress(
        modulesFromGenerationStatus({
          itinerary: 'ready',
          dos_donts: 'ready',
          documents: 'ready',
          packing: 'failed',
          safety: 'waiting',
          language: 'generating',
        })
      )
    ).toEqual({
      doneCount: 3,
      failedCount: 1,
      progress: 3 / 6,
    });
  });
});
