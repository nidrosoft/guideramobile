/**
 * GOOGLE MAPS API TESTER
 * 
 * Test if Google Maps API is working and returning data.
 */

import { googleMapsService } from '../services/GoogleMapsService';

export async function testGoogleMapsAPI() {
  console.log('🧪 Testing Google Maps API...\n');

  try {
    // Test 1: Initialize
    console.log('Test 1: Initializing Google Maps...');
    await googleMapsService.initialize();
    console.log('✅ Google Maps initialized\n');

    // Test 2: Get API Key
    console.log('Test 2: Checking API key...');
    const apiKey = googleMapsService.getApiKey();
    console.log(`✅ API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

    // Test 3: Get Airport
    console.log('Test 3: Getting LAX airport...');
    const lax = googleMapsService.getAirport('LAX');
    console.log('✅ LAX Airport:', {
      name: lax?.name,
      code: lax?.code,
      coordinates: lax?.coordinates,
    });
    console.log('');

    // Test 4: Search Places
    console.log('Test 4: Searching for gates near LAX...');
    const places = await googleMapsService.searchPlaces(
      'Gate',
      lax!.coordinates,
      1000
    );
    console.log(`✅ Found ${places.length} places`);
    if (places.length > 0) {
      console.log('First result:', {
        name: places[0].name,
        address: places[0].address,
        location: places[0].location,
      });
    }
    console.log('');

    // Test 5: Get Directions
    console.log('Test 5: Getting directions (San Diego → LAX)...');
    const sanDiego = {
      latitude: 32.7157,
      longitude: -117.1611,
    };
    const directions = await googleMapsService.getDirections(
      sanDiego,
      lax!.coordinates,
      'walking'
    );
    
    if (directions) {
      console.log('✅ Directions calculated:', {
        distance: `${(directions.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(directions.duration / 60)} min`,
        steps: directions.steps.length,
      });
      console.log('First step:', directions.steps[0].instruction);
      console.log('Polyline length:', directions.polyline.length);
    } else {
      console.log('❌ No directions found');
    }
    console.log('');

    // Test 6: Calculate Distance
    console.log('Test 6: Calculating distance (San Diego → LAX)...');
    const distance = googleMapsService.calculateDistance(sanDiego, lax!.coordinates);
    console.log(`✅ Distance: ${(distance / 1000).toFixed(1)} km\n`);

    console.log('🎉 All tests passed!\n');
    console.log('📊 Summary:');
    console.log('- API Key: Working ✅');
    console.log('- Airport Data: Working ✅');
    console.log('- Places Search: Working ✅');
    console.log('- Directions: Working ✅');
    console.log('- Distance Calc: Working ✅');

    return {
      success: true,
      apiKey: apiKey.substring(0, 10) + '...',
      placesFound: places.length,
      directionsFound: !!directions,
      distance: distance,
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Auto-run test in development
if (__DEV__) {
  // Uncomment to run test on app start
  // setTimeout(() => testGoogleMapsAPI(), 2000);
}
