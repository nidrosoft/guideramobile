-- Journeys: align owner-scoped RLS with this app's Clerk->profile mapping.
-- The init migration used auth.uid() per spec; this app resolves the caller via
-- public.requesting_user_id() (Clerk JWT sub -> profiles.id).

drop policy if exists "own saves" on journey_saves;
create policy "own saves" on journey_saves for all
  using (public.requesting_user_id() = user_id)
  with check (public.requesting_user_id() = user_id);

drop policy if exists "own checklist" on journey_user_checklist_state;
create policy "own checklist" on journey_user_checklist_state for all
  using (public.requesting_user_id() = user_id)
  with check (public.requesting_user_id() = user_id);

drop policy if exists "own estimates" on journey_cost_estimates;
create policy "own estimates" on journey_cost_estimates for all
  using (public.requesting_user_id() = user_id)
  with check (public.requesting_user_id() = user_id);

drop policy if exists "own visa watches" on journey_visa_watches;
create policy "own visa watches" on journey_visa_watches for all
  using (public.requesting_user_id() = user_id)
  with check (public.requesting_user_id() = user_id);

drop policy if exists "own leads" on journey_provider_leads;
create policy "own leads" on journey_provider_leads for all
  using (public.requesting_user_id() = user_id)
  with check (public.requesting_user_id() = user_id);

drop policy if exists "own peer reqs" on journey_peer_match_requests;
create policy "own peer reqs" on journey_peer_match_requests for all
  using (public.requesting_user_id() = user_id or public.requesting_user_id() = matched_user_id)
  with check (public.requesting_user_id() = user_id);

drop policy if exists "own chat threads" on journey_chat_threads;
create policy "own chat threads" on journey_chat_threads for all
  using (public.requesting_user_id() = user_id)
  with check (public.requesting_user_id() = user_id);

drop policy if exists "own chat msgs" on journey_chat_messages;
create policy "own chat msgs" on journey_chat_messages for all
  using (exists (select 1 from journey_chat_threads t where t.id = thread_id and t.user_id = public.requesting_user_id()));

drop policy if exists "insert feedback" on journey_guide_feedback;
create policy "insert feedback" on journey_guide_feedback for insert
  with check (public.requesting_user_id() = user_id or user_id is null);
drop policy if exists "read own feedback" on journey_guide_feedback;
create policy "read own feedback" on journey_guide_feedback for select
  using (public.requesting_user_id() = user_id or user_id is null);
