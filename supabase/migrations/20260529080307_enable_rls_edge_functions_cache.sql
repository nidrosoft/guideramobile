-- Enable Row Level Security on public.edge_functions_cache.
--
-- This table is an internal cache written/read only by Edge Functions using the
-- service role, which bypasses RLS. Enabling RLS with no policies denies all
-- access to the anon/authenticated roles (Data API), closing the
-- `rls_disabled_in_public` security advisory without affecting Edge Functions.

alter table public.edge_functions_cache enable row level security;

-- Defense in depth: ensure the Data API roles cannot touch this internal cache.
revoke all on table public.edge_functions_cache from anon, authenticated;
