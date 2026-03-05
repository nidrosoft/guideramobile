/**
 * LOCAL EXPERIENCE DETAIL SCREEN
 *
 * Rich detail page for a Viator local experience, modeled after the deals
 * experience detail layout:
 * - Photo gallery (horizontal scroll with fullscreen carousel)
 * - Quick info bar (duration, languages, group size, location)
 * - Rating & reviews
 * - Price
 * - Collapsible sections: Overview, Highlights, What's Included
 * - Cancellation policy card
 * - Partner trust note
 * - Bottom sticky CTA → "Book Now" opens Viator affiliate link
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
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
  ArrowLeft,
  ExportSquare,
  Clock,
  LanguageSquare,
  People,
  TickCircle,
  CloseCircle,
  ArrowDown2,
  ArrowUp2,
  Location,
  Star1,
  Heart,
} from 'iconsax-react-native';
import { Image } from 'expo-image';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { localExperiencesService } from '@/services/localExperiences.service';
import type { LocalExperience } from '@/services/localExperiences.service';
import { useSaveExperience } from '@/hooks/useSaveExperience';
import { SkeletonDetailPage } from '@/components/common/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 340;
const PRIMARY = '#3FC39E';

export default function LocalExperienceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [experience, setExperience] = useState<LocalExperience | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>('description');
  const { isSaved, toggleSave } = useSaveExperience(params.id || null);

  useEffect(() => {
    if (params.id) loadExperience();
  }, [params.id]);

  const loadExperience = async () => {
    setIsLoading(true);
    try {
      const data = await localExperiencesService.getExperienceDetail(params.id);
      setExperience(data);
    } catch (err) {
      console.warn('Failed to load experience:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleBookNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (experience?.bookingUrl) {
      try {
        await Linking.openURL(experience.bookingUrl);
      } catch { /* silently fail */ }
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!experience) return;
    try {
      await Share.share({
        title: `Check out this experience on Guidera!`,
        message: `🌟 ${experience.title}\n\n${experience.price.formatted} per person in ${experience.location.city}\n\nDiscover amazing local experiences on Guidera!`,
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

  // --- Loading state ---
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

  // --- Error / Not found ---
  if (!experience) {
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
          <Text style={[styles.errorTxt, { color: colors.textSecondary }]}>Experience not found</Text>
        </View>
      </View>
    );
  }

  // --- Parse data ---
  const photos: string[] = experience.images && experience.images.length > 0
    ? experience.images.map((img) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
    : [experience.heroImage].filter(Boolean);

  const quickInfo: { icon: any; label: string; value: string }[] = [];
  if (experience.duration?.formatted) {
    quickInfo.push({ icon: Clock, label: 'Duration', value: experience.duration.formatted });
  }
  if (experience.languages && experience.languages.length > 0) {
    quickInfo.push({ icon: LanguageSquare, label: 'Languages', value: experience.languages.slice(0, 3).join(', ') });
  }
  if (experience.maxGroupSize) {
    quickInfo.push({ icon: People, label: 'Group Size', value: `Up to ${experience.maxGroupSize}` });
  }
  if (experience.location?.city) {
    quickInfo.push({
      icon: Location,
      label: 'Location',
      value: `${experience.location.city}${experience.location.country ? ', ' + experience.location.country : ''}`,
    });
  }

  const rating = experience.rating?.score || null;
  const reviewCount = experience.rating?.reviewCount || 0;
  const highlights = experience.highlights || [];
  const included = experience.included || [];
  const notIncluded = experience.notIncluded || [];
  const description = experience.description || '';
  const freeCancellation = experience.freeCancellation;
  const price = experience.price?.amount || 0;

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style="light" translucent />
      <FullScreenCarousel
        photos={photos}
        visible={showCarousel}
        initialIndex={carouselIndex}
        onClose={() => setShowCarousel(false)}
      />

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
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
            }
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
          <View style={styles.photoOverlay} pointerEvents="none" />

          {/* Nav buttons */}
          <View style={[styles.heroNav, { top: insets.top + 8 }]}>
            <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
              <ArrowLeft size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.navRight}>
              <TouchableOpacity onPress={toggleSave} style={styles.navBtn}>
                <Heart size={20} color={isSaved ? '#FF4757' : '#FFF'} variant={isSaved ? 'Bold' : 'Outline'} />
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
          <View style={styles.badgeRow}>
            {experience.category ? (
              <View style={[styles.badge, { backgroundColor: '#E0E7FF' }]}>
                <Text style={[styles.badgeTxt, { color: '#4F46E5' }]}>{experience.category.toUpperCase()}</Text>
              </View>
            ) : null}
            {freeCancellation ? (
              <View style={[styles.badge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.badgeTxt, { color: '#059669' }]}>FREE CANCELLATION</Text>
              </View>
            ) : null}
            {experience.instantConfirmation ? (
              <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.badgeTxt, { color: '#92400E' }]}>INSTANT CONFIRMATION</Text>
              </View>
            ) : null}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{experience.title}</Text>

          {/* Rating bar */}
          {rating ? (
            <View style={styles.ratingBar}>
              <Star1 size={16} color="#F59E0B" variant="Bold" />
              <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{rating}</Text>
              <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>
                ({reviewCount.toLocaleString()} reviews)
              </Text>
            </View>
          ) : null}

          {/* Price */}
          <View style={styles.priceRow}>
            {experience.price.originalPrice ? (
              <Text style={styles.originalPrice}>${Math.round(experience.price.originalPrice)}</Text>
            ) : null}
            <Text style={[styles.price, { color: colors.textPrimary }]}>${Math.round(price)}</Text>
            <Text style={[styles.currency, { color: colors.textSecondary }]}>
              {experience.price.currency || 'USD'}
            </Text>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>/ per person</Text>
          </View>
          {experience.price.discountPercent ? (
            <View style={styles.discountPill}>
              <Text style={styles.discountText}>Save {experience.price.discountPercent}%</Text>
            </View>
          ) : null}

          {/* ─── Quick Info Bar ─── */}
          {quickInfo.length > 0 ? (
            <View
              style={[
                styles.infoBar,
                { backgroundColor: isDark ? colors.bgCard : '#F8FAFC', borderColor: colors.borderSubtle },
              ]}
            >
              {quickInfo.map((item, i) => {
                const Icon = item.icon;
                return (
                  <View key={i} style={[styles.infoItem, i < quickInfo.length - 1 && styles.infoItemBorder]}>
                    <Icon size={18} color={PRIMARY} variant="Bold" />
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.value}
                    </Text>
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
          {included.length > 0 ? (
            <CollapsibleSection
              title="What's Included"
              expanded={expandedSection === 'included'}
              onToggle={() => toggleSection('included')}
              colors={colors}
            >
              {included.map((item: string, i: number) => (
                <View key={i} style={styles.listItem}>
                  <TickCircle size={16} color="#059669" variant="Bold" />
                  <Text style={[styles.listText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
              {notIncluded.length > 0 ? (
                <>
                  <View style={[styles.miniDivider, { backgroundColor: colors.borderSubtle }]} />
                  <Text style={[styles.subHeading, { color: colors.textPrimary }]}>Not Included</Text>
                  {notIncluded.map((item: string, i: number) => (
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
          {freeCancellation ? (
            <View
              style={[
                styles.policyCard,
                {
                  backgroundColor: isDark ? colors.bgCard : '#F0FDF4',
                  borderColor: isDark ? colors.borderSubtle : '#BBF7D0',
                },
              ]}
            >
              <TickCircle size={20} color="#059669" variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.policyTitle, { color: colors.textPrimary }]}>Free Cancellation</Text>
                <Text style={[styles.policyBody, { color: colors.textSecondary }]}>
                  Cancel up to 24 hours before the experience for a full refund.
                </Text>
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
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.borderSubtle,
            paddingBottom: insets.bottom + 10,
          },
        ]}
      >
        <View>
          <Text style={[styles.btmLabel, { color: colors.textSecondary }]}>From</Text>
          <Text style={[styles.btmPrice, { color: colors.textPrimary }]}>
            ${Math.round(price)}
            <Text style={{ fontSize: 14, fontFamily: 'Rubik-Regular' }}> /person</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleBookNow} activeOpacity={0.85}>
          <Text style={styles.ctaTxt}>Book Now</Text>
          <ExportSquare size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Collapsible Section Component ───
function CollapsibleSection({
  title,
  expanded,
  onToggle,
  colors,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { borderColor: colors.borderSubtle }]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        {expanded ? (
          <ArrowUp2 size={18} color={colors.textSecondary} />
        ) : (
          <ArrowDown2 size={18} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
      {expanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

// ─── Full Screen Photo Carousel ───
function FullScreenCarousel({
  photos,
  visible,
  initialIndex,
  onClose,
}: {
  photos: string[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
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

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_H,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
        }}
      >
        <Image source={item} style={{ width: SCREEN_WIDTH, height: SCREEN_H * 0.7 }} contentFit="contain" />
      </View>
    ),
    [SCREEN_H]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={carouselStyles.overlay}>
        <TouchableOpacity style={carouselStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={carouselStyles.counter}>
          <Text style={carouselStyles.counterText}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>

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
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          initialScrollIndex={initialIndex}
        />

        <View style={carouselStyles.dotsRow}>
          {photos.map((_, i) => (
            <View key={i} style={[carouselStyles.dot, currentIndex === i && carouselStyles.dotActive]} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───
const carouselStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  counterText: { fontFamily: 'Rubik-Medium', fontSize: 14, color: '#FFF' },
  dotsRow: { position: 'absolute', bottom: 50, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 20 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorTxt: { fontSize: 16, fontFamily: 'Rubik-Medium' },
  scrollContent: { paddingBottom: 110 },

  // Photo gallery
  photoContainer: { width: SCREEN_WIDTH, height: PHOTO_HEIGHT, position: 'relative' },
  photo: { width: SCREEN_WIDTH, height: PHOTO_HEIGHT },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  heroNav: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navRight: { flexDirection: 'row', gap: 10 },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 20 },
  photoCountBadge: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
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
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  priceLabel: { fontFamily: 'Rubik-Regular', fontSize: 13 },
  price: { fontFamily: 'HostGrotesk-Bold', fontSize: 36 },
  originalPrice: {
    fontFamily: 'Rubik-Regular',
    fontSize: 18,
    color: '#EF4444',
    textDecorationLine: 'line-through',
  },
  currency: { fontFamily: 'Rubik-Medium', fontSize: 14 },
  discountPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  discountText: { fontFamily: 'Rubik-SemiBold', fontSize: 12, color: '#059669' },

  // Quick info bar
  infoBar: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    marginTop: 8,
    gap: 0,
  },
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
  policyCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  policyTitle: { fontFamily: 'Rubik-SemiBold', fontSize: 14, marginBottom: 2 },
  policyBody: { fontFamily: 'Rubik-Regular', fontSize: 13, lineHeight: 19 },

  // Partner note
  partnerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  partnerText: { fontFamily: 'Rubik-Regular', fontSize: 12, lineHeight: 17, flex: 1 },

  // Bottom CTA
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  btmLabel: { fontFamily: 'Rubik-Regular', fontSize: 12 },
  btmPrice: { fontFamily: 'HostGrotesk-Bold', fontSize: 26 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  ctaTxt: { fontFamily: 'Rubik-Bold', fontSize: 16, color: '#FFFFFF' },
});
