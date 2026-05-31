-- Phase 5.3: harden chat sends for launch traffic.
-- Keeps client writes idempotent and moves membership validation, counters, and
-- sender rate limits into one database transaction.

alter table public.chat_messages
  add column if not exists client_message_id text;

create unique index if not exists idx_chat_messages_dm_client_message
  on public.chat_messages (conversation_id, user_id, client_message_id)
  where conversation_id is not null and client_message_id is not null;

create unique index if not exists idx_chat_messages_room_client_message
  on public.chat_messages (group_id, user_id, client_message_id)
  where group_id is not null and client_message_id is not null;

create index if not exists idx_chat_messages_conversation_created_at
  on public.chat_messages (conversation_id, created_at desc)
  where conversation_id is not null;

create index if not exists idx_chat_messages_group_created_at
  on public.chat_messages (group_id, created_at desc)
  where group_id is not null;

create table if not exists public.chat_message_rate_buckets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  window_start timestamptz not null,
  message_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, window_start)
);

alter table public.chat_message_rate_buckets enable row level security;

create index if not exists idx_chat_message_rate_buckets_user_window
  on public.chat_message_rate_buckets (user_id, window_start desc);

drop policy if exists chat_message_rate_buckets_service_all on public.chat_message_rate_buckets;
create policy chat_message_rate_buckets_service_all
  on public.chat_message_rate_buckets
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.send_chat_message(
  p_chat_id uuid,
  p_user_id uuid,
  p_content text,
  p_message_type text default 'text',
  p_client_message_id text default null
)
returns public.chat_messages
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_requesting_user_id uuid := public.requesting_user_id();
  v_content text := btrim(coalesce(p_content, ''));
  v_message_type text := coalesce(nullif(btrim(p_message_type), ''), 'text');
  v_client_message_id text := nullif(btrim(p_client_message_id), '');
  v_window_start timestamptz := date_trunc('minute', now());
  v_window_count integer;
  v_room public.chat_rooms%rowtype;
  v_conversation public.direct_conversations%rowtype;
  v_message public.chat_messages%rowtype;
  v_preview text;
  v_chat_type text;
begin
  if v_requesting_user_id is null or v_requesting_user_id <> p_user_id then
    raise exception 'Not authorized to send as this user'
      using errcode = '42501';
  end if;

  if length(v_content) = 0 then
    raise exception 'Message content is required'
      using errcode = '22023';
  end if;

  if length(v_content) > 2000 then
    raise exception 'Message content exceeds 2000 characters'
      using errcode = '22023';
  end if;

  insert into public.chat_message_rate_buckets (user_id, window_start, message_count)
  values (p_user_id, v_window_start, 1)
  on conflict (user_id, window_start)
  do update set
    message_count = public.chat_message_rate_buckets.message_count + 1,
    updated_at = now()
  returning message_count into v_window_count;

  if v_window_count > 30 then
    raise exception 'Message rate limit exceeded'
      using errcode = '42900';
  end if;

  v_preview := left(v_content, 100);

  select *
  into v_room
  from public.chat_rooms
  where id = p_chat_id;

  if found then
    if v_room.type = 'group' then
      if not exists (
        select 1
        from public.group_members gm
        where gm.group_id = v_room.reference_id
          and gm.user_id = p_user_id
          and coalesce(gm.status, 'active') = 'active'
      ) then
        raise exception 'Not a member of this group chat'
          using errcode = '42501';
      end if;
      v_chat_type := 'group';
    elsif v_room.type = 'activity' then
      if not exists (
        select 1
        from public.activity_participants ap
        where ap.activity_id = v_room.reference_id
          and ap.user_id = p_user_id
      ) then
        raise exception 'Not a participant in this activity chat'
          using errcode = '42501';
      end if;
      v_chat_type := 'activity';
    elsif v_room.type = 'event' then
      if not exists (
        select 1
        from public.event_attendees ea
        where ea.event_id = v_room.reference_id
          and ea.user_id = p_user_id
          and coalesce(ea.rsvp_status, 'going') <> 'declined'
      ) then
        raise exception 'Not an attendee of this event chat'
          using errcode = '42501';
      end if;
      v_chat_type := 'event';
    elsif v_room.type = 'public' then
      v_chat_type := 'public';
    else
      raise exception 'Unsupported chat room type: %', v_room.type
        using errcode = '22023';
    end if;

    if v_client_message_id is not null then
      select *
      into v_message
      from public.chat_messages
      where group_id = p_chat_id
        and user_id = p_user_id
        and client_message_id = v_client_message_id;

      if found then
        return v_message;
      end if;
    end if;

    insert into public.chat_messages (
      group_id,
      user_id,
      content,
      message_type,
      client_message_id
    )
    values (
      p_chat_id,
      p_user_id,
      v_content,
      v_message_type,
      v_client_message_id
    )
    returning * into v_message;

    update public.chat_rooms
    set
      message_count = coalesce(message_count, 0) + 1,
      last_message_at = v_message.created_at,
      last_message_preview = v_preview
    where id = p_chat_id;

    if v_room.type = 'group' then
      update public.group_members
      set message_count = coalesce(message_count, 0) + 1,
          last_visited_at = now()
      where group_id = v_room.reference_id
        and user_id = p_user_id;

      insert into public.message_read_status (
        user_id,
        chat_type,
        chat_id,
        unread_count,
        last_read_at
      )
      select gm.user_id, v_chat_type, p_chat_id, 1, now()
      from public.group_members gm
      where gm.group_id = v_room.reference_id
        and gm.user_id <> p_user_id
        and coalesce(gm.status, 'active') = 'active'
      on conflict (user_id, chat_type, chat_id)
      do update set unread_count = coalesce(public.message_read_status.unread_count, 0) + 1;
    elsif v_room.type = 'activity' then
      insert into public.message_read_status (
        user_id,
        chat_type,
        chat_id,
        unread_count,
        last_read_at
      )
      select ap.user_id, v_chat_type, p_chat_id, 1, now()
      from public.activity_participants ap
      where ap.activity_id = v_room.reference_id
        and ap.user_id <> p_user_id
      on conflict (user_id, chat_type, chat_id)
      do update set unread_count = coalesce(public.message_read_status.unread_count, 0) + 1;
    elsif v_room.type = 'event' then
      insert into public.message_read_status (
        user_id,
        chat_type,
        chat_id,
        unread_count,
        last_read_at
      )
      select ea.user_id, v_chat_type, p_chat_id, 1, now()
      from public.event_attendees ea
      where ea.event_id = v_room.reference_id
        and ea.user_id <> p_user_id
        and coalesce(ea.rsvp_status, 'going') <> 'declined'
      on conflict (user_id, chat_type, chat_id)
      do update set unread_count = coalesce(public.message_read_status.unread_count, 0) + 1;
    end if;

    return v_message;
  end if;

  select *
  into v_conversation
  from public.direct_conversations
  where id = p_chat_id
    and p_user_id in (user_id_1, user_id_2);

  if not found then
    raise exception 'Conversation not found or not accessible'
      using errcode = '42501';
  end if;

  if v_client_message_id is not null then
    select *
    into v_message
    from public.chat_messages
    where conversation_id = p_chat_id
      and user_id = p_user_id
      and client_message_id = v_client_message_id;

    if found then
      return v_message;
    end if;
  end if;

  insert into public.chat_messages (
    conversation_id,
    user_id,
    content,
    message_type,
    client_message_id
  )
  values (
    p_chat_id,
    p_user_id,
    v_content,
    v_message_type,
    v_client_message_id
  )
  returning * into v_message;

  update public.direct_conversations
  set
    message_count = coalesce(message_count, 0) + 1,
    last_message_at = v_message.created_at,
    last_message_preview = v_preview
  where id = p_chat_id;

  insert into public.message_read_status (
    user_id,
    chat_type,
    chat_id,
    unread_count,
    last_read_at
  )
  values (
    case
      when v_conversation.user_id_1 = p_user_id then v_conversation.user_id_2
      else v_conversation.user_id_1
    end,
    'direct',
    p_chat_id,
    1,
    now()
  )
  on conflict (user_id, chat_type, chat_id)
  do update set unread_count = coalesce(public.message_read_status.unread_count, 0) + 1;

  return v_message;
end;
$$;

revoke all on function public.send_chat_message(uuid, uuid, text, text, text) from public;
grant execute on function public.send_chat_message(uuid, uuid, text, text, text) to authenticated;
