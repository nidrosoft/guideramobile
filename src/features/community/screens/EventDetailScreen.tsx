/**
 * EVENT DETAIL SCREEN
 * 
 * Full event info with RSVP functionality.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Share,
  Location,
  Calendar,
  Clock,
  People,
  TickCircle,
  CloseCircle,
  Message,
  Video,
  Global,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

type RSVPStatus = 'going' | 'maybe' | 'not_going' | null;

// Mock event data
const MOCK_EVENT = {
  id: 'event-1',
  title: 'Tokyo Travelers Meetup 🗼',
  description: 'Join us for an amazing meetup in Shibuya! We\'ll explore the famous crossing, grab some ramen, and visit a hidden izakaya. Perfect for solo travelers looking to make new friends.\n\nBring your camera and an appetite for adventure!',
  coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
  type: 'in_person' as const,
  location: {
    name: 'Shibuya Crossing',
    address: 'Shibuya, Tokyo, Japan',
    coordinates: { lat: 35.6595, lng: 139.7004 },
  },
  date: new Date('2025-01-20T18:00:00'),
  endDate: new Date('2025-01-20T22:00:00'),
  timezone: 'Asia/Tokyo',
  community: {
    id: 'comm-1',
    name: 'Tokyo Travelers 2025',
    avatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
  },
  host: {
    id: 'user-1',
    name: 'Yuki Tanaka',
    avatar: 'https://i.pravatar.cc/150?img=3',
    isVerified: true,
  },
  attendees: {
    going: 24,
    maybe: 8,
    limit: 30,
  },
  goingUsers: [
    { id: 'u1', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: 'u2', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: 'u3', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: 'u4', avatar: 'https://i.pravatar.cc/150?img=4' },
    { id: 'u5', avatar: 'https://i.pravatar.cc/150?img=5' },
  ],
  tags: ['meetup', 'food', 'nightlife', 'photography'],
  isFree: true,
  price: null,
};

export default function EventDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const event = MOCK_EVENT;
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Share functionality
  };
  
  const handleRSVP = async (status: RSVPStatus) => {
    if (status === rsvpStatus) {
      // Cancel RSVP
      setRsvpStatus(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate API call
    setTimeout(() => {
      setRsvpStatus(status);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (status === 'going') {
        Alert.alert('You\'re Going! 🎉', 'We\'ll send you a reminder before the event.');
      }
    }, 500);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };
  
  const spotsLeft = event.attendees.limit - event.attendees.going;
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.header}>
          <Image source={{ uri: event.coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
          
          {/* Top Bar */}
          <View style={[styles.topBar, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <ArrowLeft size={24} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Share size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          {/* Event Type Badge */}
          <View style={styles.typeBadge}>
            {event.type === 'virtual' ? (
              <Video size={14} color={colors.white} />
            ) : (
              <Location size={14} color={colors.white} />
            )}
            <Text style={styles.typeBadgeText}>
              {event.type === 'virtual' ? 'Virtual Event' : 'In Person'}
            </Text>
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Title & Community */}
          <Text style={styles.title}>{event.title}</Text>
          
          <TouchableOpacity 
            style={styles.communityRow}
            onPress={() => router.push(`/community/${event.community.id}` as any)}
          >
            <Image source={{ uri: event.community.avatar }} style={styles.communityAvatar} />
            <Text style={styles.communityName}>{event.community.name}</Text>
          </TouchableOpacity>
          
          {/* Date & Time */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                <Calendar size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
              </View>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.success + '15' }]}>
                <Clock size={20} color={colors.success} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>
                  {formatTime(event.date)} - {formatTime(event.endDate)}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.warning + '15' }]}>
                <Location size={20} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{event.location.name}</Text>
                <Text style={styles.infoSubvalue}>{event.location.address}</Text>
              </View>
            </View>
          </View>
          
          {/* Host */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosted by</Text>
            <TouchableOpacity 
              style={styles.hostCard}
              onPress={() => router.push(`/community/buddy/${event.host.id}` as any)}
            >
              <Image source={{ uri: event.host.avatar }} style={styles.hostAvatar} />
              <View style={styles.hostInfo}>
                <View style={styles.hostNameRow}>
                  <Text style={styles.hostName}>{event.host.name}</Text>
                  {event.host.isVerified && (
                    <TickCircle size={16} color={colors.primary} variant="Bold" />
                  )}
                </View>
                <Text style={styles.hostRole}>Event Organizer</Text>
              </View>
              <Message size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Attendees */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Attendees</Text>
              <Text style={styles.spotsText}>
                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
              </Text>
            </View>
            
            <View style={styles.attendeesCard}>
              <View style={styles.attendeeAvatars}>
                {event.goingUsers.slice(0, 5).map((user, index) => (
                  <Image
                    key={user.id}
                    source={{ uri: user.avatar }}
                    style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -12 : 0 }]}
                  />
                ))}
                {event.attendees.going > 5 && (
                  <View style={[styles.attendeeAvatar, styles.moreAttendees, { marginLeft: -12 }]}>
                    <Text style={styles.moreAttendeesText}>+{event.attendees.going - 5}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.attendeeStats}>
                <View style={styles.attendeeStat}>
                  <TickCircle size={16} color={colors.success} variant="Bold" />
                  <Text style={styles.attendeeStatText}>{event.attendees.going} going</Text>
                </View>
                <View style={styles.attendeeStat}>
                  <Clock size={16} color={colors.warning} />
                  <Text style={styles.attendeeStatText}>{event.attendees.maybe} maybe</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
          
          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {event.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        <View style={{ height: 120 }} />
      </ScrollView>
      
      {/* RSVP Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || spacing.md }]}>
        <View style={styles.rsvpButtons}>
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              styles.rsvpGoing,
              rsvpStatus === 'going' && styles.rsvpActive,
            ]}
            onPress={() => handleRSVP('going')}
            disabled={isLoading}
          >
            <TickCircle 
              size={20} 
              color={rsvpStatus === 'going' ? colors.white : colors.success} 
              variant={rsvpStatus === 'going' ? 'Bold' : 'Outline'}
            />
            <Text style={[
              styles.rsvpButtonText,
              styles.rsvpGoingText,
              rsvpStatus === 'going' && styles.rsvpActiveText,
            ]}>
              Going
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              styles.rsvpMaybe,
              rsvpStatus === 'maybe' && styles.rsvpMaybeActive,
            ]}
            onPress={() => handleRSVP('maybe')}
            disabled={isLoading}
          >
            <Clock 
              size={20} 
              color={rsvpStatus === 'maybe' ? colors.white : colors.warning} 
            />
            <Text style={[
              styles.rsvpButtonText,
              styles.rsvpMaybeText,
              rsvpStatus === 'maybe' && styles.rsvpActiveText,
            ]}>
              Maybe
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              styles.rsvpNo,
              rsvpStatus === 'not_going' && styles.rsvpNoActive,
            ]}
            onPress={() => handleRSVP('not_going')}
            disabled={isLoading}
          >
            <CloseCircle 
              size={20} 
              color={rsvpStatus === 'not_going' ? colors.white : colors.bgElevated0} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 250,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  typeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  communityAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  communityName: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  infoCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  infoSubvalue: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
    marginLeft: 60,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  spotsText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hostInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hostName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  hostRole: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  attendeesCard: {
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  attendeeAvatars: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  attendeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.white,
  },
  moreAttendees: {
    backgroundColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAttendeesText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  attendeeStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  attendeeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  attendeeStatText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  rsvpGoing: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  rsvpMaybe: {
    backgroundColor: colors.warning + '15',
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  rsvpNo: {
    backgroundColor: colors.borderSubtle,
    flex: 0,
    width: 52,
  },
  rsvpActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  rsvpMaybeActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  rsvpNoActive: {
    backgroundColor: colors.bgElevated0,
  },
  rsvpButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  rsvpGoingText: {
    color: colors.success,
  },
  rsvpMaybeText: {
    color: colors.warning,
  },
  rsvpActiveText: {
    color: colors.white,
  },
});
