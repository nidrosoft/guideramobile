/**
 * Community service (spec §14.1). Reads the (journey x country [x subhub]) ->
 * group mapping. Degrades gracefully ("be the first") when no link exists.
 */
import { supabase } from '@/lib/supabase/client';
import type { JourneyGroupLink } from '../types';

export async function getGroupLink(
  categorySlug: string,
  countryCode: string,
  subhubSlug?: string
): Promise<JourneyGroupLink | null> {
  const { data: cat } = await supabase
    .from('journey_categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();
  if (!cat) return null;

  let query = supabase
    .from('journey_group_links')
    .select('group_id, member_count, subhub_id, journey_subhubs(slug)')
    .eq('category_id', cat.id)
    .eq('country_code', countryCode);

  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;

  const match =
    (subhubSlug && data.find((r: any) => (r.journey_subhubs as any)?.slug === subhubSlug)) ||
    data.find((r: any) => !r.subhub_id) ||
    data[0];
  if (!match) return null;
  return { groupId: match.group_id, memberCount: match.member_count ?? 0 };
}

export async function requestPeerMatch(
  categorySlug: string,
  countryCode: string
): Promise<{ status: string; matchedUserId?: string }> {
  const { data, error } = await supabase.rpc('journey_request_peer_match', {
    p_category_slug: categorySlug,
    p_country_code: countryCode,
  });
  if (error) throw error;
  const r = (data ?? {}) as any;
  return { status: r.status ?? 'open', matchedUserId: r.matched_user_id };
}
