import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Airplane, Location, ArrowRight2 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { departureAdvisorService } from '@/services/departure/departure.service';
import { plannerService } from '@/services/planner.service';
import DepartureAdvisorSheet from '@/features/trips/components/DepartureAdvisor/DepartureAdvisorSheet';
import { useToast } from '@/contexts/ToastContext';

// Format a "HH:MM" time string to a 12-hour clock label (e.g. "2:00 PM").
function formatClock(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h)) return '';
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m || 0).padStart(2, '0')} ${period}`;
}

const midnight = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

interface TripReminderProps {
  destination: string;
  tripDate: Date;
  endDate?: Date;
  isOngoing?: boolean;
  flightNumber?: string;
  departureAirport?: string;
  isInternational?: boolean;
  tripId?: string;
  bookingId?: string;
  seatNumber?: string;
  cabinClass?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function TripReminder({
  destination,
  tripDate,
  endDate,
  isOngoing = false,
  flightNumber,
  departureAirport,
  isInternational = false,
  tripId,
  bookingId,
  seatNumber,
  cabinClass,
}: TripReminderProps) {
  const { colors } = useTheme();
  const { showSuccess } = useToast();
  const router = useRouter();
  const [nextActivity, setNextActivity] = useState<{ title: string; time: string; sub: string } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showAdvisor, setShowAdvisor] = useState(false);

  const isDepartureDay = departureAdvisorService.isDepartureDay(tripDate);
  const hasFlightData = !!flightNumber && !!departureAirport;

  // Live mode: load today's next upcoming activity from the itinerary.
  useEffect(() => {
    if (!isOngoing || !tripId) return;
    let cancelled = false;
    plannerService.getDays(tripId).then((days) => {
      if (cancelled) return;
      if (!days || days.length === 0) { setNextActivity(null); return; }
      const todayStr = new Date().toLocaleDateString('en-CA');
      const day = days.find((d) => d.date === todayStr) || days.find((d) => (d.date || '') >= todayStr) || days[0];
      const acts = day?.activities || [];
      if (!day || acts.length === 0) { setNextActivity(null); return; }
      const isToday = day.date === todayStr;
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const upcoming = isToday
        ? acts.find((a) => { const [h, m] = (a.startTime || '').split(':').map(Number); return Number.isFinite(h) && (h * 60 + m) > nowMin; })
        : null;
      const next = upcoming || acts[0];
      const time = formatClock(next.startTime);
      let sub = '';
      if (isToday && next.startTime) {
        const [h, m] = next.startTime.split(':').map(Number);
        const diff = (h * 60 + m) - nowMin;
        if (diff > 0) { const hh = Math.floor(diff / 60); const mm = diff % 60; sub = hh > 0 ? `in ${hh}h ${mm}m` : `in ${mm} min`; }
      }
      setNextActivity({ title: next.title, time, sub });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isOngoing, tripId]);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const target = tripDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [tripDate]);

  const handlePress = () => {
    setShowAdvisor(true);
  };

  // ── Live mode: trip is currently happening ──
  if (isOngoing && endDate) {
    const totalDays = Math.max(1, Math.round((midnight(endDate) - midnight(tripDate)) / 86400000) + 1);
    const dayNumber = Math.min(totalDays, Math.max(1, Math.round((midnight(new Date()) - midnight(tripDate)) / 86400000) + 1));
    const pct = Math.round((dayNumber / totalDays) * 100);
    const daysLeft = Math.max(0, totalDays - dayNumber);
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
        activeOpacity={0.85}
        onPress={() => tripId && router.push(`/planner/${tripId}` as any)}
      >
        <View style={styles.liveHeaderRow}>
          <View style={styles.liveTitleWrap}>
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.liveTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              You're in <Text style={[styles.destination, { color: colors.primary }]}>{destination}</Text>
            </Text>
          </View>
          <View style={[styles.liveBadge, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.liveBadgeText, { color: colors.primary }]}>Day {dayNumber} of {totalDays}</Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.bgElevated }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${pct}%` }]} />
        </View>
        <View style={styles.progressMetaRow}>
          <Text style={[styles.progressMeta, { color: colors.textSecondary }]}>{pct}% complete</Text>
          <Text style={[styles.progressMeta, { color: colors.textSecondary }]}>{daysLeft === 0 ? 'Last day' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}</Text>
        </View>

        <View style={[styles.liveNextRow, { borderTopColor: colors.borderSubtle }]}>
          <Location size={18} color={colors.primary} variant="Bold" />
          <View style={{ flex: 1 }}>
            {nextActivity ? (
              <>
                <Text style={[styles.liveNextTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  Up next · {nextActivity.title}{nextActivity.time ? ` · ${nextActivity.time}` : ''}
                </Text>
                <Text style={[styles.liveNextSub, { color: colors.textTertiary }]} numberOfLines={1}>
                  {nextActivity.sub || "Tap to view today's plan"}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.liveNextTitle, { color: colors.textPrimary }]} numberOfLines={1}>View today's plan</Text>
                <Text style={[styles.liveNextSub, { color: colors.textTertiary }]} numberOfLines={1}>Build your day-by-day itinerary</Text>
              </>
            )}
          </View>
          <ArrowRight2 size={18} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <View style={styles.textContainer}>
          <View style={[styles.line, { backgroundColor: colors.borderSubtle }]} />
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Your trip to <Text style={[styles.destination, { color: colors.primary }]}>{destination}</Text> is in
          </Text>
          <View style={[styles.line, { backgroundColor: colors.borderSubtle }]} />
        </View>

        <View style={styles.timerContainer}>
          <View style={[styles.timeBox, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.timeNumber, { color: colors.primary }]}>{String(timeRemaining.days).padStart(2, '0')}</Text>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>DAYS</Text>
          </View>

          <View style={[styles.timeBox, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.timeNumber, { color: colors.primary }]}>{String(timeRemaining.hours).padStart(2, '0')}</Text>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>HOURS</Text>
          </View>

          <View style={[styles.timeBox, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.timeNumber, { color: colors.primary }]}>{String(timeRemaining.minutes).padStart(2, '0')}</Text>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>MINUTES</Text>
          </View>

          <View style={[styles.timeBox, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.timeNumber, { color: colors.primary }]}>{String(timeRemaining.seconds).padStart(2, '0')}</Text>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>SECONDS</Text>
          </View>
        </View>

        {/* Departure Day CTA */}
        {isDepartureDay && hasFlightData && (
          <View style={[styles.departureCtaRow, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}25` }]}>
            <Airplane size={18} color={colors.primary} variant="Bold" />
            <Text style={[styles.departureCtaText, { color: colors.primary }]}>View Departure Plan</Text>
          </View>
        )}

        {/* Not departure day hint */}
        {!isDepartureDay && (
          <Text style={[styles.hintText, { color: colors.textTertiary }]}>
            Tap for departure advisor on travel day
          </Text>
        )}
      </TouchableOpacity>

      {/* Departure Advisor Sheet */}
      {hasFlightData && (
        <DepartureAdvisorSheet
          visible={showAdvisor}
          onClose={() => setShowAdvisor(false)}
          flightNumber={flightNumber!}
          departureAirport={departureAirport!}
          departureTime={tripDate.toISOString()}
          destination={destination}
          isInternational={isInternational}
          tripId={tripId}
          bookingId={bookingId}
          seatNumber={seatNumber}
          cabinClass={cabinClass}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  destination: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
  },
  timeNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.3,
  },
  departureCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  departureCtaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  liveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  liveTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flexShrink: 1,
  },
  liveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  liveBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressMeta: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  liveNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  liveNextTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  liveNextSub: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
});
