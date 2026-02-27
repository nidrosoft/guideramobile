/**
 * ACTIVITY CARD
 * 
 * Displays a meetup activity preview for the Live Map and activity lists.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { 
  Location, 
  Clock, 
  People, 
  Coffee, 
  Reserve,
  Camera,
  Music,
  Briefcase,
  LanguageSquare,
  Driving,
  Building,
  More,
} from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

export type ActivityType = 
  | 'coffee' 
  | 'food' 
  | 'drinks' 
  | 'sightseeing' 
  | 'walking_tour' 
  | 'museum' 
  | 'nightlife' 
  | 'sports' 
  | 'coworking' 
  | 'language_exchange' 
  | 'other';

export interface ActivityPreview {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  locationName: string;
  distance?: number; // in km
  startTime: Date;
  endTime?: Date;
  currentParticipants: number;
  maxParticipants?: number;
  isJoined?: boolean;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
}

interface ActivityCardProps {
  activity: ActivityPreview;
  variant?: 'compact' | 'full';
  onPress: () => void;
  onJoin?: () => void;
}

const ACTIVITY_ICONS: Record<ActivityType, any> = {
  coffee: Coffee,
  food: Reserve,
  drinks: Coffee,
  sightseeing: Camera,
  walking_tour: Driving,
  museum: Building,
  nightlife: Music,
  sports: Driving,
  coworking: Briefcase,
  language_exchange: LanguageSquare,
  other: More,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  coffee: '#8B4513',
  food: '#FF6B6B',
  drinks: '#9B59B6',
  sightseeing: '#3498DB',
  walking_tour: '#27AE60',
  museum: '#E67E22',
  nightlife: '#9B59B6',
  sports: '#2ECC71',
  coworking: '#3498DB',
  language_exchange: '#1ABC9C',
  other: colors.gray500,
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  coffee: 'Coffee',
  food: 'Food',
  drinks: 'Drinks',
  sightseeing: 'Sightseeing',
  walking_tour: 'Walking Tour',
  museum: 'Museum',
  nightlife: 'Nightlife',
  sports: 'Sports',
  coworking: 'Coworking',
  language_exchange: 'Language Exchange',
  other: 'Other',
};

export default function ActivityCard({ 
  activity, 
  variant = 'full',
  onPress,
  onJoin,
}: ActivityCardProps) {
  const isCompact = variant === 'compact';
  const IconComponent = ACTIVITY_ICONS[activity.type] || More;
  const activityColor = ACTIVITY_COLORS[activity.type] || colors.gray500;
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };
  
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m away`;
    }
    return `${km.toFixed(1)}km away`;
  };
  
  const getTimeLabel = () => {
    const now = new Date();
    const diff = activity.startTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 0) return 'Now';
    if (minutes < 60) return `In ${minutes}min`;
    if (minutes < 120) return 'In 1hr';
    return formatTime(activity.startTime);
  };
  
  const spotsLeft = activity.maxParticipants 
    ? activity.maxParticipants - activity.currentParticipants 
    : null;
  
  if (isCompact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBadge, { backgroundColor: activityColor + '20' }]}>
          <IconComponent size={16} color={activityColor} variant="Bold" />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{activity.title}</Text>
          <Text style={styles.compactMeta}>
            {getTimeLabel()} • {activity.currentParticipants} going
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: activityColor + '15' }]}>
          <IconComponent size={14} color={activityColor} variant="Bold" />
          <Text style={[styles.typeText, { color: activityColor }]}>
            {ACTIVITY_LABELS[activity.type]}
          </Text>
        </View>
        <Text style={styles.timeLabel}>{getTimeLabel()}</Text>
      </View>
      
      {/* Title & Description */}
      <Text style={styles.title}>{activity.title}</Text>
      {activity.description && (
        <Text style={styles.description} numberOfLines={2}>
          {activity.description}
        </Text>
      )}
      
      {/* Location */}
      <View style={styles.infoRow}>
        <Location size={14} color={colors.primary} variant="Bold" />
        <Text style={styles.infoText}>{activity.locationName}</Text>
        {activity.distance !== undefined && (
          <Text style={styles.distanceText}>• {formatDistance(activity.distance)}</Text>
        )}
      </View>
      
      {/* Time */}
      <View style={styles.infoRow}>
        <Clock size={14} color={colors.gray500} />
        <Text style={styles.infoText}>
          {formatTime(activity.startTime)}
          {activity.endTime && ` - ${formatTime(activity.endTime)}`}
        </Text>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        {/* Creator */}
        <View style={styles.creator}>
          <Image source={{ uri: activity.creatorAvatar }} style={styles.creatorAvatar} />
          <Text style={styles.creatorName}>by {activity.creatorName}</Text>
        </View>
        
        {/* Participants & Join */}
        <View style={styles.actions}>
          <View style={styles.participants}>
            <People size={14} color={colors.gray500} />
            <Text style={styles.participantText}>
              {activity.currentParticipants}
              {activity.maxParticipants && `/${activity.maxParticipants}`}
            </Text>
          </View>
          
          {activity.isJoined ? (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedText}>Joined</Text>
            </View>
          ) : spotsLeft !== null && spotsLeft <= 0 ? (
            <View style={styles.fullBadge}>
              <Text style={styles.fullText}>Full</Text>
            </View>
          ) : onJoin ? (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={onJoin}
              activeOpacity={0.7}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      
      {/* Spots warning */}
      {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 3 && (
        <View style={styles.spotsWarning}>
          <Text style={styles.spotsText}>Only {spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  distanceText: {
    fontSize: 13,
    color: colors.gray400,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  creatorName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  joinedBadge: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  fullBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  fullText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray500,
  },
  spotsWarning: {
    marginTop: spacing.sm,
    backgroundColor: colors.warning + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  spotsText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.warning,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  compactMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
