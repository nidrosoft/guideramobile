/**
 * TEST TRIP SERVICES EDGE FUNCTION
 * Verifies Trip Planning System implementation
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const results: TestResult[] = [];

  try {
    const { testType } = await req.json().catch(() => ({ testType: 'all' }));

    // Test 1: Verify trips table schema
    if (testType === 'all' || testType === 'schema') {
      results.push(await testTripsTableSchema());
      results.push(await testTripTravelersTable());
      results.push(await testTripBookingsTable());
      results.push(await testTripActivitiesTable());
      results.push(await testTripImportsTable());
      results.push(await testTripInvitationsTable());
      results.push(await testUserEmailAliasesTable());
      results.push(await testLinkedTravelAccountsTable());
    }

    // Test 2: Test CRUD operations
    if (testType === 'all' || testType === 'crud') {
      results.push(await testCreateTrip());
      results.push(await testUpdateTrip());
      results.push(await testAddTraveler());
      results.push(await testAddActivity());
      results.push(await testTripTransitions());
    }

    // Test 3: Test triggers
    if (testType === 'all' || testType === 'triggers') {
      results.push(await testSlugGeneration());
      results.push(await testTransitionCalculation());
    }

    const allPassed = results.every(r => r.passed);

    return new Response(
      JSON.stringify({
        success: allPassed,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: allPassed ? 200 : 500,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// ============================================
// SCHEMA TESTS
// ============================================

async function testTripsTableSchema(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('id, slug, owner_id, status, trip_type, adults, budget_total, is_collaborative, share_link_enabled')
      .limit(1);

    if (error) throw error;

    return {
      test: 'trips_table_schema',
      passed: true,
      message: 'Trips table has required columns',
    };
  } catch (error: any) {
    return {
      test: 'trips_table_schema',
      passed: false,
      message: `Schema error: ${error.message}`,
    };
  }
}

async function testTripTravelersTable(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('trip_travelers')
      .select('id, trip_id, user_id, first_name, role, is_owner, invitation_status')
      .limit(1);

    if (error) throw error;

    return {
      test: 'trip_travelers_table',
      passed: true,
      message: 'trip_travelers table exists with required columns',
    };
  } catch (error: any) {
    return {
      test: 'trip_travelers_table',
      passed: false,
      message: `Table error: ${error.message}`,
    };
  }
}

async function testTripBookingsTable(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('trip_bookings')
      .select('id, trip_id, booking_id, display_order, start_day')
      .limit(1);

    if (error) throw error;

    return {
      test: 'trip_bookings_table',
      passed: true,
      message: 'trip_bookings table exists with required columns',
    };
  } catch (error: any) {
    return {
      test: 'trip_bookings_table',
      passed: false,
      message: `Table error: ${error.message}`,
    };
  }
}

async function testTripActivitiesTable(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('trip_activities')
      .select('id, trip_id, title, category, day_number, start_time')
      .limit(1);

    if (error) throw error;

    return {
      test: 'trip_activities_table',
      passed: true,
      message: 'trip_activities table exists with required columns',
    };
  } catch (error: any) {
    return {
      test: 'trip_activities_table',
      passed: false,
      message: `Table error: ${error.message}`,
    };
  }
}

async function testTripImportsTable(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('trip_imports')
      .select('id, trip_id, user_id, import_method, parse_status, processing_status')
      .limit(1);

    if (error) throw error;

    return {
      test: 'trip_imports_table',
      passed: true,
      message: 'trip_imports table exists with required columns',
    };
  } catch (error: any) {
    return {
      test: 'trip_imports_table',
      passed: false,
      message: `Table error: ${error.message}`,
    };
  }
}

async function testTripInvitationsTable(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select('id, trip_id, invited_email, invited_by, token, status')
      .limit(1);

    if (error) throw error;

    return {
      test: 'trip_invitations_table',
      passed: true,
      message: 'trip_invitations table exists with required columns',
    };
  } catch (error: any) {
    return {
      test: 'trip_invitations_table',
      passed: false,
      message: `Table error: ${error.message}`,
    };
  }
}

async function testUserEmailAliasesTable(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('user_email_aliases')
      .select('id, user_id, alias_email, is_active')
      .limit(1);

    if (error) throw error;

    return {
      test: 'user_email_aliases_table',
      passed: true,
      message: 'user_email_aliases table exists with required columns',
    };
  } catch (error: any) {
    return {
      test: 'user_email_aliases_table',
      passed: false,
      message: `Table error: ${error.message}`,
    };
  }
}

async function testLinkedTravelAccountsTable(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('linked_travel_accounts')
      .select('id, user_id, provider, status, auto_sync_enabled')
      .limit(1);

    if (error) throw error;

    return {
      test: 'linked_travel_accounts_table',
      passed: true,
      message: 'linked_travel_accounts table exists with required columns',
    };
  } catch (error: any) {
    return {
      test: 'linked_travel_accounts_table',
      passed: false,
      message: `Table error: ${error.message}`,
    };
  }
}

// ============================================
// CRUD TESTS
// ============================================

async function testCreateTrip(): Promise<TestResult> {
  try {
    // Create a test trip
    // Get a test user ID
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!testUser) {
      return {
        test: 'create_trip',
        passed: false,
        message: 'No test user found in profiles table',
      };
    }

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: testUser.id,
        title: 'Test Trip - Verification',
        status: 'draft',
        trip_type: 'leisure',
        destination: { name: 'Paris', country: 'France' },
        primary_destination_name: 'Paris',
        primary_destination_country: 'France',
        start_date: '2025-06-01',
        end_date: '2025-06-07',
        adults: 2,
        budget_total: 5000,
        budget_currency: 'USD',
      })
      .select()
      .single();

    if (error) throw error;

    // Clean up
    await supabase.from('trips').delete().eq('id', trip.id);

    return {
      test: 'create_trip',
      passed: true,
      message: 'Successfully created and deleted test trip',
      data: { tripId: trip.id, slug: trip.slug },
    };
  } catch (error: any) {
    return {
      test: 'create_trip',
      passed: false,
      message: `Create trip error: ${error.message}`,
    };
  }
}

async function testUpdateTrip(): Promise<TestResult> {
  try {
    // Get a test user ID
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!testUser) {
      return {
        test: 'update_trip',
        passed: false,
        message: 'No test user found in profiles table',
      };
    }

    // Create a test trip
    const { data: trip, error: createError } = await supabase
      .from('trips')
      .insert({
        user_id: testUser.id,
        title: 'Test Trip - Update Test',
        status: 'draft',
        destination: { name: 'London', country: 'UK' },
        start_date: '2025-07-01',
        end_date: '2025-07-07',
      })
      .select()
      .single();

    if (createError) throw createError;

    // Update the trip
    const { data: updated, error: updateError } = await supabase
      .from('trips')
      .update({
        title: 'Updated Test Trip',
        status: 'planning',
        budget_total: 3000,
      })
      .eq('id', trip.id)
      .select()
      .single();

    if (updateError) throw updateError;

    const passed = updated.title === 'Updated Test Trip' && updated.status === 'planning';

    // Clean up
    await supabase.from('trips').delete().eq('id', trip.id);

    return {
      test: 'update_trip',
      passed,
      message: passed ? 'Successfully updated trip' : 'Update did not apply correctly',
    };
  } catch (error: any) {
    return {
      test: 'update_trip',
      passed: false,
      message: `Update trip error: ${error.message}`,
    };
  }
}

async function testAddTraveler(): Promise<TestResult> {
  try {
    // Get a test user ID
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!testUser) {
      return {
        test: 'add_traveler',
        passed: false,
        message: 'No test user found in profiles table',
      };
    }

    // Create a test trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: testUser.id,
        title: 'Test Trip - Traveler Test',
        status: 'draft',
        destination: { name: 'Tokyo', country: 'Japan' },
        start_date: '2025-08-01',
        end_date: '2025-08-10',
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // Add a traveler
    const { data: traveler, error: travelerError } = await supabase
      .from('trip_travelers')
      .insert({
        trip_id: trip.id,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        role: 'traveler',
        traveler_type: 'adult',
      })
      .select()
      .single();

    if (travelerError) throw travelerError;

    // Clean up
    await supabase.from('trip_travelers').delete().eq('id', traveler.id);
    await supabase.from('trips').delete().eq('id', trip.id);

    return {
      test: 'add_traveler',
      passed: true,
      message: 'Successfully added traveler to trip',
    };
  } catch (error: any) {
    return {
      test: 'add_traveler',
      passed: false,
      message: `Add traveler error: ${error.message}`,
    };
  }
}

async function testAddActivity(): Promise<TestResult> {
  try {
    // Get a test user ID
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!testUser) {
      return {
        test: 'add_activity',
        passed: false,
        message: 'No test user found in profiles table',
      };
    }

    // Create a test trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: testUser.id,
        title: 'Test Trip - Activity Test',
        status: 'draft',
        destination: { name: 'Rome', country: 'Italy' },
        start_date: '2025-06-01',
        end_date: '2025-06-07',
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // Add an activity
    const { data: activity, error: activityError } = await supabase
      .from('trip_activities')
      .insert({
        trip_id: trip.id,
        title: 'Visit Eiffel Tower',
        category: 'sightseeing',
        day_number: 2,
        start_time: '10:00',
        duration_minutes: 120,
      })
      .select()
      .single();

    if (activityError) throw activityError;

    // Clean up
    await supabase.from('trip_activities').delete().eq('id', activity.id);
    await supabase.from('trips').delete().eq('id', trip.id);

    return {
      test: 'add_activity',
      passed: true,
      message: 'Successfully added activity to trip',
    };
  } catch (error: any) {
    return {
      test: 'add_activity',
      passed: false,
      message: `Add activity error: ${error.message}`,
    };
  }
}

async function testTripTransitions(): Promise<TestResult> {
  try {
    // Get a test user ID
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!testUser) {
      return {
        test: 'trip_transitions',
        passed: false,
        message: 'No test user found in profiles table',
      };
    }

    // Create a test trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: testUser.id,
        title: 'Test Trip - Transition Test',
        status: 'draft',
        destination: { name: 'Barcelona', country: 'Spain' },
        start_date: '2025-09-01',
        end_date: '2025-09-07',
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // Transition draft -> planning
    const { data: planning, error: planningError } = await supabase
      .from('trips')
      .update({ status: 'planning', previous_status: 'draft' })
      .eq('id', trip.id)
      .select()
      .single();

    if (planningError) throw planningError;

    // Transition planning -> confirmed
    const { data: confirmed, error: confirmedError } = await supabase
      .from('trips')
      .update({ status: 'confirmed', previous_status: 'planning' })
      .eq('id', trip.id)
      .select()
      .single();

    if (confirmedError) throw confirmedError;

    // Clean up
    await supabase.from('trips').delete().eq('id', trip.id);

    return {
      test: 'trip_transitions',
      passed: confirmed.status === 'confirmed',
      message: 'Successfully transitioned trip through states',
    };
  } catch (error: any) {
    return {
      test: 'trip_transitions',
      passed: false,
      message: `Transition error: ${error.message}`,
    };
  }
}

// ============================================
// TRIGGER TESTS
// ============================================

async function testSlugGeneration(): Promise<TestResult> {
  try {
    // Get a test user ID
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!testUser) {
      return {
        test: 'slug_generation',
        passed: false,
        message: 'No test user found in profiles table',
      };
    }

    // Create a trip without a slug
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: testUser.id,
        title: 'My Amazing Paris Trip 2025',
        status: 'draft',
        destination: { name: 'Paris', country: 'France' },
        start_date: '2025-10-01',
        end_date: '2025-10-07',
      })
      .select()
      .single();

    if (error) throw error;

    const hasSlug = trip.slug && trip.slug.length > 0;
    const slugFormat = /^[a-z0-9-]+$/.test(trip.slug);

    // Clean up
    await supabase.from('trips').delete().eq('id', trip.id);

    return {
      test: 'slug_generation',
      passed: hasSlug && slugFormat,
      message: hasSlug ? `Slug generated: ${trip.slug}` : 'Slug not generated',
      data: { slug: trip.slug },
    };
  } catch (error: any) {
    return {
      test: 'slug_generation',
      passed: false,
      message: `Slug generation error: ${error.message}`,
    };
  }
}

async function testTransitionCalculation(): Promise<TestResult> {
  try {
    // Get a test user ID
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!testUser) {
      return {
        test: 'transition_calculation',
        passed: false,
        message: 'No test user found in profiles table',
      };
    }

    // Create a trip with dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45); // 45 days from now
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: testUser.id,
        title: 'Test Trip - Transition Calc',
        status: 'confirmed',
        destination: { name: 'Berlin', country: 'Germany' },
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      })
      .select('*, transition_to_upcoming_at, transition_to_ongoing_at, transition_to_completed_at')
      .single();

    if (error) throw error;

    const hasTransitions = 
      trip.transition_to_upcoming_at !== null ||
      trip.transition_to_ongoing_at !== null ||
      trip.transition_to_completed_at !== null;

    // Clean up
    await supabase.from('trips').delete().eq('id', trip.id);

    return {
      test: 'transition_calculation',
      passed: hasTransitions,
      message: hasTransitions 
        ? 'Transition timestamps calculated' 
        : 'Transition timestamps not set (trigger may not be active)',
      data: {
        upcoming: trip.transition_to_upcoming_at,
        ongoing: trip.transition_to_ongoing_at,
        completed: trip.transition_to_completed_at,
      },
    };
  } catch (error: any) {
    return {
      test: 'transition_calculation',
      passed: false,
      message: `Transition calculation error: ${error.message}`,
    };
  }
}
