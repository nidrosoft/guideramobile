-- Journeys Phase 3: peer matching, curation admin RPCs, feedback re-review.

-- ── Peer matching (Pro) ────────────────────────────────────────────
-- Inserts an open request; if a counterpart open request exists for the same
-- (category, country) from another user, pairs them. SECURITY DEFINER so it can
-- update the counterpart row.
create or replace function public.journey_request_peer_match(
  p_category_slug text,
  p_country_code char(2)
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.requesting_user_id();
  v_cat uuid;
  v_match journey_peer_match_requests%rowtype;
  v_new_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('status', 'error', 'error', 'not_authenticated');
  end if;
  select id into v_cat from journey_categories where slug = p_category_slug;
  if v_cat is null then
    return jsonb_build_object('status', 'error', 'error', 'invalid_category');
  end if;

  -- find an open counterpart from someone else
  select * into v_match
  from journey_peer_match_requests
  where category_id = v_cat and country_code = p_country_code
    and status = 'open' and user_id <> v_uid
  order by created_at asc
  limit 1;

  if found then
    update journey_peer_match_requests
      set status = 'matched', matched_user_id = v_uid
      where id = v_match.id;
    insert into journey_peer_match_requests (user_id, category_id, country_code, status, matched_user_id)
      values (v_uid, v_cat, p_country_code, 'matched', v_match.user_id)
      returning id into v_new_id;
    return jsonb_build_object('status', 'matched', 'matched_user_id', v_match.user_id);
  end if;

  insert into journey_peer_match_requests (user_id, category_id, country_code, status)
    values (v_uid, v_cat, p_country_code, 'open')
    on conflict do nothing
    returning id into v_new_id;
  return jsonb_build_object('status', 'open');
end;
$$;
grant execute on function public.journey_request_peer_match(text, char) to authenticated;

-- ── Feedback-driven re-review trigger (spec §8.3) ──────────────────
create or replace function public.journey_feedback_reopen_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.flag_reason in ('inaccurate', 'outdated', 'unsafe') then
    update journey_guides
      set status = 'pending_review'
      where id = NEW.guide_id and status in ('ai_generated', 'curated');
  end if;
  return NEW;
end;
$$;
drop trigger if exists trg_journey_feedback_reopen on journey_guide_feedback;
create trigger trg_journey_feedback_reopen
  after insert on journey_guide_feedback
  for each row execute function public.journey_feedback_reopen_review();

-- ── Curation admin RPCs (service_role only) ─────────────────────────
create or replace function public.admin_journeys_review_queue(p_limit int default 50)
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select g.id, c.slug as category_slug, c.name as category_name,
           g.country_code, co.name as country_name, sh.slug as subhub_slug,
           g.status, g.source, g.hook, g.confidence, g.view_count, g.save_count,
           g.generated_at, g.reviewed_at, g.review_notes
    from journey_guides g
    join journey_categories c on c.id = g.category_id
    join journey_countries co on co.code = g.country_code
    left join journey_subhubs sh on sh.id = g.subhub_id
    where g.status in ('ai_generated', 'pending_review')
    order by g.view_count desc, g.generated_at desc
    limit greatest(1, least(p_limit, 200))
  ) t;
$$;
grant execute on function public.admin_journeys_review_queue(int) to service_role;

create or replace function public.admin_journeys_approve_guide(p_guide_id uuid, p_reviewer uuid default null, p_notes text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row journey_guides%rowtype;
begin
  update journey_guides
    set status = 'curated',
        source = case when source = 'ai' then 'hybrid' else source end,
        reviewed_by = p_reviewer,
        reviewed_at = now(),
        review_notes = p_notes,
        content = jsonb_set(coalesce(content, '{}'::jsonb), '{generatedNote}', 'null'::jsonb),
        updated_at = now()
    where id = p_guide_id
    returning * into v_row;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true, 'id', v_row.id, 'status', v_row.status);
end;
$$;
grant execute on function public.admin_journeys_approve_guide(uuid, uuid, text) to service_role;

create or replace function public.admin_journeys_reject_guide(p_guide_id uuid, p_notes text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row journey_guides%rowtype;
begin
  update journey_guides
    set status = 'archived', is_published = false, review_notes = p_notes, updated_at = now()
    where id = p_guide_id
    returning * into v_row;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true, 'id', v_row.id, 'status', v_row.status);
end;
$$;
grant execute on function public.admin_journeys_reject_guide(uuid, text) to service_role;

create or replace function public.admin_journeys_feedback(p_limit int default 50)
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
    select f.id, f.guide_id, c.slug as category_slug, g.country_code,
           f.rating, f.is_helpful, f.flag_reason, f.comment, f.created_at
    from journey_guide_feedback f
    join journey_guides g on g.id = f.guide_id
    join journey_categories c on c.id = g.category_id
    order by f.created_at desc
    limit greatest(1, least(p_limit, 200))
  ) t;
$$;
grant execute on function public.admin_journeys_feedback(int) to service_role;

create or replace function public.admin_journeys_stats()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'total', (select count(*) from journey_guides),
    'curated', (select count(*) from journey_guides where status = 'curated'),
    'ai_generated', (select count(*) from journey_guides where status = 'ai_generated'),
    'pending_review', (select count(*) from journey_guides where status = 'pending_review'),
    'archived', (select count(*) from journey_guides where status = 'archived'),
    'country_profiles', (select count(*) from journey_country_profiles),
    'providers', (select count(*) from journey_providers where is_active),
    'leads', (select count(*) from journey_provider_leads),
    'open_peer_requests', (select count(*) from journey_peer_match_requests where status = 'open')
  );
$$;
grant execute on function public.admin_journeys_stats() to service_role;
