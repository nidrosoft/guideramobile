import { useQuery } from '@tanstack/react-query';
import { getCountries } from '../services/journeyContent.service';
import { getCountryProfile } from '../services/journeySearch.service';

export function useJourneyCountries() {
  return useQuery({
    queryKey: ['journeys', 'countries'],
    queryFn: getCountries,
    staleTime: 30 * 60 * 1000,
  });
}

export function useCountryProfile(countryCode: string | undefined) {
  return useQuery({
    queryKey: ['journeys', 'search', countryCode],
    queryFn: () => getCountryProfile(countryCode as string),
    enabled: !!countryCode,
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });
}
