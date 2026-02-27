/**
 * ACTIVE SESSIONS SCREEN
 * 
 * View and manage active login sessions across devices.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Monitor,
  Mobile,
  Logout,
  Location,
  Clock,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface Session {
  id: string;
  device_name: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  ip_address: string;
  location: string;
  last_active: Date;
  is_current: boolean;
}

// Get current device info
const getCurrentDeviceInfo = (): Session => {
  const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'mobile';
  
  if (Platform.OS === 'ios') {
    deviceType = Device.deviceType === Device.DeviceType.TABLET ? 'tablet' : 'mobile';
  } else if (Platform.OS === 'android') {
    deviceType = Device.deviceType === Device.DeviceType.TABLET ? 'tablet' : 'mobile';
  }
  
  return {
    id: 'current',
    device_name: deviceName,
    device_type: deviceType,
    ip_address: 'Current session',
    location: 'This device',
    last_active: new Date(),
    is_current: true,
  };
};

export default function ActiveSessionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      // Get current device as the only confirmed session
      // Supabase doesn't track individual sessions by default
      const currentDevice = getCurrentDeviceInfo();
      setSessions([currentDevice]);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleLogoutSession = (session: Session) => {
    if (session.is_current) {
      Alert.alert(
        'Cannot Log Out',
        'You cannot log out of your current session from here. Use the Log Out option in Settings instead.',
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Log Out Device',
      `Are you sure you want to log out "${session.device_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement session logout via Supabase
            setSessions(prev => prev.filter(s => s.id !== session.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      ]
    );
  };

  const handleLogoutAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Log Out All Devices',
      'This will log you out from ALL devices including this one. You\'ll need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out All', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Supabase global signout - logs out all sessions
              const { error } = await supabase.auth.signOut({ scope: 'global' });
              if (error) throw error;
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              // User will be redirected to login by AuthContext
            } catch (error) {
              console.error('Error logging out all devices:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Mobile size={24} color={colors.primary} variant="Bold" />;
      case 'tablet':
        return <Mobile size={24} color={colors.primary} variant="Bold" />;
      default:
        return <Monitor size={24} color={colors.primary} variant="Bold" />;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const otherSessions = sessions.filter(s => !s.is_current);
  const currentSession = sessions.find(s => s.is_current);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Sessions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Current Session */}
        {currentSession && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Session</Text>
            <View style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.deviceIcon}>
                  {getDeviceIcon(currentSession.device_type)}
                </View>
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionNameRow}>
                    <Text style={styles.deviceName}>{currentSession.device_name}</Text>
                    <View style={styles.currentBadge}>
                      <TickCircle size={12} color={colors.success} variant="Bold" />
                      <Text style={styles.currentBadgeText}>This device</Text>
                    </View>
                  </View>
                  {currentSession.browser && (
                    <Text style={styles.browserText}>{currentSession.browser}</Text>
                  )}
                </View>
              </View>
              <View style={styles.sessionDetails}>
                <View style={styles.detailRow}>
                  <Location size={14} color={colors.gray400} />
                  <Text style={styles.detailText}>{currentSession.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={14} color={colors.gray400} />
                  <Text style={styles.detailText}>Active now</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Other Sessions</Text>
              <TouchableOpacity onPress={handleLogoutAll}>
                <Text style={styles.logoutAllText}>Log out all</Text>
              </TouchableOpacity>
            </View>
            
            {otherSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.deviceIcon}>
                    {getDeviceIcon(session.device_type)}
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.deviceName}>{session.device_name}</Text>
                    {session.browser && (
                      <Text style={styles.browserText}>{session.browser}</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={() => handleLogoutSession(session)}
                  >
                    <Logout size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.sessionDetails}>
                  <View style={styles.detailRow}>
                    <Location size={14} color={colors.gray400} />
                    <Text style={styles.detailText}>{session.location}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={14} color={colors.gray400} />
                    <Text style={styles.detailText}>{formatLastActive(session.last_active)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {otherSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Monitor size={48} color={colors.gray300} variant="Bulk" />
            <Text style={styles.emptyTitle}>No Other Sessions</Text>
            <Text style={styles.emptyText}>
              You're only logged in on this device.
            </Text>
          </View>
        )}

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityNoteTitle}>Security Tip</Text>
          <Text style={styles.securityNoteText}>
            If you see a session you don't recognize, log it out immediately and change your password.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  logoutAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  deviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  currentBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
    marginLeft: 4,
  },
  browserText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionDetails: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  securityNote: {
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '20',
  },
  securityNoteTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  securityNoteText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
