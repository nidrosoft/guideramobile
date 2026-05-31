create table if not exists public.city_images (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  city text not null,
  country text,
  image_url text not null,
  storage_bucket text not null default 'destination-images',
  storage_path text not null,
  source text not null default 'google_places',
  source_photo_reference text,
  width integer,
  height integer,
  status text not null default 'ready',
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists city_images_city_country_idx
  on public.city_images (lower(city), lower(coalesce(country, '')));

alter table public.city_images enable row level security;

drop policy if exists "city images are publicly readable" on public.city_images;
create policy "city images are publicly readable"
on public.city_images
for select
to anon, authenticated
using (status = 'ready');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'destination-images',
  'destination-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "destination images are publicly readable" on storage.objects;
create policy "destination images are publicly readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'destination-images');
