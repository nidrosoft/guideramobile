import { useQuery } from '@tanstack/react-query';
import { getChecklist } from '../services/journeyToolkit.service';
import { getGroupLink } from '../services/journeyCommunity.service';

export function useChecklist(args: { categorySlug: string; countryCode: string; userId?: string }, enabled: boolean) {
  return useQuery({
    queryKey: ['journeys', 'checklist', args.categorySlug, args.countryCode, args.userId ?? '_'],
    queryFn: () => getChecklist(args.categorySlug, args.countryCode, args.userId),
    enabled: enabled && !!args.categorySlug && !!args.countryCode,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGroupLink(args: { categorySlug: string; countryCode: string; subhubSlug?: string }) {
  return useQuery({
    queryKey: ['journeys', 'groupLink', args.categorySlug, args.countryCode, args.subhubSlug ?? '_'],
    queryFn: () => getGroupLink(args.categorySlug, args.countryCode, args.subhubSlug),
    enabled: !!args.categorySlug && !!args.countryCode,
    staleTime: 10 * 60 * 1000,
  });
}
