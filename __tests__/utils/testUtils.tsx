/**
 * Test Utilities
 * 
 * Provides helper functions and custom render methods for testing.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Custom render function that wraps components with necessary providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react-native';

// Override render with custom render
export { customRender as render };

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Create a mock function that resolves after a delay
 */
export const createDelayedMock = <T,>(value: T, delay = 100) =>
  jest.fn(() => new Promise<T>((resolve) => setTimeout(() => resolve(value), delay)));

/**
 * Create a mock function that rejects after a delay
 */
export const createDelayedRejectMock = (error: Error, delay = 100) =>
  jest.fn(() => new Promise((_, reject) => setTimeout(() => reject(error), delay)));

/**
 * Mock navigation object
 */
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  canGoBack: jest.fn(() => true),
};

/**
 * Mock route object
 */
export const mockRoute = {
  key: 'test-key',
  name: 'TestScreen',
  params: {},
};

/**
 * Helper to create mock store state
 */
export function createMockStoreState<T>(initialState: T) {
  let state = initialState;

  return {
    getState: () => state,
    setState: (newState: Partial<T>) => {
      state = { ...state, ...newState };
    },
    reset: () => {
      state = initialState;
    },
  };
}
