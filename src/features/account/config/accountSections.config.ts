/**
 * ACCOUNT SECTIONS CONFIG
 * 
 * Centralized configuration for all account menu sections.
 * Easy to add/remove/reorder sections and items.
 */

import {
  Heart,
  Notification,
  Shield,
  LanguageSquare,
  Moon,
  InfoCircle,
  DocumentText,
  MessageQuestion,
  Logout,
  TicketStar,
  Gift,
  People,
  Location,
  Briefcase,
  Award,
  Verify,
  ShieldTick,
  Eye,
  Call,
  Flag,
  Trash,
  Edit2,
  Camera,
  Profile2User,
  Map1,
  DollarCircle,
} from 'iconsax-react-native';
import { colors } from '@/styles';
import { AccountSection } from '../types/account.types';

export const ACCOUNT_SECTIONS: AccountSection[] = [
  // SAVED & COLLECTIONS
  {
    id: 'saved',
    title: 'Saved & Collections',
    items: [
      {
        id: 'saved-items',
        title: 'Saved Items',
        subtitle: 'Destinations, hotels, deals',
        icon: Heart,
        iconColor: '#EF4444',
        iconVariant: 'TwoTone',
        route: '/account/saved',
        badge: 12,
        showChevron: true,
      },
      {
        id: 'collections',
        title: 'Collections',
        subtitle: 'Organize your saves',
        icon: Briefcase,
        iconColor: '#6B7280',
        iconVariant: 'TwoTone',
        route: '/account/collections',
        showChevron: true,
      },
      {
        id: 'saved-deals',
        title: 'Saved Deals',
        subtitle: 'Flights, hotels, cars',
        icon: TicketStar,
        iconColor: '#F59E0B',
        iconVariant: 'TwoTone',
        route: '/account/bookings',
        showChevron: true,
      },
      {
        id: 'my-expenses',
        title: 'My Expenses',
        subtitle: 'All your travel spending',
        icon: DollarCircle,
        iconColor: '#22C55E',
        iconVariant: 'TwoTone',
        route: '/account/my-expenses',
        showChevron: true,
      },
    ],
  },

  // REWARDS, MEMBERSHIP & PARTNER
  {
    id: 'rewards',
    title: 'Rewards & Programs',
    items: [
      {
        id: 'membership',
        title: 'Guidera Premium',
        subtitle: 'Upgrade for exclusive perks',
        icon: Award,
        iconColor: '#F59E0B',
        iconVariant: 'TwoTone',
        route: '/account/membership',
        premium: true,
        showChevron: true,
      },
      {
        id: 'rewards-points',
        title: 'Rewards Points',
        subtitle: '2,450 points available',
        icon: Gift,
        iconColor: '#A855F7',
        iconVariant: 'TwoTone',
        route: '/account/rewards',
        showChevron: true,
      },
      {
        id: 'referrals',
        title: 'Refer Friends',
        subtitle: 'Earn $20 per referral',
        icon: People,
        iconColor: '#3B82F6',
        iconVariant: 'TwoTone',
        route: '/account/referrals',
        showChevron: true,
      },
      {
        id: 'partner-program',
        title: 'Become a Local Guide',
        subtitle: 'Apply to offer tours & services',
        icon: Map1,
        iconColor: colors.primary,
        iconVariant: 'TwoTone',
        route: '/community/partner-apply',
        showChevron: true,
      },
    ],
  },

  // PREFERENCES
  {
    id: 'preferences',
    title: 'Preferences',
    items: [
      {
        id: 'travel-preferences',
        title: 'Travel Profile',
        subtitle: 'Style, interests, health & packing',
        icon: Location,
        iconColor: '#F97316',
        iconVariant: 'TwoTone',
        route: '/account/travel-preferences',
        showChevron: true,
      },
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Push, email, SMS',
        icon: Notification,
        iconColor: '#EAB308',
        iconVariant: 'TwoTone',
        route: '/account/notifications',
        showChevron: true,
      },
      {
        id: 'language',
        title: 'Language & Region',
        subtitle: 'English, USD',
        icon: LanguageSquare,
        iconColor: '#06B6D4',
        iconVariant: 'TwoTone',
        route: '/account/language',
        showChevron: true,
      },
      {
        id: 'appearance',
        title: 'Appearance',
        subtitle: 'Light mode',
        icon: Moon,
        iconColor: '#6366F1',
        iconVariant: 'TwoTone',
        route: '/account/appearance',
        showChevron: true,
      },
    ],
  },

  // PRIVACY & SECURITY
  {
    id: 'security',
    title: 'Privacy & Security',
    items: [
      {
        id: 'privacy',
        title: 'Privacy Settings',
        subtitle: 'Profile visibility, data',
        icon: Eye,
        iconColor: '#8B5CF6',
        iconVariant: 'TwoTone',
        route: '/account/privacy',
        showChevron: true,
      },
      {
        id: 'security-settings',
        title: 'Security',
        subtitle: 'Coming soon — biometrics & 2FA',
        icon: ShieldTick,
        iconColor: '#10B981',
        iconVariant: 'TwoTone',
        route: '/account/security',
        showChevron: true,
        disabled: true,
      },
      {
        id: 'verification',
        title: 'Trusted Traveler',
        subtitle: 'Coming soon — identity verification',
        icon: Verify,
        iconColor: colors.primary,
        iconVariant: 'TwoTone',
        route: '/account/verification',
        showChevron: true,
        disabled: true,
      },
    ],
  },

  // SUPPORT & LEGAL
  {
    id: 'support',
    title: 'Support & Legal',
    items: [
      {
        id: 'help-center',
        title: 'Help Center',
        icon: MessageQuestion,
        iconColor: '#3B82F6',
        iconVariant: 'TwoTone',
        route: '/account/help-center',
        showChevron: true,
      },
      {
        id: 'contact-support',
        title: 'Contact Support',
        icon: Call,
        iconColor: '#14B8A6',
        iconVariant: 'TwoTone',
        route: '/account/contact-support',
        showChevron: true,
      },
      {
        id: 'report-issue',
        title: 'Report an Issue',
        icon: Flag,
        iconColor: '#F97316',
        iconVariant: 'TwoTone',
        route: '/account/report-issue',
        showChevron: true,
      },
      {
        id: 'terms',
        title: 'Terms of Service',
        icon: DocumentText,
        iconColor: '#6B7280',
        iconVariant: 'TwoTone',
        route: '/account/terms-of-service',
        showChevron: true,
      },
      {
        id: 'privacy-policy',
        title: 'Privacy Policy',
        icon: Shield,
        iconColor: '#6B7280',
        iconVariant: 'TwoTone',
        route: '/account/privacy-policy',
        showChevron: true,
      },
      {
        id: 'about',
        title: 'About Guidera',
        subtitle: 'Version 1.0.0',
        icon: InfoCircle,
        iconColor: '#9CA3AF',
        iconVariant: 'TwoTone',
        route: '/account/about',
        showChevron: true,
      },
    ],
  },

  // DANGER ZONE
  {
    id: 'danger',
    items: [
      {
        id: 'logout',
        title: 'Log Out',
        icon: Logout,
        iconColor: colors.error,
        iconVariant: 'Bold',
        destructive: true,
        action: () => {
          // Will be handled by the component
          if (__DEV__) console.log('Logout action');
        },
      },
      {
        id: 'delete-account',
        title: 'Delete Account',
        icon: Trash,
        iconColor: colors.error,
        iconVariant: 'Bold',
        destructive: true,
        route: '/account/delete-account',
        showChevron: true,
      },
    ],
  },
];

// Quick access items for profile header
export const PROFILE_QUICK_ACTIONS = [
  {
    id: 'edit-profile',
    title: 'Edit Profile',
    icon: Edit2,
    route: '/account/edit-profile',
  },
  {
    id: 'share-profile',
    title: 'Share',
    icon: Profile2User,
    action: () => console.log('Share profile'),
  },
  {
    id: 'qr-code',
    title: 'QR Code',
    icon: Camera,
    route: '/account/qr-code',
  },
];
