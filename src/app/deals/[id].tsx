/**
 * DEAL DETAIL SCREEN
 *
 * Premium in-app deal detail page with rich content from Viator/SerpAPI:
 * - Photo gallery (horizontal scroll, up to 6 images)
 * - Quick info bar (duration, languages, group size)
 * - Description / overview
 * - Highlights
 * - What's included / not included (collapsible)
 * - Rating & recommendation %
 * - Save to DB / native share
 * - Primary color CTA → affiliate deep link to exact product
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  Share,
  Platform,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft, Heart, ExportSquare, Clock, LanguageSquare, People, TickCircle, CloseCircle, ArrowDown2, ArrowUp2, Location, Star1 } from 'iconsax-react-native';
import { Image } from 'expo-image';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import type { DealType } from '@/services/deal';
import { SkeletonDetailPage } from '@/components/common/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_WIDTH = SCREEN_WIDTH;
const PHOTO_HEIGHT = 340;
const PRIMARY = '#3FC39E';

const BADGE_STYLES: Record<string, { text: string; bg: string; fg: string }> = {
  record_low: { text: 'LOWEST EVER', bg: '#FEE2E2', fg: '#DC2626' },
  near_record_low: { text: 'NEAR RECORD LOW', bg: '#FFEDD5', fg: '#EA580C' },
  great_deal: { text: 'GREAT DEAL', bg: '#D1FAE5', fg: '#059669' },
  good_deal: { text: 'GOOD DEAL', bg: '#DBEAFE', fg: '#2563EB' },
  price_drop: { text: 'PRICE DROP', bg: '#EDE9FE', fg: '#7C3AED' },
  new: { text: 'NEW', bg: '#E0E7FF', fg: '#4F46E5' },
};

const PLACEHOLDER_IMAGES: Record<string, string> = {
  flight: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  experience: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800',
  car: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800',
};

export default function DealDetailScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const params = useLocalSearchParams<{ id: string; title?: string; type?: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [deal, setDeal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>('description');
  const saveAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (params.id) loadDeal();
  }, [params.id]);

  const loadDeal = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('deal_cache').select('*').eq('id', params.id).single();
      if (error) throw error;
      setDeal(data);
      // Check if saved
      if (profile?.id) {
        const { data: saved } = await supabase
          .from('saved_deals').select('id').eq('user_id', profile.id).eq('route_key', data.route_key).limit(1);
        setIsSaved((saved || []).length > 0);
      }
    } catch (err) {
      console.warn('Failed to load deal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); };

  const handleGetDeal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const s = deal?.deal_data || {};
    const url = s.bookingUrl || s.productUrl || s.link;
    if (url) {
      // Track click
      if (profile?.id) {
        supabase.from('deal_clicks').insert({
          user_id: profile.id, deal_type: deal.deal_type, provider: deal.provider,
          affiliate_url: url, deal_snapshot: s, price_amount: deal.price_amount,
          price_currency: deal.price_currency || 'USD', source: 'deal_detail',
        }).then(() => {});
      }
      try { await Linking.openURL(url); } catch { /* silently fail */ }
    }
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!profile?.id || !deal) return;
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    // Bounce animation
    Animated.sequence([
      Animated.spring(saveAnim, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 12 }),
      Animated.spring(saveAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }),
    ]).start();
    if (newSaved) {
      await supabase.from('saved_deals').upsert({
        user_id: profile.id, deal_type: deal.deal_type, provider: deal.provider,
        deal_snapshot: deal.deal_data, price_at_save: deal.price_amount,
        price_currency: deal.price_currency || 'USD', route_key: deal.route_key,
        deal_cache_id: deal.id,
        expires_at: deal.expires_at, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,route_key' });
    } else {
      await supabase.from('saved_deals').delete().eq('user_id', profile.id).eq('route_key', deal.route_key);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!deal) return;
    const s = deal.deal_data || {};
    const dealTitle = s.title || 'an amazing deal';
    const dealPrice = `$${Math.round(Number(deal.price_amount))}`;
    const typeLabel = deal.deal_type === 'flight' ? '✈️ Flight Deal' : deal.deal_type === 'hotel' ? '🏨 Hotel Deal' : '🌟 Experience';
    try {
      await Share.share({
        title: `Check out this deal on Guidera!`,
        message: `${typeLabel}\n\nI found ${dealTitle} for just ${dealPrice} on Guidera! 🎉\n\nDownload Guidera to discover personalized travel deals tailored just for you.`,
      });
    } catch { /* cancelled */ }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const openCarousel = (index: number) => {
    setCarouselIndex(index);
    setShowCarousel(true);
  };

  // --- Loading / Error states ---
  if (isLoading) {
    return (
      <View style={[styles.safe, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <SkeletonDetailPage heroHeight={PHOTO_HEIGHT} />
        </ScrollView>
      </View>
    );
  }
  if (!deal) {
    return (
      <View style={[styles.safe, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <TouchableOpacity onPress={handleBack} style={[styles.navBtn, { backgroundColor: colors.bgCard }]}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorTxt, { color: colors.textSecondary }]}>Deal not found</Text>
        </View>
      </View>
    );
  }

  // --- Parse deal data ---
  const d = deal.deal_data || {};
  const dealType = deal.deal_type as DealType;
  const badges = (deal.deal_badges || []) as string[];
  const price = Number(deal.price_amount) || 0;
  const title = d.title || deal.route_key?.replace('-', ' → ') || 'Deal';
  const bookingUrl = d.bookingUrl || d.productUrl || d.link;

  // Photos
  const rawImages = d.images && d.images.length > 0 ? d.images.slice(0, 8) : [];
  const photos: string[] = rawImages.length > 0
    ? rawImages.map((img: any) => (typeof img === 'string' ? img : img?.url || img?.href || '')).filter(Boolean)
    : [d.heroImage || d.imageUrl || PLACEHOLDER_IMAGES[dealType] || PLACEHOLDER_IMAGES.flight];

  // Quick info items
  const quickInfo: { icon: any; label: string; value: string }[] = [];
  if (d.duration || d.durationMinutes) {
    const durationStr = typeof d.duration === 'object' && d.duration !== null
      ? (d.duration.formatted || `${d.duration.value || ''}${d.duration.unit === 'hours' ? 'h' : d.duration.unit === 'minutes' ? 'min' : ''}`)
      : (d.duration || `${Math.round((d.durationMinutes || 120) / 60)}h`);
    quickInfo.push({ icon: Clock, label: 'Duration', value: durationStr });
  }
  if (d.languages && d.languages.length > 0) {
    quickInfo.push({ icon: LanguageSquare, label: 'Languages', value: d.languages.slice(0, 3).join(', ') });
  }
  if (d.maxGroupSize) {
    quickInfo.push({ icon: People, label: 'Group Size', value: `Up to ${d.maxGroupSize}` });
  }
  if (d.city) {
    quickInfo.push({ icon: Location, label: 'Location', value: `${d.city}${d.country ? ', ' + d.country : ''}` });
  }

  // Flight-specific quick info
  if (dealType === 'flight') {
    if (d.airline) quickInfo.push({ icon: Clock, label: 'Airline', value: d.airline });
    if (d.totalStops !== undefined) quickInfo.push({ icon: People, label: 'Stops', value: d.totalStops === 0 ? 'Nonstop' : `${d.totalStops} stop${d.totalStops > 1 ? 's' : ''}` });
    if (d.origin && d.destination) quickInfo.push({ icon: Location, label: 'Route', value: `${d.origin} → ${d.destination}` });
    if (d.destinationName) quickInfo.push({ icon: Location, label: 'To', value: d.destinationName });
  }

  // Hotel-specific quick info
  if (dealType === 'hotel') {
    if (d.name) quickInfo.push({ icon: Clock, label: 'Hotel', value: d.name });
    if (d.starRating) quickInfo.push({ icon: Star1, label: 'Stars', value: `${d.starRating} Star` });
    if (d.check_in && d.check_out) quickInfo.push({ icon: Clock, label: 'Dates', value: `${d.check_in} → ${d.check_out}` });
  }

  const whatsIncluded = d.whatsIncluded || [];
  const whatsNotIncluded = d.whatsNotIncluded || [];
  const highlights = d.highlights || [];
  const description = d.description || '';
  const ratingRaw = d.rating;
  const rating = typeof ratingRaw === 'object' && ratingRaw !== null ? ratingRaw.score : (ratingRaw || null);
  const reviewCount = typeof ratingRaw === 'object' && ratingRaw !== null ? (ratingRaw.reviewCount || 0) : (d.reviewCount || 0);
  const recommendedPercent = d.recommendedPercent || null;
  const cancellation = d.cancellationPolicy || (d.flags?.includes('FREE_CANCELLATION') ? 'Free cancellation up to 24 hours before' : null);

  // ═══════════════════════════════════════════
  // FLIGHT DEAL DETAIL (AirClub-style)
  // ═══════════════════════════════════════════
  if (dealType === 'flight') {
    const origin = d.origin || deal.route_key?.split('-')[0] || 'SAN';
    const dest = d.destination || deal.route_key?.split('-')[1] || '';
    const destName = d.destinationName || dest;
    const airline = d.airline || 'Airline';
    const stops = d.totalStops === 0 ? 'Nonstop' : `${d.totalStops || 0} stop${(d.totalStops || 0) > 1 ? 's' : ''}`;
    const originalPrice = d.originalPrice ? Number(d.originalPrice) : null;
    const savings = originalPrice ? originalPrice - price : 0;
    const dateRange = deal.date_range || '';

    return (
      <View style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar style="light" translucent />
        <FullScreenCarousel photos={photos} visible={showCarousel} initialIndex={carouselIndex} onClose={() => setShowCarousel(false)} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero photo gallery */}
          <View style={styles.photoContainer}>
            <FlatList
              data={photos}
              renderItem={({ item, index }) => (
                <TouchableOpacity activeOpacity={0.9} onPress={() => openCarousel(index)}>
                  <Image source={item} style={styles.photo} contentFit="cover" />
                </TouchableOpacity>
              )}
              keyExtractor={(_, i) => i.toString()}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
              getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            />
            <View style={styles.photoOverlay} pointerEvents="none" />

            <View style={[styles.heroNav, { top: insets.top + 8 }]}>
              <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
                <ArrowLeft size={22} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.navRight}>
                <TouchableOpacity onPress={handleSave} style={styles.navBtn}>
                  <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
                    <Heart size={22} color={isSaved ? '#EF4444' : '#FFF'} variant={isSaved ? 'Bold' : 'Linear'} />
                  </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
                  <ExportSquare size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Price overlay card on hero */}
            <View style={flightStyles.heroCard}>
              {originalPrice && (
                <Text style={flightStyles.heroPriceOld}>${Math.round(originalPrice)}</Text>
              )}
              <Text style={flightStyles.heroPriceCurrent}>${Math.round(price)}</Text>
              <Text style={flightStyles.heroPriceLabel}>Round trip</Text>
            </View>

            {/* Photo dots */}
            {photos.length > 1 && (
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, activePhoto === i && styles.dotActive]} />
                ))}
              </View>
            )}

            {/* Photo count badge */}
            {photos.length > 1 && (
              <TouchableOpacity style={styles.photoCountBadge} onPress={() => openCarousel(activePhoto)}>
                <Ionicons name="images-outline" size={14} color="#FFF" />
                <Text style={styles.photoCountText}>{photos.length}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.content, { backgroundColor: colors.background }]}>
            {/* Destination */}
            <Text style={[flightStyles.destName, { color: colors.textPrimary }]}>{destName}</Text>
            {d.country && <Text style={[flightStyles.destCountry, { color: colors.textSecondary }]}>{d.country}</Text>}
            {dateRange && <Text style={[flightStyles.dateRange, { color: colors.textSecondary }]}>{dateRange}</Text>}

            {/* Price range bar */}
            {originalPrice && (
              <View style={flightStyles.priceRangeContainer}>
                <View style={flightStyles.priceRangeLabels}>
                  <View style={flightStyles.priceRangePill}>
                    <Text style={flightStyles.priceRangeLow}>${Math.round(price)} is low</Text>
                  </View>
                  <View style={[flightStyles.priceRangePill, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[flightStyles.priceRangeLow, { color: '#DC2626' }]}>${Math.round(originalPrice)}</Text>
                  </View>
                </View>
                <View style={flightStyles.priceBar}>
                  <View style={[flightStyles.priceBarLow, { width: `${Math.round((price / originalPrice) * 100)}%` }]} />
                  <View style={flightStyles.priceBarDotLow} />
                  <View style={{ flex: 1 }} />
                  <View style={flightStyles.priceBarDotHigh} />
                </View>
              </View>
            )}

            {/* Savings callout */}
            {savings > 0 && (
              <View style={[flightStyles.savingsCard, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: isDark ? '#065F46' : '#A7F3D0' }]}>
                <Text style={[flightStyles.savingsText, { color: isDark ? '#6EE7B7' : '#059669' }]}>
                  You save ${Math.round(savings)} on this deal
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={[{ height: 1, backgroundColor: colors.borderSubtle, marginVertical: 20 }]} />

            {/* Travel Plan */}
            <Text style={[flightStyles.sectionTitle, { color: colors.textPrimary }]}>Travel Plan</Text>

            {/* Leaving */}
            <Text style={[flightStyles.legLabel, { color: PRIMARY }]}>Leaving</Text>
            <View style={flightStyles.timeline}>
              <View style={flightStyles.timelineDot} />
              <View style={[flightStyles.timelineLine, { backgroundColor: colors.borderSubtle }]} />
              <View style={flightStyles.timelineContent}>
                <Text style={[flightStyles.airportName, { color: colors.textPrimary }]}>{origin} International Airport</Text>
                <Text style={[flightStyles.airportCode, { color: colors.textSecondary }]}>{origin}</Text>
              </View>
            </View>
            <View style={flightStyles.durationBadge}>
              <Text style={[flightStyles.durationText, { color: colors.textSecondary }]}>
                {d.totalDuration ? `${Math.floor(d.totalDuration / 60)}h ${d.totalDuration % 60}m` : '~4h'} · {stops}
              </Text>
            </View>
            <View style={flightStyles.timeline}>
              <View style={flightStyles.timelineDot} />
              <View style={flightStyles.timelineContent}>
                <Text style={[flightStyles.airportName, { color: colors.textPrimary }]}>{dest} International Airport</Text>
                <Text style={[flightStyles.airportCode, { color: colors.textSecondary }]}>{dest}</Text>
              </View>
            </View>

            {/* Return */}
            <View style={[{ height: 1, backgroundColor: colors.borderSubtle, marginVertical: 16 }]} />
            <Text style={[flightStyles.legLabel, { color: colors.textSecondary }]}>Return</Text>
            <View style={flightStyles.timeline}>
              <View style={flightStyles.timelineDot} />
              <View style={[flightStyles.timelineLine, { backgroundColor: colors.borderSubtle }]} />
              <View style={flightStyles.timelineContent}>
                <Text style={[flightStyles.airportName, { color: colors.textPrimary }]}>{dest} International Airport</Text>
                <Text style={[flightStyles.airportCode, { color: colors.textSecondary }]}>{dest}</Text>
              </View>
            </View>
            <View style={flightStyles.durationBadge}>
              <Text style={[flightStyles.durationText, { color: colors.textSecondary }]}>
                {d.totalDuration ? `${Math.floor(d.totalDuration / 60)}h ${d.totalDuration % 60}m` : '~4h'} · {stops}
              </Text>
            </View>
            <View style={flightStyles.timeline}>
              <View style={flightStyles.timelineDot} />
              <View style={flightStyles.timelineContent}>
                <Text style={[flightStyles.airportName, { color: colors.textPrimary }]}>{origin} International Airport</Text>
                <Text style={[flightStyles.airportCode, { color: colors.textSecondary }]}>{origin}</Text>
              </View>
            </View>

            {/* Airline */}
            <View style={[{ height: 1, backgroundColor: colors.borderSubtle, marginVertical: 20 }]} />
            <Text style={[flightStyles.sectionTitle, { color: colors.textPrimary }]}>Airline</Text>
            <View style={[flightStyles.airlineCard, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC', borderColor: colors.borderSubtle }]}>
              {d.airlineLogo && <Image source={d.airlineLogo} style={flightStyles.airlineLogo} contentFit="contain" />}
              <Text style={[flightStyles.airlineName, { color: colors.textPrimary }]}>{airline}</Text>
            </View>

            {/* Partner note */}
            <View style={[styles.partnerNote, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC' }]}>
              <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />
              <Text style={[styles.partnerText, { color: colors.textSecondary }]}>
                Secure booking through our trusted partner. You'll be taken directly to the booking page.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + 10 }]}>
          <View>
            <Text style={[styles.btmLabel, { color: colors.textSecondary }]}>Round trip</Text>
            <Text style={[styles.btmPrice, { color: colors.textPrimary }]}>${Math.round(price)}</Text>
          </View>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleGetDeal} activeOpacity={0.85}>
            <Text style={styles.ctaTxt}>Book</Text>
            <ExportSquare size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════
  // HOTEL DEAL DETAIL
  // ═══════════════════════════════════════════
  if (dealType === 'hotel') {
    const hotelName = d.name || d.title || title;
    const starRating = d.starRating || d.stars || 0;
    const checkIn = d.check_in || d.checkIn || '';
    const checkOut = d.check_out || d.checkOut || '';
    const amenities: string[] = d.amenities || d.facilities || [];
    const originalPrice = d.originalPrice ? Number(d.originalPrice) : null;
    const savings = originalPrice ? originalPrice - price : 0;
    const hotelHero = photos[0] || PLACEHOLDER_IMAGES.hotel;
    const neighborhood = d.neighborhood || d.area || '';
    const hotelRatingRaw = d.rating || d.guestRating || null;
    const hotelRating = typeof hotelRatingRaw === 'object' && hotelRatingRaw !== null ? hotelRatingRaw.score : (hotelRatingRaw || null);
    const hotelReviews = typeof hotelRatingRaw === 'object' && hotelRatingRaw !== null ? (hotelRatingRaw.reviewCount || 0) : (d.reviewCount || d.totalReviews || 0);

    return (
      <View style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar style="light" translucent />
        <FullScreenCarousel photos={photos} visible={showCarousel} initialIndex={carouselIndex} onClose={() => setShowCarousel(false)} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hotel Hero */}
          <View style={styles.photoContainer}>
            <FlatList
              data={photos}
              renderItem={({ item, index }) => (
                <TouchableOpacity activeOpacity={0.9} onPress={() => openCarousel(index)}>
                  <Image source={item} style={styles.photo} contentFit="cover" />
                </TouchableOpacity>
              )}
              keyExtractor={(_, i) => i.toString()}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
              getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            />
            <View style={styles.photoOverlay} pointerEvents="none" />

            <View style={[styles.heroNav, { top: insets.top + 8 }]}>
              <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
                <ArrowLeft size={22} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.navRight}>
                <TouchableOpacity onPress={handleSave} style={styles.navBtn}>
                  <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
                    <Heart size={22} color={isSaved ? '#EF4444' : '#FFF'} variant={isSaved ? 'Bold' : 'Linear'} />
                  </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
                  <ExportSquare size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {photos.length > 1 && (
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, activePhoto === i && styles.dotActive]} />
                ))}
              </View>
            )}

            {photos.length > 1 && (
              <TouchableOpacity style={styles.photoCountBadge} onPress={() => openCarousel(activePhoto)}>
                <Ionicons name="images-outline" size={14} color="#FFF" />
                <Text style={styles.photoCountText}>{photos.length}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.content, { backgroundColor: colors.background }]}>
            {/* Badges */}
            {badges.length > 0 ? (
              <View style={styles.badgeRow}>
                {badges.map((b, i) => {
                  const bs = BADGE_STYLES[b] || BADGE_STYLES.good_deal;
                  return (
                    <View key={i} style={[styles.badge, { backgroundColor: bs.bg }]}>
                      <Text style={[styles.badgeTxt, { color: bs.fg }]}>{bs.text}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Hotel Name + Stars */}
            <Text style={[styles.title, { color: colors.textPrimary }]}>{hotelName}</Text>
            {starRating > 0 && (
              <View style={hotelStyles.starsRow}>
                {Array.from({ length: Math.round(starRating) }).map((_, i) => (
                  <Star1 key={i} size={16} color="#F59E0B" variant="Bold" />
                ))}
                <Text style={[hotelStyles.starLabel, { color: colors.textSecondary }]}>{starRating}-star hotel</Text>
              </View>
            )}

            {/* Location */}
            {(d.city || neighborhood) && (
              <View style={hotelStyles.locationRow}>
                <Location size={16} color={PRIMARY} variant="Bold" />
                <Text style={[hotelStyles.locationText, { color: colors.textSecondary }]}>
                  {neighborhood ? `${neighborhood}, ` : ''}{d.city || ''}{d.country ? `, ${d.country}` : ''}
                </Text>
              </View>
            )}

            {/* Guest Rating */}
            {hotelRating && (
              <View style={styles.ratingBar}>
                <Star1 size={16} color="#F59E0B" variant="Bold" />
                <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{hotelRating}</Text>
                {hotelReviews > 0 && <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>({hotelReviews.toLocaleString()} reviews)</Text>}
              </View>
            )}

            {/* Price Block */}
            <View style={[hotelStyles.priceBlock, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC', borderColor: colors.borderSubtle }]}>
              <View style={hotelStyles.priceTop}>
                {originalPrice && (
                  <Text style={hotelStyles.originalPrice}>${Math.round(originalPrice)}</Text>
                )}
                <Text style={[hotelStyles.currentPrice, { color: colors.textPrimary }]}>${Math.round(price)}</Text>
                <Text style={[hotelStyles.perNight, { color: colors.textSecondary }]}>/ night</Text>
              </View>
              {savings > 0 && (
                <View style={hotelStyles.savingsPill}>
                  <Text style={hotelStyles.savingsText}>Save ${Math.round(savings)} per night</Text>
                </View>
              )}
            </View>

            {/* Check-in / Check-out */}
            {(checkIn || checkOut) && (
              <View style={[hotelStyles.dateCard, { backgroundColor: isDark ? colors.bgCard : '#FFFFFF', borderColor: colors.borderSubtle }]}>
                <View style={hotelStyles.dateCol}>
                  <Text style={[hotelStyles.dateLabel, { color: colors.textSecondary }]}>Check-in</Text>
                  <Text style={[hotelStyles.dateValue, { color: colors.textPrimary }]}>{checkIn || 'Flexible'}</Text>
                </View>
                <View style={[hotelStyles.dateDivider, { backgroundColor: colors.borderSubtle }]} />
                <View style={hotelStyles.dateCol}>
                  <Text style={[hotelStyles.dateLabel, { color: colors.textSecondary }]}>Check-out</Text>
                  <Text style={[hotelStyles.dateValue, { color: colors.textPrimary }]}>{checkOut || 'Flexible'}</Text>
                </View>
              </View>
            )}

            {/* Amenities */}
            {amenities.length > 0 ? (
              <View style={hotelStyles.amenitiesSection}>
                <Text style={[flightStyles.sectionTitle, { color: colors.textPrimary }]}>Amenities</Text>
                <View style={hotelStyles.amenitiesGrid}>
                  {amenities.slice(0, 8).map((a: string, i: number) => (
                    <View key={i} style={[hotelStyles.amenityChip, { backgroundColor: isDark ? colors.bgCard : '#F0F9FF', borderColor: isDark ? colors.borderSubtle : '#BAE6FD' }]}>
                      <TickCircle size={14} color={PRIMARY} variant="Bold" />
                      <Text style={[hotelStyles.amenityText, { color: colors.textPrimary }]}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Description */}
            {description ? (
              <CollapsibleSection
                title="About This Hotel"
                expanded={expandedSection === 'description'}
                onToggle={() => toggleSection('description')}
                colors={colors}
              >
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{description}</Text>
              </CollapsibleSection>
            ) : null}

            {/* Highlights */}
            {highlights.length > 0 ? (
              <CollapsibleSection
                title="Highlights"
                expanded={expandedSection === 'highlights'}
                onToggle={() => toggleSection('highlights')}
                colors={colors}
              >
                {highlights.map((h: string, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <TickCircle size={18} color={PRIMARY} variant="Bold" />
                    <Text style={[styles.listText, { color: colors.textSecondary }]}>{h}</Text>
                  </View>
                ))}
              </CollapsibleSection>
            ) : null}

            {/* Cancellation */}
            {cancellation ? (
              <View style={[styles.policyCard, { backgroundColor: isDark ? colors.bgCard : '#F0FDF4', borderColor: isDark ? colors.borderSubtle : '#BBF7D0' }]}>
                <TickCircle size={20} color="#059669" variant="Bold" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.policyTitle, { color: colors.textPrimary }]}>Cancellation Policy</Text>
                  <Text style={[styles.policyBody, { color: colors.textSecondary }]}>{cancellation}</Text>
                </View>
              </View>
            ) : null}

            {/* Partner note */}
            <View style={[styles.partnerNote, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC' }]}>
              <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />
              <Text style={[styles.partnerText, { color: colors.textSecondary }]}>
                Secure booking through our trusted partner. You'll be taken directly to the booking page.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + 10 }]}>
          <View>
            <Text style={[styles.btmLabel, { color: colors.textSecondary }]}>From</Text>
            <Text style={[styles.btmPrice, { color: colors.textPrimary }]}>${Math.round(price)}<Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular' }}>/night</Text></Text>
          </View>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleGetDeal} activeOpacity={0.85}>
            <Text style={styles.ctaTxt}>Book Now</Text>
            <ExportSquare size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════
  // EXPERIENCE / DEFAULT DETAIL
  // ═══════════════════════════════════════════
  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style="light" translucent />
      <FullScreenCarousel photos={photos} visible={showCarousel} initialIndex={carouselIndex} onClose={() => setShowCarousel(false)} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Photo Gallery ─── */}
        <View style={styles.photoContainer}>
          <FlatList
            data={photos}
            renderItem={({ item, index }) => (
              <TouchableOpacity activeOpacity={0.9} onPress={() => openCarousel(index)}>
                <Image source={item} style={styles.photo} contentFit="cover" />
              </TouchableOpacity>
            )}
            keyExtractor={(_, i) => i.toString()}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
          />
          <View style={styles.photoOverlay} pointerEvents="none" />

          {/* Nav buttons */}
          <View style={[styles.heroNav, { top: insets.top + 8 }]}>
            <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
              <ArrowLeft size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.navRight}>
              <TouchableOpacity onPress={handleSave} style={styles.navBtn}>
                <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
                  <Heart size={22} color={isSaved ? '#EF4444' : '#FFF'} variant={isSaved ? 'Bold' : 'Linear'} />
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
                <ExportSquare size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo dots */}
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.dot, activePhoto === i && styles.dotActive]} />
              ))}
            </View>
          )}

          {/* Photo count badge */}
          {photos.length > 1 && (
            <TouchableOpacity style={styles.photoCountBadge} onPress={() => openCarousel(activePhoto)}>
              <Ionicons name="images-outline" size={14} color="#FFF" />
              <Text style={styles.photoCountText}>{photos.length}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Content ─── */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Badges */}
          {badges.length > 0 ? (
            <View style={styles.badgeRow}>
              {badges.map((b, i) => {
                const bs = BADGE_STYLES[b] || BADGE_STYLES.good_deal;
                return (
                  <View key={i} style={[styles.badge, { backgroundColor: bs.bg }]}>
                    <Text style={[styles.badgeTxt, { color: bs.fg }]}>{bs.text}</Text>
                  </View>
                );
              })}
              {cancellation ? (
                <View style={[styles.badge, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.badgeTxt, { color: '#059669' }]}>FREE CANCELLATION</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

          {/* Rating bar */}
          {rating && (
            <View style={styles.ratingBar}>
              <Star1 size={16} color="#F59E0B" variant="Bold" />
              <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{rating}</Text>
              <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>({reviewCount.toLocaleString()} reviews)</Text>
              {recommendedPercent && (
                <View style={styles.recommendedPill}>
                  <Text style={styles.recommendedText}>{recommendedPercent}% recommend</Text>
                </View>
              )}
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.textPrimary }]}>${Math.round(price)}</Text>
            <Text style={[styles.currency, { color: colors.textSecondary }]}>{deal.price_currency || 'USD'}</Text>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              {dealType === 'experience' ? '/ per person' : '/ per trip'}
            </Text>
          </View>

          {/* ─── Quick Info Bar ─── */}
          {quickInfo.length > 0 ? (
            <View style={[styles.infoBar, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC', borderColor: colors.borderSubtle }]}>
              {quickInfo.map((item, i) => {
                const Icon = item.icon;
                return (
                  <View key={i} style={[styles.infoItem, i < quickInfo.length - 1 && styles.infoItemBorder]}>
                    <Icon size={18} color={PRIMARY} variant="Bold" />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>{item.value}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* ─── Description (collapsible) ─── */}
          {description ? (
            <CollapsibleSection
              title="Overview"
              expanded={expandedSection === 'description'}
              onToggle={() => toggleSection('description')}
              colors={colors}
            >
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{description}</Text>
            </CollapsibleSection>
          ) : null}

          {/* ─── Highlights ─── */}
          {highlights.length > 0 ? (
            <CollapsibleSection
              title="Highlights"
              expanded={expandedSection === 'highlights'}
              onToggle={() => toggleSection('highlights')}
              colors={colors}
            >
              {highlights.map((h: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <TickCircle size={18} color={PRIMARY} variant="Bold" />
                  <Text style={[styles.listText, { color: colors.textSecondary }]}>{h}</Text>
                </View>
              ))}
            </CollapsibleSection>
          ) : null}

          {/* ─── What's Included ─── */}
          {whatsIncluded.length > 0 ? (
            <CollapsibleSection
              title="What's Included"
              expanded={expandedSection === 'included'}
              onToggle={() => toggleSection('included')}
              colors={colors}
            >
              {whatsIncluded.map((item: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <TickCircle size={16} color="#059669" variant="Bold" />
                  <Text style={[styles.listText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
              {whatsNotIncluded.length > 0 ? (
                <>
                  <View style={[styles.miniDivider, { backgroundColor: colors.borderSubtle }]} />
                  <Text style={[styles.subHeading, { color: colors.textPrimary }]}>Not Included</Text>
                  {whatsNotIncluded.map((item: string, i: number) => (
                    <View key={i} style={styles.listItem}>
                      <CloseCircle size={16} color="#EF4444" variant="Bold" />
                      <Text style={[styles.listText, { color: colors.textSecondary }]}>{item}</Text>
                    </View>
                  ))}
                </>
              ) : null}
            </CollapsibleSection>
          ) : null}

          {/* ─── Cancellation Policy ─── */}
          {cancellation ? (
            <View style={[styles.policyCard, { backgroundColor: isDark ? colors.bgCard : '#F0FDF4', borderColor: isDark ? colors.borderSubtle : '#BBF7D0' }]}>
              <TickCircle size={20} color="#059669" variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.policyTitle, { color: colors.textPrimary }]}>Cancellation Policy</Text>
                <Text style={[styles.policyBody, { color: colors.textSecondary }]}>{cancellation}</Text>
              </View>
            </View>
          ) : null}

          {/* ─── Partner note ─── */}
          <View style={[styles.partnerNote, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC' }]}>
            <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />
            <Text style={[styles.partnerText, { color: colors.textSecondary }]}>
              Secure booking through our trusted partner. You'll be taken directly to the booking page.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom CTA ─── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom + 10 }]}>
        <View>
          <Text style={[styles.btmLabel, { color: colors.textSecondary }]}>From</Text>
          <Text style={[styles.btmPrice, { color: colors.textPrimary }]}>
            ${Math.round(price)}
            <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular' }}>
              {dealType === 'experience' ? ' /per person' : ''}
            </Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleGetDeal} activeOpacity={0.85}>
          <Text style={styles.ctaTxt}>Get This Deal</Text>
          <ExportSquare size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Collapsible Section Component ───
function CollapsibleSection({ title, expanded, onToggle, colors, children }: {
  title: string; expanded: boolean; onToggle: () => void; colors: any; children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { borderColor: colors.borderSubtle }]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        {expanded ? <ArrowUp2 size={18} color={colors.textSecondary} /> : <ArrowDown2 size={18} color={colors.textSecondary} />}
      </TouchableOpacity>
      {expanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

// ─── Full Screen Photo Carousel ───
function FullScreenCarousel({ photos, visible, initialIndex, onClose }: {
  photos: string[]; visible: boolean; initialIndex: number; onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const { height: SCREEN_H } = Dimensions.get('window');

  useEffect(() => {
    if (visible && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
    }
    setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  const renderItem = useCallback(({ item }: { item: string }) => (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_H, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Image source={item} style={{ width: SCREEN_WIDTH, height: SCREEN_H * 0.7 }} contentFit="contain" />
    </View>
  ), [SCREEN_H]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={carouselStyles.overlay}>
        {/* Close button */}
        <TouchableOpacity style={carouselStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* Photo counter */}
        <View style={carouselStyles.counter}>
          <Text style={carouselStyles.counterText}>{currentIndex + 1} / {photos.length}</Text>
        </View>

        {/* FlatList carousel */}
        <FlatList
          ref={flatListRef}
          data={photos}
          renderItem={renderItem}
          keyExtractor={(_, i) => i.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig}
          getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
          initialScrollIndex={initialIndex}
        />

        {/* Bottom dots */}
        <View style={carouselStyles.dotsRow}>
          {photos.map((_, i) => (
            <View key={i} style={[carouselStyles.dot, currentIndex === i && carouselStyles.dotActive]} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const carouselStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },
  closeBtn: { position: 'absolute', top: 54, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  counter: { position: 'absolute', top: 60, alignSelf: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
  counterText: { fontFamily: 'Rubik-Medium', fontSize: 14, color: '#FFF' },
  dotsRow: { position: 'absolute', bottom: 50, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 20 },
});

// ─── Styles ───
const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorTxt: { fontSize: 16, fontFamily: 'Rubik-Medium' },
  scrollContent: { paddingBottom: 110 },

  // Photo gallery
  photoContainer: { width: SCREEN_WIDTH, height: PHOTO_HEIGHT, position: 'relative' },
  photo: { width: PHOTO_WIDTH, height: PHOTO_HEIGHT },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  heroNav: { position: 'absolute', top: 12, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  navRight: { flexDirection: 'row', gap: 10 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  dots: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 20 },
  photoCountBadge: { position: 'absolute', bottom: 14, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  photoCountText: { fontFamily: 'Rubik-Medium', fontSize: 12, color: '#FFF' },

  // Content
  content: { paddingHorizontal: spacing.lg, paddingTop: 18 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  badgeTxt: { fontFamily: 'Rubik-Bold', fontSize: 9, letterSpacing: 0.7 },
  title: { fontFamily: 'Rubik-Bold', fontSize: 22, lineHeight: 28, marginBottom: 8 },
  ratingBar: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  ratingText: { fontFamily: 'Rubik-Bold', fontSize: 15 },
  ratingCount: { fontFamily: 'Rubik-Regular', fontSize: 13 },
  recommendedPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 4 },
  recommendedText: { fontFamily: 'Rubik-Medium', fontSize: 11, color: '#92400E' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 16 },
  priceLabel: { fontFamily: 'Rubik-Regular', fontSize: 13 },
  price: { fontFamily: 'HostGrotesk-Bold', fontSize: 36 },
  currency: { fontFamily: 'Rubik-Medium', fontSize: 14 },

  // Quick info bar
  infoBar: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 8, gap: 0 },
  infoItem: { flex: 1, alignItems: 'center', gap: 4 },
  infoItemBorder: { borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.06)' },
  infoLabel: { fontFamily: 'Rubik-Regular', fontSize: 10, textAlign: 'center' },
  infoValue: { fontFamily: 'Rubik-SemiBold', fontSize: 12, textAlign: 'center' },

  // Collapsible sections
  section: { borderBottomWidth: 1, paddingVertical: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: 'Rubik-Bold', fontSize: 16 },
  sectionBody: { marginTop: 12 },
  bodyText: { fontFamily: 'Rubik-Regular', fontSize: 14, lineHeight: 22 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  listText: { fontFamily: 'Rubik-Regular', fontSize: 14, lineHeight: 20, flex: 1 },
  miniDivider: { height: 1, marginVertical: 12 },
  subHeading: { fontFamily: 'Rubik-SemiBold', fontSize: 14, marginBottom: 10 },

  // Policy card
  policyCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 16, alignItems: 'flex-start' },
  policyTitle: { fontFamily: 'Rubik-SemiBold', fontSize: 14, marginBottom: 2 },
  policyBody: { fontFamily: 'Rubik-Regular', fontSize: 13, lineHeight: 19 },

  // Partner note
  partnerNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 14, marginTop: 16 },
  partnerText: { fontFamily: 'Rubik-Regular', fontSize: 12, lineHeight: 17, flex: 1 },

  // Bottom CTA
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 14, borderTopWidth: 1 },
  btmLabel: { fontFamily: 'Rubik-Regular', fontSize: 12 },
  btmPrice: { fontFamily: 'HostGrotesk-Bold', fontSize: 26 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PRIMARY, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24 },
  ctaTxt: { fontFamily: 'Rubik-Bold', fontSize: 16, color: '#FFFFFF' },
});

// ─── Flight Detail Styles ───
const flightStyles = StyleSheet.create({
  heroCard: {
    position: 'absolute', bottom: -20, alignSelf: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 12,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
    flexDirection: 'row', gap: 8,
  },
  heroPriceOld: { fontFamily: 'Rubik-Regular', fontSize: 16, color: '#EF4444', textDecorationLine: 'line-through' },
  heroPriceCurrent: { fontFamily: 'HostGrotesk-Bold', fontSize: 26, color: '#1A1A1A' },
  heroPriceLabel: { fontFamily: 'Rubik-Regular', fontSize: 12, color: '#6B7280', marginLeft: -4 },

  destName: { fontFamily: 'Rubik-Bold', fontSize: 28, marginTop: 28, marginBottom: 2 },
  destCountry: { fontFamily: 'Rubik-Regular', fontSize: 15, marginBottom: 4 },
  dateRange: { fontFamily: 'Rubik-Regular', fontSize: 13, marginBottom: 16 },

  // Price range bar
  priceRangeContainer: { marginBottom: 12 },
  priceRangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceRangePill: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priceRangeLow: { fontFamily: 'Rubik-SemiBold', fontSize: 12, color: '#059669' },
  priceBar: { height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', overflow: 'visible' },
  priceBarLow: { height: 6, borderRadius: 3, backgroundColor: '#3FC39E' },
  priceBarDotLow: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3FC39E', marginLeft: -6, borderWidth: 2, borderColor: '#FFFFFF' },
  priceBarDotHigh: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', marginRight: -6, borderWidth: 2, borderColor: '#FFFFFF' },

  // Savings
  savingsCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 4, alignItems: 'center' },
  savingsText: { fontFamily: 'Rubik-SemiBold', fontSize: 14 },

  sectionTitle: { fontFamily: 'Rubik-Bold', fontSize: 18, marginBottom: 14 },

  // Travel plan timeline
  legLabel: { fontFamily: 'Rubik-SemiBold', fontSize: 14, marginBottom: 14 },
  timeline: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', marginTop: 5 },
  timelineLine: { position: 'absolute', left: 4, top: 15, width: 2, height: 40 },
  timelineContent: { flex: 1 },
  airportName: { fontFamily: 'Rubik-SemiBold', fontSize: 15, lineHeight: 20 },
  airportCode: { fontFamily: 'Rubik-Regular', fontSize: 13, marginTop: 1 },
  durationBadge: { marginLeft: 24, marginBottom: 14, marginTop: 4 },
  durationText: { fontFamily: 'Rubik-Regular', fontSize: 13 },

  // Airline
  airlineCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  airlineLogo: { width: 28, height: 28, borderRadius: 6 },
  airlineName: { fontFamily: 'Rubik-SemiBold', fontSize: 15 },
});

// ─── Hotel Detail Styles ───
const hotelStyles = StyleSheet.create({
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  starLabel: { fontFamily: 'Rubik-Medium', fontSize: 13, marginLeft: 4 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  locationText: { fontFamily: 'Rubik-Regular', fontSize: 14, flex: 1 },

  priceBlock: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  priceTop: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  originalPrice: { fontFamily: 'Rubik-Regular', fontSize: 16, color: '#EF4444', textDecorationLine: 'line-through' },
  currentPrice: { fontFamily: 'HostGrotesk-Bold', fontSize: 32 },
  perNight: { fontFamily: 'Rubik-Regular', fontSize: 14 },
  savingsPill: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
  savingsText: { fontFamily: 'Rubik-SemiBold', fontSize: 12, color: '#059669' },

  dateCard: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  dateCol: { flex: 1, paddingVertical: 14, paddingHorizontal: 16 },
  dateLabel: { fontFamily: 'Rubik-Regular', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontFamily: 'Rubik-SemiBold', fontSize: 15 },
  dateDivider: { width: 1 },

  amenitiesSection: { marginBottom: 8 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  amenityText: { fontFamily: 'Rubik-Medium', fontSize: 12 },
});
