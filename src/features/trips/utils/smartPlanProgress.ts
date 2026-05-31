export type SmartPlanModuleStatus = 'waiting' | 'generating' | 'done' | 'failed';
export type SmartPlanUiStatus = 'idle' | 'generating' | 'partial' | 'ready' | 'failed';

export interface SmartPlanModuleEntry {
  key: string;
  dbKey: string;
  status: SmartPlanModuleStatus;
  detail?: string;
}

export const SMART_PLAN_MODULES: SmartPlanModuleEntry[] = [
  { key: 'itinerary', dbKey: 'itinerary', status: 'waiting' },
  { key: 'dosDonts', dbKey: 'dos_donts', status: 'waiting' },
  { key: 'documents', dbKey: 'documents', status: 'waiting' },
  { key: 'packing', dbKey: 'packing', status: 'waiting' },
  { key: 'safety', dbKey: 'safety', status: 'waiting' },
  { key: 'language', dbKey: 'language', status: 'waiting' },
];

export const TOTAL_SMART_PLAN_MODULES = SMART_PLAN_MODULES.length;

export function formatSmartPlanModuleDetail(key: string, detail: unknown): string | undefined {
  if (detail === null || detail === undefined) return undefined;
  switch (key) {
    case 'itinerary':
      return `${detail} day plan`;
    case 'packing':
      return `${detail} items`;
    case 'dosDonts':
      return `${detail} tips`;
    case 'safety':
      return `Score ${detail}`;
    case 'language':
      return `${detail} phrases`;
    case 'documents':
      return `${detail} docs`;
    default:
      return 'Done';
  }
}

export function normalizeSmartPlanUiStatus(value: unknown): SmartPlanUiStatus {
  if (value === 'partial') return 'generating';
  if (value === 'generating' || value === 'ready' || value === 'failed') {
    return value;
  }
  return 'idle';
}

export function getInitialSmartPlanUiState(input: {
  modulesGenerated?: boolean;
  generationStatus?: Record<string, unknown> | null;
}): { planStatus: SmartPlanUiStatus; generated: boolean } {
  const generationStatus = input.generationStatus || null;
  const planStatus = normalizeSmartPlanUiStatus(generationStatus?.smart_plan);
  const modules = modulesFromGenerationStatus(generationStatus);
  const allModulesReady = modules.every((module) => module.status === 'done');
  // A plan that is still in-progress (generating/partial) or actively failed must not be
  // treated as complete. Otherwise, trust the persisted modules_generated flag so already
  // finished trips never appear "reset" just because their saved status omits a field.
  const isInFlight = planStatus === 'generating' || planStatus === 'failed';
  return {
    planStatus,
    generated: Boolean(
      planStatus === 'ready' || allModulesReady || (input.modulesGenerated && !isInFlight)
    ),
  };
}

export function modulesFromGenerationStatus(
  status: Record<string, unknown> | null | undefined
): SmartPlanModuleEntry[] {
  const generationStatus = status || {};
  return SMART_PLAN_MODULES.map((module) => {
    const raw = generationStatus[module.dbKey];
    const moduleStatus: SmartPlanModuleStatus =
      raw === 'ready' || raw === 'done'
        ? 'done'
        : raw === 'failed'
          ? 'failed'
          : raw === 'generating'
            ? 'generating'
            : 'waiting';
    return {
      ...module,
      status: moduleStatus,
      detail: formatSmartPlanModuleDetail(module.key, generationStatus[`${module.dbKey}_detail`]),
    };
  });
}

export function getSmartPlanProgress(modules: SmartPlanModuleEntry[]): {
  doneCount: number;
  failedCount: number;
  progress: number;
} {
  const doneCount = modules.filter((module) => module.status === 'done').length;
  const failedCount = modules.filter((module) => module.status === 'failed').length;
  const progress = TOTAL_SMART_PLAN_MODULES > 0 ? doneCount / TOTAL_SMART_PLAN_MODULES : 0;

  return { doneCount, failedCount, progress };
}
