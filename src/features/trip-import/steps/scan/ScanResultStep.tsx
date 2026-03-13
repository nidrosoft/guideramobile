/**
 * SCAN RESULT STEP
 * 
 * Step 4 in scan import flow - Display OCR-extracted booking details.
 * Two accordion sections: Core Details (open) + More Details (collapsed).
 * CTA button always visible without scrolling.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { TickCircle, Airplane, Calendar, Clock, Building, Car, Bus, Warning2, Location, Lovely, ArrowSwapHorizontal, Timer1, Crown, ArrowDown2, ArrowUp2 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { StepComponentProps } from '../../types/import-flow.types';
import { tripImportEngine } from '@/services/trip/trip-import-engine.service';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_ICONS: Record<string, any> = {
  flight: Airplane, hotel: Building, car: Car, train: Bus,
};

function DetailRow({ icon: IconCmp, iconColor, label, value, tc }: { icon: any; iconColor: string; label: string; value: string; tc: any }) {
  return (
    <View style={s.row}>
      <IconCmp size={18} color={iconColor} variant="Bold" />
      <View style={s.rowContent}>
        <Text style={[s.rowLabel, { color: tc.textTertiary }]}>{label}</Text>
        <Text style={[s.rowValue, { color: tc.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function ScanResultStep({ onNext, data }: StepComponentProps) {
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const booking = data.scannedBooking;

  if (!booking || data.scanError) {
    return (
      <View style={s.container}>
        <View style={s.errorContainer}>
          <Warning2 size={48} color={tc.error} variant="Bold" />
          <Text style={[s.title, { color: tc.textPrimary }]}>Scan Failed</Text>
          <Text style={[s.desc, { color: tc.textSecondary }]}>
            {data.scanError || 'Could not extract booking information. Try again with a clearer image.'}
          </Text>
          <TouchableOpacity style={[s.ctaBtn, { backgroundColor: tc.primary }]} onPress={() => onNext()}>
            <Text style={[s.ctaText, { color: '#FFF' }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const Icon = CATEGORY_ICONS[booking.category] || Airplane;

  const handleConfirm = async () => {
    if (!profile?.id) return;
    setIsImporting(true);
    try {
      const result = await tripImportEngine.importScannedBooking(booking, profile.id);
      onNext({ importResult: result });
    } catch (error: any) {
      onNext({ importResult: { tripId: null, error: error.message } });
    } finally {
      setIsImporting(false);
    }
  };

  const fmtDate = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };
  const fmtTime = (d?: string) => {
    if (!d || !d.includes('T')) return null;
    try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return null; }
  };
  const calcDays = () => {
    if (booking.tripDurationDays) return `${booking.tripDurationDays} days`;
    const s = booking.startDate, e = booking.returnDate || booking.endDate;
    if (!s || !e) return null;
    try { const d = Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000); return d > 0 ? `${d} days` : null; }
    catch { return null; }
  };

  const route = (booking.startLocation?.name || booking.startLocation?.code || '?') + ' → ' + (booking.endLocation?.name || booking.endLocation?.code || '?');
  const returnDateStr = fmtDate(booking.returnDate || booking.endDate);
  const hasReturn = returnDateStr && booking.startDate !== (booking.returnDate || booking.endDate);
  const duration = calcDays();
  const depTime = fmtTime(booking.startDate);

  const toggleMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMoreOpen(!moreOpen);
  };

  // Count how many "more" items exist
  const moreItems = [
    booking.details?.flightNumber,
    depTime,
    booking.details?.seatNumber,
    booking.details?.cabin,
    booking.confirmationNumber,
    booking.pricing?.total,
  ].filter(Boolean).length;

  return (
    <View style={s.container}>
      {/* Success Header — compact */}
      <View style={s.header}>
        <TickCircle size={36} color="#22C55E" variant="Bold" />
        <View style={s.headerText}>
          <Text style={[s.title, { color: tc.textPrimary }]}>Booking Details Found!</Text>
          {booking.confidence && (
            <Text style={{ fontSize: 12, fontWeight: '600', color: booking.confidence > 0.7 ? '#22C55E' : '#F59E0B' }}>
              {Math.round(booking.confidence * 100)}% confidence
            </Text>
          )}
        </View>
      </View>

      {/* Section 1: Core Details (always open) */}
      <View style={[s.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: tc.textPrimary }]}>Trip Overview</Text>
        </View>

        {/* Flight title */}
        <DetailRow icon={Icon} iconColor={tc.primary} label="Flight" value={booking.title} tc={tc} />

        {/* Route */}
        {(booking.startLocation?.name || booking.endLocation?.name) && (
          <DetailRow icon={Location} iconColor={tc.primary} label="Route" value={route} tc={tc} />
        )}

        {/* Departure */}
        <DetailRow icon={Calendar} iconColor={tc.primary} label="Departure" value={fmtDate(booking.startDate) || 'Not detected'} tc={tc} />

        {/* Return */}
        {hasReturn && (
          <DetailRow icon={ArrowSwapHorizontal} iconColor={tc.primary} label="Return" value={returnDateStr!} tc={tc} />
        )}

        {/* Duration */}
        {duration && (
          <DetailRow icon={Timer1} iconColor={tc.primary} label="Duration" value={duration} tc={tc} />
        )}
      </View>

      {/* Section 2: More Details (accordion) */}
      {moreItems > 0 && (
        <View style={[s.section, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <TouchableOpacity style={s.sectionHeader} onPress={toggleMore} activeOpacity={0.7}>
            <Text style={[s.sectionTitle, { color: tc.textPrimary }]}>Flight Details</Text>
            <View style={s.expandRow}>
              <Text style={[s.expandHint, { color: tc.textTertiary }]}>{moreItems} items</Text>
              {moreOpen
                ? <ArrowUp2 size={16} color={tc.textTertiary} />
                : <ArrowDown2 size={16} color={tc.textTertiary} />
              }
            </View>
          </TouchableOpacity>

          {moreOpen && (
            <View>
              {booking.details?.flightNumber && (
                <DetailRow icon={Airplane} iconColor={tc.primary} label="Flight Number" value={booking.details.flightNumber} tc={tc} />
              )}
              {depTime && (
                <DetailRow icon={Clock} iconColor={tc.primary} label="Departure Time" value={depTime} tc={tc} />
              )}
              {booking.details?.seatNumber && (
                <DetailRow icon={Lovely} iconColor={tc.primary} label="Seat" value={booking.details.seatNumber} tc={tc} />
              )}
              {booking.details?.cabin && (
                <View style={s.row}>
                  <Crown size={18} color={tc.primary} variant="Bold" />
                  <View style={s.rowContent}>
                    <Text style={[s.rowLabel, { color: tc.textTertiary }]}>Class</Text>
                    <View style={[s.classBadge, { backgroundColor: `${tc.primary}12` }]}>
                      <Text style={[s.classBadgeText, { color: tc.primary }]}>{booking.details.cabin}</Text>
                    </View>
                  </View>
                </View>
              )}
              {booking.confirmationNumber && (
                <DetailRow icon={Airplane} iconColor={tc.textTertiary} label="Booking Ref" value={booking.confirmationNumber} tc={tc} />
              )}
              {booking.pricing?.total && (
                <DetailRow icon={Airplane} iconColor={tc.textTertiary} label="Price" value={`${booking.pricing.currency || '$'}${booking.pricing.total}`} tc={tc} />
              )}
            </View>
          )}
        </View>
      )}

      {/* CTA — always visible */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: tc.primary }, isImporting && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={isImporting}
        >
          {isImporting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[s.ctaText, { color: '#FFF' }]}>Confirm & Add to Trip</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  desc: { fontSize: typography.fontSize.sm, textAlign: 'center', lineHeight: 20 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  // Sections
  section: { borderRadius: 16, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expandHint: { fontSize: 11 },
  // Detail rows
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, marginBottom: 1 },
  rowValue: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  classBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 20, marginTop: 1 },
  classBadgeText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  // Footer
  footer: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  ctaBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: typography.fontSize.base, fontWeight: '700' },
});
