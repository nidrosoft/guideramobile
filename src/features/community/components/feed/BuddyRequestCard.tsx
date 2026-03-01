/**
 * BUDDY REQUEST CARD
 * 
 * Structured display for buddy_request post type.
 * Shows destination, dates, group size, vibe, and interest button.
 */

import React, { memo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import {
  Location,
  Calendar,
  People,
  MusicFilter,
  Wallet2,
  LanguageSquare,
  ProfileAdd,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';
import { BuddyRequestDetails } from '../../types/feed.types';

interface BuddyRequestCardProps {
  details: BuddyRequestDetails;
}

function BuddyRequestCard({ details }: BuddyRequestCardProps) {
  const { colors: tc } = useTheme();
  const [isInterested, setIsInterested] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleInterested = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setIsInterested(!isInterested);
  };

  const rows = [
    {
      icon: Location,
      label: details.destination,
    },
    {
      icon: Calendar,
      label: `${formatDate(details.startDate)} - ${formatDate(details.endDate)}`,
    },
    {
      icon: People,
      label: `Looking for ${details.groupSizeMin}-${details.groupSizeMax} ${details.groupSizeMax === 1 ? 'person' : 'people'}`,
    },
    {
      icon: Wallet2,
      label: details.budgetRange,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
      {/* Detail rows */}
      {rows.map((row, index) => {
        const Icon = row.icon;
        return (
          <View key={index} style={styles.detailRow}>
            <Icon size={15} color="#EC4899" variant="Bold" />
            <Text style={[styles.detailText, { color: tc.textPrimary }]}>{row.label}</Text>
          </View>
        );
      })}

      {/* Vibe tags */}
      {details.vibeTags.length > 0 && (
        <View style={styles.vibeRow}>
          <MusicFilter size={15} color="#EC4899" variant="Bold" />
          <View style={styles.vibeTags}>
            {details.vibeTags.map((tag) => (
              <View key={tag} style={[styles.vibeTag, { backgroundColor: '#EC4899' + '15' }]}>
                <Text style={[styles.vibeTagText, { color: '#EC4899' }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Languages */}
      {details.languages.length > 0 && (
        <View style={styles.detailRow}>
          <LanguageSquare size={15} color="#EC4899" variant="Bold" />
          <Text style={[styles.detailText, { color: tc.textSecondary }]}>
            {details.languages.join(', ')}
          </Text>
        </View>
      )}

      {/* Interest button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.interestButton,
            isInterested
              ? { backgroundColor: '#EC4899' + '20', borderColor: '#EC4899' }
              : { backgroundColor: '#EC4899', borderColor: '#EC4899' },
          ]}
          onPress={handleInterested}
          activeOpacity={0.8}
        >
          <ProfileAdd
            size={16}
            color={isInterested ? '#EC4899' : '#FFFFFF'}
            variant={isInterested ? 'Bold' : 'Linear'}
          />
          <Text
            style={[
              styles.interestText,
              { color: isInterested ? '#EC4899' : '#FFFFFF' },
            ]}
          >
            {isInterested ? 'Interested' : "I'm Interested"}
            {details.interestedCount > 0 && ` (${details.interestedCount + (isInterested ? 1 : 0)})`}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default memo(BuddyRequestCard);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.bodySm,
    flex: 1,
  },
  vibeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  vibeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  vibeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  vibeTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    marginTop: spacing.xs,
  },
  interestText: {
    ...typography.bodySm,
    fontWeight: '600',
  },
});
