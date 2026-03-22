/**
 * EXPERIENCE DETAIL SHEET
 *
 * Rich detail bottom-sheet modeled after the LocalExperience detail page.
 * - Photo with overlay nav (share, save, close)
 * - Badges (category, free cancellation, instant confirmation)
 * - Title, rating bar, price
 * - Quick info bar (duration, languages, group size, location)
 * - Collapsible sections: Overview, Highlights, What's Included
 * - Cancellation policy card + partner note
 * - Sticky bottom CTA: "Book Now"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Star1,
  Clock,
  People,
  Location,
  TickCircle,
  CloseCircle,
  LanguageSquare,
  ArrowDown2,
  ArrowUp2,
  ShieldTick,
  Add,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors as staticColors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Experience, CANCELLATION_POLICY_LABELS } from '../../../types/experience.types';
import { useDealRedirect } from '@/hooks/useDeals';

const PHOTO_HEIGHT = 280;

interface ExperienceDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (experience: Experience) => void;
  experience: Experience | null;
}

// ─── Collapsible Section ───
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

export default function ExperienceDetailSheet({
  visible,
  onClose,
  onSelect,
  experience,
}: ExperienceDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { colors: tc, isDark } = useTheme();
  const { redirect } = useDealRedirect();
  const [expandedSection, setExpandedSection] = useState<string | null>('description');

  if (!experience) return null;

  // ─── Safe data accessors ───
  const exp = experience as any;
  const images: string[] = (Array.isArray(exp.images) ? exp.images : []).filter(Boolean);
  const ratingValue = typeof exp.rating === 'number' ? exp.rating : exp.rating?.score ?? 0;
  const reviewCountValue = typeof exp.reviewCount === 'number'
    ? exp.reviewCount
    : exp.rating?.reviewCount ?? 0;
  const durationMinutes = typeof exp.duration === 'number'
    ? exp.duration
    : exp.duration?.value
      ? (exp.duration.unit === 'hours' ? exp.duration.value * 60 : exp.duration.value)
      : 0;
  const includesList: string[] = exp.included || exp.includes || [];
  const notIncludedList: string[] = exp.notIncluded || exp.excludes || [];
  const languagesList: string[] = exp.languages || [];
  const maxParticipants = exp.maxParticipants || exp.maxGroupSize || 0;
  const highlightsList: string[] = exp.highlights || [];
  const description = exp.description || exp.shortDescription || '';
  const locationName = exp.location?.name || exp.location?.city || exp.location?.address || '';
  const cancellationPolicyKey = exp.cancellationPolicy || 'non_refundable';
  const isFreeCancellation = exp.freeCancellation === true || cancellationPolicyKey === 'free_24h' || cancellationPolicyKey === 'free_48h' || cancellationPolicyKey === 'free_7d';
  const cancellationLabel = CANCELLATION_POLICY_LABELS[cancellationPolicyKey as keyof typeof CANCELLATION_POLICY_LABELS]
    || (typeof cancellationPolicyKey === 'string' ? cancellationPolicyKey : 'Non-refundable');
  const priceAmount = typeof exp.price === 'number'
    ? exp.price
    : exp.price?.amount ?? 0;
  const priceFormatted = typeof exp.price === 'number'
    ? `$${exp.price}`
    : exp.price?.formatted || `$${priceAmount}`;
  const categoryLabel = exp.category
    ? (typeof exp.category === 'string' ? exp.category.charAt(0).toUpperCase() + exp.category.slice(1).replace(/_/g, ' ') : '')
    : '';

  const formatDuration = (minutes: number): string => {
    if (!minutes) return 'Flexible';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // ─── Quick info items ───
  const quickInfo: { icon: any; label: string; value: string }[] = [];
  if (durationMinutes > 0) {
    quickInfo.push({ icon: Clock, label: 'Duration', value: formatDuration(durationMinutes) });
  }
  if (languagesList.length > 0) {
    quickInfo.push({ icon: LanguageSquare, label: 'Languages', value: languagesList.slice(0, 3).join(', ') });
  }
  if (maxParticipants > 0) {
    quickInfo.push({ icon: People, label: 'Group Size', value: `Up to ${maxParticipants}` });
  }
  if (locationName) {
    quickInfo.push({ icon: Location, label: 'Location', value: locationName });
  }

  const handleBookNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const expName = exp.name || exp.title || 'Experience';
    const locName = locationName;
    await redirect({
      deal_type: 'experience',
      provider: 'viator',
      affiliate_url: exp.bookingUrl || exp.deepLink || '',
      deep_link: exp.bookingUrl || exp.deepLink || '',
      deal_snapshot: {
        title: expName,
        subtitle: locName,
        provider: { code: 'viator', name: 'Viator' },
        price: { amount: priceAmount, currency: 'USD', formatted: priceFormatted },
        experience: {
          name: expName,
          duration: formatDuration(durationMinutes),
          rating: ratingValue,
          reviewCount: reviewCountValue,
          date: '',
          participants: 1,
        },
      },
      price_amount: priceAmount,
      source: 'search',
      query: expName,
      destination: locName,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: tc.background }]}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Photo ─── */}
            <View style={[styles.photoContainer, { width: SCREEN_WIDTH }]}>
              {images.length > 0 ? (
                <Image source={{ uri: images[0] }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={[styles.photo, { backgroundColor: `${tc.primary}15`, justifyContent: 'center', alignItems: 'center' }]}>
                  <Star1 size={56} color={tc.primary} variant="Bold" />
                </View>
              )}
              <View style={styles.photoOverlay} pointerEvents="none" />

              {/* Close button over photo */}
              <View style={[styles.heroNav, { top: 16 }]}>
                <View />
                <TouchableOpacity onPress={onClose} style={styles.navBtn}>
                  <Add size={22} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ─── Content ─── */}
            <View style={[styles.content, { backgroundColor: tc.background }]}>
              {/* Badges */}
              <View style={styles.badgeRow}>
                {categoryLabel ? (
                  <View style={[styles.badge, { backgroundColor: `${tc.primary}15` }]}>
                    <Text style={[styles.badgeTxt, { color: tc.primary }]}>{categoryLabel.toUpperCase()}</Text>
                  </View>
                ) : null}
                {isFreeCancellation ? (
                  <View style={[styles.badge, { backgroundColor: `${tc.success}15` }]}>
                    <Text style={[styles.badgeTxt, { color: tc.success }]}>FREE CANCELLATION</Text>
                  </View>
                ) : null}
                {exp.instantConfirmation ? (
                  <View style={[styles.badge, { backgroundColor: `${tc.warning}15` }]}>
                    <Text style={[styles.badgeTxt, { color: tc.warning }]}>INSTANT CONFIRMATION</Text>
                  </View>
                ) : null}
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: tc.textPrimary }]}>{experience.title}</Text>

              {/* Rating bar */}
              {ratingValue > 0 ? (
                <View style={styles.ratingBar}>
                  <Star1 size={16} color={tc.warning} variant="Bold" />
                  <Text style={[styles.ratingText, { color: tc.textPrimary }]}>{ratingValue.toFixed(1)}</Text>
                  <Text style={[styles.ratingCount, { color: tc.textSecondary }]}>
                    ({reviewCountValue.toLocaleString()} reviews)
                  </Text>
                </View>
              ) : null}

              {/* Price */}
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: tc.textPrimary }]}>${Math.round(priceAmount)}</Text>
                <Text style={[styles.priceLabel, { color: tc.textSecondary }]}>/ per person</Text>
              </View>

              {/* ─── Quick Info Bar ─── */}
              {quickInfo.length > 0 ? (
                <View style={[styles.infoBar, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
                  {quickInfo.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <View key={i} style={[styles.infoItem, i < quickInfo.length - 1 && { borderRightWidth: 1, borderRightColor: tc.borderSubtle }]}>
                        <Icon size={18} color={tc.primary} variant="Bold" />
                        <Text style={[styles.infoLabel, { color: tc.textSecondary }]}>{item.label}</Text>
                        <Text style={[styles.infoValue, { color: tc.textPrimary }]} numberOfLines={1}>
                          {item.value}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* ─── Overview (collapsible) ─── */}
              {description ? (
                <CollapsibleSection
                  title="Overview"
                  expanded={expandedSection === 'description'}
                  onToggle={() => toggleSection('description')}
                  colors={tc}
                >
                  <Text style={[styles.bodyText, { color: tc.textSecondary }]}>{description}</Text>
                </CollapsibleSection>
              ) : null}

              {/* ─── Highlights ─── */}
              {highlightsList.length > 0 ? (
                <CollapsibleSection
                  title="Highlights"
                  expanded={expandedSection === 'highlights'}
                  onToggle={() => toggleSection('highlights')}
                  colors={tc}
                >
                  {highlightsList.map((h: string, i: number) => (
                    <View key={i} style={styles.listItem}>
                      <TickCircle size={18} color={tc.primary} variant="Bold" />
                      <Text style={[styles.listText, { color: tc.textSecondary }]}>{h}</Text>
                    </View>
                  ))}
                </CollapsibleSection>
              ) : null}

              {/* ─── What's Included ─── */}
              {includesList.length > 0 ? (
                <CollapsibleSection
                  title="What's Included"
                  expanded={expandedSection === 'included'}
                  onToggle={() => toggleSection('included')}
                  colors={tc}
                >
                  {includesList.map((item: string, i: number) => (
                    <View key={i} style={styles.listItem}>
                      <TickCircle size={16} color={tc.success} variant="Bold" />
                      <Text style={[styles.listText, { color: tc.textSecondary }]}>{item}</Text>
                    </View>
                  ))}
                  {notIncludedList.length > 0 ? (
                    <>
                      <View style={[styles.miniDivider, { backgroundColor: tc.borderSubtle }]} />
                      <Text style={[styles.subHeading, { color: tc.textPrimary }]}>Not Included</Text>
                      {notIncludedList.map((item: string, i: number) => (
                        <View key={i} style={styles.listItem}>
                          <CloseCircle size={16} color={tc.error} variant="Bold" />
                          <Text style={[styles.listText, { color: tc.textSecondary }]}>{item}</Text>
                        </View>
                      ))}
                    </>
                  ) : null}
                </CollapsibleSection>
              ) : null}

              {/* ─── Cancellation Policy ─── */}
              <View style={[styles.policyCard, {
                backgroundColor: isFreeCancellation
                  ? `${tc.success}10`
                  : `${tc.textSecondary}08`,
                borderColor: isFreeCancellation
                  ? `${tc.success}30`
                  : tc.borderSubtle,
              }]}>
                <TickCircle size={20} color={isFreeCancellation ? tc.success : tc.textSecondary} variant="Bold" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.policyTitle, { color: tc.textPrimary }]}>Cancellation Policy</Text>
                  <Text style={[styles.policyBody, { color: isFreeCancellation ? tc.success : tc.textSecondary }]}>
                    {isFreeCancellation ? 'Free cancellation available' : cancellationLabel}
                  </Text>
                </View>
              </View>

              {/* ─── Partner Note ─── */}
              <View style={[styles.partnerNote, { backgroundColor: `${tc.primary}08` }]}>
                <ShieldTick size={16} color={tc.primary} variant="Bold" />
                <Text style={[styles.partnerText, { color: tc.textSecondary }]}>
                  Secure booking through our trusted partner. You'll be taken directly to the booking page.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* ─── Bottom CTA ─── */}
          <View style={[styles.bottomBar, {
            backgroundColor: tc.background,
            borderTopColor: tc.borderSubtle,
            paddingBottom: insets.bottom + 10,
          }]}>
            <View>
              <Text style={[styles.btmLabel, { color: tc.textSecondary }]}>From</Text>
              <Text style={[styles.btmPrice, { color: tc.textPrimary }]}>
                ${Math.round(priceAmount)}
                <Text style={{ fontSize: 14, fontWeight: '400' as any }}> /person</Text>
              </Text>
            </View>
            <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: tc.primary }]} onPress={handleBookNow} activeOpacity={0.85}>
              <Text style={styles.ctaTxt}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '95%',
    overflow: 'hidden',
  },
  scrollContent: {},

  // Photo
  photoContainer: { height: PHOTO_HEIGHT, position: 'relative' },
  photo: { width: '100%', height: PHOTO_HEIGHT },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  heroNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: { paddingHorizontal: spacing.lg, paddingTop: 18 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  badgeTxt: { fontSize: 9, fontWeight: '700' as any, letterSpacing: 0.7 },
  title: {
    fontSize: typography.fontSize.heading1,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 28,
    marginBottom: 8,
  },
  ratingBar: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  ratingText: { fontSize: typography.fontSize.heading3, fontWeight: typography.fontWeight.bold },
  ratingCount: { fontSize: typography.fontSize.body },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  priceLabel: { fontSize: typography.fontSize.body },
  price: { fontSize: 36, fontWeight: typography.fontWeight.bold },

  // Quick info bar
  infoBar: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    marginTop: 8,
  },
  infoItem: { flex: 1, alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: typography.fontSize.captionSm, textAlign: 'center' },
  infoValue: { fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.semibold, textAlign: 'center' },

  // Collapsible sections
  section: { borderBottomWidth: 1, paddingVertical: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  sectionBody: { marginTop: 12 },
  bodyText: { fontSize: typography.fontSize.bodyLg, lineHeight: 22 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  listText: { fontSize: typography.fontSize.bodyLg, lineHeight: 20, flex: 1 },
  miniDivider: { height: 1, marginVertical: 12 },
  subHeading: { fontSize: typography.fontSize.bodyLg, fontWeight: typography.fontWeight.semibold, marginBottom: 10 },

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
  policyTitle: { fontSize: typography.fontSize.bodyLg, fontWeight: typography.fontWeight.semibold, marginBottom: 2 },
  policyBody: { fontSize: typography.fontSize.body, lineHeight: 19 },

  // Partner note
  partnerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  partnerText: { fontSize: typography.fontSize.bodySm, lineHeight: 17, flex: 1 },

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
  btmLabel: { fontSize: typography.fontSize.bodySm },
  btmPrice: { fontSize: 26, fontWeight: typography.fontWeight.bold },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  ctaTxt: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
});
