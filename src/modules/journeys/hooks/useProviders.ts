import { useQuery } from '@tanstack/react-query';
import { getProviders } from '../services/journeyProviders.service';

export function useProviders(
  args: { categorySlug: string; countryCode: string; subhubSlug?: string },
  enabled: boolean
) {
  return useQuery({
    queryKey: ['journeys', 'providers', args.categorySlug, args.countryCode, args.subhubSlug ?? '_'],
    queryFn: () => getProviders(args.categorySlug, args.countryCode, args.subhubSlug),
    enabled: enabled && !!args.categorySlug && !!args.countryCode,
    staleTime: 10 * 60 * 1000,
  });
}
