/**
 * EVENT CARD
 * 
 * Displays an event preview in horizontal or list format.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Calendar, Location, People, Video } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { EventPreview } from '../types/event.types';

interface EventCardProps {
  event: EventPreview;
  variant?: 'horizontal' | 'list';
  onPress: () => void;
}

export default function EventCard({ event, variant = 'horizontal', onPress }: EventCardProps) {
  const { colors: tc } = useTheme();
  const isHorizontal = variant === 'horizontal';
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };
  
  const getRSVPColor = () => {
    switch (event.myRSVP) {
      case 'going': return colors.success;
      case 'maybe': return colors.warning;
      default: return colors.borderSubtle;
    }
  };
  
  if (!isHorizontal) {
    // List variant - full-width card with side image
    return (
      <TouchableOpacity
        style={[styles.listContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Left Image */}
        {event.coverImage && (
          <View style={styles.listImageWrapper}>
            <Image source={{ uri: event.coverImage }} style={styles.listImage} />
            {event.location.isVirtual && (
              <View style={styles.listVirtualBadge}>
                <Video size={10} color={colors.white} variant="Bold" />
              </View>
            )}
          </View>
        )}
        {/* Right Content */}
        <View style={styles.listContent}>
          <View style={[styles.typeBadge, { backgroundColor: tc.primary + '15' }]}>
            <Text style={[styles.typeBadgeText, { color: tc.primary }]}>{event.type.replace('_', ' ')}</Text>
          </View>
          <Text style={[styles.listTitle, { color: tc.textPrimary }]} numberOfLines={2}>{event.title}</Text>
          <View style={styles.infoRow}>
            <Calendar size={13} color={tc.primary} />
            <Text style={[styles.infoText, { color: tc.textSecondary }]}>{formatDate(event.startDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Location size={13} color={tc.textSecondary} />
            <Text style={[styles.infoText, { color: tc.textSecondary }]}>
              {event.location.isVirtual ? 'Online' : `${event.location.city}, ${event.location.country}`}
            </Text>
          </View>
          <View style={styles.listFooter}>
            <View style={styles.attendees}>
              <People size={13} color={tc.textSecondary} />
              <Text style={[styles.attendeeText, { color: tc.textSecondary }]}>{event.attendeeCount}</Text>
            </View>
            {event.myRSVP !== 'none' && (
              <View style={[styles.rsvpBadge, { backgroundColor: getRSVPColor() + '20' }]}>
                <Text style={[styles.rsvpText, { color: getRSVPColor() }]}>
                  {event.myRSVP === 'going' ? 'Going' : 'Maybe'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Cover Image */}
      {event.coverImage && (
        <Image
          source={{ uri: event.coverImage }}
          style={styles.coverImage}
        />
      )}
      
      {/* Virtual Badge */}
      {event.location.isVirtual && (
        <View style={styles.virtualBadge}>
          <Video size={12} color={colors.white} variant="Bold" />
          <Text style={styles.virtualText}>Virtual</Text>
        </View>
      )}
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: tc.textPrimary }]} numberOfLines={2}>{event.title}</Text>
        
        <View style={styles.infoRow}>
          <Calendar size={14} color={tc.primary} />
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>{formatDate(event.startDate)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Location size={14} color={tc.textSecondary} />
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>
            {event.location.isVirtual ? 'Online' : `${event.location.city}, ${event.location.country}`}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.attendees}>
            <People size={14} color={tc.textSecondary} />
            <Text style={[styles.attendeeText, { color: tc.textSecondary }]}>{event.attendeeCount} attending</Text>
          </View>
          
          {event.myRSVP !== 'none' && (
            <View style={[styles.rsvpBadge, { backgroundColor: getRSVPColor() + '20' }]}>
              <Text style={[styles.rsvpText, { color: getRSVPColor() }]}>
                {event.myRSVP === 'going' ? 'Going' : 'Maybe'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  listImageWrapper: {
    position: 'relative',
  },
  listImage: {
    width: 110,
    height: 130,
  },
  listVirtualBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  horizontal: {
    width: 240,
  },
  coverImage: {
    width: '100%',
    height: 100,
  },
  virtualBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  virtualText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  content: {
    padding: spacing.md,
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeeText: {
    fontSize: typography.fontSize.xs,
    color: colors.borderSubtle,
  },
  rsvpBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  rsvpText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
});
