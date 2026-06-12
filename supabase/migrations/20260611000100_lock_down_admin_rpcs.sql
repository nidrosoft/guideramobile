-- SECURITY (critical): the admin_* SECURITY DEFINER functions are admin-only
-- RPCs that bypass RLS and return cross-user data (full user PII, push tokens,
-- support messages, SOS events, etc.). Postgres grants EXECUTE to PUBLIC by
-- default, so anon/authenticated could call them via /rest/v1/rpc and dump the
-- database. None of them implement an internal admin check.
--
-- The admin panel is a separate server-side app that authenticates with the
-- service_role key, so revoking anon/authenticated/PUBLIC does not break it.
-- (The newer admin write-RPCs were already created without these grants; this
-- aligns the older read/list/stats RPCs with that posture.)
--
-- Applied to production on 2026-06-11 via MCP; kept here for migration parity.

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'admin\_%'
  loop
    execute format('revoke execute on function %s from anon, authenticated, public;', r.sig);
  end loop;
end $$;
