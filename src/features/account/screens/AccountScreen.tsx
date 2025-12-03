/**
 * ACCOUNT SCREEN
 * 
 * Main account hub with profile header and menu sections.
 * Scalable architecture for growing features.
 */

import React, { useCallback, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert,
  RefreshControl,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import { UserProfile } from '../types/account.types';
import { ACCOUNT_SECTIONS } from '../config/accountSections.config';
import ProfileHeader from '../components/ProfileHeader';
import AccountSection from '../components/AccountSection';

// Apple-style dark color (same as ProfileHeader)
const DARK_BG = '#1C1C1E';
// Scroll threshold for header transition (when stats card reaches top)
const SCROLL_THRESHOLD = 220;

// Mock user data - will be replaced with real data from auth/API
const MOCK_USER: UserProfile = {
  id: 'user-1',
  firstName: 'Daniel',
  lastName: 'Smith',
  email: 'daniel.smith@email.com',
  phone: '+1 (555) 123-4567',
  avatar: 'https://i.pravatar.cc/150?img=12',
  bio: 'Adventure seeker | 23 countries and counting 🌍',
  location: 'San Diego, USA',
  country: 'United States',
  language: 'English',
  currency: 'USD',
  
  stats: {
    tripsCompleted: 12,
    countriesVisited: 23,
    citiesExplored: 45,
    reviewsWritten: 8,
    photosShared: 156,
    communitiesJoined: 5,
  },
  
  membership: {
    type: 'premium',
    since: new Date('2024-01-15'),
  },
  
  verified: {
    email: true,
    phone: true,
    identity: true,
  },
  
  travelPreferences: {
    style: ['Adventure', 'Cultural'],
    interests: ['Photography', 'Food', 'History'],
    dietaryRestrictions: ['Vegetarian'],
    accessibilityNeeds: [],
  },
  
  emergencyContact: {
    name: 'Sarah Smith',
    phone: '+1 (555) 987-6543',
    relationship: 'Sister',
  },
  
  createdAt: new Date('2023-06-01'),
  updatedAt: new Date(),
};

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const [isHeaderLight, setIsHeaderLight] = useState(false);
  
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
  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [DARK_BG, colors.background],
    extrapolate: 'clamp',
  });
  
  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  
  // Handle edit profile
  const handleEditProfile = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/account/edit-profile' as any);
  }, [router]);
  
  // Handle avatar press
  const handleAvatarPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Profile Photo',
      'What would you like to do?',
      [
        { text: 'View Photo', onPress: () => {} },
        { text: 'Change Photo', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);
  
  // Process sections to add logout handler
  const processedSections = ACCOUNT_SECTIONS.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item.id === 'logout') {
        return {
          ...item,
          action: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
              'Log Out',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Log Out', 
                  style: 'destructive',
                  onPress: () => {
                    console.log('Logging out...');
                    router.replace('/(auth)/landing' as any);
                  },
                },
              ]
            );
          },
        };
      }
      return item;
    }),
  }));
  
  return (
    <View style={styles.screen}>
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
            user={MOCK_USER}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
});
