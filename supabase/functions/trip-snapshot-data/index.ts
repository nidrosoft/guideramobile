/**
 * TRIP SNAPSHOT DATA — Phase A
 * Fast live data: flights, hotels, experiences, events, cost estimate.
 * Proxies to trip-snapshot with phase=data (no AI brief, no web search).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authorization = req.headers.get('authorization') || `Bearer ${serviceKey}`;
    const apikey = req.headers.get('apikey') || serviceKey;

    const res = await fetch(`${supabaseUrl}/functions/v1/trip-snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        apikey,
      },
      body: JSON.stringify({ ...body, phase: 'data', skipRateLimit: false }),
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('trip-snapshot-data error:', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch snapshot data', details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
