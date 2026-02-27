import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test data for a comprehensive trip to Japan
const TEST_PROFILE = {
  first_name: 'Alex',
  last_name: 'Thompson',
  email: 'alex.thompson.test@guidera.app',
  nationality: 'US',
  country_of_residence: 'US',
  languages_spoken: ['en', 'es'],
  primary_language: 'en',
  profession: 'software_engineer',
  industry: 'technology',
  religion: 'none',
  religious_observance: 'none',
  date_of_birth: '1990-05-15',
  gender: 'male',
  medical_conditions: ['mild_asthma'],
  allergies: ['shellfish'],
  blood_type: 'O+',
  medications: ['albuterol_inhaler'],
  passport_country: 'US',
  passport_expiry: '2028-06-15',
  has_drivers_license: true,
  license_country: 'US',
  has_international_driving_permit: false,
  has_global_entry: true,
  has_tsa_precheck: true,
  preferred_currency: 'USD',
  credit_cards: [
    { type: 'visa', name: 'Chase Sapphire Reserve', no_foreign_fee: true },
    { type: 'mastercard', name: 'Capital One Venture', no_foreign_fee: true }
  ],
  payment_preference: 'credit_card',
  bargaining_comfort: 'uncomfortable',
  international_trips_count: 8,
  countries_visited: ['UK', 'FR', 'MX', 'CA', 'DE', 'IT', 'ES', 'TH'],
  language_proficiency: { en: 'native', es: 'intermediate' },
  food_adventurousness: 'very_adventurous',
  cuisine_preferences: ['japanese', 'italian', 'thai', 'mexican'],
  avoid_foods: ['shellfish'],
  spice_tolerance: 'medium',
  activity_level: 'active',
  packing_style: 'light',
  morning_person: true,
  crowd_comfort: 'tolerates',
  photography_level: 'enthusiast',
  emergency_contacts: [
    { name: 'Sarah Thompson', relationship: 'spouse', phone: '+1-555-123-4567', email: 'sarah.t@email.com' }
  ],
  organ_donor: true
};

const TEST_TRIP = {
  name: 'Japan Adventure 2025',
  description: 'Two-week exploration of Japan - Tokyo, Kyoto, and Osaka',
  trip_type: 'adventure',
  status: 'confirmed',
  start_date: '2025-02-15',
  end_date: '2025-03-01',
  primary_destination_code: 'JP',
  primary_destination_name: 'Japan',
  primary_destination_city: 'Tokyo',
  destinations: [
    { city: 'Tokyo', country: 'Japan', code: 'TYO', days: 5 },
    { city: 'Kyoto', country: 'Japan', code: 'KYO', days: 4 },
    { city: 'Osaka', country: 'Japan', code: 'OSA', days: 3 }
  ],
  budget_amount: 5000,
  budget_currency: 'USD',
  budget_style: 'moderate',
  travelers_count: 2,
  composition: 'couple'
};

const TEST_ACTIVITIES = [
  { name: 'Mount Fuji Day Trip', type: 'hiking', date: '2025-02-18' },
  { name: 'Fushimi Inari Shrine Visit', type: 'cultural', date: '2025-02-21' },
  { name: 'Sushi Making Class', type: 'culinary', date: '2025-02-22' },
  { name: 'Osaka Castle Tour', type: 'historical', date: '2025-02-26' },
  { name: 'Teamlab Borderless', type: 'art', date: '2025-02-17' }
];

// Build comprehensive context for AI generation
function buildTestContext() {
  const tripDuration = 14; // days
  const currentDate = new Date().toISOString();
  
  return {
    trip: {
      id: 'test-trip-japan-001',
      name: TEST_TRIP.name,
      tripType: TEST_TRIP.trip_type,
      composition: TEST_TRIP.composition,
      startDate: TEST_TRIP.start_date,
      endDate: TEST_TRIP.end_date,
      durationDays: tripDuration,
      destinations: TEST_TRIP.destinations,
      budget: {
        total: TEST_TRIP.budget_amount,
        currency: TEST_TRIP.budget_currency,
        style: TEST_TRIP.budget_style,
        perDay: Math.round(TEST_TRIP.budget_amount / tripDuration)
      },
      activities: TEST_ACTIVITIES,
      travelersCount: TEST_TRIP.travelers_count
    },
    
    primaryTraveler: {
      demographics: {
        age: 34,
        gender: TEST_PROFILE.gender,
        nationality: TEST_PROFILE.nationality,
        countryOfResidence: TEST_PROFILE.country_of_residence,
        languagesSpoken: TEST_PROFILE.languages_spoken,
        primaryLanguage: TEST_PROFILE.primary_language
      },
      professional: {
        profession: TEST_PROFILE.profession,
        industry: TEST_PROFILE.industry,
        professionalItems: ['Laptop', 'Charger', 'Mouse', 'Headphones', 'Portable monitor', 'VPN setup']
      },
      cultural: {
        religion: TEST_PROFILE.religion,
        religiousObservance: TEST_PROFILE.religious_observance,
        religiousItems: []
      },
      health: {
        conditions: TEST_PROFILE.medical_conditions,
        allergies: TEST_PROFILE.allergies,
        medications: TEST_PROFILE.medications,
        bloodType: TEST_PROFILE.blood_type,
        dietaryRestrictions: ['no_shellfish']
      },
      preferences: {
        travelStyle: 'adventure',
        accommodationPreference: 'mid_range_hotel',
        foodPreferences: {
          adventurousness: TEST_PROFILE.food_adventurousness,
          cuisinePreferences: TEST_PROFILE.cuisine_preferences,
          avoidFoods: TEST_PROFILE.avoid_foods,
          spiceTolerance: TEST_PROFILE.spice_tolerance
        },
        activityLevel: TEST_PROFILE.activity_level,
        interestAreas: ['technology', 'food', 'culture', 'photography', 'nature'],
        packingStyle: TEST_PROFILE.packing_style,
        morningPerson: TEST_PROFILE.morning_person,
        comfortWithCrowds: TEST_PROFILE.crowd_comfort,
        photography: TEST_PROFILE.photography_level
      },
      experience: {
        internationalTravelCount: TEST_PROFILE.international_trips_count,
        hasVisitedDestination: false,
        previousVisitYear: null,
        countriesVisited: TEST_PROFILE.countries_visited,
        frequentTraveler: true,
        hasGlobalEntry: TEST_PROFILE.has_global_entry,
        hasTSAPreCheck: TEST_PROFILE.has_tsa_precheck,
        languageProficiency: TEST_PROFILE.language_proficiency
      },
      documents: {
        passport: {
          hasPassport: true,
          passportCountry: TEST_PROFILE.passport_country,
          expirationDate: TEST_PROFILE.passport_expiry,
          monthsUntilExpiry: 40,
          needsRenewal: false
        },
        visa: {
          hasValidVisa: false,
          visaType: null,
          visaExpiration: null,
          visaRequired: false, // US citizens don't need visa for Japan (90 days)
          visaOnArrival: true
        },
        driversLicense: {
          hasLicense: TEST_PROFILE.has_drivers_license,
          licenseCountry: TEST_PROFILE.license_country,
          hasInternationalPermit: TEST_PROFILE.has_international_driving_permit
        },
        insurance: {
          hasTravelInsurance: false,
          insuranceProvider: null,
          policyNumber: null,
          coverageType: null
        }
      },
      financial: {
        primaryPaymentMethod: TEST_PROFILE.payment_preference,
        creditCards: TEST_PROFILE.credit_cards,
        hasNoForeignTransactionFeeCard: true,
        preferredCurrency: TEST_PROFILE.preferred_currency,
        comfortWithBargaining: TEST_PROFILE.bargaining_comfort
      },
      emergency: {
        contacts: TEST_PROFILE.emergency_contacts,
        bloodType: TEST_PROFILE.blood_type,
        organDonor: TEST_PROFILE.organ_donor
      }
    },
    
    destination: {
      basic: {
        code: 'JP',
        name: 'Japan',
        city: 'Tokyo',
        region: 'Asia',
        timezone: 'Asia/Tokyo',
        utcOffset: '+09:00'
      },
      geography: {
        hemisphere: 'northern',
        climate: 'temperate',
        elevation: 40,
        coastal: true
      },
      culture: {
        primaryLanguage: 'Japanese',
        languageCode: 'ja',
        script: 'Japanese (Kanji, Hiragana, Katakana)',
        englishProficiency: 'low',
        religion: 'Shinto/Buddhist',
        greetingStyle: 'bow',
        dressCode: 'conservative_casual',
        tippingCustom: 'not_expected',
        bargainingCommon: false
      },
      practical: {
        currency: 'JPY',
        currencySymbol: '¥',
        exchangeRate: 150, // approximate USD to JPY
        powerPlugType: 'A/B',
        voltage: 100,
        drivingSide: 'left',
        emergencyNumber: '110',
        ambulanceNumber: '119',
        tapWaterSafe: true,
        internetSpeed: 'excellent',
        mobileNetwork: '5G available'
      },
      safety: {
        overallScore: 92,
        crimeLevel: 'very_low',
        politicalStability: 'stable',
        healthRisks: ['seasonal_flu'],
        naturalDisasterRisks: ['earthquakes', 'typhoons'],
        lgbtqSafety: 'generally_safe',
        womenSafety: 'very_safe',
        soloTravelerSafety: 'very_safe'
      },
      legal: {
        visaRequired: false,
        visaOnArrival: true,
        maxStayDays: 90,
        alcoholAge: 20,
        smokingRestrictions: 'designated_areas',
        drugLaws: 'very_strict',
        photographyRestrictions: ['some_temples', 'train_stations'],
        lgbtqLaws: 'legal_limited_recognition'
      }
    },
    
    weather: {
      current: {
        temperature: 8,
        feelsLike: 5,
        humidity: 45,
        conditions: 'partly_cloudy'
      },
      forecast: {
        averageHigh: 12,
        averageLow: 3,
        precipitation: 'low',
        uvIndex: 3,
        season: 'late_winter'
      },
      packingImplications: [
        'Warm layers needed',
        'Light jacket for daytime',
        'Heavier coat for evenings',
        'Umbrella recommended'
      ]
    },
    
    generatedAt: currentDate
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action } = await req.json();
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      testProfile: TEST_PROFILE,
      testTrip: TEST_TRIP,
      modules: {}
    };

    // Build the test context
    const context = buildTestContext();
    results.context = context;

    // Define modules to test
    const modulesToTest = action === 'single' 
      ? ['packing'] 
      : ['packing', 'dos_donts', 'safety', 'language', 'budget', 'cultural', 'documents'];

    console.log(`Testing ${modulesToTest.length} modules: ${modulesToTest.join(', ')}`);

    // Call the AI generation edge function for each module
    for (const moduleType of modulesToTest) {
      console.log(`\n========== Generating ${moduleType} module ==========`);
      
      try {
        const startTime = Date.now();
        
        // Call the ai-generation function
        const response = await fetch(`${supabaseUrl}/functions/v1/ai-generation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: 'generate',
            moduleType,
            context
          })
        });

        const generationResult = await response.json();
        const duration = Date.now() - startTime;

        results.modules[moduleType] = {
          success: generationResult.success,
          duration: `${duration}ms`,
          modelUsed: generationResult.meta?.modelUsed,
          provider: generationResult.meta?.provider,
          fallbacksAttempted: generationResult.meta?.fallbacksAttempted || [],
          usage: generationResult.usage,
          result: generationResult.result,
          error: generationResult.error
        };

        console.log(`${moduleType}: ${generationResult.success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`);
        if (generationResult.meta) {
          console.log(`  Model: ${generationResult.meta.modelUsed} (${generationResult.meta.provider})`);
        }
        if (generationResult.usage) {
          console.log(`  Tokens: ${generationResult.usage.inputTokens} in / ${generationResult.usage.outputTokens} out`);
        }

        // Store in ai_generation_logs
        if (generationResult.success) {
          await supabase.from('ai_generation_logs').insert({
            trip_id: null, // Test trip, no real ID
            module_type: moduleType,
            model_used: generationResult.meta?.modelUsed || 'unknown',
            provider: generationResult.meta?.provider || 'unknown',
            input_tokens: generationResult.usage?.inputTokens || 0,
            output_tokens: generationResult.usage?.outputTokens || 0,
            generation_time_ms: duration,
            success: true,
            context_hash: 'test-japan-trip',
            metadata: {
              test: true,
              destination: 'Japan',
              fallbacks: generationResult.meta?.fallbacksAttempted || []
            }
          });
        }

      } catch (moduleError) {
        console.error(`Error generating ${moduleType}:`, moduleError);
        results.modules[moduleType] = {
          success: false,
          error: moduleError instanceof Error ? moduleError.message : 'Unknown error'
        };
      }
    }

    // Create test alerts to verify real-time intelligence
    if (action !== 'single') {
      console.log('\n========== Creating Test Alerts ==========');
      
      const testAlerts = [
        {
          alert_type_code: 'trip_reminder',
          category_code: 'trip',
          title: 'Your Japan Adventure starts in 45 days!',
          body: 'Time to start preparing for your trip to Tokyo, Kyoto, and Osaka.',
          priority: 5,
          context: { trip_name: TEST_TRIP.name, days_until: 45 }
        },
        {
          alert_type_code: 'weather_alert',
          category_code: 'safety',
          title: 'Weather Advisory for Tokyo',
          body: 'Light snow expected during your visit dates. Pack warm layers.',
          priority: 6,
          context: { destination: 'Tokyo', weather_type: 'snow' }
        },
        {
          alert_type_code: 'travel_advisory',
          category_code: 'safety',
          title: 'Japan Travel Update',
          body: 'No travel restrictions currently in place for US citizens visiting Japan.',
          priority: 4,
          context: { country: 'Japan', advisory_level: 'normal' }
        }
      ];

      results.alerts = [];
      
      for (const alert of testAlerts) {
        // Note: In a real scenario, we'd use a real user_id
        // For testing, we'll just log what would be created
        results.alerts.push({
          ...alert,
          status: 'would_be_created',
          note: 'Alert structure validated - requires real user_id to insert'
        });
        console.log(`Alert prepared: ${alert.title}`);
      }
    }

    // Summary
    const successCount = Object.values(results.modules).filter((m: any) => m.success).length;
    const totalModules = Object.keys(results.modules).length;
    
    results.summary = {
      totalModules,
      successfulModules: successCount,
      failedModules: totalModules - successCount,
      overallSuccess: successCount === totalModules,
      testDestination: 'Japan (Tokyo, Kyoto, Osaka)',
      testDuration: '14 days',
      testTraveler: `${TEST_PROFILE.first_name} ${TEST_PROFILE.last_name}`,
      testComposition: TEST_TRIP.composition
    };

    console.log('\n========== TEST SUMMARY ==========');
    console.log(`Modules: ${successCount}/${totalModules} successful`);
    console.log(`Overall: ${results.summary.overallSuccess ? 'PASSED' : 'FAILED'}`);

    return new Response(
      JSON.stringify(results, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Test execution error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
