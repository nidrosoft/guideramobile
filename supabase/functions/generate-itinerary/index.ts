/**
 * GENERATE ITINERARY — AI Trip Planner Edge Function
 * 
 * Generates a complete day-by-day itinerary for a trip using AI.
 * Fetches trip context (user profile, bookings, destination) from DB,
 * sends to Claude Haiku 4.5 (fallback: Gemini 2.5 Flash),
 * parses structured JSON output, and stores in itinerary_days + itinerary_activities.
 * 
 * Called when user taps "Let's Do It" on the SmartPlan bottom sheet.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || '';
const INCEPTION_API_KEY = Deno.env.get('INCEPTION_API_KEY') || '';
const TOMORROW_IO_API_KEY = Deno.env.get('TOMORROW_IO_API_KEY') || '';

// ─── Weather Forecast (Tomorrow.io) ──────────────────────

async function fetchWeatherForecast(
  city: string, country: string, startDate: string, days: number,
): Promise<any[]> {
  if (!TOMORROW_IO_API_KEY) return [];
  try {
    const location = `${city}, ${country}`;
    const res = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${encodeURIComponent(location)}&timesteps=1d&units=metric&apikey=${TOMORROW_IO_API_KEY}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    const dailyTimelines = data?.timelines?.daily || [];
    return dailyTimelines.slice(0, Math.min(days, 14)).map((d: any) => ({
      date: d.time?.split('T')[0],
      tempHigh: Math.round(d.values?.temperatureMax ?? 0),
      tempLow: Math.round(d.values?.temperatureMin ?? 0),
      rainChance: Math.round(d.values?.precipitationProbabilityMax ?? 0),
      humidity: Math.round(d.values?.humidityAvg ?? 0),
      uvIndex: Math.round(d.values?.uvIndexMax ?? 0),
      windSpeed: Math.round(d.values?.windSpeedAvg ?? 0),
      condition: d.values?.weatherCodeMax,
    }));
  } catch (e) {
    console.warn('[generate-itinerary] Weather fetch failed:', e);
    return [];
  }
}

// ─── Context Builder ─────────────────────────────────────

interface TripContext {
  trip: any;
  profile: any;
  bookings: any[];
  travelers: any[];
  weather: any[];
  travelPrefs: any;
  // Derived fields
  destCity: string;
  destCountry: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  tripPurpose: string;
  tripType: string;
  travelerComposition: string;
  childrenCount: number;
  infantCount: number;
  childrenAges: number[];
  hasCar: boolean;
  isLgbtqTraveler: boolean;
  userAge: number | null;
  budgetLevel: string;
  destinationTimezone: string;
  tripNotes: string;
}

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

async function buildTripContext(supabase: any, tripId: string): Promise<TripContext> {
  // Fetch trip first (needed for destination + dates)
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();
  if (tripErr || !trip) throw new Error(`Trip not found: ${tripErr?.message || 'unknown'}`);

  const destination = trip.destination || {};
  const destCity = destination.city || trip.primary_destination_name || trip.title || '';
  const destCountry = destination.country || trip.primary_destination_country || '';
  const startDate = trip.start_date || trip.startDate || '';
  const endDate = trip.end_date || trip.endDate || '';
  const durationDays = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 7;

  // Fetch everything in parallel for speed
  const [profileRes, bookingsRes, travelersRes, travelPrefsRes, weather] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', trip.user_id).single(),
    supabase.from('trip_bookings').select('*').eq('trip_id', tripId),
    supabase.from('trip_travelers').select('*').eq('trip_id', tripId),
    supabase.from('travel_preferences').select('*').eq('user_id', trip.user_id).maybeSingle(),
    fetchWeatherForecast(destCity, destCountry, startDate, durationDays),
  ]);

  const profile = profileRes.data || {};
  const travelers = travelersRes.data || [];
  const travelPrefs = travelPrefsRes?.data || {};

  // Derive children ages from trip_travelers
  const childTravelers = travelers.filter((t: any) =>
    t.traveler_type === 'child' || t.role === 'child' ||
    (t.age_at_travel && t.age_at_travel < 18)
  );
  const childrenAges = childTravelers
    .map((t: any) => t.age_at_travel || (t.date_of_birth ? calculateAge(t.date_of_birth) : null))
    .filter((a: number | null) => a !== null) as number[];

  // Derive LGBTQ+ flag
  const isLgbtqTraveler = !!(profile.gender === 'non_binary' ||
    profile.travel_preferences?.lgbtq_traveler ||
    profile.lgbtq_traveler ||
    travelPrefs?.lgbtq_traveler);

  return {
    trip,
    profile,
    bookings: bookingsRes.data || [],
    travelers,
    weather,
    travelPrefs,
    destCity,
    destCountry,
    startDate,
    endDate,
    durationDays,
    tripPurpose: trip.trip_purpose || trip.trip_type || 'leisure',
    tripType: trip.is_multi_destination ? 'multi_city' : 'round_trip',
    travelerComposition: trip.traveler_composition || 'solo',
    childrenCount: trip.children || childrenAges.filter((a: number) => a >= 2).length,
    infantCount: trip.infants || childrenAges.filter((a: number) => a < 2).length,
    childrenAges,
    hasCar: !!trip.has_cars,
    isLgbtqTraveler,
    userAge: calculateAge(profile.date_of_birth),
    budgetLevel: trip.budget_level || 'moderate',
    destinationTimezone: trip.destination_timezone || '',
    tripNotes: trip.notes || '',
  };
}

// ─── Prompt Builder ──────────────────────────────────────

function buildItineraryPrompt(ctx: TripContext): string {
  const { trip, profile, bookings, travelers, weather } = ctx;
  const {
    destCity, destCountry, startDate, endDate, durationDays,
    tripPurpose, tripType, travelerComposition, childrenCount, infantCount,
    childrenAges, hasCar, isLgbtqTraveler, userAge, budgetLevel,
    destinationTimezone, tripNotes,
  } = ctx;

  const start = new Date(startDate);

  // User profile info
  const userName = profile.first_name || 'Traveler';
  const userNationality = profile.nationality || profile.country || 'not_provided';
  const userGender = profile.gender || 'not_provided';
  const userProfession = profile.profession || 'not_provided';
  const userIndustry = profile.industry || 'not_provided';
  const userReligion = profile.religion || 'none';
  const userReligiousObservance = profile.religious_observance || 'none';
  // Merge: travel_preferences table (tp) is primary, profile fields are fallback
  const tp = ctx.travelPrefs || {};
  const travelPrefsJson = profile.travel_preferences || {};
  const travelStyle = tp.preferred_trip_styles?.[0] || travelPrefsJson.styles?.[0] || 'explorer';
  const interests = (tp.interests && tp.interests.length > 0) ? tp.interests : (travelPrefsJson.interests || []);
  const dietaryRestrictions = (tp.dietary_restrictions && tp.dietary_restrictions.length > 0) ? tp.dietary_restrictions : (travelPrefsJson.dietary_restrictions || []);
  const accessibilityNeeds = (tp.accessibility_needs && tp.accessibility_needs.length > 0) ? tp.accessibility_needs : (travelPrefsJson.accessibility_needs || []);
  const medicalConditions = (tp.medical_conditions && tp.medical_conditions.length > 0) ? tp.medical_conditions : (profile.medical_conditions || []);
  const morningPerson = tp.morning_person !== undefined ? tp.morning_person : (profile.morning_person !== false);
  const activityLevel = tp.activity_level || profile.activity_level || 'moderate';
  const foodAdventurousness = tp.food_adventurousness || profile.food_adventurousness || 'somewhat_adventurous';
  const cuisinePrefs = (tp.cuisine_preferences && tp.cuisine_preferences.length > 0) ? tp.cuisine_preferences : (profile.cuisine_preferences || []);
  const spiceTolerance = tp.spice_tolerance || profile.spice_tolerance || 'medium';
  const budgetTotal = trip.budget_total || 0;
  const budgetCurrency = trip.budget_currency || tp.default_currency || 'USD';
  const languagesSpoken = profile.languages_spoken || ['english'];
  const countriesVisited = profile.international_trips_count || 0;
  const passportCountry = profile.passport_country || 'not_provided';
  const homeCity = profile.city || profile.location_name || 'not_provided';
  const homeTimezone = profile.timezone || 'not_provided';
  const packingStyle = profile.packing_style || 'normal';
  const photographyLevel = tp.photography_level || profile.photography_level || 'phone_only';
  const crowdComfort = tp.crowd_comfort || 'tolerates';
  const sustainabilityPref = tp.sustainability_preference || 'moderate';

  // Experience level derived from countries visited
  const experienceLevel = countriesVisited >= 15 ? 'expert' :
    countriesVisited >= 6 ? 'frequent' :
    countriesVisited >= 2 ? 'occasional' : 'first_time_traveler';

  // Traveler composition
  const totalTravelerCount = (travelers?.length || 0) + 1;
  const travelerType = trip.traveler_composition || travelerComposition ||
    (totalTravelerCount === 1 ? 'solo' : totalTravelerCount === 2 ? 'couple' : 'group');
  const travelingWithChildren = childrenCount > 0 || infantCount > 0;
  const travelingWithSenior = travelers.some((t: any) =>
    (t.age_at_travel && t.age_at_travel >= 65) ||
    (t.date_of_birth && calculateAge(t.date_of_birth)! >= 65)
  );

  // Group bookings by type
  const flights = bookings.filter((b: any) => b.category === 'flight' || b.type === 'flight' || b.booking_type === 'flight');
  const hotels = bookings.filter((b: any) => b.category === 'hotel' || b.type === 'hotel' || b.booking_type === 'hotel');
  const experiences = bookings.filter((b: any) => b.category === 'activity' || b.category === 'experience' || b.type === 'activity' || b.booking_type === 'activity');
  const carRentals = bookings.filter((b: any) => b.category === 'car' || b.type === 'car' || b.booking_type === 'car');

  // Build the month name and season
  const monthName = start.toLocaleString('en-US', { month: 'long' });

  // Multi-destination info
  const allDestinations = trip.destinations || [];
  const multiDestBlock = allDestinations.length > 1
    ? `\nALL DESTINATIONS: ${JSON.stringify(allDestinations)}`
    : '';

  // Weather summary
  const weatherBlock = weather.length > 0
    ? `\nWEATHER FORECAST (${weather.length} days from Tomorrow.io):\n${weather.map((w: any) => `${w.date}: ${w.tempLow}-${w.tempHigh}°C, rain ${w.rainChance}%, UV ${w.uvIndex}, humidity ${w.humidity}%, wind ${w.windSpeed}km/h`).join('\n')}`
    : '';

  // For longer trips, instruct the AI to be more compact per day
  const compactNote = durationDays > 4
    ? `\nIMPORTANT: This is a ${durationDays}-day trip. Keep each activity description to 1 sentence max. Keep insider_tip to 1 short sentence. This ensures the full itinerary fits in the response.`
    : '';

  // Group composition block
  const groupBlock = travelers.length > 0
    ? `\nGROUP COMPOSITION: ${JSON.stringify(travelers.map((t: any) => ({
        name: t.first_name || 'Companion',
        age: t.age_at_travel || (t.date_of_birth ? calculateAge(t.date_of_birth) : null),
        gender: t.gender || 'not_provided',
        role: t.role || t.traveler_type || 'adult',
        relationship: t.relationship_to_owner || 'companion',
        dietary: t.dietary_restrictions || [],
        accessibility: t.accessibility_needs || [],
        medical: t.medical_conditions || [],
      })))}`
    : '';

  // Car rental block
  const carBlock = (hasCar || carRentals.length > 0)
    ? `\nCAR RENTAL: ${carRentals.length > 0 ? JSON.stringify(carRentals.map((c: any) => ({ title: c.summary_title, dates: `${c.summary_datetime}` }))) : 'Yes (booked separately)'}`
    : '';

  return `You are Guidera's Itinerary Intelligence Engine. Your singular mission is to generate the perfect day-by-day itinerary for this specific traveler. You are not a generic travel guide — every decision must be filtered through the traveler's complete profile.

=== TRIP IDENTITY ===
TRIP_PURPOSE: ${tripPurpose}
TRIP_TYPE: ${tripType}
DESTINATION: ${destCity}, ${destCountry}
DATES: ${startDate} to ${endDate} (${durationDays} days)
SEASON: ${monthName}
DESTINATION_TIMEZONE: ${destinationTimezone || 'infer from destination'}
${multiDestBlock}

=== TRAVELER PROFILE ===
Name: ${userName} | Nationality: ${userNationality} | Passport: ${passportCountry} | Gender: ${userGender} | Age: ${userAge || 'unknown'}
Home: ${homeCity} | Home Timezone: ${homeTimezone}
Profession: ${userProfession} | Industry: ${userIndustry}
Travel Style: ${travelStyle} | Activity Level: ${activityLevel} | Morning Person: ${morningPerson ? 'yes' : 'no'}
Photography Level: ${photographyLevel} | Crowd Comfort: ${crowdComfort} | Sustainability: ${sustainabilityPref}
Interests: ${interests.length > 0 ? interests.join(', ') : 'general sightseeing'}
Religion: ${userReligion} (${userReligiousObservance})
Diet: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'none'}
Medical: ${medicalConditions.length > 0 ? medicalConditions.join(', ') : 'none'}
Accessibility: ${accessibilityNeeds.length > 0 ? accessibilityNeeds.join(', ') : 'none'}
Food Adventurousness: ${foodAdventurousness} | Cuisine Pref: ${cuisinePrefs.length > 0 ? cuisinePrefs.join(', ') : 'local'} | Spice: ${spiceTolerance}
Languages: ${languagesSpoken.join(', ')} | Countries Visited: ${countriesVisited} | Experience Level: ${experienceLevel}
Budget: ${budgetTotal > 0 ? `${budgetTotal} ${budgetCurrency}` : budgetLevel} | Packing Style: ${packingStyle}
LGBTQ+ Traveler: ${isLgbtqTraveler ? 'yes' : 'no'}

=== GROUP ===
Total Travelers: ${totalTravelerCount} | Type: ${travelerType}
Children: ${childrenCount} | Infants: ${infantCount}${childrenAges.length > 0 ? ` | Ages: [${childrenAges.join(', ')}]` : ''}
Traveling with Senior: ${travelingWithSenior ? 'yes' : 'no'}
${groupBlock}

=== BOOKINGS ===
${flights.length > 0 ? `FLIGHTS:\n${JSON.stringify(flights.map((f: any) => ({ ref: f.booking_reference, title: f.summary_title, subtitle: f.summary_subtitle, date: f.summary_datetime, day: f.start_day })))}` : 'FLIGHTS: none booked'}
${hotels.length > 0 ? `HOTELS:\n${JSON.stringify(hotels.map((h: any) => ({ ref: h.booking_reference, title: h.summary_title, subtitle: h.summary_subtitle, date: h.summary_datetime, startDay: h.start_day, endDay: h.end_day })))}` : 'HOTELS: none booked'}
${experiences.length > 0 ? `EXPERIENCES (ANCHORS — must appear on scheduled day):\n${JSON.stringify(experiences.map((e: any) => ({ ref: e.booking_reference, title: e.summary_title, subtitle: e.summary_subtitle, date: e.summary_datetime, day: e.start_day })))}` : 'EXPERIENCES: none booked'}
${carBlock}
${weatherBlock}

${tripNotes ? `=== TRAVELER NOTES ===\n${tripNotes}\n` : ''}
=== THE 23 PERSONALIZATION FILTERS (apply ALL relevant) ===

FILTER 1 — PROFESSION INTELLIGENCE:
- Photographer/Content Creator: Protect golden hour every day (30min before sunrise + sunset). Include best photo spots with direction of light. Note drone permit rules. Schedule iconic shots on clearest weather days
- Medical Professional: Note nearest international hospital to each hotel. Include blood type/allergy communication card note
- Business/Corporate: If trip includes work, build hybrid plan (mornings business, afternoons explore). Include coworking spaces. Note time zone math relative to ${homeTimezone}
- Software Engineer/Remote Worker/Digital Nomad: Identify cafes with strong WiFi and power outlets. Note VPN requirements. Include coworking options with day pass pricing. Protect morning hours if different time zone for calls
- Chef/Food Professional: Include professional food market per destination. Open kitchen restaurants. Cooking class with local chef
- Journalist/Writer: Build in unscheduled wander time. Note authentic neighborhoods. Bookshops, cultural meeting points
- Athlete/Fitness: Morning workout options, running routes, gym day passes. Recovery time after intense activities. Note altitude if >2500m
- Architect/Designer: Include architectural highlights, design museums, craft districts
- Retired/Senior: Maximum 2 major activities per day. Midday rest 1-3pm. No more than 2km walking without seated break. Elevator-accessible attractions only if mobility needs
- Student/Young: Budget optimization. Free experiences, student discounts. Social elements, nightlife
- Apply ${userProfession} logic to every day's plan

FILTER 2 — DIETARY & FOOD ROUTING:
- ${dietaryRestrictions.length > 0 ? `Active restrictions: ${dietaryRestrictions.join(', ')}. EVERY restaurant MUST comply. In non-obvious destinations, identify specific compliant restaurants by name. Flag days far from compliant food zones` : 'No restrictions, but match food adventurousness level'}
- Adventurousness: ${foodAdventurousness}${foodAdventurousness === 'very_adventurous' ? ' → include one bold local specialty per city (insects, fermented, unusual cuts). Best street food markets, night markets, hawker centers' : foodAdventurousness === 'safe_choices' ? ' → stick to internationally recognized cuisine. Note familiar chains as fallback. Avoid suggesting street food without hygiene context' : ''}

FILTER 3 — RELIGION & OBSERVANCE (${userReligion}, ${userReligiousObservance}):
${userReligion === 'muslim' ? '- Include daily prayer times at destination. Build itinerary around prayer windows. For Friday: free time 11:30am-1:30pm for Jumu\'ah. Identify nearest mosque for each day. Exclude alcohol-heavy environments. If Ramadan during trip: adjust meal times, note iftar hours' : ''}${userReligion === 'jewish' ? '- Note Shabbat implications if observant (no travel planning Friday sunset to Saturday night). Identify kosher restaurants. Note Jewish quarter/synagogue proximity. Flag High Holiday dates if trip overlaps' : ''}${userReligion === 'hindu' ? '- Identify auspicious timing and temple etiquette in Hindu destinations. Note vegetarian requirements if observed. Respect cow sensitivity in India' : ''}${userReligion === 'christian' ? '- If Sunday is rest day: lighter schedule, church option if desired. Note Easter/Christmas significance if trip overlaps' : ''}${userReligion === 'none' || !userReligion ? '- No religion-specific modifications unless destination has strong religious character' : ''}

FILTER 4 — MEDICAL & ACCESSIBILITY:
${medicalConditions.includes('asthma') ? '- Asthma: Flag high pollution days. Avoid heavy-smoke environments. Note altitude risk above 2000m\n' : ''}${medicalConditions.includes('diabetes') || medicalConditions.includes('diabetes_type_2') ? '- Diabetes: Never plan more than 3-4 hours without meal/snack break. Note pharmacies near hotels. Flag strenuous activities affecting blood sugar. Include cold storage for insulin\n' : ''}${accessibilityNeeds.length > 0 ? `- Accessibility (${accessibilityNeeds.join(', ')}): Every attraction must be accessible. Note non-accessible famous sites with alternative views. Flag cobblestones, steps. Identify accessible transport\n` : ''}${medicalConditions.includes('anxiety') ? '- Anxiety: Generous downtime. No back-to-back high-stimulus experiences. Include restorative calm activities. Note quiet neighborhoods\n' : ''}- Apply ALL medical conditions: ${medicalConditions.length > 0 ? medicalConditions.join(', ') : 'none'}

FILTER 5 — GROUP COMPOSITION:
${travelerType === 'solo' && userGender === 'female' ? '- SOLO FEMALE: Safety-aware routing. Avoid isolated areas in evening. Prioritize well-lit populated areas after dark. Recommend rideshare over street taxis at night. Flag areas with street harassment reputation. Include women-friendly neighborhoods\n' : ''}${travelerType === 'solo' ? '- Solo: Include social opportunities (group tours, traveler meetup spots). Note restaurants welcoming solo diners (bar seating, counter)\n' : ''}${travelerType === 'couple' || tripPurpose === 'honeymoon' ? '- Couple/Honeymoon: Include minimum one romantic experience per day (sunset viewpoint, private dinner, couples spa). Atmospheric restaurants. Protect sunrise/sunset for couple moments. Include one spontaneous wander afternoon\n' : ''}${travelingWithChildren && childrenAges.some((a: number) => a < 5) ? `- Young Children (ages: ${childrenAges.filter((a: number) => a < 5).join(',')}): Morning nap window 9:30-11:30am. Afternoon nap 1:30-3:30pm. Max 1.5km walking between activities. Stroller-friendly venues. Family restaurants with kids menus. Playground breaks every 2 days. Nearest pediatric facility to hotel\n` : ''}${travelingWithChildren && childrenAges.some((a: number) => a >= 6 && a <= 12) ? `- School-Age Children (ages: ${childrenAges.filter((a: number) => a >= 6 && a <= 12).join(',')}): Educational + fun balance. Interactive museum sections. Cap activities at 90min. One adventurous activity per day. Check age restrictions\n` : ''}${travelingWithSenior ? '- Senior Traveler: Max 2 major activities per day. Midday rest 1-3pm. Ground-level/elevator-accessible only if mobility needs. Max 2km walking without seated break\n' : ''}- Group type: ${travelerType}, total ${totalTravelerCount} travelers

FILTER 6 — BUDGET (${budgetTotal > 0 ? `${budgetTotal} ${budgetCurrency}` : budgetLevel}):
- Match ALL suggestions to budget level. Include estimated daily spend (excluding pre-booked). Note the most expensive day. Suggest money-saving swaps if total exceeds budget

FILTER 7 — ENERGY CURVE:
- Day1=gentle arrival (jet lag adjustment if time zone diff >6h between ${homeTimezone} and destination). Day2=peak energy (most demanding activities). Mid-trip=rest afternoon every 4th day. Last day=light, logistics focus
- Trips under 4 days: compress, peak on Day 1-2. Trips over 10 days: designated slow day every 4th day
- Day after major activity (trek, full-day diving): lighter next day
- Activity level: ${activityLevel}

FILTER 8 — MORNING PERSON (${morningPerson ? 'yes' : 'no'}):
${morningPerson ? '- Anchor best activity in morning. Sunrise experiences welcome. Evening winds down by 9-10pm' : '- First activity NEVER before 9:30am. Midday and afternoon are power hours. Evening activities extended (night markets, late dining, live music). Skip sunrise unless specifically requested'}

FILTER 9 — EXPERIENCE LEVEL (${experienceLevel}):
${experienceLevel === 'first_time_traveler' || experienceLevel === 'occasional' ? '- Include logistical context (how to take metro, call taxi). Flag cultural differences. Stick to well-documented attractions. Include orientation tour. Essential phrases in local language' : '- Skip basics. Go deep on hidden gems and off-tourist-trail. Neighborhoods locals frequent. Challenge with one thing they would never find on their own'}

FILTER 10 — INTEREST INTERSECTION:
- Prioritize activities matching: ${interests.length > 0 ? interests.join(', ') : 'general sightseeing'}. Cross-reference with available activities at ${destCity}

FILTER 11 — WEATHER RESPONSIVENESS:
- USE FORECAST DATA. Rain >60%: move outdoor to alternate day, indoor alternatives. Extreme heat >35°C: outdoors before 11am and after 4pm only. High UV >8: note sun protection. Perfect day: assign most outdoor activity. Use exact sunrise/sunset times for photographers

FILTER 12 — GEOGRAPHIC CLUSTERING:
- NEVER make traveler cross same ground twice. Group activities by neighborhood. Max 20-30min transport between consecutive activities. Plan lunch within geographic cluster. Multi-neighborhood structure: morning cluster → lunch nearby → afternoon adjacent neighborhood → evening restaurant

FILTER 13 — OPENING HOURS & CLOSURES:
- Verify: open on scheduled day of week? Open during season? Advance booking required? Last entry time? Lunch break closure (1-3pm at some sites)?

FILTER 14 — LAYOVER INTELLIGENCE:
- For every flight connection: assess connection time risk. Flag <90min international connections. For long layovers >5h: suggest activity. Transit visa check for ${passportCountry}

FILTER 15 — FLIGHT DAY PLANNING:
- Arrival: add 30-60min for immigration. Calculate realistic ride to hotel. Arrival after 6pm=evening only plan. Before 2pm=half-day possible with jet lag buffer. Before 10am overnight flight=no check-in until 3pm, suggest luggage storage + light exploration
- Departure: work backward. International=3h before. Domestic=2h. Add transport + checkout buffer. Late departure=half-day plan. Morning departure=light final evening

FILTER 16 — CULTURAL CALENDAR:
- Research and flag any religious festivals, public holidays, or major events during ${startDate} to ${endDate} at ${destCity}. If positive spectacle: plan traveler INTO celebration. If disruptive: advise on closures and alternatives

FILTER 17 — SUSTAINABILITY:
- Exclude unethical animal tourism. Prefer local guides, family-run restaurants, community cooperatives. For overtourism sites: suggest least crowded time

FILTER 18 — PREVIOUS VISIT AWARENESS:
- Countries visited: ${countriesVisited}. ${countriesVisited > 0 ? 'If traveler has been to this destination before, avoid standard tourist highlights, go deeper' : 'First-time: include iconic must-sees'}

FILTER 19 — ACCOMMODATION PROXIMITY:
- Day 1: plan activities near hotel. Note walkable radius from hotel. Add transport time for activities far from hotel. On checkout day: account for luggage logistics

FILTER 20 — LOCAL TRANSPORT:
- What is the reliable rideshare app at ${destCity}? (Grab in SE Asia, Bolt in Europe, Careem in Middle East). Is metro tourist-navigable? Tuk-tuk safe? Walking primary mode?${hasCar ? ' Car rental available: flag days when driving makes sense vs parking nightmares' : ''}

FILTER 21 — CONNECTIVITY & TECH:
${userProfession?.toLowerCase().includes('remote') || userProfession?.toLowerCase().includes('developer') || userProfession?.toLowerCase().includes('engineer') || userProfession?.toLowerCase().includes('nomad') ? '- Remote worker: identify WiFi cafes and coworking spaces along route. Protect working window each day' : ''}- Note if destination requires VPN. SIM/eSIM recommendation. Offline maps necessity

FILTER 22 — LANGUAGE:
- Traveler speaks: ${languagesSpoken.join(', ')}. Note where local language knowledge helps. Include 5-8 essential phrases in local language as a note

FILTER 23 — SPONTANEITY:
- At least one free afternoon in any trip over 4 days. One wander-with-no-plan block (usually Day 2-3 afternoon). Note neighborhoods that reward wandering. Avoid hour-by-hour scheduling for every block
${isLgbtqTraveler ? `\nLGBTQ+ SAFETY: Traveler identifies as LGBTQ+. Research legal status at ${destCity}. Flag any risks. Recommend safe neighborhoods and venues. Advise on PDA norms. If destination is hostile: provide specific safety guidance without being alarmist` : ''}
${compactNote}

Return ONLY valid JSON:
{"metadata":{"total_days":${durationDays},"destination":"${destCity}","trip_purpose":"${tripPurpose}","personalization_applied":[],"conflicts_detected":[],"warnings":[],"layover_alerts":[]},"days":[{"day_number":1,"date":"YYYY-MM-DD","day_of_week":"Name","day_type":"arrival|full_day|departure|travel_day|slow_day","location":"city","hotel":"hotel name if booked","theme":"Evocative phrase","neighborhood_focus":"area","estimated_cost_usd":0,"weather_note":"conditions","activities":[{"time_start":"HH:MM","time_end":"HH:MM","title":"Real place name","type":"attraction|restaurant|activity|transport|hotel|shopping|rest","category":"nature|culture|food|adventure|wellness|shopping|transport","description":"Why this matters for THIS traveler","location_name":"address/area","duration_minutes":0,"cost_usd":0,"is_booked":false,"insider_tip":"Specific non-generic tip","personalization_tags":[],"photo_opportunity":false,"accessibility_rating":"easy|moderate|challenging","meal_type":null}],"meals":{"breakfast":{"name":"Real name","cuisine":"type","price_usd":0,"why":"reason"},"lunch":{},"dinner":{}},"logistics":{"primary_transport":"mode","transport_app":"app name","estimated_transport_cost_usd":0},"local_phrase":{"phrase":"local phrase","meaning":"translation","context":"when to use"},"warnings":[]}],"trip_summary":{"total_estimated_cost_usd":0,"cost_breakdown":{"activities":0,"food":0,"local_transport":0,"misc":0},"top_highlights":[],"must_book_in_advance":[],"key_warnings":[],"essential_phrases":[{"phrase":"","meaning":"","context":""}]}}

RULES:
- All restaurants/attractions must be REAL named places in ${destCity}
- 3-5 activities per full day (fewer on arrival/departure)
- Insider tips must be specific and non-generic
- Booked experiences MUST appear on their scheduled day as anchors
- Every meal suggestion MUST comply with dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'none'}
- Return ONLY JSON, no other text`;
}

// ─── AI Providers ────────────────────────────────────────

const PROVIDER_TIMEOUT_MS = 70_000;

async function callGemini(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 32768, responseMimeType: 'application/json' },
        }),
      },
    );
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } finally {
    clearTimeout(timer);
  }
}

async function callHaiku(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 32768,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Haiku API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || '';
  } finally {
    clearTimeout(timer);
  }
}

// ─── JSON Parser ─────────────────────────────────────────

function parseItineraryJSON(raw: string): any {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (_) { /* fallback to regex extraction */ }

  // Extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in AI response');
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    // If JSON is truncated (common with long outputs), try to recover
    // by finding the last complete day entry and closing the structure
    let truncated = jsonMatch[0];
    
    // Try to close truncated arrays/objects
    const openBraces = (truncated.match(/\{/g) || []).length;
    const closeBraces = (truncated.match(/\}/g) || []).length;
    const openBrackets = (truncated.match(/\[/g) || []).length;
    const closeBrackets = (truncated.match(/\]/g) || []).length;
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) truncated += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) truncated += '}';
    
    try {
      const recovered = JSON.parse(truncated);
      console.warn('[generate-itinerary] Recovered truncated JSON');
      return recovered;
    } catch (_) {
      throw new Error(`Failed to parse itinerary JSON: ${(parseErr as Error).message}`);
    }
  }
}

// ─── DB Storage ──────────────────────────────────────────

async function storeItinerary(supabase: any, tripId: string, parsed: any, modelUsed: string): Promise<void> {
  const days = parsed.days || [];

  // Clear any existing itinerary for this trip
  const { data: existingDays } = await supabase
    .from('itinerary_days')
    .select('id')
    .eq('trip_id', tripId);

  if (existingDays && existingDays.length > 0) {
    const dayIds = existingDays.map((d: any) => d.id);
    await supabase.from('itinerary_activities').delete().in('day_id', dayIds);
    await supabase.from('itinerary_days').delete().eq('trip_id', tripId);
  }

  // Insert days and activities
  for (const day of days) {
    const { data: insertedDay, error: dayErr } = await supabase
      .from('itinerary_days')
      .insert({
        trip_id: tripId,
        day_number: day.day_number,
        date: day.date,
        title: day.theme || `Day ${day.day_number}`,
        day_type: day.day_type || 'full_day',
        theme: day.theme,
        neighborhood_focus: day.neighborhood_focus,
        day_of_week: day.day_of_week,
        location: day.location,
        hotel: day.hotel || null,
        weather: day.weather_note ? { summary: day.weather_note } : null,
        estimated_cost: day.estimated_cost_usd || null,
        currency: 'USD',
        logistics: day.logistics || null,
        meals: day.meals || {},
        local_phrase: day.local_phrase || null,
        warnings: day.warnings || [],
        generated_by: modelUsed,
      })
      .select()
      .single();

    if (dayErr) {
      console.error(`Failed to insert day ${day.day_number}:`, dayErr);
      continue;
    }

    // Insert activities for this day
    const activities = day.activities || [];
    const meals = day.meals || {};

    // Convert meals to activities
    const mealActivities = [];
    if (meals.breakfast?.name) {
      mealActivities.push({
        time_start: '08:00',
        title: meals.breakfast.name,
        type: 'restaurant',
        category: 'food',
        description: meals.breakfast.why || `${meals.breakfast.cuisine || 'Local'} breakfast`,
        cost_usd: meals.breakfast.price_usd,
        meal_type: 'breakfast',
      });
    }
    if (meals.lunch?.name) {
      mealActivities.push({
        time_start: '12:30',
        title: meals.lunch.name,
        type: 'restaurant',
        category: 'food',
        description: meals.lunch.why || `${meals.lunch.cuisine || 'Local'} lunch`,
        cost_usd: meals.lunch.price_usd,
        meal_type: 'lunch',
      });
    }
    if (meals.dinner?.name) {
      mealActivities.push({
        time_start: '19:00',
        title: meals.dinner.name,
        type: 'restaurant',
        category: 'food',
        description: meals.dinner.why || `${meals.dinner.cuisine || 'Local'} dinner`,
        cost_usd: meals.dinner.price_usd,
        meal_type: 'dinner',
      });
    }

    // Combine and sort all activities by time
    const allActivities = [...activities, ...mealActivities].sort((a: any, b: any) => {
      const tA = a.time_start || '12:00';
      const tB = b.time_start || '12:00';
      return tA.localeCompare(tB);
    });

    // Insert each activity
    for (let i = 0; i < allActivities.length; i++) {
      const act = allActivities[i];
      const { error: actErr } = await supabase
        .from('itinerary_activities')
        .insert({
          day_id: insertedDay.id,
          type: act.type || 'activity',
          title: act.title || 'Untitled',
          subtitle: act.category ? act.category.charAt(0).toUpperCase() + act.category.slice(1) : null,
          description: act.description || null,
          start_time: act.time_start || '09:00',
          end_time: act.time_end || null,
          duration_minutes: act.duration_minutes || null,
          location: act.location_name ? { name: act.location_name } : null,
          cost: act.cost_usd ? { amount: act.cost_usd, currency: 'USD' } : null,
          category: act.category || null,
          insider_tip: act.insider_tip || null,
          personalization_tags: act.personalization_tags || [],
          accessibility_rating: act.accessibility_rating || null,
          photo_opportunity: act.photo_opportunity || false,
          is_booked: act.is_booked || false,
          meal_type: act.meal_type || null,
          booking_url: act.booking_url || null,
          booking_required: !!act.booking_url,
          tips: act.insider_tip ? [act.insider_tip] : [],
          position: i,
          generated_by: modelUsed,
        });

      if (actErr) {
        console.error(`Failed to insert activity "${act.title}":`, actErr);
      }
    }
  }

  // Store trip summary metadata — MERGE with existing generation_status to avoid overwriting other modules
  const { data: currentTrip } = await supabase
    .from('trips')
    .select('generation_status')
    .eq('id', tripId)
    .single();

  const existingStatus = currentTrip?.generation_status || {};
  await supabase
    .from('trips')
    .update({
      generation_status: {
        ...existingStatus,
        itinerary: 'ready',
        itinerary_generated_at: new Date().toISOString(),
        itinerary_model: modelUsed,
        itinerary_summary: parsed.trip_summary || null,
        itinerary_metadata: parsed.metadata || null,
      },
    })
    .eq('id', tripId);
}

// ─── Main Handler ────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { tripId } = await req.json();
    if (!tripId) throw new Error('tripId is required');

    console.log(`[generate-itinerary] Starting for trip ${tripId}`);

    // Mark as generating — MERGE with existing status
    const { data: tripBefore } = await supabase
      .from('trips')
      .select('generation_status')
      .eq('id', tripId)
      .single();
    const prevStatus = tripBefore?.generation_status || {};
    await supabase
      .from('trips')
      .update({
        generation_status: {
          ...prevStatus,
          itinerary: 'generating',
          itinerary_started_at: new Date().toISOString(),
        },
      })
      .eq('id', tripId);

    // Step 1: Build context
    console.log('[generate-itinerary] Building context...');
    const ctx = await buildTripContext(supabase, tripId);

    // Step 2: Build prompt
    const prompt = buildItineraryPrompt(ctx);
    console.log(`[generate-itinerary] Prompt built (${prompt.length} chars)`);

    // Step 3: Call AI
    // Primary: Gemini 3 Flash (frontier-class, fast, structured output)
    // Fallback: Claude Haiku 4.5 (highest quality)
    const durationDays = ctx.trip.start_date && ctx.trip.end_date
      ? Math.ceil((new Date(ctx.trip.end_date).getTime() - new Date(ctx.trip.start_date).getTime()) / 86400000)
      : 7;

    let rawResponse: string;
    let modelUsed: string;

    const providers: { name: string; call: (p: string) => Promise<string> }[] = [
      { name: 'gemini-3-flash-preview', call: callGemini },
      { name: 'claude-haiku-4-5', call: callHaiku },
    ];

    console.log(`[generate-itinerary] ${durationDays}-day trip, trying ${providers.map(p => p.name).join(' → ')}`);

    let lastError: string = '';
    rawResponse = '';
    modelUsed = '';

    for (const provider of providers) {
      try {
        const startMs = Date.now();
        rawResponse = await provider.call(prompt);
        modelUsed = provider.name;
        const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
        console.log(`[generate-itinerary] ${provider.name} succeeded in ${elapsed}s`);
        break;
      } catch (err: any) {
        lastError = `${provider.name}: ${err.message}`;
        console.warn(`[generate-itinerary] ${provider.name} failed:`, err.message);
      }
    }

    if (!rawResponse) {
      throw new Error(`All AI providers failed. ${lastError}`);
    }

    // Step 4: Parse JSON
    console.log('[generate-itinerary] Parsing response...');
    const parsed = parseItineraryJSON(rawResponse);

    if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      throw new Error('AI returned empty or invalid itinerary');
    }

    // Step 5: Store in DB
    console.log(`[generate-itinerary] Storing ${parsed.days.length} days...`);
    await storeItinerary(supabase, tripId, parsed, modelUsed);

    console.log('[generate-itinerary] Complete!');

    return new Response(
      JSON.stringify({
        success: true,
        daysGenerated: parsed.days.length,
        activitiesGenerated: parsed.days.reduce((sum: number, d: any) => sum + (d.activities?.length || 0), 0),
        modelUsed,
        summary: parsed.trip_summary || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('[generate-itinerary] Error:', error);

    // Mark as failed — MERGE with existing status
    try {
      const { tripId } = await req.clone().json().catch(() => ({ tripId: null }));
      if (tripId) {
        const { data: tripNow } = await supabase
          .from('trips')
          .select('generation_status')
          .eq('id', tripId)
          .single();
        const curStatus = tripNow?.generation_status || {};
        await supabase
          .from('trips')
          .update({
            generation_status: {
              ...curStatus,
              itinerary: 'failed',
              itinerary_error: error.message,
              itinerary_failed_at: new Date().toISOString(),
            },
          })
          .eq('id', tripId);
      }
    } catch (_) { /* ignore cleanup errors */ }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
