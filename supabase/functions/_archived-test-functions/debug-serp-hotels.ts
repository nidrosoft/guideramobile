import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// DISABLED diagnostic function. Safe to delete:
//   supabase functions delete debug-serp-hotels
Deno.serve(() => new Response(JSON.stringify({ disabled: true }), {
  status: 410,
  headers: { 'Content-Type': 'application/json' },
}));
