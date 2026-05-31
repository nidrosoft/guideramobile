import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import CachedImage from '@/components/common/CachedImage';
import { fetchDestinationCoverImage } from '@/utils/destinationImage';

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    return React.createElement('ExpoImage', { testID: 'expo-image', ...props });
  },
}));

jest.mock('@/utils/destinationImage', () => ({
  fetchDestinationCoverImage: jest.fn(),
}));

describe('CachedImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses a fresh destination image when the provided URL fails', async () => {
    (fetchDestinationCoverImage as jest.Mock).mockResolvedValue('https://images.example/fresh.jpg');

    const { getByTestId } = render(
      <CachedImage
        uri="https://lh3.googleusercontent.com/place-photos/expired=s1600-w1200"
        fallbackCityName="Budapest"
      />
    );

    act(() => {
      fireEvent(getByTestId('expo-image'), 'error');
    });

    await waitFor(() => {
      expect(fetchDestinationCoverImage).toHaveBeenCalledWith('Budapest');
      expect(getByTestId('expo-image').props.source).toEqual({
        uri: 'https://images.example/fresh.jpg',
      });
    });
  });
});
