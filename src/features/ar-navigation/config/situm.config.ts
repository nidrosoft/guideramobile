/**
 * SITUM CONFIGURATION
 * 
 * Configuration for Situm indoor positioning.
 * Update these values with your actual Situm credentials and building IDs.
 */

export const SITUM_CONFIG = {
  // API Key - Get from Situm Dashboard
  API_KEY: process.env.SITUM_API_KEY || 'YOUR_SITUM_API_KEY',
  
  // Building IDs - Update with your actual building identifiers
  BUILDINGS: {
    AIRPORT_TERMINAL_1: 'airport-terminal-1',
    AIRPORT_TERMINAL_2: 'airport-terminal-2',
  },
  
  // Positioning settings
  POSITIONING: {
    USE_WIFI: true,
    USE_BLE: true,
    USE_GPS: true,
    UPDATE_INTERVAL: 1000, // milliseconds
    ACCURACY_THRESHOLD: 5, // meters
  },
  
  // Routing settings
  ROUTING: {
    ACCESSIBLE_ROUTES: false, // Use accessible routes (elevators, ramps)
    OFF_ROUTE_THRESHOLD: 5, // meters
    RECALCULATE_THRESHOLD: 10, // meters
  },
  
  // POI Categories
  POI_CATEGORIES: {
    GATE: 'gate',
    RESTROOM: 'restroom',
    FOOD_COURT: 'food_court',
    SHOP: 'shop',
    SECURITY: 'security',
    CHECK_IN: 'check_in',
    BAGGAGE_CLAIM: 'baggage_claim',
    INFO_DESK: 'info_desk',
  },
};

export default SITUM_CONFIG;
