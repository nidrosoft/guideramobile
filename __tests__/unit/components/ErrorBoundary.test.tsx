/**
 * ErrorBoundary Component Tests
 */

import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '@/components/common/error';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Child content</Text>
      </ErrorBoundary>
    );

    expect(getByText('Child content')).toBeTruthy();
  });

  it('should render fallback UI when an error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Unable to load this section')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <Text>Custom error message</Text>;

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom error message')).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('should show global level error message', () => {
    const { getByText } = render(
      <ErrorBoundary level="global">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should show feature level error message', () => {
    const { getByText } = render(
      <ErrorBoundary level="feature">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('This feature encountered an error')).toBeTruthy();
  });

  it('should reset error state when Try Again is pressed', () => {
    const onReset = jest.fn();
    
    // We need to control when error is thrown
    let shouldThrow = true;
    const ControlledError = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <Text>Recovered</Text>;
    };

    const { getByText, rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <ControlledError />
      </ErrorBoundary>
    );

    // Error should be shown
    expect(getByText('Try Again')).toBeTruthy();

    // Stop throwing error
    shouldThrow = false;

    // Press Try Again
    fireEvent.press(getByText('Try Again'));

    expect(onReset).toHaveBeenCalled();
  });

  it('should show Report Issue button', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Report Issue')).toBeTruthy();
  });
});
