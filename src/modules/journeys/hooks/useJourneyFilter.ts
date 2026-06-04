import { useMemo } from 'react';
import { useJourneyFilterStore } from '../store/journeyFilter.store';
import { useCatalogStubs } from './useJourneyCatalog';

export function useJourneyFilter() {
  const filter = useJourneyFilterStore();
  const { categorySlug, continent, subhubSlug, setCategory, setContinent, setSubhub } = filter;
  const { data: stubs = [], isLoading, isFetching } = useCatalogStubs(categorySlug);

  const results = useMemo(
    () =>
      stubs.filter(
        (s) =>
          (continent === 'All' || s.continent === continent) &&
          (subhubSlug === 'all' || !s.subhubSlugs || s.subhubSlugs.includes(subhubSlug))
      ),
    [stubs, continent, subhubSlug]
  );

  return {
    filter: { categorySlug, continent, subhubSlug },
    results,
    isLoading,
    isFetching,
    setCategory,
    setContinent,
    setSubhub,
  };
}
