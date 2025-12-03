/**
 * GOOGLE MAPS CONFIGURATION
 * 
 * Configuration for Google Maps Navigation SDK.
 * API key should be restricted in Google Cloud Console.
 */

export const GOOGLE_MAPS_CONFIG = {
  // API Key - Add your key here
  // Get from: https://console.cloud.google.com/google/maps-apis
  API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  
  // Styling
  THEME: {
    primaryColor: '#7C3AED', // Purple
    navigationLineColor: '#7C3AED',
    trafficEnabled: false, // Not needed for indoor
  },
  
  // Navigation Settings
  NAVIGATION: {
    voiceGuidance: true,
    speedLimit: false, // Not relevant indoors
    recenterButton: true,
    compassButton: true,
  },
  
  // Indoor Settings
  INDOOR: {
    showIndoorLevelPicker: true,
    showIndoorMaps: true,
  },
  
  // Major US Airports (Google Maps has these pre-mapped)
  AIRPORTS: {
    LAX: {
      name: 'Los Angeles International Airport',
      code: 'LAX',
      coordinates: {
        latitude: 33.9416,
        longitude: -118.4085,
      },
      terminals: ['1', '2', '3', '4', '5', '6', '7', '8', 'TBIT'],
    },
    JFK: {
      name: 'John F. Kennedy International Airport',
      code: 'JFK',
      coordinates: {
        latitude: 40.6413,
        longitude: -73.7781,
      },
      terminals: ['1', '4', '5', '7', '8'],
    },
    ORD: {
      name: "Chicago O'Hare International Airport",
      code: 'ORD',
      coordinates: {
        latitude: 41.9742,
        longitude: -87.9073,
      },
      terminals: ['1', '2', '3', '5'],
    },
    ATL: {
      name: 'Hartsfield-Jackson Atlanta International Airport',
      code: 'ATL',
      coordinates: {
        latitude: 33.6407,
        longitude: -84.4277,
      },
      terminals: ['Domestic', 'International'],
    },
    DFW: {
      name: 'Dallas/Fort Worth International Airport',
      code: 'DFW',
      coordinates: {
        latitude: 32.8998,
        longitude: -97.0403,
      },
      terminals: ['A', 'B', 'C', 'D', 'E'],
    },
    SFO: {
      name: 'San Francisco International Airport',
      code: 'SFO',
      coordinates: {
        latitude: 37.6213,
        longitude: -122.3790,
      },
      terminals: ['1', '2', '3', 'International'],
    },
  },
};

export default GOOGLE_MAPS_CONFIG;
