Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });

  const apiKey = Deno.env.get('RAPIDAPI_KEY');
  const results: any = { hasKey: !!apiKey, keyPrefix: apiKey ? apiKey.substring(0, 6) + '...' : 'none' };

  try {
    // Step 1: Location lookup
    const locRes = await fetch(
      `https://booking-com.p.rapidapi.com/v1/hotels/locations?name=Paris&locale=en-us`,
      { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'booking-com.p.rapidapi.com' } },
    );
    results.locStatus = locRes.status;
    results.locHeaders = Object.fromEntries(locRes.headers.entries());
    const locBody = await locRes.text();
    results.locBody = locBody.substring(0, 500);

    if (locRes.ok) {
      const locations = JSON.parse(locBody);
      results.locCount = locations.length;
      if (locations[0]) {
        results.destId = locations[0].dest_id;
        results.destType = locations[0].dest_type;
        results.destName = locations[0].name || locations[0].city_name;

        // Step 2: Hotel search
        const params = new URLSearchParams({
          dest_id: String(locations[0].dest_id),
          dest_type: locations[0].dest_type || 'city',
          checkin_date: '2026-04-15',
          checkout_date: '2026-04-22',
          adults_number: '2',
          room_number: '1',
          order_by: 'price',
          units: 'metric',
          filter_by_currency: 'USD',
          locale: 'en-us',
          page_number: '0',
        });

        const htlRes = await fetch(
          `https://booking-com.p.rapidapi.com/v1/hotels/search?${params}`,
          { headers: { 'x-rapidapi-key': apiKey!, 'x-rapidapi-host': 'booking-com.p.rapidapi.com' } },
        );
        results.htlStatus = htlRes.status;
        const htlBody = await htlRes.text();
        results.htlBodyLen = htlBody.length;
        results.htlBody = htlBody.substring(0, 800);
      }
    }
  } catch (e) {
    results.error = String(e);
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
