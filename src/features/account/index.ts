/**
 * ACCOUNT FEATURE
 * 
 * Main export for the Account feature module.
 */

// Screens
export { default as AccountScreen } from './screens/AccountScreen';

// Components
export { default as ProfileHeader } from './components/ProfileHeader';
export { default as AccountMenuItem } from './components/AccountMenuItem';
export { default as AccountSection } from './components/AccountSection';

// Config
export { ACCOUNT_SECTIONS, PROFILE_QUICK_ACTIONS } from './config/accountSections.config';

// Types
export * from './types/account.types';
