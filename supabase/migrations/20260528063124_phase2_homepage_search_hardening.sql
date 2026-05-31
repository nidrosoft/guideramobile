-- Phase 2 homepage/search hardening support.

CREATE TABLE IF NOT EXISTS public.homepage_personalization_cache (
  user_id uuid NOT NULL,
  section_cache_version text NOT NULL,
  sections jsonb NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, section_cache_version)
);

CREATE INDEX IF NOT EXISTS homepage_personalization_cache_expires_at_idx
  ON public.homepage_personalization_cache (expires_at);

ALTER TABLE public.homepage_personalization_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.homepage_personalization_cache FROM anon, authenticated;
GRANT ALL ON public.homepage_personalization_cache TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS curated_destinations_search_tsv_idx
  ON public.curated_destinations
  USING gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(country, '') || ' ' ||
      coalesce(short_description, '') || ' ' ||
      coalesce(description, '')
    )
  );

CREATE INDEX IF NOT EXISTS curated_destinations_city_trgm_idx
  ON public.curated_destinations
  USING gin (city gin_trgm_ops);

CREATE INDEX IF NOT EXISTS curated_destinations_country_trgm_idx
  ON public.curated_destinations
  USING gin (country gin_trgm_ops);
