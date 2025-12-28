/**
 * Jest Setup File
 * 
 * This file runs before each test file.
 * Use it to set up global mocks and configurations.
 */

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
}));

// Mock expo-network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
  NetworkStateType: {
    WIFI: 'wifi',
    CELLULAR: 'cellular',
    NONE: 'none',
    UNKNOWN: 'unknown',
  },
}));

// Mock @sentry/react-native
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withErrorBoundary: (component) => component,
  withProfiler: (component) => component,
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Silence console warnings in tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set up global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
