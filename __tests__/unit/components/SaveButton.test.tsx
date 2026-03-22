/**
 * SaveButton Component Tests
 *
 * Basic render and interaction tests for the SaveButton component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock the hooks used by SaveButton
const mockToggleSave = jest.fn();
jest.mock('@/hooks/useSaveDestination', () => ({
  useSaveDestination: (id: string) => ({
    isSaved: id === 'saved-dest',
    toggleSave: mockToggleSave,
  }),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      textSecondary: '#666',
      primary: '#3FC39E',
      background: '#fff',
      textPrimary: '#000',
    },
    isDark: false,
  }),
}));

// Mock iconsax
jest.mock('iconsax-react-native', () => ({
  Bookmark: 'Bookmark',
}));

import SaveButton from '@/components/common/SaveButton';

describe('SaveButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { toJSON } = render(<SaveButton destinationId="test-dest-1" />);
    expect(toJSON()).toBeTruthy();
  });

  it('should call toggleSave when pressed', () => {
    const { getByRole } = render(<SaveButton destinationId="test-dest-1" />);

    // SaveButton is a TouchableOpacity, find it and press
    // Since we can't easily query by role in this setup,
    // let's use a different approach
    const { root } = render(<SaveButton destinationId="test-dest-1" />);

    // Find the touchable and press it
    fireEvent.press(root);
    expect(mockToggleSave).toHaveBeenCalledTimes(1);
  });

  it('should accept custom size prop', () => {
    const { toJSON } = render(<SaveButton destinationId="test-dest-1" size={32} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should accept custom style prop', () => {
    const { toJSON } = render(
      <SaveButton destinationId="test-dest-1" style={{ marginTop: 10 }} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
