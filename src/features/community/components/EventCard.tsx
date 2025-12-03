/**
 * EVENT CARD
 * 
 * Displays an event preview in horizontal or list format.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Calendar, Location, People, Video } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { EventPreview } from '../types/event.types';

interface EventCardProps {
  event: EventPreview;
  variant?: 'horizontal' | 'list';
  onPress: () => void;
}

export default function EventCard({ event, variant = 'horizontal', onPress }: EventCardProps) {
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
      default: return colors.gray400;
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.container, isHorizontal ? styles.horizontal : styles.list]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Cover Image */}
      {event.coverImage && (
        <Image
          source={{ uri: event.coverImage }}
          style={isHorizontal ? styles.coverImage : styles.listImage}
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
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        
        <View style={styles.infoRow}>
          <Calendar size={14} color={colors.primary} />
          <Text style={styles.infoText}>{formatDate(event.startDate)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Location size={14} color={colors.gray500} />
          <Text style={styles.infoText}>
            {event.location.isVirtual ? 'Online' : `${event.location.city}, ${event.location.country}`}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.attendees}>
            <People size={14} color={colors.gray500} />
            <Text style={styles.attendeeText}>{event.attendeeCount} attending</Text>
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontal: {
    width: 240,
  },
  list: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  coverImage: {
    width: '100%',
    height: 100,
  },
  listImage: {
    width: 100,
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
    color: colors.gray500,
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
