import { create } from 'zustand';
import type { BriefingDraft, BriefingStage, BriefingWho, JourneyTopic } from '../types';

interface BriefingDraftState extends BriefingDraft {
  briefingId?: string;
  setCategory: (slug: string, subhubSlug?: string) => void;
  setCountry: (code: string, name?: string, flag?: string) => void;
  setStage: (s?: BriefingStage) => void;
  setWho: (w?: BriefingWho) => void;
  toggleTopic: (key: string) => void;
  setTopics: (keys: string[]) => void;
  addCustomTopic: (label: string) => void;
  setBriefingId: (id?: string) => void;
  hydrate: (draft: Partial<BriefingDraft> & { briefingId?: string }) => void;
  reset: (categorySlug: string, subhubSlug?: string) => void;
}

export const useBriefingDraft = create<BriefingDraftState>((set) => ({
  categorySlug: 'medical',
  topicKeys: [],
  customTopics: [],
  briefingId: undefined,
  setBriefingId: (id) => set({ briefingId: id }),
  hydrate: (draft) => set({ ...draft }),
  setCategory: (slug, subhubSlug) => set({ categorySlug: slug, subhubSlug, topicKeys: [] }),
  setCountry: (code, name, flag) => set({ countryCode: code, countryName: name, flagEmoji: flag }),
  setStage: (stage) => set({ stage }),
  setWho: (who) => set({ who }),
  toggleTopic: (key) =>
    set((s) => ({
      topicKeys: s.topicKeys.includes(key) ? s.topicKeys.filter((k) => k !== key) : [...s.topicKeys, key],
    })),
  setTopics: (keys) => set({ topicKeys: keys }),
  addCustomTopic: (label) =>
    set((s) => {
      const slug = `custom:${label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`;
      if (!slug || slug === 'custom:' || s.topicKeys.includes(slug)) return {};
      return { customTopics: [...(s.customTopics ?? []), label.trim()], topicKeys: [...s.topicKeys, slug] };
    }),
  reset: (categorySlug, subhubSlug) =>
    set({ categorySlug, subhubSlug, countryCode: undefined, countryName: undefined, flagEmoji: undefined, stage: undefined, who: undefined, topicKeys: [], customTopics: [] }),
}));

/** Smart default preselection (spec §5.3 + default_for). */
export function computeDefaultTopics(topics: JourneyTopic[], categorySlug: string, who?: BriefingWho): string[] {
  const defaults = new Set<string>();
  for (const t of topics) if (t.defaultFor.includes(categorySlug)) defaults.add(t.key);
  const add = (keys: string[]) => keys.forEach((k) => topics.find((t) => t.key === k) && defaults.add(k));
  if (who === 'family') add(['schools', 'health_dietary']);
  if (who === 'elderly_parent') add(['accessibility', 'healthcare_quality', 'healthcare_access']);
  if (who === 'couple') add(['col_couple']);
  if (who === 'solo') add(['overall_safety', 'safe_neighborhoods']);
  return Array.from(defaults);
}
