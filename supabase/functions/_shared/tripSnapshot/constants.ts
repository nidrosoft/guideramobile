/** Default snapshot topics shown when overlay opens */
export const DEFAULT_SNAPSHOT_TOPICS = [
  'safety',
  'visa_entry',
  'food',
  'arrival',
] as const;

export const SNAPSHOT_AI_CACHE_VERSION = 'v3';
export const GEMINI_SNAPSHOT_MODEL = 'gemini-3.5-flash';
export const GEMINI_SNAPSHOT_FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
] as const;
export const SNAPSHOT_MAX_OUTPUT_TOKENS = 8192;

/** TTL days per topic for ai_module_cache */
export const TOPIC_TTL_DAYS: Record<string, number> = {
  customs: 180,
  dos_donts: 180,
  sacred_sites: 180,
  language: 90,
  history: 180,
  food_culture: 90,
  visa_entry: 90,
  laws: 90,
  safety: 60,
  scams_crime: 60,
  solo_female: 60,
  health: 60,
  payments: 45,
  saving_tips: 45,
  price_feel: 30,
  weather: 30,
  crowds: 30,
  arrival: 14,
  transit: 14,
  apps: 14,
  hours: 14,
  neighborhoods: 30,
  food: 45,
  social_norms: 90,
  nightlife: 45,
};

export const LIVE_DATA_CACHE_TTL_SECONDS = 3 * 60 * 60; // 3 hours
