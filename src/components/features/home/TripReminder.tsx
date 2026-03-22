import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Airplane } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { departureAdvisorService } from '@/services/departure/departure.service';
import DepartureAdvisorSheet from '@/features/trips/components/DepartureAdvisor/DepartureAdvisorSheet';
import { useToast } from '@/contexts/ToastContext';

interface TripReminderProps {
  destination: string;
  tripDate: Date;
  flightNumber?: string;
  departureAirport?: string;
  isInternational?: boolean;
  tripId?: string;
  bookingId?: string;
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
  flightNumber,
  departureAirport,
  isInternational = false,
  tripId,
  bookingId,
}: TripReminderProps) {
  const { colors } = useTheme();
  const { showSuccess } = useToast();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showAdvisor, setShowAdvisor] = useState(false);

  const isDepartureDay = departureAdvisorService.isDepartureDay(tripDate);
  const hasFlightData = !!flightNumber && !!departureAirport;

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
});
