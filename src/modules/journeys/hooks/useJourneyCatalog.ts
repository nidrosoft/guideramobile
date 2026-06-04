import { useQuery } from '@tanstack/react-query';
import { getCategories, getCatalogStubs } from '../services/journeyContent.service';

export function useJourneyCatalog() {
  return useQuery({
    queryKey: ['journeys', 'categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCatalogStubs(categorySlug: string | undefined) {
  return useQuery({
    queryKey: ['journeys', 'catalog', categorySlug],
    queryFn: () => getCatalogStubs(categorySlug as string),
    enabled: !!categorySlug,
    staleTime: 5 * 60 * 1000,
  });
}
