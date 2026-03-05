/**
 * TIKTOK CONTENT EDGE FUNCTION
 * 
 * Proxies TikAPI calls for Guidera's Creators Content section.
 * - Hashtag-based video fetching per destination + category
 * - Search by keyword
 * - Trending videos
 * - Caching with TTL to minimize API calls
 * - Response normalization (lightweight payloads)
 * - Blocked-region handling via proxy country parameter
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIKAPI_BASE = 'https://api.tikapi.io';

// Cache TTLs in hours
const CACHE_TTL = {
  hashtag: 4,
  trending: 2,
  search: 1,
};

// TikTok-blocked countries — we route through a proxy country for these
const BLOCKED_COUNTRIES = ['IN', 'ID', 'PK', 'BD', 'NP', 'AF', 'SO', 'IR'];
const FALLBACK_PROXY = 'us'; // Route blocked-region requests through US

// Destination → Category → Hashtag mappings
// The Edge Function auto-generates hashtags from destination name + category if not mapped
// Clean destination name: "Istanbul - Where East Meets West" → "Istanbul", "Santorini Island, Greece" → "Santorini"
function cleanDestName(raw: string): string {
  let name = raw.split(/\s*[-:—–|]\s*/)[0].trim(); // Strip after dash/colon
  name = name.split(/\s*[,(]\s*/)[0].trim(); // Strip after comma/paren
  name = name.replace(/\b(city|island|region|province|state|national park|beach|coast|valley|mountains?)\b/gi, '').trim();
  name = name.replace(/\b(the|of|and|in|at|on|for|a|an)\b/gi, '').trim();
  name = name.replace(/\s{2,}/g, ' ').trim();
  return name || raw.split(/\s/)[0]; // Fallback to first word
}

function getHashtags(destination: string, category: string): string[] {
  const cleaned = cleanDestName(destination);
  const dest = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = cleaned.toLowerCase().replace(/\s+/g, '');

  const categoryMap: Record<string, string[]> = {
    'trending': [base, `${base}travel`, `visit${base}`],
    'nightlife': [`${base}nightlife`, `${base}bars`, `${base}bynight`, `${base}clubs`],
    'restaurant': [`${base}food`, `${base}restaurant`, `${base}eats`, `${base}foodie`],
    'activities': [`thingstodoin${dest}`, `${base}activities`, `${base}mustdo`],
    'hidden gems': [`${base}secrets`, `${base}hiddengems`, `hidden${base}`],
    'shopping': [`${base}shopping`, `${base}markets`],
    'culture': [`${base}culture`, `${base}museums`, `${base}history`],
    'beach': [`${base}beach`, `${base}beaches`],
    'adventure': [`${base}adventure`, `${base}hiking`, `${base}outdoor`],
    'budget': [`${base}onabudget`, `cheap${base}`, `${base}budget`],
    'luxury': [`${base}luxury`, `luxury${base}`],
    'street food': [`${base}streetfood`, `${base}street`, `streetfood${base}`],
    'cafes': [`${base}cafes`, `${base}coffee`, `coffeein${base}`],
    'nature': [`${base}nature`, `${base}views`, `${base}scenery`],
    'photography': [`${base}photography`, `${base}photos`, `instagrammable${base}`],
  };

  return categoryMap[category.toLowerCase()] || [`${base}${category.toLowerCase().replace(/\s+/g, '')}`];
}

// Normalize TikAPI video data → lightweight payload
function normalizeVideo(item: any, videoHeaders?: any): any {
  const video = item.video || {};
  const author = item.author || {};
  const stats = item.stats || {};

  return {
    id: item.id || '',
    coverUrl: video.cover || video.originCover || '',
    dynamicCover: video.dynamicCover || '',
    videoUrl: video.downloadAddr || video.playAddr || '',
    playAddr: video.playAddr || '',
    downloadAddr: video.downloadAddr || '',
    videoHeaders: videoHeaders || null,
    caption: (item.desc || '').slice(0, 200),
    duration: video.duration || 0,
    width: video.width || 576,
    height: video.height || 1024,
    likes: stats.diggCount || 0,
    comments: stats.commentCount || 0,
    shares: stats.shareCount || 0,
    plays: stats.playCount || 0,
    creator: {
      username: author.uniqueId || '',
      displayName: author.nickname || '',
      avatar: author.avatarThumb || '',
      verified: author.verified || false,
    },
    hashtags: (item.challenges || []).map((c: any) => c.title).filter(Boolean),
    tiktokUrl: `https://www.tiktok.com/@${author.uniqueId || 'user'}/video/${item.id}`,
    createdAt: item.createTime || 0,
    music: item.music ? {
      title: item.music.title || '',
      author: item.music.authorName || '',
    } : null,
  };
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const apiKey = Deno.env.get('TIKAPI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'TikAPI not configured' }), {
        status: 503, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, destination, category, query, cursor, count, countryCode } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'action required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Determine proxy country for blocked regions
    const userCountry = (countryCode || '').toUpperCase();
    const proxyCountry = BLOCKED_COUNTRIES.includes(userCountry) ? FALLBACK_PROXY : undefined;

    const maxCount = Math.min(count || 15, 30);
    let cacheKey = '';
    let cacheTTL = CACHE_TTL.hashtag;
    let videos: any[] = [];
    let hasMore = false;
    let nextCursor: string | undefined;
    let totalVideos = 0;

    switch (action) {
      case 'hashtag': {
        if (!destination) throw new Error('destination required for hashtag action');
        const cat = category || 'trending';
        const hashtags = getHashtags(destination, cat);
        cacheKey = `hashtag:${destination.toLowerCase()}:${cat.toLowerCase()}:${cursor || '0'}`;
        cacheTTL = CACHE_TTL.hashtag;

        // Check cache first (skip if cursor pagination)
        if (!cursor) {
          const { data: cached } = await sb
            .from('tiktok_cache')
            .select('data, expires_at')
            .eq('cache_key', cacheKey)
            .single();

          if (cached && new Date(cached.expires_at) > new Date()) {
            const cachedData = cached.data as any;
            return new Response(JSON.stringify(cachedData), {
              headers: { ...cors, 'Content-Type': 'application/json' },
            });
          }
        }

        // Fetch from TikAPI — try hashtags in order until we get results
        for (const tag of hashtags) {
          try {
            const params = new URLSearchParams({ name: tag, count: String(maxCount) });
            if (cursor) params.append('cursor', cursor);
            if (proxyCountry) params.append('country', proxyCountry);

            const r = await fetch(`${TIKAPI_BASE}/public/hashtag?${params}`, {
              headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
            });

            if (r.ok) {
              const data = await r.json();
              const items = data.itemList || [];
              if (items.length > 0) {
                videos = items.map(normalizeVideo);
                hasMore = data.hasMore || false;
                nextCursor = data.cursor;
                totalVideos = data.challengeInfo?.challenge?.stats?.videoCount || items.length;
                break;
              }
            }
          } catch (e: any) {
            console.warn(`Hashtag ${tag} failed:`, e.message);
          }
        }
        break;
      }

      case 'trending': {
        cacheKey = `trending:${cursor || '0'}`;
        cacheTTL = CACHE_TTL.trending;

        if (!cursor) {
          const { data: cached } = await sb
            .from('tiktok_cache')
            .select('data, expires_at')
            .eq('cache_key', cacheKey)
            .single();

          if (cached && new Date(cached.expires_at) > new Date()) {
            return new Response(JSON.stringify(cached.data), {
              headers: { ...cors, 'Content-Type': 'application/json' },
            });
          }
        }

        const params = new URLSearchParams({ count: String(maxCount) });
        if (proxyCountry) params.append('country', proxyCountry);

        const r = await fetch(`${TIKAPI_BASE}/public/trending?${params}`, {
          headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
        });

        if (r.ok) {
          const data = await r.json();
          videos = (data.itemList || []).map(normalizeVideo);
          hasMore = data.hasMore || false;
          nextCursor = data.cursor;
        }
        break;
      }

      case 'search': {
        if (!query) throw new Error('query required for search action');
        cacheKey = `search:${query.toLowerCase().trim()}:${cursor || '0'}`;
        cacheTTL = CACHE_TTL.search;

        if (!cursor) {
          const { data: cached } = await sb
            .from('tiktok_cache')
            .select('data, expires_at')
            .eq('cache_key', cacheKey)
            .single();

          if (cached && new Date(cached.expires_at) > new Date()) {
            return new Response(JSON.stringify(cached.data), {
              headers: { ...cors, 'Content-Type': 'application/json' },
            });
          }
        }

        const params = new URLSearchParams({ query: query, count: String(maxCount) });
        if (cursor) params.append('cursor', cursor);
        if (proxyCountry) params.append('country', proxyCountry);

        const r = await fetch(`${TIKAPI_BASE}/public/search/videos?${params}`, {
          headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
        });

        if (r.ok) {
          const data = await r.json();
          videos = (data.itemList || data.data || []).map(normalizeVideo);
          hasMore = data.hasMore || false;
          nextCursor = data.cursor;
        }
        break;
      }

      case 'related': {
        const videoId = body.videoId;
        if (!videoId) throw new Error('videoId required for related action');

        const params = new URLSearchParams({ id: videoId });
        if (proxyCountry) params.append('country', proxyCountry);

        const r = await fetch(`${TIKAPI_BASE}/public/related?${params}`, {
          headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
        });

        if (r.ok) {
          const data = await r.json();
          videos = (data.itemList || []).map(normalizeVideo);
          hasMore = data.hasMore || false;
          nextCursor = data.cursor;
        }
        break;
      }

      case 'categories': {
        // Return available categories for a destination
        const allCategories = [
          { id: 'trending', label: 'On Trending', icon: '🔥' },
          { id: 'nightlife', label: 'Night Life', icon: '🌙' },
          { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
          { id: 'activities', label: 'Activities', icon: '🎯' },
          { id: 'hidden gems', label: 'Hidden Gems', icon: '💎' },
          { id: 'street food', label: 'Street Food', icon: '🍜' },
          { id: 'cafes', label: 'Cafes', icon: '☕' },
          { id: 'shopping', label: 'Shopping', icon: '🛍️' },
          { id: 'culture', label: 'Culture', icon: '🏛️' },
          { id: 'beach', label: 'Beach', icon: '🏖️' },
          { id: 'adventure', label: 'Adventure', icon: '🧗' },
          { id: 'nature', label: 'Nature', icon: '🌿' },
          { id: 'budget', label: 'Budget', icon: '💰' },
          { id: 'luxury', label: 'Luxury', icon: '✨' },
          { id: 'photography', label: 'Photography', icon: '📸' },
        ];

        return new Response(JSON.stringify({
          success: true,
          categories: allCategories,
        }), {
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Build response
    const response = {
      success: true,
      videos: videos.map(v => ({
        ...v,
        likesFormatted: formatCount(v.likes),
        playsFormatted: formatCount(v.plays),
        commentsFormatted: formatCount(v.comments),
        sharesFormatted: formatCount(v.shares),
      })),
      hasMore,
      cursor: nextCursor,
      totalVideos,
      source: 'tiktok',
      cached: false,
    };

    // Cache the response (only first page, not paginated results)
    if (cacheKey && !cursor && videos.length > 0) {
      const expiresAt = new Date(Date.now() + cacheTTL * 60 * 60 * 1000).toISOString();
      await sb.from('tiktok_cache').upsert({
        cache_key: cacheKey,
        data: response,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: 'cache_key' }).then(() => {});
    }

    return new Response(JSON.stringify(response), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('tiktok-content error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: (err as Error).message || 'Failed to fetch content',
      videos: [],
      hasMore: false,
      // Return empty state so UI can show fallback
      fallback: true,
    }), {
      status: 200, // Return 200 even on error so app can show fallback UI
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
