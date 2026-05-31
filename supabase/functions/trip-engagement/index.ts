/**
 * TRIP ENGAGEMENT EDGE FUNCTION
 *
 * Cron-driven "smart drip" engine. On each run it emits at most one engaging,
 * personalized notification per trip — packing items, documents, phrases,
 * etiquette tips, itinerary highlights, budget checks, journal nudges — pulled
 * from the trip's already-generated content. Phase-aware (before / during /
 * after), quota-limited, deduped, and timezone/quiet-hours aware.
 *
 * Architecture: plugin-based. Each content area lives in `modules/` and is
 * registered in `registry.ts`. Adding a new notification source = one new file.
 *
 * Emitted alerts are inserted as `pending`; the existing send-notification
 * `dispatch_pending` cron handles preferences, quiet hours, and push delivery.
 *
 * Invocation (cron):  POST { "jobType": "trip_engagement" }
 * Dry run (debug):    POST { "jobType": "trip_engagement", "dryRun": true }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { runEngagement } from './engine.ts';
import { runPlanReminders } from './reminders.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-cron-secret, apikey, content-type',
};

function extractBearer(authorization: string | null): string | null {
  const match = authorization?.match(/^bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

/** Accept the cron secret or the service-role key (mirrors _shared/cronAuth). */
function isAuthorized(req: Request): boolean {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  const cronSecret = Deno.env.get('CRON_SECRET')?.trim();
  const bearer = extractBearer(req.headers.get('authorization'));
  if (serviceKey && bearer === serviceKey) return true;
  const provided = req.headers.get('x-cron-secret')?.trim();
  return !!cronSecret && provided === cronSecret;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  const startedAt = Date.now();
  const body = await req.json().catch(() => ({}));
  const dryRun = body?.dryRun === true;
  const ignoreWindow = dryRun && body?.ignoreWindow === true;

  try {
    const result = await runEngagement(supabase, { dryRun, ignoreWindow });
    // Separate pass: nudge upcoming trips that have NO generated Smart Plan yet.
    const reminders = await runPlanReminders(supabase, { dryRun, ignoreWindow });
    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        durationMs: Date.now() - startedAt,
        ...result,
        errors: [...result.errors, ...reminders.errors],
        reminders,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[trip-engagement] error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
