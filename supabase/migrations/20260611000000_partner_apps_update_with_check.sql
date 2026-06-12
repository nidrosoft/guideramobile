-- Security: the UPDATE policy on partner_applications had no WITH CHECK
-- clause, which allowed an owner to reassign a row's user_id to another
-- user. Recreate it with a matching WITH CHECK predicate.
-- Applied to production on 2026-06-11 via MCP; kept here for migration parity.

drop policy if exists "partner_apps_update_own" on public.partner_applications;
create policy "partner_apps_update_own" on public.partner_applications
  for update
  using (requesting_user_id() = user_id)
  with check (requesting_user_id() = user_id);
