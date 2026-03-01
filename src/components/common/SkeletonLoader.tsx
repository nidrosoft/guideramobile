/**
 * SkeletonLoader Component
 * 
 * Animated skeleton loading placeholders for consistent loading states.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/utils/accessibility';

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ 
  width = '100%', 
  height = 16, 
  borderRadius = 8,
  style 
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue, reduceMotion]);

  const opacity = reduceMotion 
    ? 0.5 
    : animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
      });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton layouts
export function SkeletonText({ lines = 3, lastLineWidth = '60%' as `${number}%` }: { lines?: number; lastLineWidth?: `${number}%` }) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={14}
          style={index < lines - 1 ? styles.textLine : undefined}
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={160} borderRadius={12} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={18} style={styles.cardTitle} />
        <Skeleton width="50%" height={14} style={styles.cardSubtitle} />
        <View style={styles.cardFooter}>
          <Skeleton width={80} height={24} borderRadius={6} />
          <Skeleton width={60} height={14} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={16} style={styles.listItemTitle} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonFlightCard() {
  return (
    <View style={styles.flightCard}>
      <View style={styles.flightHeader}>
        <Skeleton width={40} height={40} borderRadius={8} />
        <View style={styles.flightHeaderText}>
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={70} height={20} />
      </View>
      <View style={styles.flightRoute}>
        <View style={styles.flightTime}>
          <Skeleton width={50} height={20} />
          <Skeleton width={30} height={12} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={80} height={2} />
        <View style={styles.flightTime}>
          <Skeleton width={50} height={20} />
          <Skeleton width={30} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonHotelCard() {
  return (
    <View style={styles.hotelCard}>
      <Skeleton width={120} height={100} borderRadius={12} />
      <View style={styles.hotelContent}>
        <Skeleton width="80%" height={16} />
        <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
        <View style={styles.hotelFooter}>
          <Skeleton width={60} height={14} />
          <Skeleton width={80} height={18} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray200,
  },
  textContainer: {
    gap: 8,
  },
  textLine: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardSubtitle: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    marginBottom: 6,
  },
  flightCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  flightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flightHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flightTime: {
    alignItems: 'center',
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  hotelContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});

export default Skeleton;
