import { useQuery } from '@tanstack/react-query';
import { getTopicsForJourney, getTopicUsage, getRecentBriefings } from '../services/briefing.service';

export function useBriefingTopics(categorySlug: string | undefined) {
  return useQuery({
    queryKey: ['journeys', 'topics', categorySlug],
    queryFn: () => getTopicsForJourney(categorySlug as string),
    enabled: !!categorySlug,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTopicUsage(categorySlug: string | undefined) {
  return useQuery({
    queryKey: ['journeys', 'topicUsage', categorySlug],
    queryFn: () => getTopicUsage(categorySlug as string),
    enabled: !!categorySlug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentBriefings(userId: string | undefined) {
  return useQuery({
    queryKey: ['journeys', 'recentBriefings', userId],
    queryFn: () => getRecentBriefings(userId as string),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useSavedBriefings(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['journeys', 'savedBriefings', userId],
    queryFn: () => getRecentBriefings(userId as string, 50, true),
    enabled: !!userId && enabled,
    staleTime: 30 * 1000,
  });
}
