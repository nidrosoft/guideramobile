import { create } from 'zustand';
import type { JourneyContinent, JourneyFilter } from '../types';

interface JourneyFilterState extends JourneyFilter {
  setCategory: (slug: string) => void;
  setContinent: (c: JourneyContinent | 'All') => void;
  setSubhub: (slug: string | 'all') => void;
  reset: (slug?: string) => void;
}

export const useJourneyFilterStore = create<JourneyFilterState>((set) => ({
  categorySlug: 'medical',
  continent: 'All',
  subhubSlug: 'all',
  // Selecting a journey resets the sub-hub but keeps the continent (spec §7.3).
  setCategory: (slug) => set({ categorySlug: slug, subhubSlug: 'all' }),
  setContinent: (continent) => set({ continent }),
  setSubhub: (subhubSlug) => set({ subhubSlug }),
  reset: (slug) => set({ categorySlug: slug ?? 'medical', continent: 'All', subhubSlug: 'all' }),
}));
