/**
 * ACCOUNT SECTIONS CONFIG
 * 
 * Centralized configuration for all account menu sections.
 * Easy to add/remove/reorder sections and items.
 */

import {
  Heart,
  Wallet2,
  Notification,
  Shield,
  Lock,
  Setting2,
  LanguageSquare,
  Moon,
  InfoCircle,
  DocumentText,
  MessageQuestion,
  Logout,
  Star1,
  TicketStar,
  Gift,
  People,
  Location,
  Calendar,
  Briefcase,
  Award,
  Verify,
  Card,
  Bank,
  Receipt1,
  ShieldTick,
  Eye,
  EyeSlash,
  FingerScan,
  Mobile,
  Sms,
  Call,
  Flag,
  Trash,
  Edit2,
  Camera,
  User,
  Profile2User,
} from 'iconsax-react-native';
import { colors } from '@/styles';
import { AccountSection } from '../types/account.types';

export const ACCOUNT_SECTIONS: AccountSection[] = [
  // SAVED & COLLECTIONS
  {
    id: 'saved',
    title: 'My Saved',
    items: [
      {
        id: 'saved-items',
        title: 'Saved Items',
        subtitle: 'Destinations, hotels, deals',
        icon: Heart,
        iconColor: colors.error,
        iconVariant: 'Bold',
        route: '/account/saved',
        badge: 12,
        showChevron: true,
      },
      {
        id: 'collections',
        title: 'Collections',
        subtitle: 'Organize your saves',
        icon: Briefcase,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/collections',
        showChevron: true,
      },
    ],
  },

  // BOOKINGS & PAYMENTS
  {
    id: 'bookings',
    title: 'Bookings & Payments',
    items: [
      {
        id: 'my-bookings',
        title: 'My Bookings',
        subtitle: 'Flights, hotels, activities',
        icon: TicketStar,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/bookings',
        showChevron: true,
      },
      {
        id: 'payment-methods',
        title: 'Payment Methods',
        subtitle: 'Cards, wallets, bank',
        icon: Wallet2,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/payment-methods',
        showChevron: true,
      },
      {
        id: 'transactions',
        title: 'Transaction History',
        icon: Receipt1,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/transactions',
        showChevron: true,
      },
    ],
  },

  // REWARDS & MEMBERSHIP
  {
    id: 'rewards',
    title: 'Rewards & Membership',
    items: [
      {
        id: 'membership',
        title: 'Guidera Premium',
        subtitle: 'Upgrade for exclusive perks',
        icon: Award,
        iconColor: colors.warning,
        iconVariant: 'Bold',
        route: '/account/membership',
        premium: true,
        showChevron: true,
      },
      {
        id: 'rewards-points',
        title: 'Rewards Points',
        subtitle: '2,450 points available',
        icon: Gift,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/rewards',
        showChevron: true,
      },
      {
        id: 'referrals',
        title: 'Refer Friends',
        subtitle: 'Earn $20 per referral',
        icon: People,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/referrals',
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
        title: 'Travel Preferences',
        subtitle: 'Style, interests, dietary',
        icon: Location,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/travel-preferences',
        showChevron: true,
      },
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Push, email, SMS',
        icon: Notification,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/notifications',
        showChevron: true,
      },
      {
        id: 'language',
        title: 'Language & Region',
        subtitle: 'English, USD',
        icon: LanguageSquare,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/language',
        showChevron: true,
      },
      {
        id: 'appearance',
        title: 'Appearance',
        subtitle: 'Light mode',
        icon: Moon,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
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
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/privacy',
        showChevron: true,
      },
      {
        id: 'security-settings',
        title: 'Security',
        subtitle: '2FA, biometrics, sessions',
        icon: ShieldTick,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/security',
        showChevron: true,
      },
      {
        id: 'verification',
        title: 'Verification',
        subtitle: 'Verify your identity',
        icon: Verify,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/verification',
        showChevron: true,
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
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/help-center',
        showChevron: true,
      },
      {
        id: 'contact-support',
        title: 'Contact Support',
        icon: Call,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/contact-support',
        showChevron: true,
      },
      {
        id: 'report-issue',
        title: 'Report an Issue',
        icon: Flag,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/report-issue',
        showChevron: true,
      },
      {
        id: 'terms',
        title: 'Terms of Service',
        icon: DocumentText,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/terms-of-service',
        showChevron: true,
      },
      {
        id: 'privacy-policy',
        title: 'Privacy Policy',
        icon: Shield,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
        route: '/account/privacy-policy',
        showChevron: true,
      },
      {
        id: 'about',
        title: 'About Guidera',
        subtitle: 'Version 1.0.0',
        icon: InfoCircle,
        iconColor: colors.gray900,
        iconVariant: 'Bold',
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
          console.log('Logout action');
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
