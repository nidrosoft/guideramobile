/**
 * TIKTOK CONTENT SERVICE
 * 
 * Client-side service to fetch TikTok videos from our Edge Function proxy.
 * No direct TikAPI calls — everything goes through Supabase Edge Function.
 */

import { supabase } from '@/lib/supabase/client';

export interface TikTokVideo {
  id: string;
  coverUrl: string;
  dynamicCover: string;
  videoUrl: string;
  downloadAddr: string;
  playAddr: string;
  videoHeaders: Record<string, string> | null;
  caption: string;
  duration: number;
  width: number;
  height: number;
  likes: number;
  likesFormatted: string;
  comments: number;
  commentsFormatted: string;
  shares: number;
  sharesFormatted: string;
  plays: number;
  playsFormatted: string;
  creator: {
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  };
  hashtags: string[];
  tiktokUrl: string;
  createdAt: number;
  music: {
    title: string;
    author: string;
  } | null;
}

export interface TikTokCategory {
  id: string;
  label: string;
  icon: string;
}

export interface TikTokResponse {
  success: boolean;
  videos: TikTokVideo[];
  hasMore: boolean;
  cursor?: string;
  totalVideos?: number;
  source: string;
  cached: boolean;
  fallback?: boolean;
  error?: string;
}

async function callEdgeFunction(body: Record<string, any>): Promise<TikTokResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('tiktok-content', { body });

    if (error) {
      if (__DEV__) console.warn('TikTok service error:', error.message);
      return { success: false, videos: [], hasMore: false, source: 'tiktok', cached: false, fallback: true, error: error.message };
    }

    return data as TikTokResponse;
  } catch (err: any) {
    if (__DEV__) console.warn('TikTok service exception:', err.message);
    return { success: false, videos: [], hasMore: false, source: 'tiktok', cached: false, fallback: true, error: err.message };
  }
}

/**
 * Get videos by hashtag for a destination + category
 */
export async function getHashtagVideos(
  destination: string,
  category: string = 'trending',
  options?: { cursor?: string; count?: number; countryCode?: string }
): Promise<TikTokResponse> {
  return callEdgeFunction({
    action: 'hashtag',
    destination,
    category,
    cursor: options?.cursor,
    count: options?.count || 15,
    countryCode: options?.countryCode,
  });
}

/**
 * Get trending videos
 */
export async function getTrendingVideos(
  options?: { cursor?: string; count?: number; countryCode?: string }
): Promise<TikTokResponse> {
  return callEdgeFunction({
    action: 'trending',
    cursor: options?.cursor,
    count: options?.count || 15,
    countryCode: options?.countryCode,
  });
}

/**
 * Search videos by keyword
 */
export async function searchVideos(
  query: string,
  options?: { cursor?: string; count?: number; countryCode?: string }
): Promise<TikTokResponse> {
  return callEdgeFunction({
    action: 'search',
    query,
    cursor: options?.cursor,
    count: options?.count || 15,
    countryCode: options?.countryCode,
  });
}

/**
 * Get related videos for a specific video
 */
export async function getRelatedVideos(
  videoId: string,
  options?: { countryCode?: string }
): Promise<TikTokResponse> {
  return callEdgeFunction({
    action: 'related',
    videoId,
    countryCode: options?.countryCode,
  });
}

/**
 * Get available categories
 */
export async function getCategories(): Promise<TikTokCategory[]> {
  const res = await callEdgeFunction({ action: 'categories' });
  return (res as any).categories || [];
}
