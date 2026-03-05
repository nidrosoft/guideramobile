/**
 * DESTINATION DETAIL PAGE
 * 
 * Fetches real data from curated_destinations and renders
 * the universal DetailPageTemplate.
 * Route: /destinations/[id]
 */

import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'iconsax-react-native';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import DetailPageTemplate from '@/components/templates/DetailPageTemplate/DetailPageTemplate';
import type { CuratedDestination } from '@/hooks/useSectionDestinations';
import { useEvents } from '@/hooks/useEvents';
import { eventsService, DiscoveredEvent } from '@/services/events.service';
import { SkeletonDetailPage } from '@/components/common/SkeletonLoader';

const PRIMARY = '#3FC39E';

const BUDGET_LABELS: Record<number, string> = {
  1: '$30 - $60',
  2: '$60 - $120',
  3: '$120 - $200',
  4: '$200 - $350',
  5: '$350+',
};

const SEASON_LABELS: Record<string, string> = {
  spring: 'March - May',
  summer: 'June - August',
  fall: 'September - November',
  winter: 'December - February',
};

/** Maps curated_destinations row → DetailPageTemplate data shape */
function mapToDetailData(dest: CuratedDestination, similarItems: any[], poiData: any, aiEnrichment?: any) {
  const bestSeasons = (dest.seasons || [])
    .map(s => SEASON_LABELS[s] || s)
    .join(', ');

  const city = dest.city;
  const country = dest.country;
  const heroImg = dest.hero_image_url;
  const gallery = dest.gallery_urls || [];
  const allImages = [heroImg, ...gallery].filter(Boolean) as string[];
  const tags = dest.tags || [];
  const travelStyles = dest.travel_style || [];

  // Best time and budget labels for BasicInfoSection header cards
  // Prefer AI enrichment values when available
  const bestTimeLabel = aiEnrichment?.best_time_months
    ? aiEnrichment.best_time_months.split(',')[0].trim()
    : bestSeasons
      ? (bestSeasons.length > 15 ? bestSeasons.split(',')[0].trim() : bestSeasons)
      : 'Year-round';
  const budgetLabel = aiEnrichment?.budget_per_day_usd || BUDGET_LABELS[dest.budget_level] || '$100-200';

  return {
    name: dest.title,
    location: `${city}, ${country}`,
    rating: Number(dest.editor_rating) || 4.5,
    category: dest.primary_category?.replace(/_/g, ' ') || 'Destination',
    visitors: dest.popularity_score ? `${(dest.popularity_score / 10).toFixed(0)}K+ visitors` : '',
    bestTime: bestTimeLabel,
    budget: budgetLabel,
    description: dest.description || dest.short_description || '',
    practicalInfo: aiEnrichment?.practical_tips?.length > 0
      ? aiEnrichment.practical_tips
      : [
          { icon: 'clock', label: 'Best Time to Visit', value: bestSeasons || 'Year-round' },
          { icon: 'price', label: 'Average Daily Budget', value: aiEnrichment?.budget_per_day_usd || BUDGET_LABELS[dest.budget_level] || '$100 - $200' },
          { icon: 'calendar', label: 'Recommended Duration', value: aiEnrichment?.recommended_duration || '5-7 days' },
          ...(dest.safety_rating ? [{ icon: 'phone', label: 'Safety Rating', value: `${dest.safety_rating}/5` }] : []),
        ],
    images: allImages.length > 0 ? allImages : ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'],

    // Places to Visit — from Edge Function (Google Places) or contextual fallback
    places: poiData?.nearbyPlaces?.length > 0 ? poiData.nearbyPlaces.map((p: any, idx: number) => {
      // Smart category assignment from Google Places types
      let category = p.category || 'Attractions';
      const types: string[] = p.types || [];
      if (types.some(t => ['restaurant', 'food', 'cafe', 'bar', 'bakery'].includes(t))) {
        category = 'Restaurants';
      } else if (types.some(t => ['amusement_park', 'museum', 'art_gallery', 'bowling_alley', 'spa', 'gym', 'movie_theater', 'stadium'].includes(t))) {
        category = 'Interaction';
      } else if (types.some(t => ['park', 'natural_feature', 'campground', 'rv_park', 'beach'].includes(t)) || (p.reviewCount && p.reviewCount < 80)) {
        category = 'Hidden Gems';
      } else {
        category = 'Attractions';
      }
      return {
        id: p.id || String(idx),
        name: p.name,
        description: p.vicinity || `A popular ${category.toLowerCase()} in ${city}.`,
        image: p.photo || allImages[idx % allImages.length] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
        distance: 'Nearby',
        category,
        latitude: p.location?.lat || 0,
        longitude: p.location?.lng || 0,
      };
    }) : [
      {
        id: '1',
        name: `${city} City Center`,
        description: `Explore the vibrant heart of ${city} with its iconic landmarks, local markets, and cultural attractions.`,
        image: allImages[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
        distance: '0.5 Miles',
        category: 'Attractions',
        latitude: Number(dest.latitude) || 0,
        longitude: Number(dest.longitude) || 0,
      },
      {
        id: '2',
        name: `Historic ${city} Quarter`,
        description: `Discover the rich history and heritage of ${city} through its ancient streets and architectural marvels.`,
        image: allImages[1] || allImages[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
        distance: '1.2 Miles',
        category: 'Attractions',
        latitude: (Number(dest.latitude) || 0) + 0.005,
        longitude: (Number(dest.longitude) || 0) + 0.003,
      },
      {
        id: '3',
        name: `${city} Local Market`,
        description: `Experience authentic local cuisine and handcrafted goods at ${city}'s most popular market.`,
        image: allImages[2] || allImages[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
        distance: '0.8 Miles',
        category: 'Hidden Gems',
        latitude: (Number(dest.latitude) || 0) - 0.003,
        longitude: (Number(dest.longitude) || 0) + 0.005,
      },
    ],

    // Safety Information — AI-enriched (accurate per-destination) or DB fallback
    safetyInfo: aiEnrichment?.safety_cards?.length > 0
      ? aiEnrichment.safety_cards.map((card: any, idx: number) => ({
          id: String(idx + 1),
          category: card.category || 'General Safety',
          title: card.title || 'Safety Information',
          detail: card.detail || '',
          severity: (card.severity as 'low' | 'medium' | 'high') || 'medium',
          iconType: (card.iconType as 'warning' | 'clock' | 'location' | 'info') || 'info',
        }))
      : [
          {
            id: '1',
            category: 'General Safety',
            title: `Safety in ${city}`,
            detail: `${city} has a safety rating of ${dest.safety_rating}/5. Always stay aware of your surroundings and use common travel precautions.`,
            severity: dest.safety_rating >= 4 ? 'low' as const : dest.safety_rating >= 3 ? 'medium' as const : 'high' as const,
            iconType: 'info' as const,
          },
          {
            id: '2',
            category: 'Emergency',
            title: 'Emergency Services',
            detail: `Keep local emergency contacts and your embassy number saved. Carry travel insurance and keep copies of important documents.`,
            severity: 'low' as const,
            iconType: 'location' as const,
          },
        ],

    // Creators Content — powered by real TikTok API via CreatorsContentSection
    // The component fetches live TikTok videos by destination name; no mock data needed
    creatorContent: [],

    // Vibes Around Here — wired to real nearby destinations (same continent)
    // Uses real Supabase UUIDs so tapping navigates to a real detail page
    vibes: similarItems.slice(0, 4).map((s: any, idx: number) => {
      const sTags: string[] = s.tags || [];
      const sStyles: string[] = s.travel_style || [];
      let vibeTags: string[] = [];
      if (sTags.includes('food') || sStyles.includes('foodie')) vibeTags.push('Foodie');
      if (sTags.includes('history') || sTags.includes('culture')) vibeTags.push('Historic');
      if (sStyles.includes('adventure') || sTags.includes('hiking')) vibeTags.push('Adventure');
      if (sStyles.includes('romantic') || sTags.includes('romantic')) vibeTags.push('Romantic');
      if (sTags.includes('art') || sTags.includes('art_gallery')) vibeTags.push('Artsy');
      if (sTags.includes('nature') || sTags.includes('park')) vibeTags.push('Nature');
      if (sStyles.includes('nightlife') || sTags.includes('nightlife')) vibeTags.push('Nightlife');
      if (vibeTags.length === 0) vibeTags = ['Social', 'Historic', 'Nature'];
      return {
        id: s.id,
        name: s.title,
        description: s.short_description || `Explore the unique atmosphere and experiences of ${s.city}, ${s.country}.`,
        distance: 'Nearby',
        image: s.thumbnail_url || s.hero_image_url || allImages[idx % allImages.length] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
        tags: vibeTags.slice(0, 3),
      };
    }),

    // Local Events — populated from AI event discovery (Gemini + Google Search)
    localEvents: [] as any[], // Will be injected from useEvents hook

    // Reviews — real Google Places reviews only, no mock fallback
    reviews: poiData?.reviews?.length > 0 ? poiData.reviews.map((r: any, idx: number) => ({
      id: String(idx),
      userName: r.author,
      userAvatar: r.avatar || `https://i.pravatar.cc/150?img=${idx + 1}`,
      rating: r.rating || 5,
      date: r.time,
      reviewText: r.text,
    })) : [],

    similarItems: similarItems.map(s => ({
      id: s.id,
      name: s.title,
      location: `${s.city}, ${s.country}`,
      rating: Number(s.editor_rating) || 4.5,
      image: s.thumbnail_url || s.hero_image_url,
      category: s.primary_category?.replace(/_/g, ' ') || 'Destination',
    })),
  };
}

export default function DestinationDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [destination, setDestination] = useState<CuratedDestination | null>(null);
  const [similarItems, setSimilarItems] = useState<any[]>([]);
  const [poiData, setPoiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventCity, setEventCity] = useState('');
  const [eventCountry, setEventCountry] = useState('');

  const { events: discoveredEvents } = useEvents({
    city: eventCity,
    country: eventCountry,
    enabled: !!eventCity && !!eventCountry,
  });

  const localEvents = useMemo(() => {
    return discoveredEvents.map((e: DiscoveredEvent) => ({
      id: e.id,
      dbId: e.id,
      title: e.event_name,
      location: e.venue || `${e.city}, ${e.country}`,
      date: eventsService.formatEventDate(e.date_start),
      time: e.time_info || 'See details',
      description: e.description || `${e.category} event in ${e.city}`,
      image: e.image_url || '',
      category: e.category,
      ticketPrice: e.ticket_price || (e.is_free ? 'Free' : 'See details'),
      sourceUrl: e.source_url || e.ticket_url || '',
      tags: e.tags,
    }));
  }, [discoveredEvents]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDestination() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch the destination
        const { data: dest, error: destError } = await supabase
          .from('curated_destinations')
          .select('*')
          .eq('id', id as string)
          .single();

        if (destError) throw destError;
        if (!dest) throw new Error('Destination not found');

        if (!cancelled) {
          setDestination(dest);
          setEventCity(dest.city);
          setEventCountry(dest.country);
        }

        // Fetch similar items (same continent, different id)
        const { data: similar } = await supabase
          .from('curated_destinations')
          .select('id, title, city, country, thumbnail_url, hero_image_url, editor_rating, primary_category, tags, travel_style, short_description')
          .eq('status', 'published')
          .eq('continent', dest.continent)
          .neq('id', dest.id)
          .order('popularity_score', { ascending: false })
          .limit(6);

        if (!cancelled) {
          setSimilarItems(similar || []);
        }

        // Fetch POIs from Edge Function
        try {
          const { data: poiRes } = await supabase.functions.invoke('destination-details', {
            body: { id: dest.id },
          });
          if (!cancelled && poiRes?.success) {
            setPoiData(poiRes.data);
          }
        } catch (poiErr) {
          console.error('Failed to fetch POIs:', poiErr);
        }
      } catch (err: any) {
        console.error('DestinationDetail fetch error:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load destination');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (id) fetchDestination();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SkeletonDetailPage />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !destination) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Destination not found</Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{error || 'This destination may no longer be available'}</Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: PRIMARY }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={18} color="#FFF" />
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const detailData = {
    ...mapToDetailData(destination, similarItems, poiData, poiData?.enrichment),
    localEvents,
  };

  return (
    <DetailPageTemplate
      type="destination"
      id={id as string}
      data={detailData}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 20,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backBtnText: {
    fontFamily: 'Rubik-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
