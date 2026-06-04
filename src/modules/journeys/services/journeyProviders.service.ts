/**
 * Providers service (spec §13). Reads the verified directory (public-read) and
 * captures leads (owner-scoped insert via requesting_user_id RLS).
 */
import { supabase } from '@/lib/supabase/client';
import type { JourneyProvider } from '../types';

async function categoryId(slug: string): Promise<string | null> {
  const { data } = await supabase.from('journey_categories').select('id').eq('slug', slug).maybeSingle();
  return data?.id ?? null;
}

function mapProvider(row: any): JourneyProvider {
  return {
    id: row.id,
    name: row.name,
    providerType: row.provider_type ?? undefined,
    summary: row.summary ?? undefined,
    website: row.website ?? undefined,
    contact: row.contact ?? {},
    accreditations: row.accreditations ?? [],
    isVerified: !!row.is_verified,
    verificationNotes: row.verification_notes ?? undefined,
    tier: row.tier ?? 'standard',
    qualityScore: row.quality_score ?? undefined,
    monetization: row.monetization ?? 'lead_gen',
  };
}

export async function getProviders(
  categorySlug: string,
  countryCode: string,
  subhubSlug?: string
): Promise<JourneyProvider[]> {
  const catId = await categoryId(categorySlug);
  if (!catId) return [];

  let query = supabase
    .from('journey_providers')
    .select('*, journey_subhubs(slug)')
    .eq('category_id', catId)
    .eq('country_code', countryCode)
    .eq('is_active', true);

  const { data, error } = await query
    .order('is_verified', { ascending: false })
    .order('quality_score', { ascending: false });
  if (error) throw error;

  let rows = data ?? [];
  // ranking is by quality/verification; filter to sub-hub when one is selected
  if (subhubSlug) {
    rows = rows.filter((r: any) => !r.subhub_id || (r.journey_subhubs as any)?.slug === subhubSlug);
  }
  return rows.map(mapProvider);
}

export async function captureLead(input: {
  providerId: string;
  userId: string;
  guideId?: string;
  note?: string;
}): Promise<void> {
  const { error } = await supabase.from('journey_provider_leads').insert({
    provider_id: input.providerId,
    user_id: input.userId,
    guide_id: input.guideId ?? null,
    note: input.note ?? null,
  });
  if (error) throw error;
}
