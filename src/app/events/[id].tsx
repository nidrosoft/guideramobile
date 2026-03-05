/**
 * EVENT DETAIL SCREEN
 *
 * Rich detail page for a discovered event, modeled after the local experiences
 * detail layout:
 * - Hero image with overlay navigation
 * - Category badge + date badge
 * - Event title, venue, date/time info
 * - Quick info bar (date, time, price, attendees)
 * - Collapsible sections: About, Highlights, Details
 * - Tags display
 * - Bottom sticky CTA → "Add to Calendar" + "Get Tickets"
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Calendar from 'expo-calendar';
import {
  ArrowLeft,
  ExportSquare,
  Clock,
  Calendar as CalendarIcon,
  Location,
  Ticket,
  People,
  TickCircle,
  ArrowDown2,
  ArrowUp2,
  Heart,
  Star1,
  InfoCircle,
  Link1,
  Magicpen,
  Warning2,
  Routing2,
} from 'iconsax-react-native';
import { Image } from 'expo-image';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { eventsService, DiscoveredEvent } from '@/services/events.service';
import { SkeletonDetailPage } from '@/components/common/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 380;
const PRIMARY = '#3FC39E';

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<DiscoveredEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('about');
  const [calendarAdded, setCalendarAdded] = useState(false);

  useEffect(() => {
    if (params.id) loadEvent();
  }, [params.id]);

  const loadEvent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('destination_events')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setEvent(data as DiscoveredEvent);
    } catch (err) {
      console.warn('Failed to load event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!event) return;
    try {
      await Share.share({
        title: `Check out this event on Guidera!`,
        message: `🎉 ${event.event_name}\n📍 ${event.venue || event.city}\n📅 ${eventsService.formatEventDate(event.date_start)}\n${event.is_free ? '🆓 Free!' : `💰 ${event.ticket_price || 'See details'}`}\n\nDiscover amazing events on Guidera!`,
      });
    } catch { /* cancelled */ }
  };

  const handleGetTickets = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = event?.ticket_url || event?.source_url;
    if (url) {
      try {
        await Linking.openURL(url);
      } catch { /* silently fail */ }
    } else {
      Alert.alert('Tickets', 'No ticket link available for this event. Try searching for the event name online.');
    }
  };

  const handleAddToCalendar = async () => {
    if (!event) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Request calendar permission
      const { status } = await Calendar.requestCalendarPermissionsAsync();

      if (status === 'granted') {
        // Get default calendar
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = Platform.OS === 'ios'
          ? calendars.find(c => c.source?.name === 'Default') || calendars.find(c => c.allowsModifications) || calendars[0]
          : calendars.find(c => c.isPrimary) || calendars.find(c => c.allowsModifications) || calendars[0];

        if (!defaultCalendar) {
          // Fallback to Google Calendar URL
          return handleGoogleCalendarFallback();
        }

        // Parse event date
        const startDate = event.date_start
          ? new Date(event.date_start + 'T00:00:00')
          : new Date();

        // Try to parse time_info for start time
        if (event.time_info) {
          const timeMatch = event.time_info.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const ampm = timeMatch[3]?.toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            startDate.setHours(hours, minutes, 0, 0);
          }
        }

        const endDate = event.date_end
          ? new Date(event.date_end + 'T23:59:00')
          : new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // Default 3 hours

        await Calendar.createEventAsync(defaultCalendar.id, {
          title: event.event_name,
          startDate,
          endDate,
          location: event.venue || `${event.city}, ${event.country}`,
          notes: `${event.description || ''}\n\nCategory: ${event.category}\n${event.ticket_price ? `Price: ${event.ticket_price}` : 'Free'}\n${event.source_url ? `\nMore info: ${event.source_url}` : ''}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          alarms: [{ relativeOffset: -60 }], // Reminder 1 hour before
        });

        setCalendarAdded(true);
        Alert.alert('Added to Calendar! 🎉', `"${event.event_name}" has been added to your calendar with a 1-hour reminder.`);
      } else {
        // Fallback to Google Calendar URL
        handleGoogleCalendarFallback();
      }
    } catch (err) {
      console.error('Calendar error:', err);
      handleGoogleCalendarFallback();
    }
  };

  const handleGoogleCalendarFallback = async () => {
    if (!event) return;
    try {
      const title = encodeURIComponent(event.event_name);
      const details = encodeURIComponent(event.description || '');
      const location = encodeURIComponent(event.venue || `${event.city}, ${event.country}`);

      const startDate = event.date_start
        ? new Date(event.date_start + 'T10:00:00')
        : new Date();
      const endDate = event.date_end
        ? new Date(event.date_end + 'T22:00:00')
        : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

      const start = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
      await Linking.openURL(calUrl);
      setCalendarAdded(true);
    } catch {
      Alert.alert('Calendar', 'Unable to add to calendar. Please add it manually.');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
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
  if (!event) {
    return (
      <View style={[styles.safe, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <TouchableOpacity onPress={handleBack} style={[styles.navBtn, { backgroundColor: colors.bgCard }]}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Warning2 size={48} color={colors.textSecondary} />
          <Text style={[styles.errorTxt, { color: colors.textSecondary }]}>Event not found</Text>
        </View>
      </View>
    );
  }

  // --- Parse data ---
  const imageUrl = event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';
  const highlights: string[] = event.highlights || [];
  const tags: string[] = event.tags || [];
  const dateRange = eventsService.formatDateRange(event.date_start, event.date_end);

  const quickInfo: { icon: any; label: string; value: string }[] = [
    { icon: CalendarIcon, label: 'Date', value: eventsService.formatEventDate(event.date_start) },
    { icon: Clock, label: 'Time', value: event.time_info || 'See details' },
    { icon: Ticket, label: 'Price', value: event.is_free ? 'Free' : (event.ticket_price || 'See details') },
  ];
  if (event.estimated_attendees) {
    quickInfo.push({ icon: People, label: 'Attendees', value: event.estimated_attendees });
  }

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style="light" translucent />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Hero Image ─── */}
        <View style={styles.photoContainer}>
          <Image source={imageUrl} style={styles.photo} contentFit="cover" />
          <View style={styles.photoOverlay} pointerEvents="none" />

          {/* Nav buttons */}
          <View style={[styles.heroNav, { top: insets.top + 8 }]}>
            <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
              <ArrowLeft size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.navRight}>
              <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
                <ExportSquare size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category + Date overlay badge */}
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{event.category}</Text>
            </View>
            {event.is_free && (
              <View style={[styles.heroBadge, { backgroundColor: 'rgba(5, 150, 105, 0.85)' }]}>
                <Text style={styles.heroBadgeText}>FREE</Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── Content ─── */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Date range */}
          <View style={styles.dateRow}>
            <CalendarIcon size={16} color={PRIMARY} variant="Bold" />
            <Text style={[styles.dateRangeText, { color: PRIMARY }]}>{dateRange}</Text>
            {event.is_recurring && event.recurrence_info && (
              <View style={[styles.recurringBadge, { backgroundColor: PRIMARY + '15' }]}>
                <Text style={[styles.recurringText, { color: PRIMARY }]}>{event.recurrence_info}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{event.event_name}</Text>

          {/* Venue & Location */}
          {event.venue && (
            <View style={styles.venueRow}>
              <Location size={16} color={colors.textSecondary} variant="Bold" />
              <Text style={[styles.venueText, { color: colors.textSecondary }]}>{event.venue}</Text>
            </View>
          )}
          <View style={styles.venueRow}>
            <Routing2 size={15} color={colors.textSecondary} />
            <Text style={[styles.cityText, { color: colors.textSecondary }]}>{event.city}, {event.country}</Text>
          </View>

          {/* Rating */}
          {event.rating && (
            <View style={styles.ratingBar}>
              <Star1 size={16} color="#F59E0B" variant="Bold" />
              <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{event.rating}</Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.textPrimary }]}>
              {event.is_free ? 'Free' : (event.ticket_price || 'See details')}
            </Text>
            {!event.is_free && event.ticket_price && (
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>/ per person</Text>
            )}
          </View>

          {/* ─── Quick Info Bar ─── */}
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

          {/* ─── About (collapsible) ─── */}
          {event.description && (
            <CollapsibleSection
              title="About This Event"
              expanded={expandedSection === 'about'}
              onToggle={() => toggleSection('about')}
              colors={colors}
            >
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{event.description}</Text>
            </CollapsibleSection>
          )}

          {/* ─── Highlights ─── */}
          {highlights.length > 0 && (
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
          )}

          {/* ─── Event Details ─── */}
          <CollapsibleSection
            title="Event Details"
            expanded={expandedSection === 'details'}
            onToggle={() => toggleSection('details')}
            colors={colors}
          >
            <View style={styles.detailGrid}>
              {event.time_info && (
                <DetailRow icon={Clock} label="Time" value={event.time_info} colors={colors} />
              )}
              {event.venue && (
                <DetailRow icon={Location} label="Venue" value={event.venue} colors={colors} />
              )}
              {event.ticket_price && (
                <DetailRow icon={Ticket} label="Tickets" value={event.ticket_price} colors={colors} />
              )}
              {event.estimated_attendees && (
                <DetailRow icon={People} label="Expected" value={`${event.estimated_attendees} attendees`} colors={colors} />
              )}
              {event.is_recurring && event.recurrence_info && (
                <DetailRow icon={CalendarIcon} label="Schedule" value={event.recurrence_info} colors={colors} />
              )}
            </View>
          </CollapsibleSection>

          {/* ─── Tags ─── */}
          {tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={[styles.tagsSectionTitle, { color: colors.textPrimary }]}>Tags</Text>
              <View style={styles.tagsRow}>
                {tags.map((tag, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: isDark ? colors.bgCard : '#F1F5F9' }]}>
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ─── Source link ─── */}
          {event.source_url && (
            <TouchableOpacity
              style={[styles.sourceCard, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC' }]}
              onPress={() => Linking.openURL(event.source_url!)}
              activeOpacity={0.7}
            >
              <Link1 size={18} color={PRIMARY} />
              <Text style={[styles.sourceText, { color: colors.textSecondary }]} numberOfLines={1}>
                View original source
              </Text>
              <ExportSquare size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* ─── AI Discovery note ─── */}
          <View style={[styles.partnerNote, { backgroundColor: isDark ? colors.bgCard : '#F8FAFC' }]}>
            <Magicpen size={16} color={PRIMARY} />
            <Text style={[styles.partnerText, { color: colors.textSecondary }]}>
              This event was discovered by Guidera AI using real-time web search. Event details may change — please verify with the organizer.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom CTA ─── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: isDark ? '#1A1A1A' : colors.background,
            borderTopColor: colors.borderSubtle,
            paddingBottom: insets.bottom + 10,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.calendarBtn, calendarAdded && { backgroundColor: '#ECFDF5', borderColor: '#059669' }]}
          onPress={handleAddToCalendar}
          activeOpacity={0.85}
        >
          <CalendarIcon size={18} color={calendarAdded ? '#059669' : PRIMARY} variant="Bold" />
          <Text style={[styles.calendarBtnTxt, calendarAdded && { color: '#059669' }]}>
            {calendarAdded ? 'Added!' : 'Add to Calendar'}
          </Text>
        </TouchableOpacity>

        {(event.ticket_url || event.source_url) && (
          <TouchableOpacity style={styles.ctaBtn} onPress={handleGetTickets} activeOpacity={0.85}>
            <Text style={styles.ctaTxt}>{event.is_free ? 'Learn More' : 'Get Tickets'}</Text>
            <ExportSquare size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
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

// ─── Detail Row Component ───
function DetailRow({
  icon: Icon,
  label,
  value,
  colors,
}: {
  icon: any;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Icon size={16} color={PRIMARY} variant="Bold" />
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorTxt: { fontSize: 16, fontFamily: 'Rubik-Medium' },
  scrollContent: { paddingBottom: 120 },

  // Photo gallery
  photoContainer: { width: SCREEN_WIDTH, height: PHOTO_HEIGHT, position: 'relative' },
  photo: { width: SCREEN_WIDTH, height: PHOTO_HEIGHT },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
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
  heroBadgeRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  heroBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroBadgeText: { fontFamily: 'Rubik-Bold', fontSize: 11, color: '#FFF', letterSpacing: 0.5 },

  // Content
  content: { paddingHorizontal: spacing.lg, paddingTop: 18 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dateRangeText: { fontFamily: 'Rubik-SemiBold', fontSize: 14 },
  recurringBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 4 },
  recurringText: { fontFamily: 'Rubik-Medium', fontSize: 11 },
  title: { fontFamily: 'Rubik-Bold', fontSize: 24, lineHeight: 30, marginBottom: 10 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  venueText: { fontFamily: 'Rubik-Medium', fontSize: 14, flex: 1 },
  cityText: { fontFamily: 'Rubik-Regular', fontSize: 13 },
  ratingBar: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, marginBottom: 4 },
  ratingText: { fontFamily: 'Rubik-Bold', fontSize: 15 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8, marginBottom: 4 },
  price: { fontFamily: 'HostGrotesk-Bold', fontSize: 28 },
  priceLabel: { fontFamily: 'Rubik-Regular', fontSize: 13 },

  // Quick info bar
  infoBar: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    marginTop: 12,
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

  // Detail grid
  detailGrid: { gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontFamily: 'Rubik-Medium', fontSize: 13, width: 70 },
  detailValue: { fontFamily: 'Rubik-Regular', fontSize: 14, flex: 1 },

  // Tags
  tagsSection: { marginTop: 16 },
  tagsSectionTitle: { fontFamily: 'Rubik-Bold', fontSize: 16, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { fontFamily: 'Rubik-Medium', fontSize: 12 },

  // Source card
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  sourceText: { fontFamily: 'Rubik-Regular', fontSize: 13, flex: 1 },

  // AI note
  partnerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
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
    gap: 10,
  },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 24,
    flex: 1,
    justifyContent: 'center',
  },
  calendarBtnTxt: { fontFamily: 'Rubik-Bold', fontSize: 14, color: PRIMARY },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    flex: 1,
    justifyContent: 'center',
  },
  ctaTxt: { fontFamily: 'Rubik-Bold', fontSize: 14, color: '#FFFFFF' },
});
