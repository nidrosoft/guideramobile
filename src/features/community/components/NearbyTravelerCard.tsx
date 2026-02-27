/**
 * NEARBY TRAVELER CARD
 * 
 * Displays a nearby traveler on the Live Map with their status and distance.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { 
  Location, 
  Verify, 
  Crown,
  Message,
  UserAdd,
} from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

export type TravelerStatus = 'available' | 'busy' | 'invisible';

export interface NearbyTraveler {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isVerified: boolean;
  isPremium: boolean;
  status: TravelerStatus;
  statusMessage?: string;
  currentLocation?: string;
  distance?: number; // in km
  matchScore?: number;
  sharedInterests?: string[];
  isBuddy?: boolean;
  lastActive?: Date;
}

interface NearbyTravelerCardProps {
  traveler: NearbyTraveler;
  variant?: 'map' | 'list';
  onPress: () => void;
  onConnect?: () => void;
  onMessage?: () => void;
  showActions?: boolean;
}

const STATUS_COLORS: Record<TravelerStatus, string> = {
  available: colors.success,
  busy: colors.warning,
  invisible: colors.gray400,
};

const STATUS_LABELS: Record<TravelerStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  invisible: 'Away',
};

export default function NearbyTravelerCard({ 
  traveler, 
  variant = 'list',
  onPress,
  onConnect,
  onMessage,
  showActions = true,
}: NearbyTravelerCardProps) {
  const isMapVariant = variant === 'map';
  
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };
  
  const getMatchColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary;
    return colors.gray400;
  };
  
  // Map marker variant (compact)
  if (isMapVariant) {
    return (
      <TouchableOpacity
        style={styles.mapContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.mapAvatarContainer}>
          <Image source={{ uri: traveler.avatar }} style={styles.mapAvatar} />
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[traveler.status] }]} />
        </View>
        <View style={styles.mapContent}>
          <Text style={styles.mapName} numberOfLines={1}>
            {traveler.firstName}
          </Text>
          {traveler.distance !== undefined && (
            <Text style={styles.mapDistance}>{formatDistance(traveler.distance)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
  
  // List variant (full)
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar with status */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: traveler.avatar }} style={styles.avatar} />
        <View style={[styles.statusIndicator, { backgroundColor: STATUS_COLORS[traveler.status] }]} />
        {traveler.isPremium && (
          <View style={styles.premiumBadge}>
            <Crown size={10} color={colors.warning} variant="Bold" />
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {traveler.firstName} {traveler.lastName.charAt(0)}.
          </Text>
          {traveler.isVerified && (
            <Verify size={14} color={colors.primary} variant="Bold" />
          )}
          {traveler.matchScore !== undefined && (
            <View style={[styles.matchBadge, { backgroundColor: getMatchColor(traveler.matchScore) + '20' }]}>
              <Text style={[styles.matchText, { color: getMatchColor(traveler.matchScore) }]}>
                {traveler.matchScore}%
              </Text>
            </View>
          )}
        </View>
        
        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[traveler.status] + '20' }]}>
            <View style={[styles.statusDotSmall, { backgroundColor: STATUS_COLORS[traveler.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLORS[traveler.status] }]}>
              {STATUS_LABELS[traveler.status]}
            </Text>
          </View>
          {traveler.statusMessage && (
            <Text style={styles.statusMessage} numberOfLines={1}>
              {traveler.statusMessage}
            </Text>
          )}
        </View>
        
        {/* Location & Distance */}
        <View style={styles.locationRow}>
          <Location size={12} color={colors.gray400} />
          <Text style={styles.locationText}>
            {traveler.currentLocation || 'Nearby'}
            {traveler.distance !== undefined && ` • ${formatDistance(traveler.distance)} away`}
          </Text>
        </View>
        
        {/* Shared Interests */}
        {traveler.sharedInterests && traveler.sharedInterests.length > 0 && (
          <View style={styles.interestsRow}>
            {traveler.sharedInterests.slice(0, 3).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
            {traveler.sharedInterests.length > 3 && (
              <Text style={styles.moreInterests}>
                +{traveler.sharedInterests.length - 3}
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          {traveler.isBuddy ? (
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={onMessage}
              activeOpacity={0.7}
            >
              <Message size={18} color={colors.primary} variant="Bold" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={onConnect}
              activeOpacity={0.7}
            >
              <UserAdd size={18} color={colors.white} variant="Bold" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  matchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusMessage: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  interestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  interestTag: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  interestText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  actions: {
    marginLeft: spacing.sm,
  },
  connectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Map variant styles
  mapContainer: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  mapAvatarContainer: {
    position: 'relative',
  },
  mapAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.white,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  mapContent: {
    alignItems: 'center',
    marginTop: 4,
  },
  mapName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mapDistance: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
