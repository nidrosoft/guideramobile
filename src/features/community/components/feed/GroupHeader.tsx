/**
 * GROUP HEADER
 * 
 * Banner header for the group detail screen with cover image,
 * group info, join/share buttons, and animated collapse behavior.
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import {
  ArrowLeft,
  More,
  Verify,
  Setting2,
  ExportSquare,
  Global,
  Lock,
  Clock,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borderRadius } from '@/styles';
import { LinearGradient } from 'expo-linear-gradient';

interface GroupHeaderProps {
  bannerImage: string;
  avatar: string;
  name: string;
  isVerified: boolean;
  privacy: 'public' | 'private' | 'invite_only';
  memberCount: number;
  activeCount: number;
  isMember: boolean;
  isPending?: boolean;
  paddingTop: number;
  onBack: () => void;
  onMore: () => void;
  onJoin: () => void;
  onShare: () => void;
  onSettings?: () => void;
}

function GroupHeader({
  bannerImage,
  avatar,
  name,
  isVerified,
  privacy,
  memberCount,
  activeCount,
  isMember,
  isPending,
  paddingTop,
  onBack,
  onMore,
  onJoin,
  onShare,
  onSettings,
}: GroupHeaderProps) {
  const { colors: tc } = useTheme();

  const PrivacyIcon = privacy === 'public' ? Global : Lock;
  const privacyLabel = privacy === 'public' ? 'Public' : 'Private';

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin();
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: bannerImage }}
        style={styles.bannerImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.65)']}
          locations={[0, 0.3, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top navigation bar */}
        <View style={[styles.topBar, { paddingTop: paddingTop + 4 }]}>
          <TouchableOpacity style={styles.navButton} onPress={onBack}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={onMore}>
            <More size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Group info overlay */}
        <View style={styles.infoOverlay}>
          <View style={styles.infoRow}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={styles.textCol}>
              <View style={styles.nameRow}>
                <Text style={styles.groupName} numberOfLines={1}>{name}</Text>
                {isVerified && (
                  <Verify size={16} color="#3FC39E" variant="Bold" />
                )}
              </View>
              <View style={styles.metaRow}>
                <PrivacyIcon size={12} color="rgba(255,255,255,0.85)" variant="Bold" />
                <Text style={styles.metaText}>
                  {privacyLabel}
                </Text>
                <View style={styles.metaDot} />
                <Text style={styles.metaText}>
                  {memberCount.toLocaleString()} members
                </Text>
                <View style={styles.metaDot} />
                <Text style={styles.metaText}>
                  {activeCount} active
                </Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {isMember ? (
              <>
                <View style={styles.joinedBadge}>
                  <Text style={styles.joinedText}>Joined</Text>
                </View>
                {onSettings && (
                  <TouchableOpacity style={styles.iconButton} onPress={onSettings}>
                    <Setting2 size={18} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                )}
              </>
            ) : isPending ? (
              <View style={[styles.pendingBadge]}>
                <Clock size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
                <Text style={styles.joinButtonText}>
                  {privacy === 'private' ? 'Request to Join' : 'Join'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
              <ExportSquare size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

export default memo(GroupHeader);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 230,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoOverlay: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    marginRight: spacing.sm,
  },
  textCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  metaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  joinButton: {
    backgroundColor: '#3FC39E',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121212',
  },
  joinedBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shareText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
