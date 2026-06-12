-- SECURITY: RLS hardening for advisor findings.
-- Applied to production on 2026-06-11 via MCP; kept here for migration parity.

-- 1) journey_events / journey_search_queries had an INSERT policy with
--    WITH CHECK (true), letting any caller write rows attributed to ANY
--    user_id. Restrict to rows that are anonymous (null) or owned by the
--    caller. Client telemetry inserts no user_id (stays null); edge functions
--    write via service_role (bypass RLS).
drop policy if exists "insert events" on public.journey_events;
create policy "insert events" on public.journey_events
  for insert to anon, authenticated
  with check (user_id is null or user_id = requesting_user_id());

drop policy if exists "insert search" on public.journey_search_queries;
create policy "insert search" on public.journey_search_queries
  for insert to anon, authenticated
  with check (user_id is null or user_id = requesting_user_id());

-- 2) edge_functions_cache stores cached edge-function source and system
--    prompts and had RLS disabled with full anon/authenticated grants.
--    Lock it to server-side (service_role) access only.
alter table public.edge_functions_cache enable row level security;
revoke all on public.edge_functions_cache from anon, authenticated;
