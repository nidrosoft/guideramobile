import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getOrGenerateGuide } from '../services/journeyContent.service';
import { isProTier } from '../services/entitlements.adapter';

export function useJourneyGuide(args: {
  categorySlug?: string;
  countryCode?: string;
  subhubSlug?: string;
}) {
  const { categorySlug, countryCode, subhubSlug } = args;
  return useQuery({
    queryKey: ['journeys', 'guide', categorySlug, countryCode, subhubSlug ?? '_'],
    // generate-or-fetch: returns a curated/AI guide, or generates on demand
    queryFn: () => getOrGenerateGuide({ categorySlug: categorySlug as string, countryCode: countryCode as string, subhubSlug }),
    enabled: !!categorySlug && !!countryCode,
    staleTime: 10 * 60 * 1000,
    retry: 0, // generation is expensive — don't auto-retry on failure
  });
}

export function useIsPro(): { data: boolean } {
  const { profile } = useAuth();
  return { data: isProTier((profile as any)?.membership_type) };
}
