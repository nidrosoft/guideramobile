-- Guidera Connect launch seed v1.
-- Safe-by-design: all non-human accounts are visibly labeled system/staff
-- profiles. No fake travelers, DMs, or live Pulse meetups are inserted.

with batch as (
  insert into public.seed_batches (id, name, environment, description, applied_by)
  values (
    '00000000-0000-4000-8000-00000000c001',
    'connect_launch_v1',
    'production',
    'Official Connect starter groups, posts, and events managed by Guidera.',
    'guidera-system'
  )
  on conflict (name) do update
    set description = excluded.description,
        applied_at = now(),
        applied_by = excluded.applied_by
  returning id
),
system_profiles as (
  insert into public.profiles (
    id,
    first_name,
    last_name,
    email,
    avatar_url,
    bio,
    city,
    country,
    onboarding_completed,
    onboarding_step,
    is_verified,
    identity_verified,
    profile_kind,
    is_synthetic,
    synthetic_label,
    synthetic_metadata,
    visibility_settings
  )
  values
    (
      '00000000-0000-4000-8000-00000000a001',
      'Guidera',
      'Team',
      'team+connect@guidera.app',
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&auto=format&fit=crop',
      'Official Guidera community team. We share product updates, city tips, and safety-first community guidance.',
      'San Diego',
      'United States',
      true,
      10,
      true,
      true,
      'system',
      true,
      'Guidera Team',
      '{"disclosure":"Official system account. Not a private traveler."}'::jsonb,
      '{"show_bio":true,"show_dob":false,"show_phone":false,"show_stats":false,"show_location":true,"show_languages":true,"show_member_since":true,"show_travel_style":false}'::jsonb
    ),
    (
      '00000000-0000-4000-8000-00000000a002',
      'Guidera',
      'Assistant',
      'assistant+connect@guidera.app',
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&auto=format&fit=crop',
      'Clearly labeled AI assistant for official group FAQs and travel basics. It does not participate in DMs or live meetups.',
      'San Diego',
      'United States',
      true,
      10,
      true,
      true,
      'system',
      true,
      'AI Assistant',
      '{"disclosure":"AI-generated replies must be labeled. No DMs or meetup participation."}'::jsonb,
      '{"show_bio":true,"show_dob":false,"show_phone":false,"show_stats":false,"show_location":false,"show_languages":true,"show_member_since":true,"show_travel_style":false}'::jsonb
    ),
    (
      '00000000-0000-4000-8000-00000000a101',
      'US',
      'Ambassador',
      'ambassador-us@guidera.app',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop',
      'Official Guidera community ambassador for United States starter groups.',
      'San Diego',
      'United States',
      true,
      10,
      true,
      true,
      'staff',
      true,
      'Community Ambassador',
      '{"region":"United States","disclosure":"Official Guidera-managed ambassador profile."}'::jsonb,
      '{"show_bio":true,"show_dob":false,"show_phone":false,"show_stats":false,"show_location":true,"show_languages":true,"show_member_since":true,"show_travel_style":false}'::jsonb
    ),
    (
      '00000000-0000-4000-8000-00000000a102',
      'Europe',
      'Ambassador',
      'ambassador-europe@guidera.app',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop',
      'Official Guidera community ambassador for Europe starter groups.',
      'Lisbon',
      'Portugal',
      true,
      10,
      true,
      true,
      'staff',
      true,
      'Community Ambassador',
      '{"region":"Europe","disclosure":"Official Guidera-managed ambassador profile."}'::jsonb,
      '{"show_bio":true,"show_dob":false,"show_phone":false,"show_stats":false,"show_location":true,"show_languages":true,"show_member_since":true,"show_travel_style":false}'::jsonb
    ),
    (
      '00000000-0000-4000-8000-00000000a103',
      'Africa',
      'Ambassador',
      'ambassador-africa@guidera.app',
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format&fit=crop',
      'Official Guidera community ambassador for Africa starter groups.',
      'Nairobi',
      'Kenya',
      true,
      10,
      true,
      true,
      'staff',
      true,
      'Community Ambassador',
      '{"region":"Africa","disclosure":"Official Guidera-managed ambassador profile."}'::jsonb,
      '{"show_bio":true,"show_dob":false,"show_phone":false,"show_stats":false,"show_location":true,"show_languages":true,"show_member_since":true,"show_travel_style":false}'::jsonb
    ),
    (
      '00000000-0000-4000-8000-00000000a104',
      'Asia',
      'Ambassador',
      'ambassador-asia@guidera.app',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop',
      'Official Guidera community ambassador for Asia starter groups.',
      'Bangkok',
      'Thailand',
      true,
      10,
      true,
      true,
      'staff',
      true,
      'Community Ambassador',
      '{"region":"Asia","disclosure":"Official Guidera-managed ambassador profile."}'::jsonb,
      '{"show_bio":true,"show_dob":false,"show_phone":false,"show_stats":false,"show_location":true,"show_languages":true,"show_member_since":true,"show_travel_style":false}'::jsonb
    )
  on conflict (id) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        bio = excluded.bio,
        city = excluded.city,
        country = excluded.country,
        is_verified = excluded.is_verified,
        identity_verified = excluded.identity_verified,
        profile_kind = excluded.profile_kind,
        is_synthetic = excluded.is_synthetic,
        synthetic_label = excluded.synthetic_label,
        synthetic_metadata = excluded.synthetic_metadata,
        visibility_settings = excluded.visibility_settings,
        updated_at = now()
  returning id
),
official_groups as (
  insert into public.groups (
    id,
    name,
    slug,
    description,
    cover_photo_url,
    group_photo_url,
    destination_name,
    destination_country,
    privacy,
    join_approval,
    category,
    tags,
    languages,
    travel_styles,
    member_count,
    active_member_count,
    post_count,
    is_verified,
    discoverable,
    status,
    created_by,
    origin,
    is_official,
    seed_rank,
    seed_batch_id,
    guidelines_text
  )
  values
    ('00000000-0000-4000-8000-00000000b001','Guidera Welcome Lounge','guidera-welcome-lounge','Start here for app updates, travel etiquette, safety basics, and help finding the right Connect groups.','https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop',null,null,'public','automatic','interest',array['welcome','official','travel-basics'],array['en'],array['all'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a001','official',true,100,'00000000-0000-4000-8000-00000000c001','Be helpful, kind, and safety-first. Official accounts are labeled.'),
    ('00000000-0000-4000-8000-00000000b002','US Weekend Explorers','us-weekend-explorers','Official starter group for short trips, city breaks, food spots, and weekend planning across the United States.','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&auto=format&fit=crop','United States','US','public','automatic','destination',array['usa','weekend','city-breaks'],array['en'],array['solo','friends','family'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a101','official',true,95,'00000000-0000-4000-8000-00000000c001','Share practical weekend ideas and local safety tips.'),
    ('00000000-0000-4000-8000-00000000b003','Europe City Hoppers','europe-city-hoppers','Official starter group for train-friendly European cities, museum weekends, cafes, and local customs.','https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&auto=format&fit=crop','Europe','PT','public','automatic','destination',array['europe','trains','culture'],array['en'],array['solo','culture','budget'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a102','official',true,94,'00000000-0000-4000-8000-00000000c001','Keep advice current, kind, and city-specific.'),
    ('00000000-0000-4000-8000-00000000b004','Africa Travel Circle','africa-travel-circle','Official starter group for Africa travel inspiration, entry tips, local etiquette, and regional planning.','https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&auto=format&fit=crop','Africa','KE','public','automatic','destination',array['africa','safari','culture'],array['en','fr'],array['culture','adventure','family'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a103','official',true,93,'00000000-0000-4000-8000-00000000c001','Respect local communities and avoid stereotypes.'),
    ('00000000-0000-4000-8000-00000000b005','Asia First-Timers','asia-first-timers','Official starter group for first trips across Asia: transit, food etiquette, temple visits, and neighborhood tips.','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop','Asia','TH','public','automatic','destination',array['asia','first-trip','food'],array['en'],array['culture','food','solo'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a104','official',true,92,'00000000-0000-4000-8000-00000000c001','Share useful first-timer context and safety notes.'),
    ('00000000-0000-4000-8000-00000000b006','Solo Travelers Hub','solo-travelers-hub','Official starter group for solo travelers looking for confidence, safety routines, and low-pressure planning advice.','https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&auto=format&fit=crop',null,null,'public','automatic','interest',array['solo','safety','confidence'],array['en'],array['solo'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a001','official',true,91,'00000000-0000-4000-8000-00000000c001','Protect privacy and avoid pressuring meetups.'),
    ('00000000-0000-4000-8000-00000000b007','Family Travel Crew','family-travel-crew','Official starter group for family-friendly hotels, stroller routes, kid-friendly food stops, and slower itineraries.','https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&auto=format&fit=crop',null,null,'public','automatic','interest',array['family','kids','planning'],array['en'],array['family'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a001','official',true,90,'00000000-0000-4000-8000-00000000c001','Keep advice family-safe and practical.'),
    ('00000000-0000-4000-8000-00000000b008','Digital Nomad Desk','digital-nomad-desk','Official starter group for coworking, eSIMs, remote-work neighborhoods, and routines while abroad.','https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&auto=format&fit=crop',null,null,'public','automatic','interest',array['nomad','remote-work','coworking'],array['en'],array['business','solo'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a001','official',true,89,'00000000-0000-4000-8000-00000000c001','Share coworking and connectivity info without spam.'),
    ('00000000-0000-4000-8000-00000000b009','Food And Etiquette Exchange','food-and-etiquette-exchange','Official starter group for restaurant etiquette, local dishes, tipping norms, and respectful dining questions.','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop',null,null,'public','automatic','interest',array['food','etiquette','local-customs'],array['en'],array['food','culture'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a001','official',true,88,'00000000-0000-4000-8000-00000000c001','Respect dietary needs and local customs.'),
    ('00000000-0000-4000-8000-00000000b010','Budget Smart Trips','budget-smart-trips','Official starter group for saving money without cutting safety: transit passes, free museums, and smart booking windows.','https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&auto=format&fit=crop',null,null,'public','automatic','interest',array['budget','deals','planning'],array['en'],array['budget','solo','friends'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a001','official',true,87,'00000000-0000-4000-8000-00000000c001','No scammy deal links or unsafe shortcuts.'),
    ('00000000-0000-4000-8000-00000000b011','Women Who Wander','women-who-wander','Official starter group for women travelers sharing safety routines, neighborhood comfort checks, and supportive planning.','https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&auto=format&fit=crop',null,null,'public','automatic','interest',array['women','safety','solo'],array['en'],array['solo','safety'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a001','official',true,86,'00000000-0000-4000-8000-00000000c001','Be supportive and privacy-conscious.'),
    ('00000000-0000-4000-8000-00000000b012','Luxury And Design Hotels','luxury-and-design-hotels','Official starter group for design hotels, luxury escapes, service quality, and polished trip inspiration.','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop',null,null,'public','automatic','interest',array['luxury','hotels','design'],array['en'],array['luxury','couples'],2,2,2,true,true,'active','00000000-0000-4000-8000-00000000a001','official',true,85,'00000000-0000-4000-8000-00000000c001','Focus on high-quality recommendations and transparent costs.')
  on conflict (id) do update
    set name = excluded.name,
        description = excluded.description,
        cover_photo_url = excluded.cover_photo_url,
        group_photo_url = excluded.group_photo_url,
        tags = excluded.tags,
        languages = excluded.languages,
        travel_styles = excluded.travel_styles,
        member_count = excluded.member_count,
        active_member_count = excluded.active_member_count,
        post_count = excluded.post_count,
        is_verified = excluded.is_verified,
        discoverable = excluded.discoverable,
        status = excluded.status,
        origin = excluded.origin,
        is_official = excluded.is_official,
        seed_rank = excluded.seed_rank,
        seed_batch_id = excluded.seed_batch_id,
        guidelines_text = excluded.guidelines_text,
        updated_at = now()
  returning id, created_by
)
insert into public.seeded_entities (batch_id, entity_type, entity_id)
select '00000000-0000-4000-8000-00000000c001', 'profile', id from system_profiles
on conflict do nothing;

insert into public.seeded_entities (batch_id, entity_type, entity_id)
select '00000000-0000-4000-8000-00000000c001', 'group', id
from public.groups
where seed_batch_id = '00000000-0000-4000-8000-00000000c001'
on conflict do nothing;

insert into public.group_members (group_id, user_id, role, status, joined_at)
select g.id, g.created_by, 'owner', 'active', now()
from public.groups g
where g.seed_batch_id = '00000000-0000-4000-8000-00000000c001'
on conflict (group_id, user_id) do update
  set role = excluded.role,
      status = excluded.status;

insert into public.group_members (group_id, user_id, role, status, joined_at)
select g.id, '00000000-0000-4000-8000-00000000a002', 'member', 'active', now()
from public.groups g
where g.seed_batch_id = '00000000-0000-4000-8000-00000000c001'
on conflict (group_id, user_id) do update
  set status = excluded.status;

insert into public.chat_rooms (type, reference_id, name)
select 'group', g.id, g.name
from public.groups g
where g.seed_batch_id = '00000000-0000-4000-8000-00000000c001'
  and not exists (
    select 1 from public.chat_rooms cr
    where cr.type = 'group' and cr.reference_id = g.id
  );

insert into public.community_posts (
  id,
  community_id,
  author_id,
  content,
  tags,
  is_pinned,
  post_type,
  status,
  origin,
  seed_rank,
  seed_batch_id,
  metadata
)
values
  ('00000000-0000-4000-8000-00000000d001','00000000-0000-4000-8000-00000000b001','00000000-0000-4000-8000-00000000a001','Welcome to Connect. Official Guidera accounts are labeled so you can tell system guidance apart from real traveler posts. Start by joining a few groups that match your travel style.',array['welcome','official'],true,'general','published','official',100,'00000000-0000-4000-8000-00000000c001','{"disclosure":"Official Guidera seed post"}'::jsonb),
  ('00000000-0000-4000-8000-00000000d002','00000000-0000-4000-8000-00000000b001','00000000-0000-4000-8000-00000000a002','I am Guidera Assistant. I can help answer basic questions in official group threads when that feature is enabled. I do not participate in private DMs or pretend to be a traveler.',array['ai','disclosure'],true,'question','published','ai',99,'00000000-0000-4000-8000-00000000c001','{"ai_generated":false,"disclosure":"AI Assistant profile disclosure"}'::jsonb),
  ('00000000-0000-4000-8000-00000000d003','00000000-0000-4000-8000-00000000b002','00000000-0000-4000-8000-00000000a101','What is your favorite underrated US weekend city and why? We are collecting practical ideas for first-time members.',array['usa','weekend'],true,'question','published','official',95,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d004','00000000-0000-4000-8000-00000000b003','00000000-0000-4000-8000-00000000a102','Europe tip: when planning city hops, compare total door-to-door time before choosing flights over trains.',array['europe','trains'],true,'general','published','official',94,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d005','00000000-0000-4000-8000-00000000b004','00000000-0000-4000-8000-00000000a103','Africa travel thread: share questions about respectful etiquette, visa timing, and seasonal planning. Keep advice specific and kind.',array['africa','etiquette'],true,'question','published','official',93,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d006','00000000-0000-4000-8000-00000000b005','00000000-0000-4000-8000-00000000a104','Asia first-timer checklist: local SIM/eSIM, transit card, temple dress norms, cash backup, and food etiquette.',array['asia','first-trip'],true,'general','published','official',92,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d007','00000000-0000-4000-8000-00000000b006','00000000-0000-4000-8000-00000000a001','Solo travel safety routine: share your check-in plan with one trusted person, save offline maps, and trust your comfort level.',array['solo','safety'],true,'general','published','official',91,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d008','00000000-0000-4000-8000-00000000b007','00000000-0000-4000-8000-00000000a001','Family travel thread: what makes a destination genuinely easy with kids? Think stroller routes, flexible food, and downtime.',array['family','planning'],true,'question','published','official',90,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d009','00000000-0000-4000-8000-00000000b008','00000000-0000-4000-8000-00000000a001','Nomad setup starter: check upload speed, call privacy, backup power, eSIM coverage, and neighborhood noise before booking long stays.',array['nomad','remote-work'],true,'general','published','official',89,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d010','00000000-0000-4000-8000-00000000b009','00000000-0000-4000-8000-00000000a001','Food etiquette thread: ask about tipping, reservations, table customs, and must-try dishes before you land.',array['food','etiquette'],true,'question','published','official',88,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d011','00000000-0000-4000-8000-00000000b010','00000000-0000-4000-8000-00000000a001','Budget does not mean unsafe. Share tips for transit passes, museum days, local lunch specials, and safe neighborhoods.',array['budget','safety'],true,'general','published','official',87,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d012','00000000-0000-4000-8000-00000000b011','00000000-0000-4000-8000-00000000a001','Women Who Wander starter: share comfort checks, hotel location tips, and safety routines without revealing private real-time locations.',array['women','safety'],true,'general','published','official',86,'00000000-0000-4000-8000-00000000c001','{}'::jsonb),
  ('00000000-0000-4000-8000-00000000d013','00000000-0000-4000-8000-00000000b012','00000000-0000-4000-8000-00000000a001','Design hotel checklist: location, service consistency, quiet rooms, wellness amenities, and transparent total cost.',array['luxury','hotels'],true,'general','published','official',85,'00000000-0000-4000-8000-00000000c001','{}'::jsonb)
on conflict (id) do update
  set content = excluded.content,
      tags = excluded.tags,
      is_pinned = excluded.is_pinned,
      post_type = excluded.post_type,
      status = excluded.status,
      origin = excluded.origin,
      seed_rank = excluded.seed_rank,
      seed_batch_id = excluded.seed_batch_id,
      metadata = excluded.metadata,
      updated_at = now();

insert into public.seeded_entities (batch_id, entity_type, entity_id)
select '00000000-0000-4000-8000-00000000c001', 'post', id
from public.community_posts
where seed_batch_id = '00000000-0000-4000-8000-00000000c001'
on conflict do nothing;

insert into public.community_events (
  id,
  type,
  group_id,
  created_by,
  title,
  description,
  category,
  cover_image_url,
  location_type,
  location_name,
  start_date,
  end_date,
  timezone,
  max_attendees,
  attendee_count,
  visibility,
  status,
  origin,
  seed_rank,
  seed_batch_id,
  metadata
)
values
  ('00000000-0000-4000-8000-00000000e001','meetup','00000000-0000-4000-8000-00000000b002','00000000-0000-4000-8000-00000000a101','Official San Diego Travel Coffee Hour','A low-pressure Guidera-hosted starter event to help members share weekend trip ideas.','social','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop','physical','San Diego, CA',now() + interval '14 days',now() + interval '14 days 2 hours','America/Los_Angeles',30,1,'public','upcoming','official',95,'00000000-0000-4000-8000-00000000c001','{"official":true,"no_fake_attendees":true}'::jsonb),
  ('00000000-0000-4000-8000-00000000e002','online','00000000-0000-4000-8000-00000000b003','00000000-0000-4000-8000-00000000a102','Europe City Hop Planning Session','Official online planning session for train routes, museum passes, and city-pair ideas.','planning','https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&auto=format&fit=crop','virtual','Online',now() + interval '18 days',now() + interval '18 days 1 hour','Europe/Lisbon',50,1,'public','upcoming','official',94,'00000000-0000-4000-8000-00000000c001','{"official":true,"no_fake_attendees":true}'::jsonb),
  ('00000000-0000-4000-8000-00000000e003','online','00000000-0000-4000-8000-00000000b004','00000000-0000-4000-8000-00000000a103','Africa Travel Q&A: Etiquette And Seasons','Official group Q&A for respectful planning, entry timing, and seasonal considerations.','culture','https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&auto=format&fit=crop','virtual','Online',now() + interval '21 days',now() + interval '21 days 1 hour','Africa/Nairobi',50,1,'public','upcoming','official',93,'00000000-0000-4000-8000-00000000c001','{"official":true,"no_fake_attendees":true}'::jsonb),
  ('00000000-0000-4000-8000-00000000e004','online','00000000-0000-4000-8000-00000000b005','00000000-0000-4000-8000-00000000a104','Asia First-Timer Checklist Workshop','Official online checklist walkthrough for transit, etiquette, and food confidence.','planning','https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&auto=format&fit=crop','virtual','Online',now() + interval '25 days',now() + interval '25 days 1 hour','Asia/Bangkok',50,1,'public','upcoming','official',92,'00000000-0000-4000-8000-00000000c001','{"official":true,"no_fake_attendees":true}'::jsonb)
on conflict (id) do update
  set title = excluded.title,
      description = excluded.description,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      visibility = excluded.visibility,
      status = excluded.status,
      origin = excluded.origin,
      seed_rank = excluded.seed_rank,
      seed_batch_id = excluded.seed_batch_id,
      metadata = excluded.metadata,
      updated_at = now();

insert into public.event_attendees (event_id, user_id, rsvp_status, is_organizer)
select e.id, e.created_by, 'going', true
from public.community_events e
where e.seed_batch_id = '00000000-0000-4000-8000-00000000c001'
on conflict (event_id, user_id) do update
  set rsvp_status = excluded.rsvp_status,
      is_organizer = excluded.is_organizer;

insert into public.chat_rooms (type, reference_id, name)
select 'event', e.id, e.title
from public.community_events e
where e.seed_batch_id = '00000000-0000-4000-8000-00000000c001'
  and not exists (
    select 1 from public.chat_rooms cr
    where cr.type = 'event' and cr.reference_id = e.id
  );

insert into public.seeded_entities (batch_id, entity_type, entity_id)
select '00000000-0000-4000-8000-00000000c001', 'event', id
from public.community_events
where seed_batch_id = '00000000-0000-4000-8000-00000000c001'
on conflict do nothing;

update public.groups
set created_at = '2026-01-01 12:00:00+00'::timestamptz
where seed_batch_id = '00000000-0000-4000-8000-00000000c001';
