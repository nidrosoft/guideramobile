import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { colors, typography, spacing, borderRadius } from '@/styles';

interface TripReminderProps {
  destination: string;
  tripDate: Date;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function TripReminder({ destination, tripDate }: TripReminderProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <View style={styles.line} />
        <Text style={styles.text}>
          Your trip to <Text style={styles.destination}>{destination}</Text> is in
        </Text>
        <View style={styles.line} />
      </View>

      <View style={styles.timerContainer}>
        <View style={styles.timeBox}>
          <Text style={styles.timeNumber}>{String(timeRemaining.days).padStart(2, '0')}</Text>
          <Text style={styles.timeLabel}>DAYS</Text>
        </View>

        <View style={styles.timeBox}>
          <Text style={styles.timeNumber}>{String(timeRemaining.hours).padStart(2, '0')}</Text>
          <Text style={styles.timeLabel}>HOURS</Text>
        </View>

        <View style={styles.timeBox}>
          <Text style={styles.timeNumber}>{String(timeRemaining.minutes).padStart(2, '0')}</Text>
          <Text style={styles.timeLabel}>MINUTES</Text>
        </View>

        <View style={styles.timeBox}>
          <Text style={styles.timeNumber}>{String(timeRemaining.seconds).padStart(2, '0')}</Text>
          <Text style={styles.timeLabel}>SECONDS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
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
    backgroundColor: colors.gray200,
  },
  text: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  destination: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  timeNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  timeLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.3,
  },
});
