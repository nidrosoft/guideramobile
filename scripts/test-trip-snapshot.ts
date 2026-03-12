/**
 * Quick test script for the trip-snapshot edge function.
 * Run: npx ts-node scripts/test-trip-snapshot.ts
 * Or:  npx tsx scripts/test-trip-snapshot.ts
 */

const SUPABASE_URL = 'https://pkydmdygctojtfzbqcud.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/trip-snapshot`;

async function testSnapshot() {
  console.log('🚀 Testing trip-snapshot edge function...\n');

  const payload = {
    destination: 'Paris',
    country: 'France',
    startDate: '2026-04-15',
    endDate: '2026-04-22',
    travelers: { adults: 2, children: 0, infants: 0 },
    currency: 'USD',
  };

  console.log('📦 Request payload:', JSON.stringify(payload, null, 2), '\n');

  const start = Date.now();

  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`⏱  Response received in ${elapsed}s (status: ${res.status})\n`);

    if (!res.ok) {
      const text = await res.text();
      console.error('❌ Error response:', text);
      return;
    }

    const data = await res.json();

    // ─── Summary ───
    console.log('═══════════════════════════════════════');
    console.log('  TRIP SNAPSHOT RESULTS');
    console.log('═══════════════════════════════════════\n');

    console.log(`📍 Destination: ${data.destination} (${data.country || 'N/A'})`);
    console.log(`📅 Dates: ${data.dates?.start} → ${data.dates?.end} (${data.dates?.nights} nights)`);
    console.log(`👥 Travelers: ${data.travelers?.total} (${data.travelers?.adults} adults)\n`);

    // Cost Estimate
    const cost = data.costEstimate;
    if (cost) {
      console.log('💰 COST ESTIMATE');
      console.log(`   Total: $${cost.low?.toLocaleString()} – $${cost.high?.toLocaleString()} ${cost.currency}`);
      console.log(`   Flights:     $${cost.breakdown?.flights?.low} – $${cost.breakdown?.flights?.high}`);
      console.log(`   Hotels:      $${cost.breakdown?.hotels?.low} – $${cost.breakdown?.hotels?.high}`);
      console.log(`   Experiences: $${cost.breakdown?.experiences?.low} – $${cost.breakdown?.experiences?.high}`);
      console.log(`   Food:        $${cost.breakdown?.food?.low} – $${cost.breakdown?.food?.high}`);
      console.log();
    } else {
      console.log('💰 Cost estimate: ❌ missing\n');
    }

    // Flights
    if (data.flights) {
      console.log('✈️  FLIGHTS');
      if (data.flights.cheapest) {
        const c = data.flights.cheapest;
        console.log(`   Cheapest: $${c.price} — ${c.airline}, ${c.stops === 0 ? 'Direct' : c.stops + ' stop(s)'}, ${c.duration}`);
      }
      if (data.flights.fastest) {
        const f = data.flights.fastest;
        console.log(`   Fastest:  $${f.price} — ${f.airline}, ${f.stops === 0 ? 'Direct' : f.stops + ' stop(s)'}, ${f.duration}`);
      }
      console.log(`   Avg price: $${data.flights.avgPrice}`);
      console.log();
    } else {
      console.log('✈️  Flights: ⚠️  no origin airport provided (expected)\n');
    }

    // Hotels
    if (data.hotels) {
      console.log('🏨 HOTELS');
      if (data.hotels.budget) console.log(`   Budget (3★):    $${data.hotels.budget.avgPrice}/night (${data.hotels.budget.count} found)`);
      if (data.hotels.midRange) console.log(`   Mid-Range (4★): $${data.hotels.midRange.avgPrice}/night (${data.hotels.midRange.count} found)`);
      if (data.hotels.luxury) console.log(`   Luxury (5★):    $${data.hotels.luxury.avgPrice}/night (${data.hotels.luxury.count} found)`);
      console.log();
    } else {
      console.log('🏨 Hotels: ❌ no data returned\n');
    }

    // Experiences
    if (data.experiences?.length) {
      console.log(`⭐ EXPERIENCES (${data.experiences.length})`);
      for (const exp of data.experiences) {
        console.log(`   • ${exp.title}`);
        console.log(`     ★${exp.rating} (${exp.reviewCount} reviews) · $${exp.price} · ${exp.duration}${exp.freeCancellation ? ' · Free cancel' : ''}`);
      }
      console.log();
    } else {
      console.log('⭐ Experiences: ❌ none returned\n');
    }

    // Events
    if (data.events?.length) {
      console.log(`🎉 EVENTS (${data.events.length})`);
      for (const evt of data.events) {
        console.log(`   • ${evt.name} (${evt.category}) — ${evt.dateRange}${evt.isFree ? ' [Free]' : ''}`);
      }
      console.log();
    } else {
      console.log('🎉 Events: ❌ none returned\n');
    }

    // AI Brief
    if (data.aiBrief) {
      console.log('🤖 AI TRAVEL BRIEF');
      console.log('   ' + data.aiBrief.split('\n').join('\n   '));
      console.log();
    } else {
      console.log('🤖 AI Brief: ❌ not generated\n');
    }

    console.log(`⏰ Generated at: ${data.generatedAt}`);
    console.log('\n✅ Test complete!');

  } catch (err) {
    console.error('❌ Request failed:', err);
  }
}

testSnapshot();
