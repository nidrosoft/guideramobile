/**
 * ACCOUNT SCREEN
 * 
 * Main account hub with profile header and menu sections.
 * Scalable architecture for growing features.
 */

import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { Logout } from 'iconsax-react-native';
import { useTheme } from '@/context/ThemeContext';
import { UserProfile } from '../types/account.types';
import { ACCOUNT_SECTIONS } from '../config/accountSections.config';
import ProfileHeader from '../components/ProfileHeader';
import AccountSection from '../components/AccountSection';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profile.service';
import { savedService } from '@/services/saved.service';

// Apple-style dark color (same as ProfileHeader)
const DARK_BG = '#1C1C1E';
// Scroll threshold for header transition (when stats card reaches top)
const SCROLL_THRESHOLD = 220;

// Default user data for when profile is loading
const DEFAULT_USER: UserProfile = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  language: 'English',
  currency: 'USD',
  stats: {
    tripsCompleted: 0,
    countriesVisited: 0,
    citiesExplored: 0,
    reviewsWritten: 0,
    photosShared: 0,
    communitiesJoined: 0,
  },
  membership: {
    type: 'free',
    since: new Date(),
  },
  verified: {
    email: false,
    phone: false,
    identity: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile, signOut, user: authUser } = useAuth();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [isHeaderLight, setIsHeaderLight] = useState(false);
  const [savedItemsCount, setSavedItemsCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    screen: {
      backgroundColor: colors.background,
    },
  }), [colors]);

  // Fetch saved items count
  useEffect(() => {
    const fetchSavedCount = async () => {
      if (!authUser?.id) return;
      const { total } = await savedService.getSavedItemsCount(authUser.id);
      setSavedItemsCount(total);
    };
    fetchSavedCount();
  }, [authUser?.id]);
  
  // Transform Supabase profile to UserProfile type
  const user: UserProfile = useMemo(() => {
    if (!profile) return DEFAULT_USER;
    
    return {
      id: profile.id,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      email: profile.email || '',
      phone: profile.phone,
      avatar: profile.avatar_url,
      coverPhoto: profile.cover_photo_url,
      bio: profile.bio,
      location: profileService.getLocationString(profile as any),
      country: profile.country,
      language: profile.preferences?.language || 'English',
      currency: profile.preferences?.currency || 'USD',
      timezone: profile.timezone,
      dateOfBirth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
      gender: profile.gender,
      
      stats: {
        tripsCompleted: profile.stats?.trips_completed || 0,
        countriesVisited: profile.stats?.countries_visited || 0,
        citiesExplored: profile.stats?.cities_explored || 0,
        reviewsWritten: profile.stats?.reviews_written || 0,
        photosShared: 0,
        communitiesJoined: 0,
      },
      
      membership: {
        type: (profile.membership_type as 'free' | 'premium' | 'pro') || 'free',
        since: profile.created_at ? new Date(profile.created_at) : new Date(),
        expiresAt: profile.membership_expires_at ? new Date(profile.membership_expires_at) : undefined,
      },
      
      verified: {
        email: profile.email_verified || false,
        phone: profile.phone_verified || false,
        identity: profile.identity_verified || false,
      },
      
      travelPreferences: {
        style: profile.travel_preferences?.styles || [],
        interests: profile.travel_preferences?.interests || [],
        dietaryRestrictions: profile.travel_preferences?.dietary_restrictions || [],
        accessibilityNeeds: profile.travel_preferences?.accessibility_needs || [],
      },
      
      emergencyContact: profile.emergency_contact ? {
        name: profile.emergency_contact.name || '',
        phone: profile.emergency_contact.phone || '',
        relationship: profile.emergency_contact.relationship || '',
      } : undefined,
      
      createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
      updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
    };
  }, [profile]);
  
  // Set initial status bar style when screen is focused
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      setIsHeaderLight(false);
      return () => {
        setStatusBarStyle('dark');
      };
    }, [])
  );
  
  // Handle scroll to update status bar
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldBeLight = offsetY < SCROLL_THRESHOLD;
    
    if (shouldBeLight !== !isHeaderLight) {
      setIsHeaderLight(!shouldBeLight);
      setStatusBarStyle(shouldBeLight ? 'light' : 'dark');
    }
  }, [isHeaderLight]);
  
  // Interpolate header background color based on scroll
  const headerBackgroundColor = useMemo(() => scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [DARK_BG, colors.background],
    extrapolate: 'clamp',
  }), [scrollY, colors.background]);
  
  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);
  
  // Handle edit profile
  const handleEditProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/account/edit-profile' as any);
  }, [router]);
  
  // Handle avatar press
  const handleAvatarPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement avatar options modal
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      setShowLogoutModal(false);
      router.replace('/(auth)/landing' as any);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [signOut, router]);
  
  // Process sections to add dynamic data and handlers
  const processedSections = ACCOUNT_SECTIONS.map(section => ({
    ...section,
    items: section.items.map(item => {
      // Update saved items badge with real count
      if (item.id === 'saved-items') {
        return {
          ...item,
          badge: savedItemsCount > 0 ? savedItemsCount : undefined,
        };
      }
      // Handle logout action
      if (item.id === 'logout') {
        return {
          ...item,
          action: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setShowLogoutModal(true);
          },
        };
      }
      return item;
    }),
  }));
  
  return (
    <View style={[styles.screen, dynamicStyles.screen]}>
      <StatusBar style={isHeaderLight ? 'dark' : 'light'} />
      
      {/* Animated status bar background */}
      <Animated.View 
        style={[
          styles.statusBarBg, 
          { 
            height: insets.top,
            backgroundColor: headerBackgroundColor,
          }
        ]} 
      />
      
      <View style={styles.container}>
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { 
              useNativeDriver: false,
              listener: handleScroll,
            }
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.white}
              progressViewOffset={insets.top}
            />
          }
        >
          {/* Profile Header */}
          <ProfileHeader
            user={user}
            onEditPress={handleEditProfile}
            onAvatarPress={handleAvatarPress}
          />
          
          {/* Menu Sections */}
          {processedSections.map(section => (
            <AccountSection key={section.id} section={section} />
          ))}
          
          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </Animated.ScrollView>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
                <View style={styles.modalIcon}>
                  <Logout size={32} color={colors.error} variant="Bold" />
                </View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Out?</Text>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  Are you sure you want to log out of your account?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.gray100 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowLogoutModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonLogout]}
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonTextLogout}>
                      {isLoggingOut ? 'Logging out...' : 'Log Out'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  statusBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  bottomSpacer: {
    height: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  modalMessage: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    // Background set dynamically
  },
  modalButtonLogout: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  modalButtonTextLogout: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
