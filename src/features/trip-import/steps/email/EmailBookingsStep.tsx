/**
 * EMAIL BOOKINGS STEP
 *
 * Step 3 in the email import flow. Shows the single booking parsed from the
 * forwarded email (data.emailImport.parsedBooking) and imports it into a trip
 * via emailImportService.importBooking.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { TickCircle, Airplane, Building, Car, Bus, Ship, DocumentText, Warning2, Calendar, Clock, Location, TicketStar, Lovely, Crown, Timer1, ArrowSwapHorizontal, ArrowDown2, ArrowUp2 } from 'iconsax-react-native';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { StepComponentProps } from '../../types/import-flow.types';
import { emailImportService } from '@/services/emailImport.service';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_ICONS: Record<string, any> = {
  flight: Airplane,
  hotel: Building,
  car: Car,
  train: Bus,
  cruise: Ship,
  experience: TicketStar,
  other: DocumentText,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', JPY: '\u00A5', AUD: 'A$', CAD: 'C$',
};

function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function formatTime(value?: string | null): string | null {
  if (!value || !value.includes('T')) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function DetailRow({ icon: IconCmp, iconColor, label, value, tc }: { icon: any; iconColor: string; label: string; value: string; tc: any }) {
  return (
    <View style={styles.row}>
      <IconCmp size={18} color={iconColor} variant="Bold" />
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: tc.textTertiary }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: tc.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function EmailBookingsStep({ onNext, onBack, data }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const emailImport = data.emailImport;
  const booking = emailImport?.parsedBooking;

  // Handle scan/processing errors
  if (data.scanStatus === 'failed' || data.scanError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Warning2 size={48} color={tc.warning} variant="Bold" />
          <Text style={[styles.title, { color: tc.textPrimary }]}>Couldn't Process Email</Text>
          <Text style={[styles.description, styles.centered, { color: tc.textSecondary }]}>
            {data.scanError || 'We had trouble reading your email. This can happen with some email formats. Please try forwarding the email again or use the scan option instead.'}
          </Text>
          <TouchableOpacity style={[styles.ctaBtn, styles.retryBtn, { backgroundColor: tc.primary }]} onPress={() => onBack()}>
            <Text style={[styles.ctaText, { color: '#FFF' }]} numberOfLines={1}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Handle no booking parsed
  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <DocumentText size={48} color={tc.textTertiary} variant="Bold" />
          <Text style={[styles.title, { color: tc.textPrimary }]}>No Bookings Detected</Text>
          <Text style={[styles.description, styles.centered, { color: tc.textSecondary }]}>
            We couldn't detect a travel booking in that email. Make sure you're forwarding a booking confirmation (not a marketing email or newsletter).{"\n\n"}You can also try scanning a ticket photo or entering details manually.
          </Text>
          <TouchableOpacity style={[styles.ctaBtn, styles.retryBtn, { backgroundColor: tc.primary }]} onPress={() => onBack()}>
            <Text style={[styles.ctaText, { color: '#FFF' }]} numberOfLines={1}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const Icon = CATEGORY_ICONS[booking.category] || DocumentText;
  const categoryLabel = booking.category === 'hotel' ? 'Hotel'
    : booking.category === 'car' ? 'Car Rental'
    : booking.category === 'experience' ? 'Experience'
    : booking.category === 'flight' ? 'Flight' : 'Booking';
  const provider = booking.provider || booking.details?.airline || booking.details?.hotelName || booking.details?.carCompany || '';
  const startName = booking.startLocation?.city || booking.startLocation?.name || booking.startLocation?.code;
  const endName = booking.endLocation?.city || booking.endLocation?.name || booking.endLocation?.code;
  const route = startName && endName ? `${startName} \u2192 ${endName}` : (booking.details?.route || '');
  const departureDate = formatDate(booking.startDate);
  const departureTime = formatTime(booking.startDate);
  const returnRaw = booking.returnDate || booking.endDate;
  const returnDate = formatDate(returnRaw);
  const hasReturn = !!returnDate && returnRaw !== booking.startDate && returnDate !== departureDate;
  const duration = (() => {
    if (booking.tripDurationDays) return `${booking.tripDurationDays} days`;
    const s = booking.startDate, e = returnRaw;
    if (!s || !e) return null;
    const d = Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000);
    return d > 0 ? `${d} days` : null;
  })();
  const price = booking.pricing?.total
    ? `${CURRENCY_SYMBOLS[booking.pricing.currency] || ''}${booking.pricing.total}${CURRENCY_SYMBOLS[booking.pricing.currency] ? '' : ` ${booking.pricing.currency || ''}`}`.trim()
    : null;

  const moreItems = [
    booking.details?.flightNumber,
    departureTime,
    booking.details?.seatNumber,
    booking.details?.gate,
    booking.details?.cabin,
    booking.confirmationNumber,
    price,
  ].filter(Boolean).length;

  const toggleMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMoreOpen(!moreOpen);
  };

  const handleImport = async () => {
    if (!profile?.id || !emailImport?.id) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const result = await emailImportService.importBooking(profile.id, emailImport.id);
      // Set importResult so the flow's onComplete navigates straight to the new
      // trip card, exactly like the scan flow does.
      onNext({ importedTrip: result, importResult: { tripId: result.tripId, title: result.title } });
    } catch (error: any) {
      if (__DEV__) console.warn('[EmailImport] Import error:', error);
      setImportError(error?.message || 'Something went wrong importing this booking. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Success header */}
      <View style={styles.header}>
        <TickCircle size={36} color="#22C55E" variant="Bold" />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: tc.textPrimary }]}>Booking Detected</Text>
          {!!booking.confidence && (
            <Text style={{ fontSize: 12, fontWeight: '600', color: booking.confidence > 0.7 ? '#22C55E' : '#F59E0B' }}>
              {Math.round(booking.confidence * 100)}% confidence
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Section 1: Trip Overview */}
        <View style={[styles.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Trip Overview</Text>
          </View>

          <DetailRow icon={Icon} iconColor={tc.primary} label={categoryLabel} value={booking.title || route || 'Booking'} tc={tc} />
          {!!provider && (
            <DetailRow icon={Building} iconColor={tc.primary} label="Provider" value={provider} tc={tc} />
          )}
          {!!route && (
            <DetailRow icon={Location} iconColor={tc.primary} label="Route" value={route} tc={tc} />
          )}
          <DetailRow icon={Calendar} iconColor={tc.primary} label="Departure" value={departureDate || 'Not detected'} tc={tc} />
          {hasReturn && (
            <DetailRow icon={ArrowSwapHorizontal} iconColor={tc.primary} label="Return" value={returnDate!} tc={tc} />
          )}
          {!!duration && (
            <DetailRow icon={Timer1} iconColor={tc.primary} label="Duration" value={duration} tc={tc} />
          )}
        </View>

        {/* Section 2: More Details (accordion) */}
        {moreItems > 0 && (
          <View style={[styles.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <TouchableOpacity style={styles.sectionHeader} onPress={toggleMore} activeOpacity={0.7}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>More Details</Text>
              <View style={styles.expandRow}>
                <Text style={[styles.expandHint, { color: tc.textTertiary }]}>{moreItems} items</Text>
                {moreOpen ? <ArrowUp2 size={16} color={tc.textTertiary} /> : <ArrowDown2 size={16} color={tc.textTertiary} />}
              </View>
            </TouchableOpacity>

            {moreOpen && (
              <View>
                {!!booking.details?.flightNumber && (
                  <DetailRow icon={Airplane} iconColor={tc.primary} label="Flight Number" value={booking.details.flightNumber} tc={tc} />
                )}
                {!!departureTime && (
                  <DetailRow icon={Clock} iconColor={tc.primary} label="Departure Time" value={departureTime} tc={tc} />
                )}
                {!!booking.details?.seatNumber && (
                  <DetailRow icon={Lovely} iconColor={tc.primary} label="Seat" value={booking.details.seatNumber} tc={tc} />
                )}
                {!!booking.details?.gate && (
                  <DetailRow icon={Location} iconColor={tc.primary} label="Gate" value={booking.details.gate} tc={tc} />
                )}
                {!!booking.details?.cabin && (
                  <View style={styles.row}>
                    <Crown size={18} color={tc.primary} variant="Bold" />
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowLabel, { color: tc.textTertiary }]}>Class</Text>
                      <View style={[styles.classBadge, { backgroundColor: `${tc.primary}12` }]}>
                        <Text style={[styles.classBadgeText, { color: tc.primary }]}>{booking.details.cabin}</Text>
                      </View>
                    </View>
                  </View>
                )}
                {!!booking.confirmationNumber && (
                  <DetailRow icon={TicketStar} iconColor={tc.textTertiary} label="Booking Ref" value={booking.confirmationNumber} tc={tc} />
                )}
                {!!price && (
                  <DetailRow icon={TicketStar} iconColor={tc.textTertiary} label="Price" value={price} tc={tc} />
                )}
              </View>
            )}
          </View>
        )}

        {!!importError && (
          <Text style={[styles.inlineError, { color: tc.error }]}>{importError}</Text>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: tc.primary }, isImporting && { opacity: 0.6 }]}
          onPress={handleImport}
          disabled={isImporting}
        >
          {isImporting ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.ctaText, { color: '#FFF' }]}>Add to My Trips</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  description: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  centered: { textAlign: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  scroll: { flex: 1 },
  section: { borderRadius: 16, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expandHint: { fontSize: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, marginBottom: 1 },
  rowValue: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  classBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 20, marginTop: 1 },
  classBadgeText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  inlineError: { fontSize: typography.fontSize.sm, textAlign: 'center', marginTop: spacing.sm },
  footer: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  ctaBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  retryBtn: { width: '100%', alignSelf: 'stretch', paddingHorizontal: spacing.lg },
  ctaText: { fontSize: typography.fontSize.base, fontWeight: '700' },
});
