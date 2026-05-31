import { renderHook, waitFor } from '@testing-library/react-native';
import * as ExpoLocation from 'expo-location';
import { useHomepage } from '@/features/homepage/hooks/useHomepage';
import { homepageService } from '@/features/homepage/services/homepageService';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    profile: {
      id: 'profile-san-diego',
      city: 'San Diego',
      country: 'United States',
      location_name: 'San Diego, California, United States',
      latitude: 32.7157,
      longitude: -117.1611,
      timezone: 'America/Los_Angeles',
    },
  }),
}));

jest.mock('@/features/homepage/services/homepageService', () => ({
  homepageService: {
    getHomepage: jest.fn(),
    trackInteraction: jest.fn(),
    toggleSaved: jest.fn(),
  },
}));

describe('useHomepage location params', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (homepageService.getHomepage as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        sections: [],
        meta: {
          userId: 'profile-san-diego',
          personalizationScore: 0,
          strategyUsed: 'cold',
          sectionsReturned: 0,
          totalItemsReturned: 0,
          generatedAt: new Date().toISOString(),
          cacheHit: true,
          responseTimeMs: 1,
        },
      },
    });
  });

  it('uses the saved onboarding profile location when device GPS is unavailable', async () => {
    (ExpoLocation.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    renderHook(() => useHomepage({ autoFetch: true, includeLocation: true }));

    await waitFor(() => {
      expect(homepageService.getHomepage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'profile-san-diego',
          latitude: 32.7157,
          longitude: -117.1611,
          timezone: 'America/Los_Angeles',
        })
      );
    });
  });
});
